package app

import (
	"fmt"

	"go.uber.org/zap"

	analyticsinfra "github.com/chawais/deenquest/backend/internal/analytics/infrastructure"
	analyticshttp "github.com/chawais/deenquest/backend/internal/analytics/interfaces/http"
	authapp "github.com/chawais/deenquest/backend/internal/auth/application"
	authdomain "github.com/chawais/deenquest/backend/internal/auth/domain"
	authinfra "github.com/chawais/deenquest/backend/internal/auth/infrastructure"
	authhttp "github.com/chawais/deenquest/backend/internal/auth/interfaces/http"
	challengeapp "github.com/chawais/deenquest/backend/internal/challenge/application"
	challengeinfra "github.com/chawais/deenquest/backend/internal/challenge/infrastructure"
	challengehttp "github.com/chawais/deenquest/backend/internal/challenge/interfaces/http"
	coachapp "github.com/chawais/deenquest/backend/internal/coach/application"
	coachinfra "github.com/chawais/deenquest/backend/internal/coach/infrastructure"
	coachhttp "github.com/chawais/deenquest/backend/internal/coach/interfaces/http"
	contenthttp "github.com/chawais/deenquest/backend/internal/content/interfaces/http"
	dailytaskapp "github.com/chawais/deenquest/backend/internal/dailytask/application"
	dailytaskinfra "github.com/chawais/deenquest/backend/internal/dailytask/infrastructure"
	dailytaskhttp "github.com/chawais/deenquest/backend/internal/dailytask/interfaces/http"
	hifzapp "github.com/chawais/deenquest/backend/internal/hifz/application"
	hifzinfra "github.com/chawais/deenquest/backend/internal/hifz/infrastructure"
	hifzhttp "github.com/chawais/deenquest/backend/internal/hifz/interfaces/http"
	levelapp "github.com/chawais/deenquest/backend/internal/level/application"
	levelinfra "github.com/chawais/deenquest/backend/internal/level/infrastructure"
	levelhttp "github.com/chawais/deenquest/backend/internal/level/interfaces/http"
	notifapp "github.com/chawais/deenquest/backend/internal/notification/application"
	notifinfra "github.com/chawais/deenquest/backend/internal/notification/infrastructure"
	notifhttp "github.com/chawais/deenquest/backend/internal/notification/interfaces/http"
	smartapp "github.com/chawais/deenquest/backend/internal/notification/smart/application"
	smartinfra "github.com/chawais/deenquest/backend/internal/notification/smart/infrastructure"
	"github.com/chawais/deenquest/backend/internal/platform/config"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
	progressapp "github.com/chawais/deenquest/backend/internal/progress/application"
	progressinfra "github.com/chawais/deenquest/backend/internal/progress/infrastructure"
	progresshttp "github.com/chawais/deenquest/backend/internal/progress/interfaces/http"
	quranapp "github.com/chawais/deenquest/backend/internal/quran/application"
	quraninfra "github.com/chawais/deenquest/backend/internal/quran/infrastructure"
	quranhttp "github.com/chawais/deenquest/backend/internal/quran/interfaces/http"
	recitationapp "github.com/chawais/deenquest/backend/internal/recitation/application"
	recitationinfra "github.com/chawais/deenquest/backend/internal/recitation/infrastructure"
	recitationhttp "github.com/chawais/deenquest/backend/internal/recitation/interfaces/http"
	rewardapp "github.com/chawais/deenquest/backend/internal/reward/application"
	rewardinfra "github.com/chawais/deenquest/backend/internal/reward/infrastructure"
	rewardhttp "github.com/chawais/deenquest/backend/internal/reward/interfaces/http"
	userapp "github.com/chawais/deenquest/backend/internal/user/application"
	userinfra "github.com/chawais/deenquest/backend/internal/user/infrastructure"
	userhttp "github.com/chawais/deenquest/backend/internal/user/interfaces/http"
)

type Modules struct {
	// auth & user — accounts, login, profiles.
	AuthService *authapp.Service
	AuthHandler *authhttp.Handler
	UserHandler *userhttp.Handler

	// learning — the gamification currency plus the features that write to it.
	ProgressHandler    *progresshttp.Handler   // XP, streaks, leaderboard
	ProgressService    *progressapp.Service    // shared "currency" used by level/dailytask/recitation
	LevelService       *levelapp.Service       // curriculum + progression (seeded on boot)
	LevelHandler       *levelhttp.Handler      // /levels
	LevelAdminHandler  *levelhttp.AdminHandler // admin CRUD
	TaskService        *dailytaskapp.Service   // daily tasks (seeded on boot)
	TaskHandler        *dailytaskhttp.Handler
	TaskAdminHandler   *dailytaskhttp.AdminHandler
	RewardService      *rewardapp.Service // reward catalog + granting (seeded on boot)
	RewardHandler      *rewardhttp.Handler
	RewardAdminHandler *rewardhttp.AdminHandler
	RecitationHandler  *recitationhttp.Handler // whisper + coach
	ContentHandler     *contenthttp.Handler    // authoring registry (/admin/registry)
	AnalyticsHandler   *analyticshttp.Handler  // admin dashboards (/admin/analytics)

	CoachService      *coachapp.Service
	CoachHandler      *coachhttp.Handler
	CoachAdminHandler *coachhttp.AdminHandler // /admin/learning/*

	// challenge — weekly quests, 1v1 duels, and shared group challenges. Scored
	// by observing every XP award through the progress activity listener.
	ChallengeService *challengeapp.Service
	ChallengeHandler *challengehttp.Handler

	// quran — surah reading and audio (external AlQuran API + Redis cache).
	QuranHandler *quranhttp.Handler

	// Sabaq/Sabqi/Manzil daily queues, and the session pipeline.
	HifzService      *hifzapp.Service
	HifzAdminService *hifzapp.AdminService
	HifzHandler      *hifzhttp.Handler
	HifzAdminHandler *hifzhttp.AdminHandler

	// notification — push tokens, Expo delivery, job log, smart rules engine.
	NotificationService *notifapp.Service
	NotificationHandler *notifhttp.Handler
	JobLogs             *notifinfra.JobLogRepository
	SmartNotifications  *smartapp.Service
}

func buildModules(cfg *config.Config, infra *Infra) (*Modules, error) {
	db := infra.DB

	// --- repositories (each module owns its own MongoDB collections) ---
	userRepo, err := userinfra.NewMongoRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init user repository: %w", err)
	}
	progressRepo, err := progressinfra.NewMongoRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init progress repository: %w", err)
	}
	levelRepo, err := levelinfra.NewMongoRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init level repository: %w", err)
	}
	taskRepo, err := dailytaskinfra.NewMongoRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init daily-task repository: %w", err)
	}
	rewardRepo, err := rewardinfra.NewMongoRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init reward repository: %w", err)
	}
	recitationRepo, err := recitationinfra.NewMongoRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init recitation repository: %w", err)
	}
	analyticsRepo := analyticsinfra.NewMongoRepository(db)
	tokenRepo, err := notifinfra.NewMongoTokenRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init notification token repository: %w", err)
	}
	jobRepo := notifinfra.NewJobLogRepository(db)
	refreshRepo, err := authinfra.NewMongoRefreshTokenRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init refresh token repository: %w", err)
	}

	// --- services (built in dependency order: progress/reward are leaves) ---
	authService := authapp.NewService(userRepo, refreshRepo, infra.JWT, buildVerifiers(cfg), authapp.Options{
		RefreshTTL:  cfg.RefreshTokenExpiry,
		AdminEmails: cfg.AdminEmailList(),
	})
	userService := userapp.NewService(userRepo)

	progressService := progressapp.NewService(progressRepo)
	rewardService := rewardapp.NewService(rewardRepo)
	levelService := levelapp.NewService(levelRepo, progressService, rewardService)
	taskService := dailytaskapp.NewService(taskRepo, progressService)
	recitationService := recitationapp.NewService(recitationRepo, cfg.WhisperURL, cfg.WhisperInternalToken, levelService, progressService)
	logger.Info("Recitation service initialized", zap.String("whisper_url", cfg.WhisperURL))

	// reward evaluation needs level + progress metrics; wire the adapter that
	// composes them so the reward package stays decoupled from both.
	rewardService.SetMetricsProvider(rewardMetrics{level: levelService, progress: progressService})

	notificationService := notifapp.NewService(tokenRepo, infra.Expo)
	smartNotifications := smartapp.NewService(smartinfra.NewUserFetcher(db), smartinfra.NewMongoLogRepository(db), notificationService)

	quranClient := quraninfra.NewClient(cfg.AlQuranBaseURL, cfg.QuranAudioCDNURL, cfg.QuranAudioEdition, cfg.QuranAudioBitrate)
	quranService := quranapp.NewService(quranClient, infra.Redis)

	// recitation service's text-based seam, and spends the shared XP currency.
	hifzRepo, err := hifzinfra.NewMongoRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init hifz repository: %w", err)
	}
	hifzService := hifzapp.NewService(hifzRepo, quranService, recitationService, progressService)
	hifzAdminService := hifzapp.NewAdminService(hifzRepo, quranService, hifzService)

	challengeRepo, err := challengeinfra.NewMongoRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init challenge repository: %w", err)
	}
	challengeService := challengeapp.NewService(challengeRepo, challengeProfiles{users: userService}, progressService)
	progressService.SetActivityListener(challengeService)

	var coachService *coachapp.Service
	var coachHandler *coachhttp.Handler
	var coachAdminHandler *coachhttp.AdminHandler
	if cfg.CoachEnabled {
		coachRepo, err := coachinfra.NewMongoRepository(db)
		if err != nil {
			return nil, fmt.Errorf("init coach repository: %w", err)
		}
		var coachLLM coachapp.Generator
		if infra.Gemini != nil {
			coachLLM = infra.Gemini
		}
		phraser := coachapp.NewPhraser(coachLLM, infra.Redis, cfg.CoachLLMEnabled)
		coachService = coachapp.NewService(coachRepo, progressService, phraser)
		coachHandler = coachhttp.NewHandler(coachService)
		coachAdminHandler = coachhttp.NewAdminHandler(coachapp.NewAdminService(coachRepo))
		logger.Info("Coach module initialized",
			zap.Bool("llm_enabled", cfg.CoachLLMEnabled && infra.Gemini != nil))
	}

	// --- optional Gemini wiring (features also work without it) ---
	if infra.Gemini != nil {
		recitationService.SetCoach(infra.Gemini) // pronunciation/tajweed coach
	}

	return &Modules{
		AuthService: authService,
		AuthHandler: authhttp.NewHandler(authService),
		UserHandler: userhttp.NewHandler(userService),

		ProgressHandler:    progresshttp.NewHandler(progressService),
		ProgressService:    progressService,
		LevelService:       levelService,
		LevelHandler:       levelhttp.NewHandler(levelService),
		LevelAdminHandler:  levelhttp.NewAdminHandler(levelService),
		TaskService:        taskService,
		TaskHandler:        dailytaskhttp.NewHandler(taskService),
		TaskAdminHandler:   dailytaskhttp.NewAdminHandler(taskService),
		RewardService:      rewardService,
		RewardHandler:      rewardhttp.NewHandler(rewardService),
		RewardAdminHandler: rewardhttp.NewAdminHandler(rewardService),
		RecitationHandler:  recitationhttp.NewHandler(recitationService),
		ContentHandler:     contenthttp.NewHandler(),
		AnalyticsHandler:   analyticshttp.NewHandler(analyticsRepo),

		CoachService:      coachService,
		CoachHandler:      coachHandler,
		CoachAdminHandler: coachAdminHandler,

		ChallengeService: challengeService,
		ChallengeHandler: challengehttp.NewHandler(challengeService),

		QuranHandler: quranhttp.NewHandler(quranService),

		HifzService:      hifzService,
		HifzAdminService: hifzAdminService,
		HifzHandler:      hifzhttp.NewHandler(hifzService),
		HifzAdminHandler: hifzhttp.NewAdminHandler(hifzAdminService),

		NotificationService: notificationService,
		NotificationHandler: notifhttp.NewHandler(notificationService),
		JobLogs:             jobRepo,
		SmartNotifications:  smartNotifications,
	}, nil
}

func buildVerifiers(cfg *config.Config) map[string]authdomain.Verifier {
	verifiers := make(map[string]authdomain.Verifier, 2)

	if ids := cfg.GoogleClientIDs(); len(ids) > 0 {
		v, err := authinfra.NewGoogleVerifier(ids...)
		if err != nil {
			logger.Warn("Google sign-in disabled", zap.Error(err))
		} else {
			verifiers[authdomain.ProviderGoogle] = v
			logger.Info("Google sign-in enabled", zap.Int("client_ids", len(ids)))
		}
	} else {
		logger.Warn("Google sign-in disabled: no GOOGLE_*_CLIENT_ID configured")
	}

	if ids := cfg.AppleClientIDList(); len(ids) > 0 {
		v, err := authinfra.NewAppleVerifier(ids...)
		if err != nil {
			logger.Warn("Apple sign-in disabled", zap.Error(err))
		} else {
			verifiers[authdomain.ProviderApple] = v
			logger.Info("Apple sign-in enabled", zap.Int("client_ids", len(ids)))
		}
	}

	return verifiers
}

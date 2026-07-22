package app

import (
	"fmt"

	"go.uber.org/zap"

	analyticsinfra "github.com/chawais/deenquest/backend/internal/analytics/infrastructure"
	analyticshttp "github.com/chawais/deenquest/backend/internal/analytics/interfaces/http"
	authapp "github.com/chawais/deenquest/backend/internal/auth/application"
	authhttp "github.com/chawais/deenquest/backend/internal/auth/interfaces/http"
	coachapp "github.com/chawais/deenquest/backend/internal/coach/application"
	coachinfra "github.com/chawais/deenquest/backend/internal/coach/infrastructure"
	coachhttp "github.com/chawais/deenquest/backend/internal/coach/interfaces/http"
	contenthttp "github.com/chawais/deenquest/backend/internal/content/interfaces/http"
	dailytaskapp "github.com/chawais/deenquest/backend/internal/dailytask/application"
	dailytaskinfra "github.com/chawais/deenquest/backend/internal/dailytask/infrastructure"
	dailytaskhttp "github.com/chawais/deenquest/backend/internal/dailytask/interfaces/http"
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
	AuthService      *authapp.Service
	AuthHandler      *authhttp.Handler
	UserHandler      *userhttp.Handler
	UserAdminHandler *userhttp.AdminHandler // /admin/users (App Icons page)

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

	// quran — surah reading and audio (external AlQuran API + Redis cache).
	QuranHandler *quranhttp.Handler

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

	// --- services (built in dependency order: progress/reward are leaves) ---
	authService := authapp.NewService(userRepo, infra.JWT)
	userService := userapp.NewService(userRepo)

	progressService := progressapp.NewService(progressRepo)
	rewardService := rewardapp.NewService(rewardRepo)
	levelService := levelapp.NewService(levelRepo, progressService, rewardService)
	taskService := dailytaskapp.NewService(taskRepo, progressService)
	recitationService := recitationapp.NewService(recitationRepo, cfg.WhisperURL, levelService, progressService)
	logger.Info("Recitation service initialized", zap.String("whisper_url", cfg.WhisperURL))

	// reward evaluation needs level + progress metrics; wire the adapter that
	// composes them so the reward package stays decoupled from both.
	rewardService.SetMetricsProvider(rewardMetrics{level: levelService, progress: progressService})

	notificationService := notifapp.NewService(tokenRepo, infra.Expo)
	smartNotifications := smartapp.NewService(smartinfra.NewUserFetcher(db), smartinfra.NewMongoLogRepository(db), notificationService)

	quranClient := quraninfra.NewClient(cfg.AlQuranBaseURL, cfg.QuranAudioCDNURL, cfg.QuranAudioEdition, cfg.QuranAudioBitrate)
	quranService := quranapp.NewService(quranClient, infra.Redis)

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
		AuthService:      authService,
		AuthHandler:      authhttp.NewHandler(authService),
		UserHandler:      userhttp.NewHandler(userService),
		UserAdminHandler: userhttp.NewAdminHandler(userService),

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

		QuranHandler: quranhttp.NewHandler(quranService),

		NotificationService: notificationService,
		NotificationHandler: notifhttp.NewHandler(notificationService),
		JobLogs:             jobRepo,
		SmartNotifications:  smartNotifications,
	}, nil
}

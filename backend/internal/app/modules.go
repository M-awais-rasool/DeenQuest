package app

import (
	"fmt"

	"go.uber.org/zap"

	"github.com/chawais/deenquest/backend/internal/analytics"
	"github.com/chawais/deenquest/backend/internal/auth"
	"github.com/chawais/deenquest/backend/internal/content"
	"github.com/chawais/deenquest/backend/internal/dailytask"
	"github.com/chawais/deenquest/backend/internal/level"
	"github.com/chawais/deenquest/backend/internal/notification"
	"github.com/chawais/deenquest/backend/internal/notification/smart"
	"github.com/chawais/deenquest/backend/internal/platform/config"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
	"github.com/chawais/deenquest/backend/internal/progress"
	"github.com/chawais/deenquest/backend/internal/quran"
	"github.com/chawais/deenquest/backend/internal/recitation"
	"github.com/chawais/deenquest/backend/internal/reward"
	"github.com/chawais/deenquest/backend/internal/user"
)

// Modules collects every feature module's services and HTTP handlers, grouped
// by module. buildModules is the single place where modules are constructed
// and wired to each other — if you want to know "who talks to whom", read it
// top to bottom.
type Modules struct {
	// auth & user — accounts, login, profiles.
	AuthService *auth.Service
	AuthHandler *auth.Handler
	UserHandler *user.Handler

	// learning — the gamification currency plus the features that write to it.
	ProgressHandler    *progress.Handler   // XP, streaks, leaderboard
	ProgressService    *progress.Service   // shared "currency" used by level/dailytask/recitation
	LevelService       *level.Service      // curriculum + progression (seeded on boot)
	LevelHandler       *level.Handler      // /levels
	LevelAdminHandler  *level.AdminHandler // admin CRUD
	TaskService        *dailytask.Service  // daily tasks (seeded on boot)
	TaskHandler        *dailytask.Handler
	TaskAdminHandler   *dailytask.AdminHandler
	RewardService      *reward.Service // reward catalog + granting (seeded on boot)
	RewardHandler      *reward.Handler
	RewardAdminHandler *reward.AdminHandler
	RecitationHandler  *recitation.Handler // whisper + coach
	ContentHandler     *content.Handler    // authoring registry (/admin/registry)
	AnalyticsHandler   *analytics.Handler  // admin dashboards (/admin/analytics)

	// quran — surah reading and audio (external AlQuran API + Redis cache).
	QuranHandler *quran.Handler

	// notification — push tokens, Expo delivery, job log, smart rules engine.
	NotificationService *notification.Service
	NotificationHandler *notification.Handler
	JobLogs             *notification.JobLogRepository
	SmartNotifications  *smart.Service
}

// buildModules constructs all feature modules on top of the shared
// infrastructure. Order: repositories → services (dependency order) →
// optional AI wiring → handlers.
func buildModules(cfg *config.Config, infra *Infra) (*Modules, error) {
	db := infra.DB

	// --- repositories (each module owns its own MongoDB collections) ---
	userRepo, err := user.NewMongoRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init user repository: %w", err)
	}
	progressRepo, err := progress.NewMongoRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init progress repository: %w", err)
	}
	levelRepo, err := level.NewMongoRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init level repository: %w", err)
	}
	taskRepo, err := dailytask.NewMongoRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init daily-task repository: %w", err)
	}
	rewardRepo, err := reward.NewMongoRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init reward repository: %w", err)
	}
	recitationRepo, err := recitation.NewMongoRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init recitation repository: %w", err)
	}
	analyticsRepo := analytics.NewMongoRepository(db)
	tokenRepo, err := notification.NewMongoTokenRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init notification token repository: %w", err)
	}
	jobRepo := notification.NewJobLogRepository(db)

	// --- services (built in dependency order: progress/reward are leaves) ---
	authService := auth.NewService(userRepo, infra.JWT)
	userService := user.NewService(userRepo)

	progressService := progress.NewService(progressRepo)
	rewardService := reward.NewService(rewardRepo)
	levelService := level.NewService(levelRepo, progressService, rewardService)
	taskService := dailytask.NewService(taskRepo, progressService)
	recitationService := recitation.NewService(recitationRepo, cfg.WhisperURL, levelService, progressService)
	logger.Info("Recitation service initialized", zap.String("whisper_url", cfg.WhisperURL))

	// reward evaluation needs level + progress metrics; wire the adapter that
	// composes them so the reward package stays decoupled from both.
	rewardService.SetMetricsProvider(rewardMetrics{level: levelService, progress: progressService})

	notificationService := notification.NewService(tokenRepo, infra.Expo)
	smartNotifications := smart.NewService(smart.NewUserFetcher(db), smart.NewMongoLogRepository(db), notificationService)

	quranClient := quran.NewClient(cfg.AlQuranBaseURL, cfg.QuranAudioCDNURL, cfg.QuranAudioEdition, cfg.QuranAudioBitrate)
	quranService := quran.NewService(quranClient, infra.Redis)

	// --- optional Gemini wiring (features also work without it) ---
	if infra.Gemini != nil {
		recitationService.SetCoach(infra.Gemini) // pronunciation/tajweed coach
	}

	return &Modules{
		AuthService: authService,
		AuthHandler: auth.NewHandler(authService),
		UserHandler: user.NewHandler(userService),

		ProgressHandler:    progress.NewHandler(progressService),
		ProgressService:    progressService,
		LevelService:       levelService,
		LevelHandler:       level.NewHandler(levelService),
		LevelAdminHandler:  level.NewAdminHandler(levelService),
		TaskService:        taskService,
		TaskHandler:        dailytask.NewHandler(taskService),
		TaskAdminHandler:   dailytask.NewAdminHandler(taskService),
		RewardService:      rewardService,
		RewardHandler:      reward.NewHandler(rewardService),
		RewardAdminHandler: reward.NewAdminHandler(rewardService),
		RecitationHandler:  recitation.NewHandler(recitationService),
		ContentHandler:     content.NewHandler(),
		AnalyticsHandler:   analytics.NewHandler(analyticsRepo),

		QuranHandler: quran.NewHandler(quranService),

		NotificationService: notificationService,
		NotificationHandler: notification.NewHandler(notificationService),
		JobLogs:             jobRepo,
		SmartNotifications:  smartNotifications,
	}, nil
}

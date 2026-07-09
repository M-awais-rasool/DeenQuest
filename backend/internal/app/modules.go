package app

import (
	"fmt"

	"go.uber.org/zap"

	"github.com/chawais/deenquest/backend/internal/auth"
	"github.com/chawais/deenquest/backend/internal/notification"
	"github.com/chawais/deenquest/backend/internal/notification/smart"
	"github.com/chawais/deenquest/backend/internal/platform/config"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
	"github.com/chawais/deenquest/backend/internal/progress"
	"github.com/chawais/deenquest/backend/internal/quran"
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

	// progress — streaks, daily tasks, levels, rewards, recitation, admin CRUD.
	CoreService       *progress.CoreService
	CoreHandler       *progress.CoreHandler
	RecitationHandler *progress.RecitationHandler
	AdminHandler      *progress.AdminHandler

	// quran — surah reading and audio (external AlQuran API + Redis cache).
	QuranHandler *quran.Handler

	// notification — push tokens, Expo delivery, job log, smart rules engine.
	NotificationService *notification.Service
	NotificationHandler *notification.Handler
	JobLogs             *notification.JobLogRepository
	SmartNotifications  *smart.Service
}

// buildModules constructs all feature modules on top of the shared
// infrastructure. Order: repositories → services → optional AI wiring →
// handlers.
func buildModules(cfg *config.Config, infra *Infra) (*Modules, error) {
	db := infra.DB

	// --- repositories (each module owns its own MongoDB collections) ---
	userRepo, err := user.NewMongoRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init user repository: %w", err)
	}
	coreRepo, err := progress.NewMongoCoreRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init progress repository: %w", err)
	}
	tokenRepo, err := notification.NewMongoTokenRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init notification token repository: %w", err)
	}
	jobRepo := notification.NewJobLogRepository(db)
	analyticsRepo := progress.NewMongoAnalyticsRepository(db)

	// --- services ---
	authService := auth.NewService(userRepo, infra.JWT)
	userService := user.NewService(userRepo)

	coreService := progress.NewCoreService(coreRepo)
	recitationService := progress.NewRecitationService(coreRepo, cfg.WhisperURL)
	logger.Info("Recitation service initialized", zap.String("whisper_url", cfg.WhisperURL))

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

		CoreService:       coreService,
		CoreHandler:       progress.NewCoreHandler(coreService),
		RecitationHandler: progress.NewRecitationHandler(recitationService),
		AdminHandler:      progress.NewAdminHandler(coreService, analyticsRepo),

		QuranHandler: quran.NewHandler(quranService),

		NotificationService: notificationService,
		NotificationHandler: notification.NewHandler(notificationService),
		JobLogs:             jobRepo,
		SmartNotifications:  smartNotifications,
	}, nil
}

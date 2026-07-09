package app

import (
	"fmt"

	"go.uber.org/zap"

	"github.com/chawais/deenquest/backend/internal/auth"
	"github.com/chawais/deenquest/backend/internal/knowledge"
	"github.com/chawais/deenquest/backend/internal/learning"
	"github.com/chawais/deenquest/backend/internal/learning/model"
	"github.com/chawais/deenquest/backend/internal/moderation"
	"github.com/chawais/deenquest/backend/internal/notification"
	"github.com/chawais/deenquest/backend/internal/notification/smart"
	"github.com/chawais/deenquest/backend/internal/platform/config"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
	"github.com/chawais/deenquest/backend/internal/progress"
	"github.com/chawais/deenquest/backend/internal/quran"
	"github.com/chawais/deenquest/backend/internal/reflection"
	"github.com/chawais/deenquest/backend/internal/scheduling"
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

	// learning — the event-driven Learning Agent.
	LearningRepo        model.Repository
	LearningPublisher   *learning.Publisher
	LearningState       *learning.StateService
	LearningMistakes    *learning.MistakeService
	LearningRecommender *learning.RecommenderService
	LearningReports     *learning.ReportService
	LearningAI          *learning.AIService // nil without Gemini
	LearningHandler     *learning.Handler
	EventsHandler       *learning.EventsHandler

	// notification — push tokens, Expo delivery, job log, smart rules engine.
	NotificationService *notification.Service
	NotificationHandler *notification.Handler
	JobLogs             *notification.JobLogRepository
	SmartNotifications  *smart.Service

	// reflection, scheduling, knowledge — smaller companion features.
	ReflectionHandler *reflection.Handler
	SchedulingHandler *scheduling.Handler
	KnowledgeHandler  *knowledge.Handler
}

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
	learningRepo, err := learning.NewMongoStateRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init learning repository: %w", err)
	}
	mistakeRepo, err := learning.NewMongoMistakeRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init mistake repository: %w", err)
	}
	reflectionRepo, err := reflection.NewMongoRepository(db)
	if err != nil {
		return nil, fmt.Errorf("init reflection repository: %w", err)
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

	learningPublisher := learning.NewPublisher(infra.Kafka)
	learningState := learning.NewStateService(learningRepo)
	learningMistakes := learning.NewMistakeService(mistakeRepo)
	learningRecommender := learning.NewRecommenderService(learningRepo, coreRepo)
	curriculumService := learning.NewCurriculumService(learningRepo, mistakeRepo)
	reportService := learning.NewReportService(learningRepo, coreRepo)

	notificationService := notification.NewService(tokenRepo, infra.Expo)
	smartNotifications := smart.NewService(smart.NewUserFetcher(db), smart.NewMongoLogRepository(db), notificationService)

	reflectionService := reflection.NewService(reflectionRepo)
	moderationService := moderation.NewService()
	schedulingService := scheduling.NewService()
	knowledgeService := knowledge.NewService()

	quranClient := quran.NewClient(cfg.AlQuranBaseURL, cfg.QuranAudioCDNURL, cfg.QuranAudioEdition, cfg.QuranAudioBitrate)
	quranService := quran.NewService(quranClient, infra.Redis)

	// --- cross-module wiring ---
	// progress emits learning behavior events and personalizes daily tasks
	// from the learner state; reflection posts pass through moderation.
	coreService.SetEventEmitter(learningPublisher)
	coreService.SetLearnerStateReader(learningRepo)
	recitationService.SetEventEmitter(learningPublisher)
	reflectionService.SetModerator(moderationService)

	// --- optional Gemini wiring (every feature also works without it) ---
	var learningAI *learning.AIService
	if infra.Gemini != nil {
		recitationService.SetCoach(infra.Gemini)      // pronunciation/tajweed coach
		reflectionService.SetCoach(infra.Gemini)      // reflection companion
		moderationService.SetClassifier(infra.Gemini) // safety/moderation agent
		reportService.SetCoach(infra.Gemini)          // parent/teacher weekly report
		knowledgeService.SetGenerator(infra.Gemini)   // Q&A knowledge agent
		learningAI = learning.NewAIService(learningRepo, infra.Gemini)
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

		LearningRepo:        learningRepo,
		LearningPublisher:   learningPublisher,
		LearningState:       learningState,
		LearningMistakes:    learningMistakes,
		LearningRecommender: learningRecommender,
		LearningReports:     reportService,
		LearningAI:          learningAI,
		LearningHandler:     learning.NewHandler(learningRecommender, learningMistakes, curriculumService, reportService),
		EventsHandler:       learning.NewEventsHandler(learningPublisher),

		NotificationService: notificationService,
		NotificationHandler: notification.NewHandler(notificationService),
		JobLogs:             jobRepo,
		SmartNotifications:  smartNotifications,

		ReflectionHandler: reflection.NewHandler(reflectionService),
		SchedulingHandler: scheduling.NewHandler(schedulingService),
		KnowledgeHandler:  knowledge.NewHandler(knowledgeService),
	}, nil
}

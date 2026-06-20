package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.uber.org/zap"

	authsvc "github.com/chawais/talent-flow/backend/internal/application/auth"
	intel "github.com/chawais/talent-flow/backend/internal/application/intelligent"
	learningsvc "github.com/chawais/talent-flow/backend/internal/application/learning"
	notifiesvc "github.com/chawais/talent-flow/backend/internal/application/notification"
	progresssvc "github.com/chawais/talent-flow/backend/internal/application/progress"
	quransvc "github.com/chawais/talent-flow/backend/internal/application/quran"
	usersvc "github.com/chawais/talent-flow/backend/internal/application/user"
	"github.com/chawais/talent-flow/backend/internal/application/worker"
	dlearning "github.com/chawais/talent-flow/backend/internal/domain/learning"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/alquran"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/cache"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/config"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/gemini"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/jwt"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/logger"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/middleware"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/persistence"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/push"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/queue"
	router "github.com/chawais/talent-flow/backend/internal/interfaces/http"
	"github.com/chawais/talent-flow/backend/internal/interfaces/http/handler"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	logger.Init(cfg.AppEnv)
	defer logger.Sync()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mongoOpts := options.Client().
		ApplyURI(cfg.MongoURI).
		SetMinPoolSize(10).
		SetMaxPoolSize(100).
		SetMaxConnIdleTime(5 * time.Minute).
		SetConnectTimeout(5 * time.Second).
		SetServerSelectionTimeout(5 * time.Second).
		SetCompressors([]string{"zstd", "snappy", "zlib"})

	mongoClient, err := mongo.Connect(ctx, mongoOpts)
	if err != nil {
		logger.Fatal(fmt.Sprintf("failed to connect MongoDB: %v", err))
	}
	defer func() { _ = mongoClient.Disconnect(context.Background()) }()
	if err := mongoClient.Ping(ctx, nil); err != nil {
		logger.Fatal(fmt.Sprintf("failed to ping MongoDB: %v", err))
	}

	db := mongoClient.Database(cfg.MongoDB)

	userRepo, err := persistence.NewMongoUserRepository(db)
	if err != nil {
		logger.Fatal(fmt.Sprintf("failed to initialize user repository: %v", err))
	}

	coreRepo, err := persistence.NewMongoCoreRepository(db)
	if err != nil {
		logger.Fatal(fmt.Sprintf("failed to initialize core repository: %v", err))
	}

	learningRepo, err := persistence.NewMongoLearningRepository(db)
	if err != nil {
		logger.Fatal(fmt.Sprintf("failed to initialize learning repository: %v", err))
	}

	tokenRepo, err := persistence.NewMongoTokenRepository(db)
	if err != nil {
		logger.Fatal(fmt.Sprintf("failed to initialize notification repository: %v", err))
	}

	jobRepo := persistence.NewJobLogRepository(db)
	notifLogRepo := persistence.NewMongoLogRepository(db)

	jwtManager := jwt.NewJWTManager(cfg.JWTSecret, cfg.JWTAccessExpiry, cfg.JWTRefreshExpiry)

	authService := authsvc.NewAuthService(userRepo, jwtManager)
	userService := usersvc.NewUserService(userRepo)
	coreService := progresssvc.NewCoreService(coreRepo)
	recitationService := progresssvc.NewRecitationService(coreRepo, cfg.WhisperURL)
	logger.Info("Recitation service initialized", zap.String("whisper_url", cfg.WhisperURL))

	// ─── Learning Agent: event publisher ───
	// Async, user-keyed producer for the learning.events topic: non-blocking
	// publishes (HTTP never waits on broker acks) with per-user partition
	// ordering. The writer connects lazily, so it is safe even when Kafka is
	// down (publishes log + no-op).
	learningProducer := queue.NewKafkaProducerAsync(cfg.GetKafkaBrokerList())
	defer learningProducer.Close()
	learningPublisher := learningsvc.NewPublisher(learningProducer)
	coreService.SetEventEmitter(learningPublisher)
	coreService.SetLearnerStateReader(learningRepo)
	recitationService.SetEventEmitter(learningPublisher)

	// Deterministic recommender (reads state + level landscape, writes recommendations).
	learningRecommender := learningsvc.NewRecommenderService(learningRepo, coreRepo)

	expoClient := push.NewExpoClient(cfg.ExpoPushURL, cfg.ExpoPushAccessToken)
	notificationService := notifiesvc.NewService(tokenRepo, expoClient)

	redisClient, err := cache.NewRedisClient(cfg.GetRedisAddr(), cfg.RedisPassword, cfg.RedisDB)
	if err != nil {
		logger.Warn(fmt.Sprintf("Redis not available for caching or rate limiting: %v", err))
		redisClient = nil
	} else {
		defer redisClient.Close()
	}

	if status, err := authService.SeedAdmin(context.Background(), cfg.AdminSeedEmail, cfg.AdminSeedPassword, cfg.AdminSeedName); err != nil {
		logger.Warn("failed to seed admin user", zap.Error(err))
	} else {
		logger.Info("Admin user ready",
			zap.String("email", cfg.AdminSeedEmail),
			zap.String("status", status))
	}

	if err := coreService.SeedDailyTasks(context.Background()); err != nil {
		log.Fatalf("failed to seed daily tasks: %v", err)
	}
	logger.Info("Daily tasks seeded successfully")

	if err := coreService.SeedLevels(context.Background()); err != nil {
		logger.Warn("failed to seed levels (will retry on next startup)", zap.Error(err))
	} else {
		logger.Info("Levels seeded successfully")
	}

	if err := coreService.SeedRewards(context.Background()); err != nil {
		logger.Warn("failed to seed rewards (will retry on next startup)", zap.Error(err))
	} else {
		logger.Info("Rewards seeded successfully")
	}

	runCtx, runCancel := context.WithCancel(context.Background())
	defer runCancel()

	consumer := worker.NewConsumer(jobRepo, notificationService)
	workerScheduler := worker.NewScheduler(jobRepo)

	notificationSendConsumer := queue.NewKafkaConsumer(cfg.GetKafkaBrokerList(), "notification.send", "worker-notification-send-group")
	defer notificationSendConsumer.Close()

	go func() {
		_ = notificationSendConsumer.Consume(runCtx, consumer.Wrap("notification.send", consumer.HandleNotificationSend))
	}()

	go workerScheduler.Start(runCtx)

	intelUserFetcher := intel.NewUserFetcher(db)
	intelNotifService := intel.NewNotificationService(intelUserFetcher, notifLogRepo, notificationService)
	intelScheduler := intel.NewScheduler(intelNotifService)

	go func() {
		if err := intelScheduler.Start(runCtx); err != nil {
			logger.Error("intelligent notification scheduler error", zap.Error(err))
		}
	}()

	// ─── Learning Agent: StateUpdater reactor ───
	// Independent consumer group on learning.events; evolves LearnerState on
	// every behavior event. Other reactors (recommender, AI copy) consume the
	// same topic under their own groups, staying loosely coupled.
	learningStateService := learningsvc.NewStateService(learningRepo)
	learningStateConsumer := queue.NewKafkaConsumerWithConfig(
		cfg.GetKafkaBrokerList(), dlearning.TopicLearningEvents, "learning-state-group",
		queue.ConsumerConfig{MaxWait: 500 * time.Millisecond, CommitInterval: time.Second},
	)
	defer learningStateConsumer.Close()
	go func() {
		_ = learningStateConsumer.Consume(runCtx, learningStateService.Handle)
	}()

	// ─── Learning Agent: pattern-sweep cron ───
	// Re-evaluates segments/dropout-risk against the clock and refreshes
	// recommendations from accumulated patterns, not single actions.
	learningSweep := learningsvc.NewScheduler(learningRepo, learningRecommender)
	go func() {
		if err := learningSweep.Start(runCtx); err != nil {
			logger.Error("learning pattern sweep error", zap.Error(err))
		}
	}()

	// ─── Learning Agent: optional Gemini AI copy reactor ───
	// Enabled only when GEMINI_API_KEY is set. Narrates a few moments with
	// motivational/feedback text; the deterministic core is unaffected if absent.
	if geminiClient := gemini.New(cfg.GeminiAPIKey, cfg.GeminiModel); geminiClient != nil {
		learningAIService := learningsvc.NewAIService(learningRepo, geminiClient)
		learningAIConsumer := queue.NewKafkaConsumerWithConfig(
			cfg.GetKafkaBrokerList(), dlearning.TopicLearningEvents, "learning-ai-group",
			queue.ConsumerConfig{MaxWait: time.Second, CommitInterval: 2 * time.Second},
		)
		defer learningAIConsumer.Close()
		go func() {
			_ = learningAIConsumer.Consume(runCtx, learningAIService.Handle)
		}()
		logger.Info("Learning Agent Gemini AI layer enabled")
	} else {
		logger.Info("Learning Agent Gemini AI layer disabled (no GEMINI_API_KEY)")
	}

	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService)
	coreHandler := handler.NewCoreHandler(coreService)
	analyticsRepo := persistence.NewMongoAnalyticsRepository(db)
	adminHandler := handler.NewAdminHandler(coreService, analyticsRepo)
	recitationHandler := handler.NewRecitationHandler(recitationService)
	notificationHandler := handler.NewNotificationHandler(notificationService)
	eventsHandler := handler.NewEventsHandler(learningPublisher)
	learningHandler := handler.NewLearningHandler(learningRecommender)
	quranClient := alquran.NewClient(cfg.AlQuranBaseURL, cfg.QuranAudioCDNURL, cfg.QuranAudioEdition, cfg.QuranAudioBitrate)
	quranService := quransvc.NewService(quranClient, redisClient)
	quranHandler := handler.NewQuranHandler(quranService)

	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(middleware.Recovery())
	r.Use(middleware.RequestLogger())
	r.Use(middleware.CORS(cfg.AllowedOrigins()))
	r.Use(middleware.Gzip())

	if redisClient != nil {
		r.Use(middleware.RateLimit(redisClient, 100, time.Minute))
	}

	router.SetupRoutes(r, authHandler, userHandler, coreHandler, recitationHandler, notificationHandler, quranHandler, adminHandler, eventsHandler, learningHandler, cfg.AdminEmailList(), jwtManager)

	addr := fmt.Sprintf("%s:%s", cfg.Host, cfg.Port)
	srv := &http.Server{Addr: addr, Handler: r}

	go func() {
		logger.Info(fmt.Sprintf("DeenQuest API listening on %s", addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal(fmt.Sprintf("failed to start server: %v", err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down DeenQuest API...")
	runCancel()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Fatal(fmt.Sprintf("server forced to shutdown: %v", err))
	}
	logger.Info("DeenQuest API stopped")
}

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
	notifiesvc "github.com/chawais/talent-flow/backend/internal/application/notification"
	progresssvc "github.com/chawais/talent-flow/backend/internal/application/progress"
	quransvc "github.com/chawais/talent-flow/backend/internal/application/quran"
	usersvc "github.com/chawais/talent-flow/backend/internal/application/user"
	"github.com/chawais/talent-flow/backend/internal/application/worker"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/alquran"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/cache"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/config"
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

	mongoClient, err := mongo.Connect(ctx, options.Client().ApplyURI(cfg.MongoURI))
	if err != nil {
		logger.Fatal(fmt.Sprintf("failed to connect MongoDB: %v", err))
	}
	defer func() { _ = mongoClient.Disconnect(context.Background()) }()

	db := mongoClient.Database(cfg.MongoDB)

	userRepo, err := persistence.NewMongoUserRepository(db)
	if err != nil {
		logger.Fatal(fmt.Sprintf("failed to initialize user repository: %v", err))
	}

	coreRepo, err := persistence.NewMongoCoreRepository(db)
	if err != nil {
		logger.Fatal(fmt.Sprintf("failed to initialize core repository: %v", err))
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

	expoClient := push.NewExpoClient(cfg.ExpoPushURL, cfg.ExpoPushAccessToken)
	notificationService := notifiesvc.NewService(tokenRepo, expoClient)

	redisClient, err := cache.NewRedisClient(cfg.GetRedisAddr(), cfg.RedisPassword, cfg.RedisDB)
	if err != nil {
		logger.Warn(fmt.Sprintf("Redis not available for caching or rate limiting: %v", err))
		redisClient = nil
	} else {
		defer redisClient.Close()
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

	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService)
	coreHandler := handler.NewCoreHandler(coreService)
	recitationHandler := handler.NewRecitationHandler(recitationService)
	notificationHandler := handler.NewNotificationHandler(notificationService)
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

	if redisClient != nil {
		r.Use(middleware.RateLimit(redisClient, 100, time.Minute))
	}

	router.SetupRoutes(r, authHandler, userHandler, coreHandler, recitationHandler, notificationHandler, quranHandler, jwtManager)

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

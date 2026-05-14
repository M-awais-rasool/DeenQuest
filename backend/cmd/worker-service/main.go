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

	notifications "github.com/chawais/talent-flow/backend/internal/ai-service/ai-notifications"
	"github.com/chawais/talent-flow/backend/internal/notification-service"
	"github.com/chawais/talent-flow/backend/internal/worker-service/repository"
	"github.com/chawais/talent-flow/backend/internal/worker-service/worker"
	"github.com/chawais/talent-flow/backend/pkg/config"
	"github.com/chawais/talent-flow/backend/pkg/logger"
	"github.com/chawais/talent-flow/backend/pkg/ollama"
	"github.com/chawais/talent-flow/backend/pkg/push"
	"github.com/chawais/talent-flow/backend/pkg/queue"
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

	workerDB := mongoClient.Database(cfg.MongoDB)
	jobRepo := repository.NewJobLogRepository(workerDB)
	notificationRepo, err := notification.NewMongoTokenRepository(workerDB)
	if err != nil {
		logger.Fatal(fmt.Sprintf("failed to initialize notification repository: %v", err))
	}
	notificationService := notification.NewService(notificationRepo, push.NewExpoClient(cfg.ExpoPushURL, cfg.ExpoPushAccessToken))
	consumer := worker.NewConsumer(jobRepo, notificationService)
	scheduler := worker.NewScheduler(jobRepo)

	notificationSendConsumer := queue.NewKafkaConsumer(cfg.GetKafkaBrokerList(), "notification.send", "worker-notification-send-group")
	defer notificationSendConsumer.Close()

	inactivityScheduler := initInactivityScheduler(workerDB, notificationService, cfg)

	runCtx, runCancel := context.WithCancel(context.Background())
	defer runCancel()

	go func() {
		_ = notificationSendConsumer.Consume(runCtx, consumer.Wrap("notification.send", consumer.HandleNotificationSend))
	}()

	go scheduler.Start(runCtx)

	go func() {
		if err := inactivityScheduler.Start(runCtx); err != nil {
			logger.Error("inactivity scheduler error", zap.Error(err))
		}
	}()

	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "worker-service"})
	})

	addr := fmt.Sprintf("%s:%s", cfg.WorkerHost, cfg.WorkerPort)
	srv := &http.Server{Addr: addr, Handler: r}
	go func() {
		logger.Info(fmt.Sprintf("Worker Service listening on %s", addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error(fmt.Sprintf("worker health server error: %v", err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	runCancel()
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	_ = srv.Shutdown(shutdownCtx)
}

func initInactivityScheduler(db *mongo.Database, notificationService *notification.Service, cfg *config.Config) *notifications.Scheduler {
	logRepo := notifications.NewMongoLogRepository(db)
	userFetcher := notifications.NewUserFetcher(db)
	ollamaClient := ollama.New(cfg.OllamaURL)
	generator := notifications.NewMessageGenerator(ollamaClient, "llama3")

	inactivityService := notifications.NewInactivityService(
		userFetcher,
		generator,
		logRepo,
		notificationService,
	)

	return notifications.NewScheduler(inactivityService)
}

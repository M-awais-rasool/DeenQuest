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

	"github.com/chawais/talent-flow/backend/internal/worker-service/repository"
	"github.com/chawais/talent-flow/backend/internal/worker-service/worker"
	"github.com/chawais/talent-flow/backend/pkg/config"
	"github.com/chawais/talent-flow/backend/pkg/logger"
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

	workerDB := mongoClient.Database(cfg.MongoWorkerDB)
	jobRepo := repository.NewJobLogRepository(workerDB)
	consumer := worker.NewConsumer(jobRepo)
	scheduler := worker.NewScheduler(jobRepo)

	userCreatedConsumer := queue.NewKafkaConsumer(cfg.GetKafkaBrokerList(), "user.created", "worker-user-created-group")
	defer userCreatedConsumer.Close()
	habitCompletedConsumer := queue.NewKafkaConsumer(cfg.GetKafkaBrokerList(), "habit.completed", "worker-habit-completed-group")
	defer habitCompletedConsumer.Close()
	streakUpdatedConsumer := queue.NewKafkaConsumer(cfg.GetKafkaBrokerList(), "streak.updated", "worker-streak-updated-group")
	defer streakUpdatedConsumer.Close()
	notificationSendConsumer := queue.NewKafkaConsumer(cfg.GetKafkaBrokerList(), "notification.send", "worker-notification-send-group")
	defer notificationSendConsumer.Close()

	runCtx, runCancel := context.WithCancel(context.Background())
	defer runCancel()

	go func() {
		_ = userCreatedConsumer.Consume(runCtx, consumer.Wrap("user.created", consumer.HandleUserCreated))
	}()
	go func() {
		_ = habitCompletedConsumer.Consume(runCtx, consumer.Wrap("habit.completed", consumer.HandleHabitCompleted))
	}()
	go func() {
		_ = streakUpdatedConsumer.Consume(runCtx, consumer.Wrap("streak.updated", consumer.HandleStreakUpdated))
	}()
	go func() {
		_ = notificationSendConsumer.Consume(runCtx, consumer.Wrap("notification.send", consumer.HandleNotificationSend))
	}()
	go scheduler.Start(runCtx)

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

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

	"github.com/chawais/talent-flow/backend/internal/core-service/controller"
	"github.com/chawais/talent-flow/backend/internal/core-service/repository"
	"github.com/chawais/talent-flow/backend/internal/core-service/router"
	"github.com/chawais/talent-flow/backend/internal/core-service/service"
	"github.com/chawais/talent-flow/backend/pkg/auth"
	"github.com/chawais/talent-flow/backend/pkg/config"
	"github.com/chawais/talent-flow/backend/pkg/logger"
	"github.com/chawais/talent-flow/backend/pkg/middleware"
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

	coreDB := mongoClient.Database(cfg.MongoCoreDB)
	repo, err := repository.NewMongoCoreRepository(coreDB)
	if err != nil {
		logger.Fatal(fmt.Sprintf("failed to initialize core repository: %v", err))
	}

	producer := queue.NewKafkaProducer(cfg.GetKafkaBrokerList())
	defer producer.Close()

	jwtManager := auth.NewJWTManager(cfg.JWTSecret, cfg.JWTAccessExpiry, cfg.JWTRefreshExpiry)
	coreService := service.NewCoreService(repo, producer)
	coreController := controller.NewCoreController(coreService)

	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(middleware.Recovery())
	r.Use(middleware.RequestLogger())
	r.Use(middleware.CORS(cfg.AllowedOrigins()))
	router.SetupRoutes(r, coreController, jwtManager)

	addr := fmt.Sprintf("%s:%s", cfg.CoreHost, cfg.CorePort)
	srv := &http.Server{Addr: addr, Handler: r}

	go func() {
		logger.Info(fmt.Sprintf("Core Service listening on %s", addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal(fmt.Sprintf("failed to start core service: %v", err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Fatal(fmt.Sprintf("core service forced to shutdown: %v", err))
	}
}

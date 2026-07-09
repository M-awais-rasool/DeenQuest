package app

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/chawais/deenquest/backend/internal/platform/cache"
	"github.com/chawais/deenquest/backend/internal/platform/config"
	"github.com/chawais/deenquest/backend/internal/platform/gemini"
	"github.com/chawais/deenquest/backend/internal/platform/jwt"
	"github.com/chawais/deenquest/backend/internal/platform/kafka"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
	"github.com/chawais/deenquest/backend/internal/platform/push"
)

// Infra holds every external connection the app talks to. It is built once at
// startup by connectInfra and handed to the modules; nothing else in the
// codebase opens its own connections.
type Infra struct {
	Mongo *mongo.Client
	DB    *mongo.Database

	// Redis is nil when unavailable — callers must nil-check. The app then runs
	// without response caching and rate limiting.
	Redis *cache.RedisClient

	// Kafka is the shared async producer used to publish learning behavior
	// events (fire-and-forget, keyed by user for per-user ordering).
	Kafka *kafka.Producer

	// Gemini is nil when GEMINI_API_KEY is unset. Every AI feature checks for
	// nil and falls back to its deterministic behavior.
	Gemini *gemini.Client

	Expo *push.ExpoClient
	JWT  *jwt.JWTManager
}

func connectInfra(cfg *config.Config) (*Infra, error) {
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
		return nil, fmt.Errorf("connect MongoDB: %w", err)
	}
	if err := mongoClient.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("ping MongoDB: %w", err)
	}

	redisClient, err := cache.NewRedisClient(cfg.GetRedisAddr(), cfg.RedisPassword, cfg.RedisDB)
	if err != nil {
		logger.Warn(fmt.Sprintf("Redis not available for caching or rate limiting: %v", err))
		redisClient = nil
	}

	return &Infra{
		Mongo:  mongoClient,
		DB:     mongoClient.Database(cfg.MongoDB),
		Redis:  redisClient,
		Kafka:  kafka.NewProducerAsync(cfg.GetKafkaBrokerList()),
		Gemini: gemini.New(cfg.GeminiAPIKey, cfg.GeminiModel),
		Expo:   push.NewExpoClient(cfg.ExpoPushURL, cfg.ExpoPushAccessToken),
		JWT:    jwt.NewJWTManager(cfg.JWTSecret, cfg.JWTAccessExpiry, cfg.JWTRefreshExpiry),
	}, nil
}

// Close releases every connection in reverse dependency order.
func (i *Infra) Close() {
	_ = i.Kafka.Close()
	if i.Redis != nil {
		_ = i.Redis.Close()
	}
	_ = i.Mongo.Disconnect(context.Background())
}

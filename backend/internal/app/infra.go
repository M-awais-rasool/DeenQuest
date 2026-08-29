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
	"github.com/chawais/deenquest/backend/internal/platform/logger"
	"github.com/chawais/deenquest/backend/internal/platform/push"
)

type Infra struct {
	Mongo *mongo.Client
	DB    *mongo.Database
	Redis *cache.RedisClient
	Gemini *gemini.Client
	Expo *push.ExpoClient
	JWT  *jwt.JWTManager
}

func connectInfra(cfg *config.Config) (*Infra, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mongoOpts := options.Client().
		ApplyURI(cfg.MongoURI).
		SetMinPoolSize(5).
		SetMaxPoolSize(25).
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
		Gemini: gemini.New(cfg.GeminiAPIKey, cfg.GeminiModel),
		Expo:   push.NewExpoClient(cfg.ExpoPushURL, cfg.ExpoPushAccessToken),
		JWT:    jwt.NewJWTManager(cfg.JWTSecret, cfg.JWTAccessExpiry),
	}, nil
}

func (i *Infra) Close() {
	if i.Redis != nil {
		_ = i.Redis.Close()
	}
	_ = i.Mongo.Disconnect(context.Background())
}

package cache

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisClient struct {
	Client *redis.Client
}

func NewRedisClient(addr, password string, db int) (*RedisClient, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	return &RedisClient{Client: client}, nil
}

func (r *RedisClient) Close() error {
	return r.Client.Close()
}

func (r *RedisClient) StoreRefreshToken(ctx context.Context, userID, token string, expiry time.Duration) error {
	return r.Client.Set(ctx, "refresh_token:"+userID, token, expiry).Err()
}

func (r *RedisClient) GetRefreshToken(ctx context.Context, userID string) (string, error) {
	return r.Client.Get(ctx, "refresh_token:"+userID).Result()
}

func (r *RedisClient) DeleteRefreshToken(ctx context.Context, userID string) error {
	return r.Client.Del(ctx, "refresh_token:"+userID).Err()
}

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

// Get returns the string value at key. Nil-receiver-safe (the app runs
// without Redis): a nil client reports a miss.
func (r *RedisClient) Get(ctx context.Context, key string) (string, error) {
	if r == nil {
		return "", redis.Nil
	}
	return r.Client.Get(ctx, key).Result()
}

// Set stores value at key with an expiry. No-op on a nil client.
func (r *RedisClient) Set(ctx context.Context, key string, value interface{}, expiry time.Duration) error {
	if r == nil {
		return nil
	}
	return r.Client.Set(ctx, key, value, expiry).Err()
}

// Incr increments a counter, setting its expiry on first increment (so daily
// counters clean themselves up). A nil client counts nothing and returns 0.
func (r *RedisClient) Incr(ctx context.Context, key string, expiry time.Duration) (int64, error) {
	if r == nil {
		return 0, nil
	}
	n, err := r.Client.Incr(ctx, key).Result()
	if err != nil {
		return 0, err
	}
	if n == 1 && expiry > 0 {
		_ = r.Client.Expire(ctx, key, expiry).Err()
	}
	return n, nil
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

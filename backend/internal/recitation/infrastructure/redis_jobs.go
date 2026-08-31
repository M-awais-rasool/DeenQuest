package infrastructure

import (
	"context"
	"encoding/json"
	"errors"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/chawais/deenquest/backend/internal/recitation/domain"
)

const (
	pendingKey  = "recitation:jobs:pending"
	jobKeyPfx   = "recitation:job:"
	avgKey      = "recitation:jobs:avg_ms"
	jobStateTTL = 15 * time.Minute
	avgTTL      = 6 * time.Hour
	claimBlock  = 5 * time.Second
)

type RedisJobStore struct {
	rdb *redis.Client
}

func NewRedisJobStore(rdb *redis.Client) *RedisJobStore {
	return &RedisJobStore{rdb: rdb}
}

func jobKey(id string) string { return jobKeyPfx + id }

func (s *RedisJobStore) Enqueue(ctx context.Context, job *domain.Job, maxDepth int) (int, error) {
	depth, err := s.rdb.LLen(ctx, pendingKey).Result()
	if err != nil {
		return 0, err
	}
	if maxDepth > 0 && int(depth) >= maxDepth {
		return 0, domain.ErrQueueFull
	}

	payload, err := json.Marshal(job)
	if err != nil {
		return 0, err
	}

	if err := s.rdb.Set(ctx, jobKey(job.ID), payload, jobStateTTL).Err(); err != nil {
		return 0, err
	}

	n, err := s.rdb.LPush(ctx, pendingKey, job.ID).Result()
	if err != nil {
		_ = s.rdb.Del(ctx, jobKey(job.ID)).Err()
		return 0, err
	}

	return int(n) - 1, nil
}

func (s *RedisJobStore) Claim(ctx context.Context) (*domain.Job, error) {
	res, err := s.rdb.BRPop(ctx, claimBlock, pendingKey).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, nil // idle, not broken
		}
		return nil, err
	}
	if len(res) < 2 {
		return nil, nil
	}
	return s.Get(ctx, res[1])
}

func (s *RedisJobStore) Get(ctx context.Context, id string) (*domain.Job, error) {
	raw, err := s.rdb.Get(ctx, jobKey(id)).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, domain.ErrJobNotFound
		}
		return nil, err
	}

	var job domain.Job
	if err := json.Unmarshal([]byte(raw), &job); err != nil {
		return nil, err
	}
	return &job, nil
}

func (s *RedisJobStore) Save(ctx context.Context, job *domain.Job) error {
	payload, err := json.Marshal(job)
	if err != nil {
		return err
	}
	return s.rdb.Set(ctx, jobKey(job.ID), payload, jobStateTTL).Err()
}

func (s *RedisJobStore) Position(ctx context.Context, id string) (int, error) {
	idx, err := s.rdb.LPos(ctx, pendingKey, id, redis.LPosArgs{}).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return -1, nil
		}
		return -1, err
	}
	depth, err := s.rdb.LLen(ctx, pendingKey).Result()
	if err != nil {
		return -1, err
	}
	return int(depth-idx) - 1, nil
}

func (s *RedisJobStore) Depth(ctx context.Context) (int, error) {
	n, err := s.rdb.LLen(ctx, pendingKey).Result()
	return int(n), err
}

func (s *RedisJobStore) ObserveDuration(ctx context.Context, seconds float64) {
	const alpha = 0.2

	next := seconds * 1000
	if prev, err := s.rdb.Get(ctx, avgKey).Float64(); err == nil && prev > 0 {
		next = alpha*next + (1-alpha)*prev
	}
	_ = s.rdb.Set(ctx, avgKey, strconv.FormatFloat(next, 'f', 0, 64), avgTTL).Err()
}

func (s *RedisJobStore) AverageDuration(ctx context.Context) float64 {
	ms, err := s.rdb.Get(ctx, avgKey).Float64()
	if err != nil || ms <= 0 {
		return 0
	}
	return ms / 1000
}

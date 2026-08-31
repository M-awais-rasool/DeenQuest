package domain

import (
	"context"
	"errors"
)

type Repository interface {
	SaveRecitationAttempt(ctx context.Context, attempt *RecitationAttempt) error
	CountUserRecitationAttempts(ctx context.Context, userID string, levelID, lessonIndex int) (int, error)
}

var ErrJobNotFound = errors.New("recitation job not found")
var ErrQueueFull = errors.New("recitation queue is full")

type AudioStore interface {
	Put(ctx context.Context, id string, data []byte) error
	Get(ctx context.Context, id string) ([]byte, error)
	Delete(ctx context.Context, id string) error
}

type JobStore interface {
	Enqueue(ctx context.Context, job *Job, maxDepth int) (position int, err error)
	Claim(ctx context.Context) (*Job, error)
	Get(ctx context.Context, id string) (*Job, error)
	Save(ctx context.Context, job *Job) error
	Position(ctx context.Context, id string) (int, error)
	Depth(ctx context.Context) (int, error)
	ObserveDuration(ctx context.Context, seconds float64)
	AverageDuration(ctx context.Context) float64
}

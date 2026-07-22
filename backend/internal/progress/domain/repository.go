package domain

import "context"

type Repository interface {
	GetProgress(ctx context.Context, userID string) (*Progress, error)
	IncrementProgress(ctx context.Context, userID string, xpDelta, barakahDelta int) (*Progress, error)
	ListLeaderboardProgress(ctx context.Context, limit int) ([]Progress, error)

	GetStreak(ctx context.Context, userID string) (*Streak, error)
	UpsertStreak(ctx context.Context, streak *Streak) error

	GetCompletedDates(ctx context.Context, userID string, dates []string) (map[string]bool, error)
}

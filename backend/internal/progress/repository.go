package progress

import "context"

// Repository is the persistence port for the gamification "currency": XP,
// levels-of-prestige, barakah score and streaks. It owns the `progress` and
// `streaks` collections and reads `user_daily_tasks` (read-only) to derive the
// weekly-completion strip.
type Repository interface {
	GetProgress(ctx context.Context, userID string) (*Progress, error)
	IncrementProgress(ctx context.Context, userID string, xpDelta, barakahDelta int) (*Progress, error)
	ListLeaderboardProgress(ctx context.Context, limit int) ([]Progress, error)

	GetStreak(ctx context.Context, userID string) (*Streak, error)
	UpsertStreak(ctx context.Context, streak *Streak) error

	GetCompletedDates(ctx context.Context, userID string, dates []string) (map[string]bool, error)
}

package domain

import (
	"context"
	"time"
)

type AnalyticsTimePoint struct {
	Date             string `json:"date"` // YYYY-MM-DD
	LevelCompletions int    `json:"level_completions"`
	TaskCompletions  int    `json:"task_completions"`
}

type AnalyticsLabelCount struct {
	Label string `json:"label"`
	Count int    `json:"count"`
}

type AdminAnalytics struct {
	TotalUsers         int64                 `json:"total_users"`
	ActiveToday        int64                 `json:"active_today"`
	ActiveWeek         int64                 `json:"active_week"`
	TotalXP            int64                 `json:"total_xp"`
	AvgStreak          float64               `json:"avg_streak"`
	LongestStreak      int                   `json:"longest_streak"`
	LevelsCompleted    int64                 `json:"levels_completed"`
	TasksCompleted     int64                 `json:"tasks_completed"`
	TotalLevels        int64                 `json:"total_levels"`
	TotalTasks         int64                 `json:"total_tasks"`
	RecitationAttempts int64                 `json:"recitation_attempts"`
	Series             []AnalyticsTimePoint  `json:"series"` // last 14 days, oldest first
	LevelsByDifficulty []AnalyticsLabelCount `json:"levels_by_difficulty"`
	TopLevels          []AnalyticsLabelCount `json:"top_levels"`
}

// DailySnapshot is one finished UTC day, counted once and kept.
//
// The dashboard used to derive every number by scanning the raw collections,
// which meant its cost grew with the whole history of the app. It also meant
// the raw rows could never be expired: deleting them would silently shrink
// lifetime totals. Rolling each day up into a single small document breaks
// both problems at once — the dashboard reads a few hundred documents a year
// instead of millions, and the rows it summarises become disposable.
type DailySnapshot struct {
	Date               string    `bson:"_id"`
	TaskCompletions    int       `bson:"task_completions"`
	LevelCompletions   int       `bson:"level_completions"`
	RecitationAttempts int       `bson:"recitation_attempts"`
	ActiveUsers        int       `bson:"active_users"`
	ComputedAt         time.Time `bson:"computed_at"`
}

type Repository interface {
	GetAdminAnalytics(ctx context.Context) (*AdminAnalytics, error)

	// RollUpDay counts one UTC day from the raw collections and stores it.
	// It is idempotent: running it again for the same day overwrites the row,
	// so a retry or an overlapping backfill cannot double-count.
	RollUpDay(ctx context.Context, date string) error

	// BackfillMissingDays rolls up every day that still has raw rows but no
	// snapshot. It is what makes turning the TTL indexes on safe, and it lets
	// a night the scheduler missed heal itself on the next start.
	BackfillMissingDays(ctx context.Context) (int, error)
}

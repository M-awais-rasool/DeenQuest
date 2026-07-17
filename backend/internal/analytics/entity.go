package analytics

import "context"

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

// Repository is the read-only analytics port. It queries collections owned by
// other features (progress, streaks, levels, tasks, recitation) by name to
// build admin dashboards — a read model, so it never mutates.
type Repository interface {
	GetAdminAnalytics(ctx context.Context) (*AdminAnalytics, error)
}

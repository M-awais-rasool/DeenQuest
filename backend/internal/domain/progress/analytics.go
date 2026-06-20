package progress

import "context"

// AnalyticsTimePoint is one day in the activity time series.
type AnalyticsTimePoint struct {
	Date             string `json:"date"` // YYYY-MM-DD
	LevelCompletions int    `json:"level_completions"`
	TaskCompletions  int    `json:"task_completions"`
}

// AnalyticsLabelCount is a labelled bucket for bar/doughnut charts.
type AnalyticsLabelCount struct {
	Label string `json:"label"`
	Count int    `json:"count"`
}

// AdminAnalytics is the real, aggregated dashboard payload.
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

// AnalyticsRepository aggregates real data across collections for the dashboard.
type AnalyticsRepository interface {
	GetAdminAnalytics(ctx context.Context) (*AdminAnalytics, error)
}

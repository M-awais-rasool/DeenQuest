package progress

// ProgressResponse is the response type for the user's progress summary.
type ProgressResponse struct {
	XP                int    `json:"xp"`
	Level             int    `json:"level"`
	BarakahScore      int    `json:"barakah_score"`
	CurrentStreak     int    `json:"current_streak"`
	LongestStreak     int    `json:"longest_streak"`
	Freezes           int    `json:"freezes"`            // streak freezes available
	WeeklyCompletions []bool `json:"weekly_completions"` // index 0 = 6 days ago, index 6 = today
	LastCompletedAt string `json:"last_completed_at"`
}

// PublicProgressResponse contains only the fields safe to expose without authentication.
type PublicProgressResponse struct {
	XP            int `json:"xp"`
	Level         int `json:"level"`
	BarakahScore  int `json:"barakah_score"`
	CurrentStreak int `json:"current_streak"`
}

type LeaderboardEntry struct {
	Rank   int    `json:"rank"`
	UserID string `json:"user_id"`
	Level  int    `json:"level"`
	XP     int    `json:"xp"`
}

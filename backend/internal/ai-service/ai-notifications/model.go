package notifications

import "time"

type NotificationType string

const (
	DailyTaskReminder  NotificationType = "daily_task_reminder"
	StreakWarning      NotificationType = "streak_warning"
	FridaySpecial      NotificationType = "friday_special"
	LeaderboardUpdate  NotificationType = "leaderboard_update"
)

type UserContext struct {
	UserID             string
	ExpoPushToken      string
	CurrentStreak      int
	LongestStreak      int
	LastCompletedAt    time.Time
	CompletedLessons   int
	TodayTasksTotal    int
	TodayTasksDone     int
	CurrentRank        int
	PreviousRank       int
	TopRankThreshold   int
}

type NotificationRule struct {
	Type            NotificationType
	Cooldown        time.Duration
	Evaluate        func(ctx *UserContext, now time.Time) bool
	BuildMessage    func(ctx *UserContext) string
	BuildTitle      func(ctx *UserContext) string
}

type NotificationLog struct {
	ID               string           `bson:"_id"`
	UserID           string           `bson:"user_id"`
	NotificationType NotificationType `bson:"notification_type"`
	Status           string           `bson:"status"`
	Message          string           `bson:"message"`
	Error            string           `bson:"error,omitempty"`
	Attempts         int              `bson:"attempts"`
	CreatedAt        time.Time        `bson:"created_at"`
}

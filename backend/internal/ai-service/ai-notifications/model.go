package notifications

import "time"

type NotificationType string

const (
	DailyTaskReminder  NotificationType = "daily_task_reminder"
	StreakWarning      NotificationType = "streak_warning"
	FridaySpecial      NotificationType = "friday_special"
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
}

type TimeWindow struct {
	StartHour int
	EndHour   int
}

type NotificationRule struct {
	Type            NotificationType
	Cooldown        time.Duration
	TimeWindow      TimeWindow
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

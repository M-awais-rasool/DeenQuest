package domain

import "time"

type NotificationType string

const (
	DailyTaskReminder NotificationType = "daily_task_reminder"
	StreakWarning     NotificationType = "streak_warning"
	FridaySpecial     NotificationType = "friday_special"
	QuranSuggestion   NotificationType = "quran_suggestion"
	MulkReminder      NotificationType = "mulk_reminder"
)

type UserContext struct {
	UserID           string
	ExpoPushToken    string
	Timezone         string
	CurrentStreak    int
	LongestStreak    int
	LastCompletedAt  time.Time
	CompletedLessons int
	TodayTasksTotal  int
	TodayTasksDone   int
}

type TimeWindow struct {
	StartHour int
	EndHour   int
}

type HourSet [24]bool

func (h HourSet) Contains(hour int) bool {
	if hour < 0 || hour > 23 {
		return false
	}
	return h[hour]
}

func ActiveHours(rules []NotificationRule) HourSet {
	var set HourSet
	for _, r := range rules {
		for hour := r.TimeWindow.StartHour; hour < r.TimeWindow.EndHour; hour++ {
			if hour >= 0 && hour < 24 {
				set[hour] = true
			}
		}
	}
	return set
}

type NotificationRule struct {
	Type         NotificationType
	Cooldown     time.Duration
	TimeWindow   TimeWindow
	Evaluate     func(ctx *UserContext, now time.Time) bool
	BuildMessage func(ctx *UserContext) string
	BuildTitle   func(ctx *UserContext) string
	BuildData    func(ctx *UserContext) map[string]interface{}
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

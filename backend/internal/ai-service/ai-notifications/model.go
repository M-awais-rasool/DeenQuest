package notifications

import "time"

type InactiveUser struct {
	UserID           string
	DisplayName      string
	Streak           int
	LastCompletedAt  time.Time
	CompletedLessons int
	ExpoPushToken    string
}

type InactivityNotificationLog struct {
	ID           string    `bson:"_id"`
	UserID       string    `bson:"user_id"`
	Status       string    `bson:"status"`
	Message      string    `bson:"message"`
	Error        string    `bson:"error,omitempty"`
	Attempts     int       `bson:"attempts"`
	CreatedAt    time.Time `bson:"created_at"`
}

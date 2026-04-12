package model

import "time"

type HabitType string

const (
	HabitPrayer HabitType = "prayer"
	HabitQuran  HabitType = "quran"
	HabitTask   HabitType = "task"
)

type Habit struct {
	ID          string    `bson:"_id" json:"id"`
	UserID      string    `bson:"user_id" json:"user_id"`
	Title       string    `bson:"title" json:"title"`
	Type        HabitType `bson:"type" json:"type"`
	TargetDaily int       `bson:"target_daily" json:"target_daily"`
	CreatedAt   time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time `bson:"updated_at" json:"updated_at"`
}

type Task struct {
	ID          string    `bson:"_id" json:"id"`
	UserID      string    `bson:"user_id" json:"user_id"`
	Title       string    `bson:"title" json:"title"`
	Description string    `bson:"description" json:"description"`
	XP          int       `bson:"xp" json:"xp"`
	Completed   bool      `bson:"completed" json:"completed"`
	DueDate     time.Time `bson:"due_date" json:"due_date"`
	CreatedAt   time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time `bson:"updated_at" json:"updated_at"`
}

type Progress struct {
	ID           string    `bson:"_id" json:"id"`
	UserID       string    `bson:"user_id" json:"user_id"`
	TotalXP      int       `bson:"total_xp" json:"total_xp"`
	Level        int       `bson:"level" json:"level"`
	BarakahScore int       `bson:"barakah_score" json:"barakah_score"`
	UpdatedAt    time.Time `bson:"updated_at" json:"updated_at"`
}

type Streak struct {
	ID              string    `bson:"_id" json:"id"`
	UserID          string    `bson:"user_id" json:"user_id"`
	CurrentStreak   int       `bson:"current_streak" json:"current_streak"`
	LongestStreak   int       `bson:"longest_streak" json:"longest_streak"`
	LastCompletedAt time.Time `bson:"last_completed_at" json:"last_completed_at"`
	UpdatedAt       time.Time `bson:"updated_at" json:"updated_at"`
}

type Achievement struct {
	ID          string    `bson:"_id" json:"id"`
	UserID      string    `bson:"user_id" json:"user_id"`
	Code        string    `bson:"code" json:"code"`
	Title       string    `bson:"title" json:"title"`
	Description string    `bson:"description" json:"description"`
	UnlockedAt  time.Time `bson:"unlocked_at" json:"unlocked_at"`
}

type Reflection struct {
	ID          string    `bson:"_id" json:"id"`
	UserID      string    `bson:"user_id" json:"user_id"`
	Text        string    `bson:"text" json:"text"`
	MoodScore   int       `bson:"mood_score" json:"mood_score"`
	BarakahGain int       `bson:"barakah_gain" json:"barakah_gain"`
	CreatedAt   time.Time `bson:"created_at" json:"created_at"`
}

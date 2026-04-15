package model

import "time"

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

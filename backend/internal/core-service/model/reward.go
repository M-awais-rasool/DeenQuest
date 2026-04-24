package model

import "time"

// RewardTrigger defines the condition that unlocks a reward.
type RewardTrigger string

const (
	TriggerLevelsCompleted RewardTrigger = "levels_completed"
	TriggerXP              RewardTrigger = "xp"
	TriggerStreakDays      RewardTrigger = "streak_days"
)

// Reward is the master definition of an achievement reward (seeded by the server).
type Reward struct {
	ID          string        `bson:"_id"         json:"id"`
	Title       string        `bson:"title"       json:"title"`
	Description string        `bson:"description" json:"description"`
	Icon        string        `bson:"icon"        json:"icon"`   // crown|flame|gem|trophy|zap
	Rarity      string        `bson:"rarity"      json:"rarity"` // rare|epic|legendary
	Trigger     RewardTrigger `bson:"trigger"     json:"trigger"`
	Required    int           `bson:"required"    json:"required"`
	XPBonus     int           `bson:"xp_bonus"    json:"xp_bonus"`
	SortOrder   int           `bson:"sort_order"  json:"sort_order"`
}

// UserReward records that a user has been granted a specific reward.
type UserReward struct {
	ID         string    `bson:"_id"         json:"id"`
	UserID     string    `bson:"user_id"     json:"user_id"`
	RewardID   string    `bson:"reward_id"   json:"reward_id"`
	UnlockedAt time.Time `bson:"unlocked_at" json:"unlocked_at"`
}

// RewardWithStatus is the API response type sent to the client.
type RewardWithStatus struct {
	Reward     `bson:",inline"`
	Unlocked   bool       `json:"unlocked"`
	UnlockedAt *time.Time `json:"unlocked_at,omitempty"`
	Current    int        `json:"current"`  // current metric value for this user
	Progress   float64    `json:"progress"` // 0.0–1.0 for UI progress bar
}

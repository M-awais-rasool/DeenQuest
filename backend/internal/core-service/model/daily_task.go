package model

import "time"

type ScreenType string

const (
	ScreenChecklist   ScreenType = "CHECKLIST"
	ScreenQuranReader ScreenType = "QURAN_READER"
	ScreenCounter     ScreenType = "COUNTER"
	ScreenHadithCard  ScreenType = "HADITH_CARD"
	ScreenQuiz        ScreenType = "QUIZ"
	ScreenAudioPlayer ScreenType = "AUDIO_PLAYER"
	ScreenReflection  ScreenType = "REFLECTION"
	ScreenTips        ScreenType = "TIPS"
	ScreenAction      ScreenType = "ACTION"
)

type CompletionType string

const (
	CompletionButton  CompletionType = "button"
	CompletionAuto    CompletionType = "auto"
	CompletionCounter CompletionType = "counter"
	CompletionQuiz    CompletionType = "quiz"
)

type Difficulty string

const (
	DifficultyEasy   Difficulty = "easy"
	DifficultyMedium Difficulty = "medium"
)

type TaskCategory string

const (
	CategorySalah      TaskCategory = "salah"
	CategoryQuran      TaskCategory = "quran"
	CategoryDhikr      TaskCategory = "dhikr"
	CategoryLearning   TaskCategory = "learning"
	CategoryCharacter  TaskCategory = "character"
	CategorySocial     TaskCategory = "social"
	CategoryReflection TaskCategory = "reflection"
)

// DailyTask is the master template for a task. These are seeded and never user-specific.
type DailyTask struct {
	ID             string         `bson:"_id" json:"id"`
	Title          string         `bson:"title" json:"title"`
	Category       TaskCategory   `bson:"category" json:"category"`
	Description    string         `bson:"description" json:"description"`
	ScreenType     ScreenType     `bson:"screen_type" json:"screen_type"`
	Component      string         `bson:"component" json:"component"`
	Data           map[string]any `bson:"data" json:"data"`
	CompletionType CompletionType `bson:"completion_type" json:"completion_type"`
	RewardXP       int            `bson:"reward_xp" json:"reward_xp"`
	Difficulty     Difficulty     `bson:"difficulty" json:"difficulty"`
	IsFixed        bool           `bson:"is_fixed" json:"is_fixed"` // Fajr is always fixed
}

// UserDailyTask tracks a user's assignment and completion for a specific day.
type UserDailyTask struct {
	ID          string    `bson:"_id" json:"id"`
	UserID      string    `bson:"user_id" json:"user_id"`
	TaskID      string    `bson:"task_id" json:"task_id"`
	Date        string    `bson:"date" json:"date"` // YYYY-MM-DD
	Completed   bool      `bson:"completed" json:"completed"`
	CompletedAt time.Time `bson:"completed_at,omitempty" json:"completed_at,omitempty"`
	CreatedAt   time.Time `bson:"created_at" json:"created_at"`
}

// DailyTaskWithStatus is the response type sent to the frontend.
type DailyTaskWithStatus struct {
	DailyTask   `bson:",inline"`
	Completed   bool      `json:"completed"`
	CompletedAt time.Time `json:"completed_at,omitempty"`
}

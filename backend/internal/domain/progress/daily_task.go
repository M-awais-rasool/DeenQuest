package progress

import "time"

type CompletionType string

const (
	CompletionButton CompletionType = "button"
	CompletionAuto   CompletionType = "auto"
	CompletionQuiz   CompletionType = "quiz"
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
// A task is composed of an ordered list of Blocks; the frontend renders each block in
// sequence without needing a dedicated component per task type.
type DailyTask struct {
	ID             string         `bson:"_id" json:"id"`
	Title          string         `bson:"title" json:"title"`
	Category       TaskCategory   `bson:"category" json:"category"`
	Description    string         `bson:"description" json:"description"`
	Blocks         []Block        `bson:"blocks" json:"blocks"`
	CompletionType CompletionType `bson:"completion_type" json:"completion_type"`
	RewardXP       int            `bson:"reward_xp" json:"reward_xp"`
	Difficulty     Difficulty     `bson:"difficulty" json:"difficulty"`
	IsFixed        bool           `bson:"is_fixed" json:"is_fixed"` // Fajr is always included
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

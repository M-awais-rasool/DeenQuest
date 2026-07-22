package domain

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

type BlockType string

const (
	BlockText          BlockType = "TextBlock"
	BlockAyah          BlockType = "AyahBlock"
	BlockHadith        BlockType = "HadithBlock"
	BlockCounter       BlockType = "CounterBlock"
	BlockQuiz          BlockType = "QuizBlock"
	BlockAudio         BlockType = "AudioBlock"
	BlockChecklist     BlockType = "ChecklistBlock"
	BlockFlashCard     BlockType = "FlashCardBlock"
	BlockDragDrop      BlockType = "DragDropBlock"
	BlockMatch         BlockType = "MatchBlock"
	BlockReward        BlockType = "RewardBlock"
	BlockImage         BlockType = "ImageBlock"
	BlockVideo         BlockType = "VideoBlock"
	BlockVoicePractice BlockType = "VoicePracticeBlock"
)

// Block is a single renderable unit within a task.
// Content holds block-specific data; its keys vary by Type.
//
// Content schema by block type:
//
//	TextBlock:      { "content": string }
//	                Optional: "items": []string, "style": "list"|"numbered"
//	AyahBlock:      { "surah": string, "ayahs": []int }
//	                Optional: "surah_id": int for opening the Quran reader
//	HadithBlock:    { "text": string, "reference": string }
//	CounterBlock:   { "target": int, "phrase": string }
//	QuizBlock:      { "question": string, "options": []string }
//	                Quiz mode:       add "correct": int (0-based index)
//	                Reflection mode: omit "correct" (any selection is valid)
//	AudioBlock:     { "surah": string, "duration": int (seconds) }
//	                Optional: "surah_id": int for opening the Quran reader/player
//	ChecklistBlock: { "items": []string }
type Block struct {
	Type    BlockType      `bson:"type" json:"type"`
	Content map[string]any `bson:"content" json:"content"`
}

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
	SkillTags      []string       `bson:"skill_tags,omitempty" json:"skill_tags,omitempty"`
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

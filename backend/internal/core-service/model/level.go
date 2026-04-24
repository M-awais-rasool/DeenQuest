package model

import "time"

// MiniGameType defines the kind of interactive game in a level.
type MiniGameType string

const (
	GameTapMatch     MiniGameType = "tap_match"
	GameListenChoose MiniGameType = "listen_choose"
	GameDragDrop     MiniGameType = "drag_drop"
	GameRepeatVoice  MiniGameType = "repeat_voice"
	GameMCQ          MiniGameType = "mcq"
	GameMemoryCards  MiniGameType = "memory_cards"
)

// LessonType describes the pedagogical focus of a lesson step.
type LessonType string

const (
	LessonQaida         LessonType = "qaida"
	LessonHadith        LessonType = "hadith"
	LessonDua           LessonType = "dua"
	LessonQuiz          LessonType = "quiz"
	LessonPronunciation LessonType = "pronunciation"
	LessonManners       LessonType = "manners"
	LessonRevision      LessonType = "revision"
)

// LevelDifficulty covers all three tiers for the level journey.
type LevelDifficulty string

const (
	LevelEasy   LevelDifficulty = "easy"
	LevelMedium LevelDifficulty = "medium"
	LevelHard   LevelDifficulty = "hard"
)

// Lesson is a single step inside a level.
type Lesson struct {
	Type        LessonType     `bson:"type" json:"type"`
	Title       string         `bson:"title" json:"title"`
	Description string         `bson:"description" json:"description"`
	ScreenType  ScreenType     `bson:"screen_type" json:"screen_type"`
	Component   string         `bson:"component" json:"component"`
	Data        map[string]any `bson:"data" json:"data"`
}

// MiniGame is the interactive challenge at the end of a level.
type MiniGame struct {
	Type        MiniGameType   `bson:"type" json:"type"`
	Description string         `bson:"description" json:"description"`
	Data        map[string]any `bson:"data" json:"data"`
}

// Level is the master template for a single level in the learning journey.
type Level struct {
	ID           int             `bson:"_id" json:"id"`
	Title        string          `bson:"title" json:"title"`
	Theme        string          `bson:"theme" json:"theme"`
	Goal         string          `bson:"goal" json:"goal"`
	Lessons      []Lesson        `bson:"lessons" json:"lessons"`
	MiniGame     MiniGame        `bson:"mini_game" json:"mini_game"`
	XPReward     int             `bson:"xp_reward" json:"xp_reward"`
	UnlockReward string          `bson:"unlock_reward" json:"unlock_reward"`
	Difficulty   LevelDifficulty `bson:"difficulty" json:"difficulty"`
}

// UserLevel tracks a user's progress through a single level.
type UserLevel struct {
	ID              string    `bson:"_id" json:"id"`
	UserID          string    `bson:"user_id" json:"user_id"`
	LevelID         int       `bson:"level_id" json:"level_id"`
	Stars           int       `bson:"stars" json:"stars"` // 0-3
	LessonsComplete int       `bson:"lessons_complete" json:"lessons_complete"`
	MiniGameDone    bool      `bson:"mini_game_done" json:"mini_game_done"`
	Completed       bool      `bson:"completed" json:"completed"`
	CompletedAt     time.Time `bson:"completed_at,omitempty" json:"completed_at,omitempty"`
	CreatedAt       time.Time `bson:"created_at" json:"created_at"`
}

// LevelWithStatus is the response type for a level with the user's progress.
type LevelWithStatus struct {
	Level           `bson:",inline"`
	Status          string `json:"status"` // "locked", "available", "in_progress", "completed"
	Stars           int    `json:"stars"`
	LessonsComplete int    `json:"lessons_complete"`
}

// LevelCompletionResult is returned when a user completes a level.
type LevelCompletionResult struct {
	XPEarned     int      `json:"xp_earned"`
	Stars        int      `json:"stars"`
	UnlockReward string   `json:"unlock_reward"`
	TreasureOpen bool     `json:"treasure_open"` // true every 5 levels
	NextLevelID  int      `json:"next_level_id"`
	NewRewards   []Reward `json:"new_rewards"` // rewards granted by this completion
}

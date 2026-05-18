package learningagent

import (
	"time"
)

type EventType string

const (
	EventTaskCompleted    EventType = "task.completed"
	EventTaskFailed       EventType = "task.failed"
	EventTaskSkipped      EventType = "task.skipped"
	EventLevelCompleted   EventType = "level.completed"
	EventLevelFailed      EventType = "level.failed"
	EventInactiveDetected EventType = "inactive.detected"
	EventActivityLogged   EventType = "activity.logged"
)

type ActionType string

const (
	ActionAssignRevision     ActionType = "assign_revision"
	ActionIncreaseDifficulty ActionType = "increase_difficulty"
	ActionDecreaseDifficulty ActionType = "decrease_difficulty"
	ActionContinueNormal     ActionType = "continue_normal"
	ActionReEngage           ActionType = "re_engage"
)

type UserCategory string

const (
	CategoryQaida  UserCategory = "qaida"
	CategoryTajweed UserCategory = "tajweed"
)

type EngagementLevel string

const (
	EngagementHigh     EngagementLevel = "high"
	EngagementModerate EngagementLevel = "moderate"
	EngagementLow      EngagementLevel = "low"
	EngagementAtRisk   EngagementLevel = "at_risk"
)

type LearningSpeed string

const (
	SpeedFast         LearningSpeed = "fast_learner"
	SpeedAverage      LearningSpeed = "average"
	SpeedNeedsSupport LearningSpeed = "needs_support"
	SpeedUnknown      LearningSpeed = "unknown"
)

type TrendDirection string

const (
	TrendImproving TrendDirection = "improving"
	TrendDeclining TrendDirection = "declining"
	TrendStable    TrendDirection = "stable"
)

type SkillProfile struct {
	Proficiency   float64   `json:"proficiency" bson:"proficiency"`
	Attempts      int       `json:"attempts" bson:"attempts"`
	AvgScore      float64   `json:"avg_score" bson:"avg_score"`
	LastPracticed time.Time `json:"last_practiced" bson:"last_practiced"`
}

type EngagementProfile struct {
	Level              EngagementLevel `json:"level" bson:"level"`
	Score              float64         `json:"score" bson:"score"`
	LastActive         time.Time       `json:"last_active" bson:"last_active"`
	SessionFrequency7d int             `json:"session_frequency_7d" bson:"session_frequency_7d"`
	SkipRate7d         float64         `json:"skip_rate_7d" bson:"skip_rate_7d"`
}

type LearningSpeedProfile struct {
	Classification       LearningSpeed `json:"classification" bson:"classification"`
	AvgTimeToMasteryDays float64       `json:"avg_time_to_mastery_days" bson:"avg_time_to_mastery_days"`
	CategoriesMastered   int           `json:"categories_mastered" bson:"categories_mastered"`
	CategoriesInProgress int           `json:"categories_in_progress" bson:"categories_in_progress"`
}

type LearningState struct {
	UserID        string                                            `json:"user_id" bson:"user_id"`
	UpdatedAt     time.Time                                         `json:"updated_at" bson:"updated_at"`
	CreatedAt     time.Time                                         `json:"created_at" bson:"created_at"`
	SkillProfile  map[UserCategory]map[string]*SkillProfile         `json:"skill_profile" bson:"skill_profile"`
	Engagement    EngagementProfile                                 `json:"engagement" bson:"engagement"`
	LearningSpeed LearningSpeedProfile                              `json:"learning_speed" bson:"learning_speed"`
	WeakAreas     []string                                          `json:"weak_areas" bson:"weak_areas"`
	StrongAreas   []string                                          `json:"strong_areas" bson:"strong_areas"`
	CurrentLevel  int                                               `json:"current_level" bson:"current_level"`
}

type DecisionResult struct {
	UserID      string       `json:"user_id"`
	ActionType  ActionType   `json:"action_type"`
	Reason      string       `json:"reason"`
	Category    UserCategory `json:"category,omitempty"`
	SubCategory string       `json:"subcategory,omitempty"`
	Difficulty  string       `json:"difficulty,omitempty"`
	TaskIDs     []string     `json:"task_ids,omitempty"`
	Message     string       `json:"message,omitempty"`
	Timestamp   time.Time    `json:"timestamp"`
}

type PatternReport struct {
	WeakAreas      []string       `json:"weak_areas"`
	StrongAreas    []string       `json:"strong_areas"`
	EngagementRisk bool           `json:"engagement_risk"`
	LearningSpeed  LearningSpeed  `json:"learning_speed"`
	TrendDirection TrendDirection `json:"trend_direction"`
}

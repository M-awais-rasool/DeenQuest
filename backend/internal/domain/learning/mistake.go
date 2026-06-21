package learning

import (
	"context"
	"time"
)

// Mistake is a wrong answer the learner can revisit deliberately. It is keyed per
// (user, level, lesson); repeated wrongs on the same item increment Count and
// re-open it. Populated by the mistakes reactor (its own Kafka consumer group),
// fully decoupled from the StateUpdater/Recommender.
type Mistake struct {
	ID          string    `bson:"_id" json:"id"`
	UserID      string    `bson:"user_id" json:"user_id"`
	CourseType  string    `bson:"course_type,omitempty" json:"course_type,omitempty"`
	LevelID     int       `bson:"level_id" json:"level_id"`
	LessonIndex int       `bson:"lesson_index" json:"lesson_index"`
	SkillTags   []string  `bson:"skill_tags,omitempty" json:"skill_tags,omitempty"`
	Count       int       `bson:"count" json:"count"`
	Resolved    bool      `bson:"resolved" json:"resolved"`
	FirstAt     time.Time `bson:"first_at" json:"first_at"`
	LastAt      time.Time `bson:"last_at" json:"last_at"`
	ResolvedAt  time.Time `bson:"resolved_at,omitempty" json:"resolved_at,omitempty"`
}

// MistakeRepository persists the mistake notebook. Kept separate from the main
// learning Repository so the feature stays modular and independently testable.
type MistakeRepository interface {
	// RecordMistake upserts a mistake for (user, level, lesson): increments the
	// count, refreshes the timestamp, and re-opens it if it was resolved.
	RecordMistake(ctx context.Context, m Mistake) error
	// ListMistakes returns a user's mistakes, newest first; resolved ones only
	// when includeResolved is true.
	ListMistakes(ctx context.Context, userID string, includeResolved bool, limit int) ([]Mistake, error)
	// ResolveMistake marks one mistake resolved (the learner revisited it).
	ResolveMistake(ctx context.Context, userID, id string) error

	// TopMissed ranks the most-missed (level, lesson) across all learners — the
	// admin Curriculum Agent's "where people fail" view.
	TopMissed(ctx context.Context, limit int) ([]LessonStruggle, error)
}

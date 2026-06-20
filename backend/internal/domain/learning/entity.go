// Package learning holds the domain model for the Learning Agent: the evolving
// per-user LearnerState, the deterministic Recommendation it drives, and the
// behavior-event envelope (see event.go) that feeds both. All learning logic is
// rule-based; the optional Claude layer only fills the Motivation/Message text.
package learning

import "time"

// Segment is the coarse learner classification the recommender branches on.
type Segment string

const (
	SegmentWeak      Segment = "weak"      // low mastery, needs heavier revision
	SegmentActive    Segment = "active"    // engaging normally
	SegmentInactive  Segment = "inactive"  // hasn't engaged recently (dropout risk)
	SegmentImproving Segment = "improving" // mastery trending up / strong streak
)

// SkillStat tracks mastery + spaced-repetition state for a single skill unit
// (an Arabic letter, a harakat, or a concept tag). Mastery is an EWMA of
// correctness; Ease/IntervalDays/DueAt are an SM-2-lite revision schedule.
type SkillStat struct {
	Attempts     int       `bson:"attempts" json:"attempts"`
	Correct      int       `bson:"correct" json:"correct"`
	Streak       int       `bson:"streak" json:"streak"` // consecutive correct
	Mastery      float64   `bson:"mastery" json:"mastery"`
	Ease         float64   `bson:"ease" json:"ease"`                   // SM-2 ease factor (default 2.5)
	IntervalDays float64   `bson:"interval_days" json:"interval_days"` // current revision interval
	DueAt        time.Time `bson:"due_at" json:"due_at"`               // when this skill should be revised
	LastSeenAt   time.Time `bson:"last_seen_at" json:"last_seen_at"`
}

// LearnerState is the single evolving document per user. It is updated by the
// StateUpdater on every behavior event and read by the Recommender + pattern
// sweep. One document per user in the learner_states collection.
type LearnerState struct {
	ID         string               `bson:"_id" json:"id"`
	UserID     string               `bson:"user_id" json:"user_id"`
	CourseType string               `bson:"course_type" json:"course_type"`
	Skills     map[string]SkillStat `bson:"skills" json:"skills"` // skill tag -> stats

	WeakAreas   []string `bson:"weak_areas" json:"weak_areas"`     // derived, worst-first
	StrongAreas []string `bson:"strong_areas" json:"strong_areas"` // derived, best-first

	LearningSpeed float64 `bson:"learning_speed" json:"learning_speed"` // EWMA correct-per-minute (normalized)
	AvgTaskMs     float64 `bson:"avg_task_ms" json:"avg_task_ms"`       // EWMA time-on-task
	Engagement    float64 `bson:"engagement" json:"engagement"`         // 0..1 EWMA
	DropoutRisk   float64 `bson:"dropout_risk" json:"dropout_risk"`     // 0..1
	Segment       Segment `bson:"segment" json:"segment"`

	TotalEvents int      `bson:"total_events" json:"total_events"`
	RecentItems []string `bson:"recent_items" json:"recent_items"` // last N item keys (anti-repetition)

	// NextDueAt is the earliest revision due-date across still-learning skills.
	// Indexed so the pattern sweep can query only users who actually need work
	// (O(candidates) instead of scanning every learner).
	NextDueAt time.Time `bson:"next_due_at,omitempty" json:"next_due_at,omitempty"`

	// Motivation is optional Claude-generated copy. It is never read by the
	// deterministic engines — purely surfaced to the UI.
	Motivation   string    `bson:"motivation,omitempty" json:"motivation,omitempty"`
	MotivationAt time.Time `bson:"motivation_at,omitempty" json:"motivation_at,omitempty"`

	LastEventAt time.Time `bson:"last_event_at" json:"last_event_at"`
	CreatedAt   time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time `bson:"updated_at" json:"updated_at"`
}

// AgentStats is the aggregate read-model powering the admin "Learning Agent"
// monitoring page. Computed on demand from learner_states + recommendations.
type AgentStats struct {
	TotalLearners         int            `json:"total_learners"`
	Segments              map[string]int `json:"segments"` // weak/active/inactive/improving -> count
	ActiveRecommendations int            `json:"active_recommendations"`
	DueRevisions          int            `json:"due_revisions"` // learners with a revision due now
	AvgEngagement         float64        `json:"avg_engagement"`
	AvgDropoutRisk        float64        `json:"avg_dropout_risk"`
	TotalEvents           int64          `json:"total_events"`
}

// RecommendationKind is the type of next-best-action the recommender produced.
type RecommendationKind string

const (
	RecRevision   RecommendationKind = "revision"    // revise a weak/overdue skill
	RecNewContent RecommendationKind = "new_content" // advance to the next level/lesson
	RecReengage   RecommendationKind = "reengage"    // win back an inactive learner
)

// Recommendation status values.
const (
	RecStatusActive    = "active"
	RecStatusDismissed = "dismissed"
	RecStatusServed    = "served"
)

// Recommendation is a deterministic next-best-action written by the recommender.
// Reason is the rule-based explanation; Message is optional Claude copy.
type Recommendation struct {
	ID         string             `bson:"_id" json:"id"`
	UserID     string             `bson:"user_id" json:"user_id"`
	Kind       RecommendationKind `bson:"kind" json:"kind"`
	CourseType string             `bson:"course_type" json:"course_type"`
	LevelID    int                `bson:"level_id,omitempty" json:"level_id,omitempty"`
	SkillTags  []string           `bson:"skill_tags,omitempty" json:"skill_tags,omitempty"`
	Title      string             `bson:"title" json:"title"`
	Reason     string             `bson:"reason" json:"reason"`                       // deterministic explanation
	Difficulty string             `bson:"difficulty" json:"difficulty"`               // easy|medium|hard
	Priority   int                `bson:"priority" json:"priority"`                   // higher = surfaced first
	Message    string             `bson:"message,omitempty" json:"message,omitempty"` // optional AI copy
	Status     string             `bson:"status" json:"status"`
	CreatedAt  time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt  time.Time          `bson:"updated_at" json:"updated_at"`
}

package learning

import (
	"context"
	"time"
)

// Repository persists LearnerState and Recommendations. Implemented by the
// Mongo adapter in internal/infrastructure/persistence.
type Repository interface {
	// State
	GetState(ctx context.Context, userID string) (*LearnerState, error)
	UpsertState(ctx context.Context, state *LearnerState) error
	ListStates(ctx context.Context, limit, offset int) ([]LearnerState, error)

	// ListSweepCandidates returns only learners the pattern sweep must act on:
	// those idle long enough to flip to inactive, or with a revision now due.
	// Indexed so the cron is O(candidates), not O(all users).
	ListSweepCandidates(ctx context.Context, inactiveBefore, dueBefore time.Time, limit, offset int) ([]LearnerState, error)

	// Recommendations
	ReplaceActiveRecommendations(ctx context.Context, userID string, recs []Recommendation) error
	ListActiveRecommendations(ctx context.Context, userID string) ([]Recommendation, error)

	// SetMotivation attaches optional AI-generated copy to the user's state.
	// Best-effort; never part of the deterministic decision path.
	SetMotivation(ctx context.Context, userID, message string) error

	// Stats returns aggregate metrics for the admin monitoring page.
	Stats(ctx context.Context, now time.Time) (*AgentStats, error)

	// SkillStruggles ranks skills by how many learners are weak in them — the
	// admin Curriculum Agent's "what's hardest" view.
	SkillStruggles(ctx context.Context, limit int) ([]SkillStruggle, error)
}

package coach

import (
	"context"
	"time"
)

type Repository interface {
	// ClaimBatch records an ingest idempotency key; it returns false when the
	// same (user, key) was already processed, so retried batches are no-ops.
	ClaimBatch(ctx context.Context, userID, key string) (bool, error)

	// StoreEvents persists raw telemetry for Phase-2 replay and analytics.
	StoreEvents(ctx context.Context, events []StoredEvent) error

	// GetSkillState returns the user's skill model, or nil when none exists.
	GetSkillState(ctx context.Context, userID string) (*UserSkillState, error)
	SaveSkillState(ctx context.Context, state *UserSkillState) error

	// UpsertInsights writes rule output; deterministic IDs make this idempotent
	// (created_at is preserved on updates). ExpireInsightsNotIn then retires
	// active insights the latest evaluation no longer produced.
	UpsertInsights(ctx context.Context, insights []Insight) error
	ExpireInsightsNotIn(ctx context.Context, userID string, activeIDs []string, now time.Time) error

	ActiveInsights(ctx context.Context, userID string, now time.Time) ([]Insight, error)
	GetInsight(ctx context.Context, userID, insightID string) (*Insight, error)
	MarkInsightDone(ctx context.Context, userID, insightID string) error

	ClearConfusionPair(ctx context.Context, userID, a, b string) error

	// EachSkillState streams every user's state for the nightly sweep.
	EachSkillState(ctx context.Context, fn func(*UserSkillState) error) error

	// PurgeUser removes every coach document for a user (account deletion).
	PurgeUser(ctx context.Context, userID string) error
}

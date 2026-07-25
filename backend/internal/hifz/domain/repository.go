package domain

import (
	"context"
	"time"
)

type Repository interface {
	// ── plans ──
	ListPlans(ctx context.Context, publishedOnly bool) ([]Plan, error)
	GetPlan(ctx context.Context, id string) (*Plan, error)
	UpsertPlan(ctx context.Context, plan *Plan) error
	DeletePlan(ctx context.Context, id string) error
	// SeedPlans inserts plans that are absent or carry an older seed version,
	// never overwriting admin edits to an up-to-date plan.
	SeedPlans(ctx context.Context, plans []Plan) (inserted int, err error)

	// ── settings ──
	GetSettings(ctx context.Context) (*Settings, error)
	SaveSettings(ctx context.Context, s *Settings) error

	// ── enrollment ──
	ActiveEnrollment(ctx context.Context, userID string) (*Enrollment, error)
	ListEnrollments(ctx context.Context, userID string) ([]Enrollment, error)
	SaveEnrollment(ctx context.Context, e *Enrollment) error
	DeactivateEnrollments(ctx context.Context, userID string) error

	// ── portion state ──
	GetPortionState(ctx context.Context, userID, portionID string) (*PortionState, error)
	ListPortionStates(ctx context.Context, userID, planID string) ([]PortionState, error)
	SavePortionState(ctx context.Context, st *PortionState) error
	DeletePortionState(ctx context.Context, userID, portionID string) error

	// ── sessions ──
	GetSession(ctx context.Context, id string) (*Session, error)
	SaveSession(ctx context.Context, s *Session) error

	// ── attempts ──
	SaveAttempt(ctx context.Context, a *Attempt) error
	// AvgLatency returns the user's typical answer latency in ms, used to scale
	// the latency penalty. Zero means "not enough data".
	AvgLatency(ctx context.Context, userID string) (int, error)

	// ── mistakes ──
	BumpMistakes(ctx context.Context, mistakes []Mistake) error
	ListMistakes(ctx context.Context, userID string, limit int) ([]Mistake, error)
	CountMistakes(ctx context.Context, userID string) (int, error)
	ResolveMistake(ctx context.Context, userID, mistakeID string, at time.Time) error

	// PurgeUser removes every hifz document for a user (account deletion).
	PurgeUser(ctx context.Context, userID string) error
}

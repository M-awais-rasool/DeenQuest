package application

import (
	"context"
	"time"

	"github.com/chawais/deenquest/backend/internal/coach/domain"
)

// AdminRepository backs the coach admin dashboards (aggregate reads).
type AdminRepository interface {
	EachSkillState(ctx context.Context, fn func(*domain.UserSkillState) error) error
	CountActiveInsights(ctx context.Context, now time.Time) (total, decay int, err error)
	CountEvents(ctx context.Context) (int64, error)
	MostMissedLessons(ctx context.Context, limit int) ([]LessonStruggle, error)
}

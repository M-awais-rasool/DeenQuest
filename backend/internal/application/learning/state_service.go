package learning

import (
	"context"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"

	domain "github.com/chawais/talent-flow/backend/internal/domain/learning"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/logger"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/queue"
)

// StateService is the StateUpdater reactor (Kafka consumer group "learning-state").
// For each behavior event it loads the user's LearnerState, applies the pure
// engine, and upserts. This is the only writer of the deterministic state.
type StateService struct {
	repo domain.Repository
}

func NewStateService(repo domain.Repository) *StateService {
	return &StateService{repo: repo}
}

// Handle is a queue.MessageHandler for the learning.events topic.
func (s *StateService) Handle(ctx context.Context, event queue.Event) error {
	ev, err := domain.DecodeBehaviorEvent(event.Payload)
	if err != nil {
		logger.Warn("learning state: undecodable event", zap.Error(err))
		return nil // poison message — skip rather than block the partition
	}
	if ev.UserID == "" {
		return nil
	}

	state, err := s.repo.GetState(ctx, ev.UserID)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	if state == nil {
		state = NewState(uuid.NewString(), ev.UserID, ev.CourseType, now)
	}

	ApplyEvent(state, ev, now)

	if err := s.repo.UpsertState(ctx, state); err != nil {
		return err
	}
	logger.Info("learning state updated",
		zap.String("user_id", ev.UserID),
		zap.String("event_type", string(ev.Type)),
		zap.String("segment", string(state.Segment)),
		zap.Int("weak_areas", len(state.WeakAreas)),
	)
	return nil
}

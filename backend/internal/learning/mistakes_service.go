package learning

import (
	"context"

	"go.uber.org/zap"

	"github.com/chawais/deenquest/backend/internal/learning/model"
	"github.com/chawais/deenquest/backend/internal/platform/kafka"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
)

// MistakeService is the Mistake Notebook reactor (consumer group
// "learning-mistakes-group"). It records wrong answers so learners can revisit
// them. Fully independent of the StateUpdater/Recommender — a textbook example of
// adding a reactor on the shared event stream without touching the others.
type MistakeService struct {
	repo model.MistakeRepository
}

func NewMistakeService(repo model.MistakeRepository) *MistakeService {
	return &MistakeService{repo: repo}
}

// Handle is a kafka.MessageHandler for the learning.events topic. It only acts on
// wrong answers / failed recitations that carry a level reference.
func (s *MistakeService) Handle(ctx context.Context, event kafka.Event) error {
	ev, err := model.DecodeBehaviorEvent(event.Payload)
	if err != nil || ev.UserID == "" {
		return nil
	}

	wrong := ev.Type == model.EventAnswerWrong ||
		(ev.Type == model.EventRecitationScored && !ev.Correct)
	if !wrong || ev.LevelID == 0 {
		return nil
	}

	if err := s.repo.RecordMistake(ctx, model.Mistake{
		UserID:      ev.UserID,
		CourseType:  ev.CourseType,
		LevelID:     ev.LevelID,
		LessonIndex: ev.LessonIndex,
		SkillTags:   ev.SkillTags,
	}); err != nil {
		return err
	}
	logger.Info("mistake recorded", zap.String("user_id", ev.UserID), zap.Int("level_id", ev.LevelID))
	return nil
}

// List returns the learner's mistakes (open by default).
func (s *MistakeService) List(ctx context.Context, userID string, includeResolved bool) ([]model.Mistake, error) {
	return s.repo.ListMistakes(ctx, userID, includeResolved, 100)
}

// Resolve marks a mistake as revisited.
func (s *MistakeService) Resolve(ctx context.Context, userID, id string) error {
	return s.repo.ResolveMistake(ctx, userID, id)
}

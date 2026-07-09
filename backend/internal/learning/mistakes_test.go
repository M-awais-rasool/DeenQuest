package learning

import (
	"context"
	"testing"

	"github.com/chawais/deenquest/backend/internal/learning/model"
	"github.com/chawais/deenquest/backend/internal/platform/kafka"
)

type fakeMistakeRepo struct {
	recorded []model.Mistake
}

func (f *fakeMistakeRepo) RecordMistake(_ context.Context, m model.Mistake) error {
	f.recorded = append(f.recorded, m)
	return nil
}
func (f *fakeMistakeRepo) ListMistakes(context.Context, string, bool, int) ([]model.Mistake, error) {
	return f.recorded, nil
}
func (f *fakeMistakeRepo) ResolveMistake(context.Context, string, string) error { return nil }
func (f *fakeMistakeRepo) TopMissed(context.Context, int) ([]model.LessonStruggle, error) {
	return nil, nil
}

func ev(payload model.BehaviorEvent) kafka.Event {
	return kafka.Event{Type: string(payload.Type), Payload: payload}
}

func TestMistakeService_RecordsOnlyWrongAnswers(t *testing.T) {
	repo := &fakeMistakeRepo{}
	svc := NewMistakeService(repo)
	ctx := context.Background()

	// A wrong answer with a level → recorded.
	_ = svc.Handle(ctx, ev(model.BehaviorEvent{UserID: "u1", Type: model.EventAnswerWrong, LevelID: 3, LessonIndex: 2, SkillTags: []string{"ت"}}))
	// A correct answer → ignored.
	_ = svc.Handle(ctx, ev(model.BehaviorEvent{UserID: "u1", Type: model.EventAnswerCorrect, LevelID: 3}))
	// A failed recitation → recorded.
	_ = svc.Handle(ctx, ev(model.BehaviorEvent{UserID: "u1", Type: model.EventRecitationScored, LevelID: 4, Correct: false}))
	// A passed recitation → ignored.
	_ = svc.Handle(ctx, ev(model.BehaviorEvent{UserID: "u1", Type: model.EventRecitationScored, LevelID: 4, Correct: true}))
	// A wrong answer with no level → ignored (nothing to revisit).
	_ = svc.Handle(ctx, ev(model.BehaviorEvent{UserID: "u1", Type: model.EventAnswerWrong}))

	if len(repo.recorded) != 2 {
		t.Fatalf("expected 2 recorded mistakes, got %d: %+v", len(repo.recorded), repo.recorded)
	}
	if repo.recorded[0].LevelID != 3 || repo.recorded[0].LessonIndex != 2 {
		t.Fatalf("unexpected first mistake: %+v", repo.recorded[0])
	}
}

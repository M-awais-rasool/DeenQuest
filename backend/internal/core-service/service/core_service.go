package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/chawais/talent-flow/backend/internal/core-service/model"
	"github.com/chawais/talent-flow/backend/internal/core-service/repository"
	"github.com/chawais/talent-flow/backend/pkg/queue"
)

var ErrHabitNotFound = errors.New("habit not found")

type EventPublisher interface {
	Publish(ctx context.Context, topic string, event queue.Event) error
}

type CoreService struct {
	repo      repository.CoreRepository
	publisher EventPublisher
}

func NewCoreService(repo repository.CoreRepository, publisher EventPublisher) *CoreService {
	return &CoreService{repo: repo, publisher: publisher}
}

func (s *CoreService) CreateHabit(ctx context.Context, userID, title string, habitType model.HabitType, targetDaily int) (*model.Habit, error) {
	now := time.Now().UTC()
	h := &model.Habit{
		ID:          uuid.NewString(),
		UserID:      userID,
		Title:       title,
		Type:        habitType,
		TargetDaily: targetDaily,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	if err := s.repo.CreateHabit(ctx, h); err != nil {
		return nil, fmt.Errorf("create habit: %w", err)
	}
	return h, nil
}

func (s *CoreService) ListHabits(ctx context.Context, userID string) ([]model.Habit, error) {
	return s.repo.ListHabits(ctx, userID)
}

func (s *CoreService) CompleteHabit(ctx context.Context, userID, habitID string, xp int) error {
	h, err := s.repo.GetHabitByID(ctx, userID, habitID)
	if err != nil {
		return err
	}
	if h == nil {
		return ErrHabitNotFound
	}

	if err := s.bumpProgress(ctx, userID, xp, 0); err != nil {
		return err
	}
	if err := s.bumpStreak(ctx, userID); err != nil {
		return err
	}

	if s.publisher != nil {
		_ = s.publisher.Publish(ctx, "habit.completed", queue.Event{
			Type: "habit.completed",
			Payload: map[string]interface{}{
				"user_id":  userID,
				"habit_id": habitID,
				"habit":    h.Type,
				"xp":       xp,
			},
		})
	}
	return nil
}

func (s *CoreService) AddReflection(ctx context.Context, userID, text string, moodScore int) (*model.Reflection, error) {
	barakahGain := 5
	if moodScore >= 8 {
		barakahGain = 8
	}
	r := &model.Reflection{
		ID:          uuid.NewString(),
		UserID:      userID,
		Text:        text,
		MoodScore:   moodScore,
		BarakahGain: barakahGain,
		CreatedAt:   time.Now().UTC(),
	}
	if err := s.repo.CreateReflection(ctx, r); err != nil {
		return nil, err
	}
	if err := s.bumpProgress(ctx, userID, 0, barakahGain); err != nil {
		return nil, err
	}
	return r, nil
}

func (s *CoreService) GetProgress(ctx context.Context, userID string) (*model.Progress, *model.Streak, error) {
	progress, err := s.repo.GetProgress(ctx, userID)
	if err != nil {
		return nil, nil, err
	}
	if progress == nil {
		progress = &model.Progress{ID: uuid.NewString(), UserID: userID, Level: 1, UpdatedAt: time.Now().UTC()}
		if err := s.repo.UpsertProgress(ctx, progress); err != nil {
			return nil, nil, err
		}
	}

	streak, err := s.repo.GetStreak(ctx, userID)
	if err != nil {
		return nil, nil, err
	}
	if streak == nil {
		streak = &model.Streak{ID: uuid.NewString(), UserID: userID, UpdatedAt: time.Now().UTC()}
		if err := s.repo.UpsertStreak(ctx, streak); err != nil {
			return nil, nil, err
		}
	}
	return progress, streak, nil
}

func (s *CoreService) ListAchievements(ctx context.Context, userID string) ([]model.Achievement, error) {
	return s.repo.ListAchievements(ctx, userID)
}

func (s *CoreService) bumpProgress(ctx context.Context, userID string, xpDelta int, barakahDelta int) error {
	p, err := s.repo.GetProgress(ctx, userID)
	if err != nil {
		return err
	}
	if p == nil {
		p = &model.Progress{ID: uuid.NewString(), UserID: userID, Level: 1}
	}
	p.TotalXP += xpDelta
	p.BarakahScore += barakahDelta
	p.Level = (p.TotalXP / 100) + 1
	p.UpdatedAt = time.Now().UTC()
	return s.repo.UpsertProgress(ctx, p)
}

func (s *CoreService) bumpStreak(ctx context.Context, userID string) error {
	streak, err := s.repo.GetStreak(ctx, userID)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	if streak == nil {
		streak = &model.Streak{ID: uuid.NewString(), UserID: userID, CurrentStreak: 1, LongestStreak: 1, LastCompletedAt: now, UpdatedAt: now}
	} else {
		last := streak.LastCompletedAt.UTC()
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
		lastDay := time.Date(last.Year(), last.Month(), last.Day(), 0, 0, 0, 0, time.UTC)
		days := int(today.Sub(lastDay).Hours() / 24)
		if days == 1 {
			streak.CurrentStreak++
		} else if days > 1 {
			streak.CurrentStreak = 1
		}
		if streak.CurrentStreak > streak.LongestStreak {
			streak.LongestStreak = streak.CurrentStreak
		}
		streak.LastCompletedAt = now
		streak.UpdatedAt = now
	}
	if s.publisher != nil {
		_ = s.publisher.Publish(ctx, "streak.updated", queue.Event{Type: "streak.updated", Payload: streak})
	}
	return s.repo.UpsertStreak(ctx, streak)
}

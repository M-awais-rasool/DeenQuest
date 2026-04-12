package repository

import (
	"context"

	"github.com/chawais/talent-flow/backend/internal/core-service/model"
)

type CoreRepository interface {
	CreateHabit(ctx context.Context, habit *model.Habit) error
	ListHabits(ctx context.Context, userID string) ([]model.Habit, error)
	GetHabitByID(ctx context.Context, userID, habitID string) (*model.Habit, error)
	UpsertTask(ctx context.Context, task *model.Task) error
	GetProgress(ctx context.Context, userID string) (*model.Progress, error)
	UpsertProgress(ctx context.Context, progress *model.Progress) error
	GetStreak(ctx context.Context, userID string) (*model.Streak, error)
	UpsertStreak(ctx context.Context, streak *model.Streak) error
	ListAchievements(ctx context.Context, userID string) ([]model.Achievement, error)
	CreateReflection(ctx context.Context, reflection *model.Reflection) error
}

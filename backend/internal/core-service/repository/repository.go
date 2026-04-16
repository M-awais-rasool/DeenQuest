package repository

import (
	"context"
	"errors"

	"github.com/chawais/talent-flow/backend/internal/core-service/model"
)

// ErrAlreadyCompleted is returned when a task has already been completed for the day.
// Callers should treat this as a no-op rather than a failure.
var ErrAlreadyCompleted = errors.New("task already completed")

type CoreRepository interface {
	GetProgress(ctx context.Context, userID string) (*model.Progress, error)
	UpsertProgress(ctx context.Context, progress *model.Progress) error
	GetStreak(ctx context.Context, userID string) (*model.Streak, error)
	UpsertStreak(ctx context.Context, streak *model.Streak) error

	GetCompletedDates(ctx context.Context, userID string, dates []string) (map[string]bool, error)

	// Daily tasks
	SeedDailyTasks(ctx context.Context, tasks []model.DailyTask) error
	ListAllDailyTasks(ctx context.Context) ([]model.DailyTask, error)
	GetDailyTaskByID(ctx context.Context, taskID string) (*model.DailyTask, error)
	GetUserDailyTasks(ctx context.Context, userID, date string) ([]model.UserDailyTask, error)
	UpsertUserDailyTasks(ctx context.Context, assignments []model.UserDailyTask) error
	CompleteUserDailyTask(ctx context.Context, userID, taskID, date string) error
}

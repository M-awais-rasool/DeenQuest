package repository

import (
	"context"

	"github.com/chawais/talent-flow/backend/internal/core-service/model"
)

type CoreRepository interface {
	GetProgress(ctx context.Context, userID string) (*model.Progress, error)
	UpsertProgress(ctx context.Context, progress *model.Progress) error
	GetStreak(ctx context.Context, userID string) (*model.Streak, error)
	UpsertStreak(ctx context.Context, streak *model.Streak) error

	// Daily tasks
	SeedDailyTasks(ctx context.Context, tasks []model.DailyTask) error
	ListAllDailyTasks(ctx context.Context) ([]model.DailyTask, error)
	GetDailyTaskByID(ctx context.Context, taskID string) (*model.DailyTask, error)
	GetUserDailyTasks(ctx context.Context, userID, date string) ([]model.UserDailyTask, error)
	UpsertUserDailyTasks(ctx context.Context, assignments []model.UserDailyTask) error
	CompleteUserDailyTask(ctx context.Context, userID, taskID, date string) error
}

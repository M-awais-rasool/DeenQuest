package domain

import (
	"context"
	"errors"
)

var ErrAlreadyCompleted = errors.New("task already completed")

// Repository is the persistence port for the daily-task catalog and per-user
// day assignments. It owns the `daily_tasks` and `user_daily_tasks` collections.
type Repository interface {
	SeedDailyTasks(ctx context.Context, tasks []DailyTask) error
	ListAllDailyTasks(ctx context.Context) ([]DailyTask, error)
	GetDailyTaskByID(ctx context.Context, taskID string) (*DailyTask, error)
	GetUserDailyTasks(ctx context.Context, userID, date string) ([]UserDailyTask, error)
	UpsertUserDailyTask(ctx context.Context, assignments []UserDailyTask) error
	CompleteUserDailyTask(ctx context.Context, userID, taskID, date string) error
	// Admin CRUD
	CreateDailyTask(ctx context.Context, task *DailyTask) error
	UpdateDailyTask(ctx context.Context, task *DailyTask) error
	DeleteDailyTask(ctx context.Context, taskID string) error
}

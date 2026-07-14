package progress

import (
	"context"
	"errors"
)

// ErrAlreadyCompleted is returned when a task has already been completed for the day.
// Callers should treat this as a no-op rather than a failure.
var ErrAlreadyCompleted = errors.New("task already completed")

type CoreRepository interface {
	GetProgress(ctx context.Context, userID string) (*Progress, error)
	UpsertProgress(ctx context.Context, progress *Progress) error
	IncrementProgress(ctx context.Context, userID string, xpDelta, barakahDelta int) (*Progress, error)
	ListLeaderboardProgress(ctx context.Context, limit int) ([]Progress, error)
	GetStreak(ctx context.Context, userID string) (*Streak, error)
	UpsertStreak(ctx context.Context, streak *Streak) error

	GetCompletedDates(ctx context.Context, userID string, dates []string) (map[string]bool, error)

	// Daily tasks
	SeedDailyTasks(ctx context.Context, tasks []DailyTask) error
	ListAllDailyTasks(ctx context.Context) ([]DailyTask, error)
	GetDailyTaskByID(ctx context.Context, taskID string) (*DailyTask, error)
	GetUserDailyTasks(ctx context.Context, userID, date string) ([]UserDailyTask, error)
	UpsertUserDailyTask(ctx context.Context, assignments []UserDailyTask) error
	CompleteUserDailyTask(ctx context.Context, userID, taskID, date string) error
	// Daily tasks — admin CRUD
	CreateDailyTask(ctx context.Context, task *DailyTask) error
	UpdateDailyTask(ctx context.Context, task *DailyTask) error
	DeleteDailyTask(ctx context.Context, taskID string) error

	// Levels
	SeedLevels(ctx context.Context, levels []Level) error
	// LevelSeedVersion returns the curriculum version stored in the meta
	// collection (0 when the database predates versioned seeds).
	LevelSeedVersion(ctx context.Context) (int, error)
	// ReplaceLevels swaps the whole level catalog for a new curriculum
	// version: wipes levels + per-user level progress, inserts the new
	// levels, and records the version. Used when SeedDataVersion is bumped.
	ReplaceLevels(ctx context.Context, levels []Level, version int) error
	ListLevelsByCourse(ctx context.Context, courseType CourseType) ([]Level, error)
	ListAllLevels(ctx context.Context) ([]Level, error)
	GetLevelByID(ctx context.Context, levelID int) (*Level, error)
	GetNextLevelByCourseLevel(ctx context.Context, courseType CourseType, courseLevel int) (*Level, error)
	GetUserLevels(ctx context.Context, userID string) ([]UserLevel, error)
	GetUserLevelsByLevelIDs(ctx context.Context, userID string, levelIDs []int) ([]UserLevel, error)
	GetUserLevel(ctx context.Context, userID string, levelID int) (*UserLevel, error)
	UpsertUserLevel(ctx context.Context, ul *UserLevel) error
	// Levels — admin CRUD
	CreateLevel(ctx context.Context, level *Level) error
	UpdateLevel(ctx context.Context, level *Level) error
	DeleteLevel(ctx context.Context, levelID int) error

	// Rewards
	SeedRewards(ctx context.Context, rewards []Reward) error
	ListAllRewards(ctx context.Context) ([]Reward, error)
	GetUserRewards(ctx context.Context, userID string) ([]UserReward, error)
	GrantUserReward(ctx context.Context, ur *UserReward) error
	// Rewards — admin CRUD
	GetRewardByID(ctx context.Context, id string) (*Reward, error)
	CreateReward(ctx context.Context, reward *Reward) error
	UpdateReward(ctx context.Context, reward *Reward) error
	DeleteReward(ctx context.Context, id string) error

	// Recitation — keyed by level_id + lesson_index (no separate ayah collection)
	SaveRecitationAttempt(ctx context.Context, attempt *RecitationAttempt) error
	CountUserRecitationAttempts(ctx context.Context, userID string, levelID, lessonIndex int) (int, error)
}

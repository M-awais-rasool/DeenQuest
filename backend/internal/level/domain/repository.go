package domain

import "context"

type Repository interface {
	// Levels — seeding & versioned migration
	SeedLevels(ctx context.Context, levels []Level) error
	LevelSeedVersion(ctx context.Context) (int, error)
	ReplaceLevels(ctx context.Context, levels []Level, version int) error

	// Levels — reads
	ListLevelsByCourse(ctx context.Context, courseType CourseType) ([]Level, error)
	ListAllLevels(ctx context.Context) ([]Level, error)
	GetLevelByID(ctx context.Context, levelID int) (*Level, error)
	GetNextLevelByCourseLevel(ctx context.Context, courseType CourseType, courseLevel int) (*Level, error)

	// Levels — admin CRUD
	CreateLevel(ctx context.Context, level *Level) error
	UpdateLevel(ctx context.Context, level *Level) error
	DeleteLevel(ctx context.Context, levelID int) error

	// Per-user level progress
	GetUserLevels(ctx context.Context, userID string) ([]UserLevel, error)
	GetUserLevelsByLevelIDs(ctx context.Context, userID string, levelIDs []int) ([]UserLevel, error)
	GetUserLevel(ctx context.Context, userID string, levelID int) (*UserLevel, error)
	UpsertUserLevel(ctx context.Context, ul *UserLevel) error
}

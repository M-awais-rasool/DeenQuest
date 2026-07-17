package level

import "context"

type Repository interface {
	// Levels — seeding & versioned migration
	SeedLevels(ctx context.Context, levels []Level) error
	// LevelSeedVersion returns the curriculum version stored in the meta
	// collection (0 when the database predates versioned seeds).
	LevelSeedVersion(ctx context.Context) (int, error)
	// ReplaceLevels swaps the whole level catalog for a new curriculum
	// version: wipes levels + per-user level progress, inserts the new
	// levels, and records the version. Used when SeedDataVersion is bumped.
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

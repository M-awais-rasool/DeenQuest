package infrastructure

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/chawais/deenquest/backend/internal/level/domain"
)

type MongoRepository struct {
	levels     *mongo.Collection
	userLevels *mongo.Collection
	meta       *mongo.Collection

	staticMu     sync.RWMutex
	cachedLevels []domain.Level
	levelsLoaded bool
}

func NewMongoRepository(db *mongo.Database) (*MongoRepository, error) {
	r := &MongoRepository{
		levels:     db.Collection("levels"),
		userLevels: db.Collection("user_levels"),
		meta:       db.Collection("meta"),
	}
	if err := r.ensureIndexes(); err != nil {
		return nil, err
	}
	return r, nil
}

func (r *MongoRepository) ensureIndexes() error {
	ctx := context.Background()

	_, err := r.userLevels.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "level_id", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		return err
	}
	_, err = r.userLevels.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "course_type", Value: 1}, {Key: "completed", Value: 1}},
		Options: options.Index().SetBackground(true),
	})
	if err != nil {
		return err
	}
	// Admin analytics: completed-level counts, time series and top levels.
	_, err = r.userLevels.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "completed", Value: 1}, {Key: "completed_at", Value: 1}},
		Options: options.Index().SetBackground(true),
	})
	if err != nil {
		return err
	}

	_, err = r.levels.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "course_type", Value: 1}, {Key: "course_level", Value: 1}},
		Options: options.Index().SetBackground(true),
	})
	return err
}

func withTimeout(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, 5*time.Second)
}

// levels are immutable between deploys; serve a cached snapshot and only hit
// Mongo on a cold cache (first read or after a re-seed / CRUD write). Returned
// slices are treated as read-only by callers.
func (r *MongoRepository) levelsSnapshot(ctx context.Context) ([]domain.Level, error) {
	r.staticMu.RLock()
	if r.levelsLoaded {
		levels := r.cachedLevels
		r.staticMu.RUnlock()
		return levels, nil
	}
	r.staticMu.RUnlock()

	r.staticMu.Lock()
	defer r.staticMu.Unlock()
	if r.levelsLoaded {
		return r.cachedLevels, nil
	}

	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.levels.Find(timeoutCtx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]domain.Level, 0, 32)
	for cur.Next(ctx) {
		var l domain.Level
		if err := cur.Decode(&l); err != nil {
			return nil, err
		}
		normalizeLevelDefaults(&l)
		out = append(out, l)
	}
	if err := cur.Err(); err != nil {
		return nil, err
	}
	r.cachedLevels = out
	r.levelsLoaded = true
	return r.cachedLevels, nil
}

func (r *MongoRepository) invalidateLevels() {
	r.staticMu.Lock()
	r.cachedLevels, r.levelsLoaded = nil, false
	r.staticMu.Unlock()
}

func (r *MongoRepository) SeedLevels(ctx context.Context, levels []domain.Level) error {
	if len(levels) == 0 {
		return nil
	}
	// Insert-if-absent: only create levels whose ID does not exist yet.
	// $setOnInsert means a server restart never overwrites edits an admin made
	// through the CMS, while a fresh DB (or a newly added seed ID) still seeds.
	models := make([]mongo.WriteModel, 0, len(levels))
	for _, l := range levels {
		models = append(models, mongo.NewUpdateOneModel().
			SetFilter(bson.M{"_id": l.ID}).
			SetUpdate(bson.M{"$setOnInsert": l}).
			SetUpsert(true))
	}

	timeoutCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	if _, err := r.levels.BulkWrite(timeoutCtx, models, options.BulkWrite().SetOrdered(false)); err != nil {
		return err
	}
	r.invalidateLevels()
	return nil
}

// levelSeedMetaID is the meta-collection document that records which
// curriculum version the levels collection holds.
const levelSeedMetaID = "level_seed"

func (r *MongoRepository) LevelSeedVersion(ctx context.Context) (int, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()

	var doc struct {
		Version int `bson:"version"`
	}
	err := r.meta.FindOne(timeoutCtx, bson.M{"_id": levelSeedMetaID}).Decode(&doc)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return 0, nil
	}
	if err != nil {
		return 0, err
	}
	return doc.Version, nil
}

// ReplaceLevels swaps the entire level catalog for a new curriculum version.
// The version marker is written last, so a crash mid-migration simply reruns
// the migration on the next boot (every step is idempotent).
func (r *MongoRepository) ReplaceLevels(ctx context.Context, levels []domain.Level, version int) error {
	if len(levels) == 0 {
		return errors.New("refusing to replace levels with an empty catalog")
	}

	timeoutCtx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	// 1. Out with the old catalog…
	if _, err := r.levels.DeleteMany(timeoutCtx, bson.M{}); err != nil {
		return fmt.Errorf("clear levels: %w", err)
	}
	// 2. …and the per-user progress that pointed at it (level IDs changed
	// meaning; XP, streaks and rewards are untouched).
	if _, err := r.userLevels.DeleteMany(timeoutCtx, bson.M{}); err != nil {
		return fmt.Errorf("clear user levels: %w", err)
	}

	// 3. In with the new catalog.
	docs := make([]any, 0, len(levels))
	for _, l := range levels {
		docs = append(docs, l)
	}
	if _, err := r.levels.InsertMany(timeoutCtx, docs); err != nil {
		return fmt.Errorf("insert levels: %w", err)
	}

	// 4. Record the version — the commit point of the migration.
	_, err := r.meta.UpdateOne(timeoutCtx,
		bson.M{"_id": levelSeedMetaID},
		bson.M{"$set": bson.M{"version": version, "updated_at": time.Now().UTC()}},
		options.Update().SetUpsert(true))
	if err != nil {
		return fmt.Errorf("record seed version: %w", err)
	}

	r.invalidateLevels()
	return nil
}

func (r *MongoRepository) ListAllLevels(ctx context.Context) ([]domain.Level, error) {
	levels, err := r.levelsSnapshot(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]domain.Level, len(levels))
	copy(out, levels)
	sortLevels(out)
	return out, nil
}

func (r *MongoRepository) CreateLevel(ctx context.Context, level *domain.Level) error {
	normalizeLevelDefaults(level)
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	if _, err := r.levels.InsertOne(timeoutCtx, level); err != nil {
		return err
	}
	r.invalidateLevels()
	return nil
}

func (r *MongoRepository) UpdateLevel(ctx context.Context, level *domain.Level) error {
	normalizeLevelDefaults(level)
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	res, err := r.levels.ReplaceOne(timeoutCtx, bson.M{"_id": level.ID}, level)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return errors.New("level not found")
	}
	r.invalidateLevels()
	return nil
}

func (r *MongoRepository) DeleteLevel(ctx context.Context, levelID int) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	res, err := r.levels.DeleteOne(timeoutCtx, bson.M{"_id": levelID})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return errors.New("level not found")
	}
	r.invalidateLevels()
	return nil
}

func normalizeLevelDefaults(l *domain.Level) {
	if l.CourseType == "" {
		l.CourseType = domain.CourseQaida
	}
	if l.CourseLevel == 0 {
		l.CourseLevel = l.ID
	}
}

func (r *MongoRepository) ListLevelsByCourse(ctx context.Context, courseType domain.CourseType) ([]domain.Level, error) {
	levels, err := r.levelsSnapshot(ctx)
	if err != nil {
		return nil, err
	}
	// Snapshot levels are normalized, so an unset course_type already reads as
	// domain.CourseQaida — a simple equality match reproduces the old Mongo filter.
	out := make([]domain.Level, 0, len(levels))
	for _, l := range levels {
		if l.CourseType == courseType {
			out = append(out, l)
		}
	}
	sortLevels(out)
	return out, nil
}

func (r *MongoRepository) GetLevelByID(ctx context.Context, levelID int) (*domain.Level, error) {
	levels, err := r.levelsSnapshot(ctx)
	if err != nil {
		return nil, err
	}
	for i := range levels {
		if levels[i].ID == levelID {
			l := levels[i]
			return &l, nil
		}
	}
	return nil, nil
}

func (r *MongoRepository) GetNextLevelByCourseLevel(ctx context.Context, courseType domain.CourseType, courseLevel int) (*domain.Level, error) {
	levels, err := r.levelsSnapshot(ctx)
	if err != nil {
		return nil, err
	}
	var next *domain.Level
	for i := range levels {
		l := levels[i]
		if l.CourseType != courseType || l.CourseLevel <= courseLevel {
			continue
		}
		if next == nil || l.CourseLevel < next.CourseLevel || (l.CourseLevel == next.CourseLevel && l.ID < next.ID) {
			lv := l
			next = &lv
		}
	}
	return next, nil
}

// sortLevels orders levels by (course_level, id) to match the previous Mongo sort.
func sortLevels(levels []domain.Level) {
	sort.Slice(levels, func(i, j int) bool {
		if levels[i].CourseLevel != levels[j].CourseLevel {
			return levels[i].CourseLevel < levels[j].CourseLevel
		}
		return levels[i].ID < levels[j].ID
	})
}

func (r *MongoRepository) GetUserLevels(ctx context.Context, userID string) ([]domain.UserLevel, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.userLevels.Find(timeoutCtx, bson.M{"user_id": userID}, options.Find().SetSort(bson.D{{Key: "level_id", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]domain.UserLevel, 0, 20)
	for cur.Next(ctx) {
		var ul domain.UserLevel
		if err := cur.Decode(&ul); err != nil {
			return nil, err
		}
		out = append(out, ul)
	}
	return out, cur.Err()
}

func (r *MongoRepository) GetUserLevelsByLevelIDs(ctx context.Context, userID string, levelIDs []int) ([]domain.UserLevel, error) {
	if len(levelIDs) == 0 {
		return []domain.UserLevel{}, nil
	}

	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.userLevels.Find(
		timeoutCtx,
		bson.M{"user_id": userID, "level_id": bson.M{"$in": levelIDs}},
		options.Find().SetSort(bson.D{{Key: "level_id", Value: 1}}),
	)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]domain.UserLevel, 0, len(levelIDs))
	for cur.Next(ctx) {
		var ul domain.UserLevel
		if err := cur.Decode(&ul); err != nil {
			return nil, err
		}
		out = append(out, ul)
	}
	return out, cur.Err()
}

func (r *MongoRepository) GetUserLevel(ctx context.Context, userID string, levelID int) (*domain.UserLevel, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	var ul domain.UserLevel
	err := r.userLevels.FindOne(timeoutCtx, bson.M{"user_id": userID, "level_id": levelID}).Decode(&ul)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &ul, nil
}

func (r *MongoRepository) UpsertUserLevel(ctx context.Context, ul *domain.UserLevel) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	_, err := r.userLevels.UpdateOne(timeoutCtx,
		bson.M{"user_id": ul.UserID, "level_id": ul.LevelID},
		bson.M{"$set": ul},
		options.Update().SetUpsert(true),
	)
	return err
}

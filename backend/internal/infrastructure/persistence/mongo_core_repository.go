package persistence

import (
	"context"
	"errors"
	"sort"
	"sync"
	"time"

	"github.com/chawais/talent-flow/backend/internal/domain/progress"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoCoreRepository struct {
	streaks            *mongo.Collection
	progress           *mongo.Collection
	dailyTasks         *mongo.Collection
	userDailyTasks     *mongo.Collection
	levels             *mongo.Collection
	userLevels         *mongo.Collection
	rewards            *mongo.Collection
	userRewards        *mongo.Collection
	recitationAttempts *mongo.Collection
	staticMu           sync.RWMutex
	cachedLevels       []progress.Level
	cachedTasks        []progress.DailyTask
	cachedRewards      []progress.Reward
	levelsLoaded       bool
	tasksLoaded        bool
	rewardsLoaded      bool
}

func NewMongoCoreRepository(db *mongo.Database) (*MongoCoreRepository, error) {
	r := &MongoCoreRepository{
		streaks:            db.Collection("streaks"),
		progress:           db.Collection("progress"),
		dailyTasks:         db.Collection("daily_tasks"),
		userDailyTasks:     db.Collection("user_daily_tasks"),
		levels:             db.Collection("levels"),
		userLevels:         db.Collection("user_levels"),
		rewards:            db.Collection("rewards"),
		userRewards:        db.Collection("user_rewards"),
		recitationAttempts: db.Collection("recitation_attempts"),
	}
	if err := r.ensureIndexes(); err != nil {
		return nil, err
	}
	return r, nil
}

func (r *MongoCoreRepository) ensureIndexes() error {
	ctx := context.Background()

	_, err := r.progress.Indexes().CreateOne(ctx, mongo.IndexModel{Keys: bson.D{{Key: "user_id", Value: 1}}, Options: options.Index().SetUnique(true)})
	if err != nil {
		return err
	}
	_, err = r.progress.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "level", Value: -1}, {Key: "total_xp", Value: -1}},
		Options: options.Index().SetBackground(true),
	})
	if err != nil {
		return err
	}

	_, err = r.streaks.Indexes().CreateOne(ctx, mongo.IndexModel{Keys: bson.D{{Key: "user_id", Value: 1}}, Options: options.Index().SetUnique(true)})
	if err != nil {
		return err
	}

	_, err = r.userDailyTasks.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "date", Value: 1}},
		Options: options.Index().SetBackground(true),
	})
	if err != nil {
		return err
	}

	_, err = r.userLevels.Indexes().CreateOne(ctx, mongo.IndexModel{
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

	_, err = r.levels.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "course_type", Value: 1}, {Key: "course_level", Value: 1}},
		Options: options.Index().SetBackground(true),
	})
	if err != nil {
		return err
	}

	_, err = r.userRewards.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "reward_id", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		return err
	}

	_, err = r.recitationAttempts.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "level_id", Value: 1}, {Key: "lesson_index", Value: 1}, {Key: "created_at", Value: -1}},
		Options: options.Index().SetBackground(true),
	})
	if err != nil {
		return err
	}

	return nil
}

// ─── Static seed-data cache ───
//
// levels / daily_tasks / rewards are immutable between deploys. Each snapshot
// loader serves a cached copy and only hits Mongo on a cold cache (first read
// or after a re-seed). Returned slices are treated as read-only by callers, so
// the underlying arrays can be shared safely without per-request copies.

func (r *MongoCoreRepository) levelsSnapshot(ctx context.Context) ([]progress.Level, error) {
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
	out := make([]progress.Level, 0, 32)
	for cur.Next(ctx) {
		var l progress.Level
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

func (r *MongoCoreRepository) tasksSnapshot(ctx context.Context) ([]progress.DailyTask, error) {
	r.staticMu.RLock()
	if r.tasksLoaded {
		tasks := r.cachedTasks
		r.staticMu.RUnlock()
		return tasks, nil
	}
	r.staticMu.RUnlock()

	r.staticMu.Lock()
	defer r.staticMu.Unlock()
	if r.tasksLoaded {
		return r.cachedTasks, nil
	}

	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.dailyTasks.Find(timeoutCtx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]progress.DailyTask, 0, 16)
	for cur.Next(ctx) {
		var t progress.DailyTask
		if err := cur.Decode(&t); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	if err := cur.Err(); err != nil {
		return nil, err
	}
	r.cachedTasks = out
	r.tasksLoaded = true
	return r.cachedTasks, nil
}

func (r *MongoCoreRepository) rewardsSnapshot(ctx context.Context) ([]progress.Reward, error) {
	r.staticMu.RLock()
	if r.rewardsLoaded {
		rewards := r.cachedRewards
		r.staticMu.RUnlock()
		return rewards, nil
	}
	r.staticMu.RUnlock()

	r.staticMu.Lock()
	defer r.staticMu.Unlock()
	if r.rewardsLoaded {
		return r.cachedRewards, nil
	}

	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.rewards.Find(timeoutCtx, bson.M{}, options.Find().SetSort(bson.D{{Key: "sort_order", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]progress.Reward, 0, 16)
	for cur.Next(ctx) {
		var rw progress.Reward
		if err := cur.Decode(&rw); err != nil {
			return nil, err
		}
		out = append(out, rw)
	}
	if err := cur.Err(); err != nil {
		return nil, err
	}
	r.cachedRewards = out
	r.rewardsLoaded = true
	return r.cachedRewards, nil
}

func (r *MongoCoreRepository) invalidateLevels() {
	r.staticMu.Lock()
	r.cachedLevels, r.levelsLoaded = nil, false
	r.staticMu.Unlock()
}

func (r *MongoCoreRepository) invalidateTasks() {
	r.staticMu.Lock()
	r.cachedTasks, r.tasksLoaded = nil, false
	r.staticMu.Unlock()
}

func (r *MongoCoreRepository) invalidateRewards() {
	r.staticMu.Lock()
	r.cachedRewards, r.rewardsLoaded = nil, false
	r.staticMu.Unlock()
}

func (r *MongoCoreRepository) GetProgress(ctx context.Context, userID string) (*progress.Progress, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	var p progress.Progress
	err := r.progress.FindOne(timeoutCtx, bson.M{"user_id": userID}).Decode(&p)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *MongoCoreRepository) UpsertProgress(ctx context.Context, prog *progress.Progress) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	_, err := r.progress.UpdateOne(timeoutCtx, bson.M{"user_id": prog.UserID}, bson.M{"$set": prog}, options.Update().SetUpsert(true))
	return err
}

func (r *MongoCoreRepository) IncrementProgress(ctx context.Context, userID string, xpDelta, barakahDelta int) (*progress.Progress, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()

	now := time.Now().UTC()
	update := bson.M{
		"$inc": bson.M{"total_xp": xpDelta, "barakah_score": barakahDelta},
		"$set": bson.M{"updated_at": now},
		"$setOnInsert": bson.M{
			"_id":     uuid.NewString(),
			"user_id": userID,
		},
	}
	opts := options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After)

	var p progress.Progress
	if err := r.progress.FindOneAndUpdate(timeoutCtx, bson.M{"user_id": userID}, update, opts).Decode(&p); err != nil {
		return nil, err
	}

	if newLevel := (p.TotalXP / 100) + 1; newLevel != p.Level {
		levelCtx, levelCancel := withTimeout(ctx)
		defer levelCancel()
		if _, err := r.progress.UpdateByID(levelCtx, p.ID, bson.M{"$set": bson.M{"level": newLevel}}); err != nil {
			return nil, err
		}
		p.Level = newLevel
	}
	return &p, nil
}

func (r *MongoCoreRepository) ListLeaderboardProgress(ctx context.Context, limit int) ([]progress.Progress, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()

	findOptions := options.Find().
		SetSort(bson.D{{Key: "level", Value: -1}, {Key: "total_xp", Value: -1}}).
		SetProjection(bson.M{"_id": 0, "user_id": 1, "level": 1, "total_xp": 1})

	if limit > 0 {
		findOptions.SetLimit(int64(limit))
	}

	cur, err := r.progress.Find(timeoutCtx, bson.M{}, findOptions)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	out := make([]progress.Progress, 0)
	for cur.Next(ctx) {
		var p progress.Progress
		if err := cur.Decode(&p); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, cur.Err()
}

func (r *MongoCoreRepository) GetStreak(ctx context.Context, userID string) (*progress.Streak, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	var s progress.Streak
	err := r.streaks.FindOne(timeoutCtx, bson.M{"user_id": userID}).Decode(&s)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *MongoCoreRepository) UpsertStreak(ctx context.Context, streak *progress.Streak) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	_, err := r.streaks.UpdateOne(timeoutCtx, bson.M{"user_id": streak.UserID}, bson.M{"$set": streak}, options.Update().SetUpsert(true))
	return err
}

func (r *MongoCoreRepository) GetCompletedDates(ctx context.Context, userID string, dates []string) (map[string]bool, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.userDailyTasks.Find(timeoutCtx, bson.M{
		"user_id":   userID,
		"date":      bson.M{"$in": dates},
		"completed": true,
	})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	result := make(map[string]bool, len(dates))
	for cur.Next(ctx) {
		var ut progress.UserDailyTask
		if err := cur.Decode(&ut); err != nil {
			return nil, err
		}
		result[ut.Date] = true
	}
	return result, cur.Err()
}

func (r *MongoCoreRepository) SeedDailyTasks(ctx context.Context, tasks []progress.DailyTask) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	for _, t := range tasks {
		_, err := r.dailyTasks.ReplaceOne(
			timeoutCtx,
			bson.M{"_id": t.ID},
			t,
			options.Replace().SetUpsert(true),
		)
		if err != nil {
			return err
		}
	}
	r.invalidateTasks()
	return nil
}

func (r *MongoCoreRepository) ListAllDailyTasks(ctx context.Context) ([]progress.DailyTask, error) {
	return r.tasksSnapshot(ctx)
}

func (r *MongoCoreRepository) GetDailyTaskByID(ctx context.Context, taskID string) (*progress.DailyTask, error) {
	tasks, err := r.tasksSnapshot(ctx)
	if err != nil {
		return nil, err
	}
	for i := range tasks {
		if tasks[i].ID == taskID {
			t := tasks[i]
			return &t, nil
		}
	}
	return nil, nil
}

func (r *MongoCoreRepository) GetUserDailyTasks(ctx context.Context, userID, date string) ([]progress.UserDailyTask, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.userDailyTasks.Find(timeoutCtx, bson.M{"user_id": userID, "date": date})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]progress.UserDailyTask, 0, 5)
	for cur.Next(ctx) {
		var ut progress.UserDailyTask
		if err := cur.Decode(&ut); err != nil {
			return nil, err
		}
		out = append(out, ut)
	}
	return out, cur.Err()
}

func (r *MongoCoreRepository) UpsertUserDailyTask(ctx context.Context, assignments []progress.UserDailyTask) error {
	if len(assignments) == 0 {
		return nil
	}
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	// One BulkWrite instead of N sequential UpdateByID round-trips.
	models := make([]mongo.WriteModel, 0, len(assignments))
	for _, a := range assignments {
		models = append(models, mongo.NewUpdateOneModel().
			SetFilter(bson.M{"_id": a.ID}).
			SetUpdate(bson.M{"$set": a}).
			SetUpsert(true))
	}
	_, err := r.userDailyTasks.BulkWrite(timeoutCtx, models, options.BulkWrite().SetOrdered(false))
	return err
}

func (r *MongoCoreRepository) CompleteUserDailyTask(ctx context.Context, userID, taskID, date string) error {
	updateCtx, updateCancel := withTimeout(ctx)
	defer updateCancel()
	res, err := r.userDailyTasks.UpdateOne(updateCtx,
		bson.M{"user_id": userID, "task_id": taskID, "date": date, "completed": false},
		bson.M{"$set": bson.M{"completed": true, "completed_at": time.Now().UTC()}},
	)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		checkCtx, checkCancel := withTimeout(ctx)
		defer checkCancel()
		count, countErr := r.userDailyTasks.CountDocuments(checkCtx,
			bson.M{"user_id": userID, "task_id": taskID, "date": date, "completed": true},
		)
		if countErr == nil && count > 0 {
			return progress.ErrAlreadyCompleted
		}
		return errors.New("task assignment not found")
	}
	return nil
}

func withTimeout(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, 5*time.Second)
}

func (r *MongoCoreRepository) SeedLevels(ctx context.Context, levels []progress.Level) error {
	if len(levels) == 0 {
		return nil
	}
	models := make([]mongo.WriteModel, 0, len(levels))
	for _, l := range levels {
		models = append(models, mongo.NewUpdateOneModel().
			SetFilter(bson.M{"_id": l.ID}).
			SetUpdate(bson.M{"$set": l}).
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

func normalizeLevelDefaults(l *progress.Level) {
	if l.CourseType == "" {
		l.CourseType = progress.CourseQaida
	}
	if l.CourseLevel == 0 {
		l.CourseLevel = l.ID
	}
}

func (r *MongoCoreRepository) ListLevelsByCourse(ctx context.Context, courseType progress.CourseType) ([]progress.Level, error) {
	levels, err := r.levelsSnapshot(ctx)
	if err != nil {
		return nil, err
	}
	// Snapshot levels are normalized, so an unset course_type already reads as
	// CourseQaida — a simple equality match reproduces the old Mongo filter.
	out := make([]progress.Level, 0, len(levels))
	for _, l := range levels {
		if l.CourseType == courseType {
			out = append(out, l)
		}
	}
	sortLevels(out)
	return out, nil
}

func (r *MongoCoreRepository) GetLevelByID(ctx context.Context, levelID int) (*progress.Level, error) {
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

func (r *MongoCoreRepository) GetNextLevelByCourseLevel(ctx context.Context, courseType progress.CourseType, courseLevel int) (*progress.Level, error) {
	levels, err := r.levelsSnapshot(ctx)
	if err != nil {
		return nil, err
	}
	var next *progress.Level
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
func sortLevels(levels []progress.Level) {
	sort.Slice(levels, func(i, j int) bool {
		if levels[i].CourseLevel != levels[j].CourseLevel {
			return levels[i].CourseLevel < levels[j].CourseLevel
		}
		return levels[i].ID < levels[j].ID
	})
}

func (r *MongoCoreRepository) GetUserLevels(ctx context.Context, userID string) ([]progress.UserLevel, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.userLevels.Find(timeoutCtx, bson.M{"user_id": userID}, options.Find().SetSort(bson.D{{Key: "level_id", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]progress.UserLevel, 0, 20)
	for cur.Next(ctx) {
		var ul progress.UserLevel
		if err := cur.Decode(&ul); err != nil {
			return nil, err
		}
		out = append(out, ul)
	}
	return out, cur.Err()
}

func (r *MongoCoreRepository) GetUserLevelsByLevelIDs(ctx context.Context, userID string, levelIDs []int) ([]progress.UserLevel, error) {
	if len(levelIDs) == 0 {
		return []progress.UserLevel{}, nil
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
	out := make([]progress.UserLevel, 0, len(levelIDs))
	for cur.Next(ctx) {
		var ul progress.UserLevel
		if err := cur.Decode(&ul); err != nil {
			return nil, err
		}
		out = append(out, ul)
	}
	return out, cur.Err()
}

func (r *MongoCoreRepository) GetUserLevel(ctx context.Context, userID string, levelID int) (*progress.UserLevel, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	var ul progress.UserLevel
	err := r.userLevels.FindOne(timeoutCtx, bson.M{"user_id": userID, "level_id": levelID}).Decode(&ul)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &ul, nil
}

func (r *MongoCoreRepository) UpsertUserLevel(ctx context.Context, ul *progress.UserLevel) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	_, err := r.userLevels.UpdateOne(timeoutCtx,
		bson.M{"user_id": ul.UserID, "level_id": ul.LevelID},
		bson.M{"$set": ul},
		options.Update().SetUpsert(true),
	)
	return err
}

func (r *MongoCoreRepository) SeedRewards(ctx context.Context, rewards []progress.Reward) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	for _, rw := range rewards {
		_, err := r.rewards.UpdateByID(timeoutCtx, rw.ID, bson.M{"$set": rw}, options.Update().SetUpsert(true))
		if err != nil {
			return err
		}
	}
	r.invalidateRewards()
	return nil
}

func (r *MongoCoreRepository) ListAllRewards(ctx context.Context) ([]progress.Reward, error) {
	return r.rewardsSnapshot(ctx)
}

func (r *MongoCoreRepository) GetUserRewards(ctx context.Context, userID string) ([]progress.UserReward, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.userRewards.Find(timeoutCtx, bson.M{"user_id": userID})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]progress.UserReward, 0, 10)
	for cur.Next(ctx) {
		var ur progress.UserReward
		if err := cur.Decode(&ur); err != nil {
			return nil, err
		}
		out = append(out, ur)
	}
	return out, cur.Err()
}

func (r *MongoCoreRepository) GrantUserReward(ctx context.Context, ur *progress.UserReward) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	_, err := r.userRewards.UpdateOne(
		timeoutCtx,
		bson.M{"user_id": ur.UserID, "reward_id": ur.RewardID},
		bson.M{"$setOnInsert": ur},
		options.Update().SetUpsert(true),
	)
	return err
}

func (r *MongoCoreRepository) SaveRecitationAttempt(ctx context.Context, attempt *progress.RecitationAttempt) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	_, err := r.recitationAttempts.InsertOne(timeoutCtx, attempt)
	return err
}

func (r *MongoCoreRepository) CountUserRecitationAttempts(ctx context.Context, userID string, levelID, lessonIndex int) (int, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	n, err := r.recitationAttempts.CountDocuments(timeoutCtx, bson.M{
		"user_id":      userID,
		"level_id":     levelID,
		"lesson_index": lessonIndex,
	})
	return int(n), err
}

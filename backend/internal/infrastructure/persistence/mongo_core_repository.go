package persistence

import (
	"context"
	"errors"
	"time"

	"github.com/chawais/talent-flow/backend/internal/domain/progress"
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
	return nil
}

func (r *MongoCoreRepository) ListAllDailyTasks(ctx context.Context) ([]progress.DailyTask, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.dailyTasks.Find(timeoutCtx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]progress.DailyTask, 0, 10)
	for cur.Next(ctx) {
		var t progress.DailyTask
		if err := cur.Decode(&t); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, cur.Err()
}

func (r *MongoCoreRepository) GetDailyTaskByID(ctx context.Context, taskID string) (*progress.DailyTask, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	var t progress.DailyTask
	err := r.dailyTasks.FindOne(timeoutCtx, bson.M{"_id": taskID}).Decode(&t)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
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
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	for _, a := range assignments {
		_, err := r.userDailyTasks.UpdateByID(timeoutCtx, a.ID, bson.M{"$set": a}, options.Update().SetUpsert(true))
		if err != nil {
			return err
		}
	}
	return nil
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
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	for _, l := range levels {
		_, err := r.levels.UpdateByID(timeoutCtx, l.ID, bson.M{"$set": l}, options.Update().SetUpsert(true))
		if err != nil {
			return err
		}
	}
	return nil
}

func levelCourseFilter(courseType progress.CourseType) bson.M {
	if courseType == progress.CourseQaida {
		return bson.M{
			"$or": []bson.M{
				{"course_type": courseType},
				{"course_type": bson.M{"$exists": false}},
			},
		}
	}
	return bson.M{"course_type": courseType}
}

func nextCourseLevelFilter(courseType progress.CourseType, courseLevel int) bson.M {
	if courseType != progress.CourseQaida {
		return bson.M{"course_type": courseType, "course_level": bson.M{"$gt": courseLevel}}
	}

	return bson.M{
		"$and": []bson.M{
			levelCourseFilter(courseType),
			{
				"$or": []bson.M{
					{"course_level": bson.M{"$gt": courseLevel}},
					{"course_level": bson.M{"$exists": false}, "_id": bson.M{"$gt": courseLevel}},
				},
			},
		},
	}
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
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.levels.Find(
		timeoutCtx,
		levelCourseFilter(courseType),
		options.Find().SetSort(bson.D{{Key: "course_level", Value: 1}, {Key: "_id", Value: 1}}),
	)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]progress.Level, 0, 20)
	for cur.Next(ctx) {
		var l progress.Level
		if err := cur.Decode(&l); err != nil {
			return nil, err
		}
		normalizeLevelDefaults(&l)
		out = append(out, l)
	}
	return out, cur.Err()
}

func (r *MongoCoreRepository) GetLevelByID(ctx context.Context, levelID int) (*progress.Level, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	var l progress.Level
	err := r.levels.FindOne(timeoutCtx, bson.M{"_id": levelID}).Decode(&l)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	normalizeLevelDefaults(&l)
	return &l, nil
}

func (r *MongoCoreRepository) GetNextLevelByCourseLevel(ctx context.Context, courseType progress.CourseType, courseLevel int) (*progress.Level, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	var l progress.Level
	err := r.levels.FindOne(
		timeoutCtx,
		nextCourseLevelFilter(courseType, courseLevel),
		options.FindOne().SetSort(bson.D{{Key: "course_level", Value: 1}, {Key: "_id", Value: 1}}),
	).Decode(&l)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	normalizeLevelDefaults(&l)
	return &l, nil
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
	return nil
}

func (r *MongoCoreRepository) ListAllRewards(ctx context.Context) ([]progress.Reward, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.rewards.Find(timeoutCtx, bson.M{}, options.Find().SetSort(bson.D{{Key: "sort_order", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]progress.Reward, 0, 10)
	for cur.Next(ctx) {
		var rw progress.Reward
		if err := cur.Decode(&rw); err != nil {
			return nil, err
		}
		out = append(out, rw)
	}
	return out, cur.Err()
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

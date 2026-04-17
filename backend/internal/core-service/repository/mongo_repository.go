package repository

import (
	"context"
	"errors"
	"time"

	"github.com/chawais/talent-flow/backend/internal/core-service/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoCoreRepository struct {
	streaks        *mongo.Collection
	progress       *mongo.Collection
	dailyTasks     *mongo.Collection
	userDailyTasks *mongo.Collection
	levels         *mongo.Collection
	userLevels     *mongo.Collection
}

func NewMongoCoreRepository(db *mongo.Database) (*MongoCoreRepository, error) {
	r := &MongoCoreRepository{
		streaks:        db.Collection("streaks"),
		progress:       db.Collection("progress"),
		dailyTasks:     db.Collection("daily_tasks"),
		userDailyTasks: db.Collection("user_daily_tasks"),
		levels:         db.Collection("levels"),
		userLevels:     db.Collection("user_levels"),
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
	return err
}

func (r *MongoCoreRepository) GetProgress(ctx context.Context, userID string) (*model.Progress, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	var p model.Progress
	err := r.progress.FindOne(timeoutCtx, bson.M{"user_id": userID}).Decode(&p)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *MongoCoreRepository) UpsertProgress(ctx context.Context, progress *model.Progress) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	_, err := r.progress.UpdateOne(timeoutCtx, bson.M{"user_id": progress.UserID}, bson.M{"$set": progress}, options.Update().SetUpsert(true))
	return err
}

func (r *MongoCoreRepository) GetStreak(ctx context.Context, userID string) (*model.Streak, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	var s model.Streak
	err := r.streaks.FindOne(timeoutCtx, bson.M{"user_id": userID}).Decode(&s)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *MongoCoreRepository) UpsertStreak(ctx context.Context, streak *model.Streak) error {
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
		var ut model.UserDailyTask
		if err := cur.Decode(&ut); err != nil {
			return nil, err
		}
		result[ut.Date] = true
	}
	return result, cur.Err()
}

func (r *MongoCoreRepository) SeedDailyTasks(ctx context.Context, tasks []model.DailyTask) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	for _, t := range tasks {
		_, err := r.dailyTasks.UpdateByID(timeoutCtx, t.ID, bson.M{"$set": t}, options.Update().SetUpsert(true))
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *MongoCoreRepository) ListAllDailyTasks(ctx context.Context) ([]model.DailyTask, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.dailyTasks.Find(timeoutCtx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]model.DailyTask, 0, 10)
	for cur.Next(ctx) {
		var t model.DailyTask
		if err := cur.Decode(&t); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, cur.Err()
}

func (r *MongoCoreRepository) GetDailyTaskByID(ctx context.Context, taskID string) (*model.DailyTask, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	var t model.DailyTask
	err := r.dailyTasks.FindOne(timeoutCtx, bson.M{"_id": taskID}).Decode(&t)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *MongoCoreRepository) GetUserDailyTasks(ctx context.Context, userID, date string) ([]model.UserDailyTask, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.userDailyTasks.Find(timeoutCtx, bson.M{"user_id": userID, "date": date})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]model.UserDailyTask, 0, 5)
	for cur.Next(ctx) {
		var ut model.UserDailyTask
		if err := cur.Decode(&ut); err != nil {
			return nil, err
		}
		out = append(out, ut)
	}
	return out, cur.Err()
}

func (r *MongoCoreRepository) UpsertUserDailyTasks(ctx context.Context, assignments []model.UserDailyTask) error {
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
			return ErrAlreadyCompleted
		}
		return errors.New("task assignment not found")
	}
	return nil
}

func withTimeout(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, 5*time.Second)
}

// ─── Level repository methods ───

func (r *MongoCoreRepository) SeedLevels(ctx context.Context, levels []model.Level) error {
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

func (r *MongoCoreRepository) ListAllLevels(ctx context.Context) ([]model.Level, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.levels.Find(timeoutCtx, bson.M{}, options.Find().SetSort(bson.D{{Key: "_id", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]model.Level, 0, 20)
	for cur.Next(ctx) {
		var l model.Level
		if err := cur.Decode(&l); err != nil {
			return nil, err
		}
		out = append(out, l)
	}
	return out, cur.Err()
}

func (r *MongoCoreRepository) GetLevelByID(ctx context.Context, levelID int) (*model.Level, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	var l model.Level
	err := r.levels.FindOne(timeoutCtx, bson.M{"_id": levelID}).Decode(&l)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &l, nil
}

func (r *MongoCoreRepository) GetUserLevels(ctx context.Context, userID string) ([]model.UserLevel, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.userLevels.Find(timeoutCtx, bson.M{"user_id": userID}, options.Find().SetSort(bson.D{{Key: "level_id", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]model.UserLevel, 0, 20)
	for cur.Next(ctx) {
		var ul model.UserLevel
		if err := cur.Decode(&ul); err != nil {
			return nil, err
		}
		out = append(out, ul)
	}
	return out, cur.Err()
}

func (r *MongoCoreRepository) GetUserLevel(ctx context.Context, userID string, levelID int) (*model.UserLevel, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	var ul model.UserLevel
	err := r.userLevels.FindOne(timeoutCtx, bson.M{"user_id": userID, "level_id": levelID}).Decode(&ul)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &ul, nil
}

func (r *MongoCoreRepository) UpsertUserLevel(ctx context.Context, ul *model.UserLevel) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	_, err := r.userLevels.UpdateOne(timeoutCtx,
		bson.M{"user_id": ul.UserID, "level_id": ul.LevelID},
		bson.M{"$set": ul},
		options.Update().SetUpsert(true),
	)
	return err
}

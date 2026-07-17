package dailytask

import (
	"context"
	"errors"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoRepository struct {
	dailyTasks     *mongo.Collection
	userDailyTasks *mongo.Collection

	staticMu    sync.RWMutex
	cachedTasks []DailyTask
	tasksLoaded bool
}

func NewMongoRepository(db *mongo.Database) (*MongoRepository, error) {
	r := &MongoRepository{
		dailyTasks:     db.Collection("daily_tasks"),
		userDailyTasks: db.Collection("user_daily_tasks"),
	}
	if err := r.ensureIndexes(); err != nil {
		return nil, err
	}
	return r, nil
}

func (r *MongoRepository) ensureIndexes() error {
	ctx := context.Background()

	_, err := r.userDailyTasks.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "date", Value: 1}},
		Options: options.Index().SetBackground(true),
	})
	if err != nil {
		return err
	}
	// Admin analytics: active-users by date and completed-task counts.
	_, err = r.userDailyTasks.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "date", Value: 1}, {Key: "completed", Value: 1}},
		Options: options.Index().SetBackground(true),
	})
	return err
}

func withTimeout(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, 5*time.Second)
}

// daily_tasks are immutable between deploys; serve a cached snapshot and only
// hit Mongo on a cold cache (first read or after a re-seed / CRUD write).
func (r *MongoRepository) tasksSnapshot(ctx context.Context) ([]DailyTask, error) {
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
	out := make([]DailyTask, 0, 16)
	for cur.Next(ctx) {
		var t DailyTask
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

func (r *MongoRepository) invalidateTasks() {
	r.staticMu.Lock()
	r.cachedTasks, r.tasksLoaded = nil, false
	r.staticMu.Unlock()
}

func (r *MongoRepository) SeedDailyTasks(ctx context.Context, tasks []DailyTask) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	// Insert-if-absent so CMS edits survive restarts.
	for _, t := range tasks {
		_, err := r.dailyTasks.UpdateOne(
			timeoutCtx,
			bson.M{"_id": t.ID},
			bson.M{"$setOnInsert": t},
			options.Update().SetUpsert(true),
		)
		if err != nil {
			return err
		}
	}
	r.invalidateTasks()
	return nil
}

func (r *MongoRepository) CreateDailyTask(ctx context.Context, task *DailyTask) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	if _, err := r.dailyTasks.InsertOne(timeoutCtx, task); err != nil {
		return err
	}
	r.invalidateTasks()
	return nil
}

func (r *MongoRepository) UpdateDailyTask(ctx context.Context, task *DailyTask) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	res, err := r.dailyTasks.ReplaceOne(timeoutCtx, bson.M{"_id": task.ID}, task)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return errors.New("task not found")
	}
	r.invalidateTasks()
	return nil
}

func (r *MongoRepository) DeleteDailyTask(ctx context.Context, taskID string) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	res, err := r.dailyTasks.DeleteOne(timeoutCtx, bson.M{"_id": taskID})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return errors.New("task not found")
	}
	r.invalidateTasks()
	return nil
}

func (r *MongoRepository) ListAllDailyTasks(ctx context.Context) ([]DailyTask, error) {
	return r.tasksSnapshot(ctx)
}

func (r *MongoRepository) GetDailyTaskByID(ctx context.Context, taskID string) (*DailyTask, error) {
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

func (r *MongoRepository) GetUserDailyTasks(ctx context.Context, userID, date string) ([]UserDailyTask, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.userDailyTasks.Find(timeoutCtx, bson.M{"user_id": userID, "date": date})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]UserDailyTask, 0, 5)
	for cur.Next(ctx) {
		var ut UserDailyTask
		if err := cur.Decode(&ut); err != nil {
			return nil, err
		}
		out = append(out, ut)
	}
	return out, cur.Err()
}

func (r *MongoRepository) UpsertUserDailyTask(ctx context.Context, assignments []UserDailyTask) error {
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

func (r *MongoRepository) CompleteUserDailyTask(ctx context.Context, userID, taskID, date string) error {
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

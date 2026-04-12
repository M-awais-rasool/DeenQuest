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
	habits       *mongo.Collection
	tasks        *mongo.Collection
	streaks      *mongo.Collection
	achievements *mongo.Collection
	progress     *mongo.Collection
	reflections  *mongo.Collection
}

func NewMongoCoreRepository(db *mongo.Database) (*MongoCoreRepository, error) {
	r := &MongoCoreRepository{
		habits:       db.Collection("habits"),
		tasks:        db.Collection("tasks"),
		streaks:      db.Collection("streaks"),
		achievements: db.Collection("achievements"),
		progress:     db.Collection("progress"),
		reflections:  db.Collection("reflections"),
	}
	if err := r.ensureIndexes(); err != nil {
		return nil, err
	}
	return r, nil
}

func (r *MongoCoreRepository) ensureIndexes() error {
	ctx := context.Background()
	_, err := r.habits.Indexes().CreateOne(ctx, mongo.IndexModel{Keys: bson.D{{Key: "user_id", Value: 1}}})
	if err != nil {
		return err
	}
	_, err = r.progress.Indexes().CreateOne(ctx, mongo.IndexModel{Keys: bson.D{{Key: "user_id", Value: 1}}, Options: options.Index().SetUnique(true)})
	if err != nil {
		return err
	}
	_, err = r.streaks.Indexes().CreateOne(ctx, mongo.IndexModel{Keys: bson.D{{Key: "user_id", Value: 1}}, Options: options.Index().SetUnique(true)})
	if err != nil {
		return err
	}
	_, err = r.achievements.Indexes().CreateOne(ctx, mongo.IndexModel{Keys: bson.D{{Key: "user_id", Value: 1}}})
	return err
}

func (r *MongoCoreRepository) CreateHabit(ctx context.Context, habit *model.Habit) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	_, err := r.habits.InsertOne(timeoutCtx, habit)
	return err
}

func (r *MongoCoreRepository) ListHabits(ctx context.Context, userID string) ([]model.Habit, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.habits.Find(timeoutCtx, bson.M{"user_id": userID})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]model.Habit, 0)
	for cur.Next(ctx) {
		var h model.Habit
		if err := cur.Decode(&h); err != nil {
			return nil, err
		}
		out = append(out, h)
	}
	return out, cur.Err()
}

func (r *MongoCoreRepository) GetHabitByID(ctx context.Context, userID, habitID string) (*model.Habit, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	var h model.Habit
	err := r.habits.FindOne(timeoutCtx, bson.M{"_id": habitID, "user_id": userID}).Decode(&h)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &h, nil
}

func (r *MongoCoreRepository) UpsertTask(ctx context.Context, task *model.Task) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	_, err := r.tasks.UpdateByID(timeoutCtx, task.ID, bson.M{"$set": task}, options.Update().SetUpsert(true))
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

func (r *MongoCoreRepository) ListAchievements(ctx context.Context, userID string) ([]model.Achievement, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.achievements.Find(timeoutCtx, bson.M{"user_id": userID})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]model.Achievement, 0)
	for cur.Next(ctx) {
		var a model.Achievement
		if err := cur.Decode(&a); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, cur.Err()
}

func (r *MongoCoreRepository) CreateReflection(ctx context.Context, reflection *model.Reflection) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	_, err := r.reflections.InsertOne(timeoutCtx, reflection)
	return err
}

func withTimeout(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, 5*time.Second)
}

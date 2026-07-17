package progress

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoRepository struct {
	progress *mongo.Collection
	streaks  *mongo.Collection
	// userDailyTasks is read-only here: the weekly-completion strip on the
	// progress screen is derived from daily-task activity. The dailytask
	// feature owns this collection; progress only projects from it.
	userDailyTasks *mongo.Collection
}

func NewMongoRepository(db *mongo.Database) (*MongoRepository, error) {
	r := &MongoRepository{
		progress:       db.Collection("progress"),
		streaks:        db.Collection("streaks"),
		userDailyTasks: db.Collection("user_daily_tasks"),
	}
	if err := r.ensureIndexes(); err != nil {
		return nil, err
	}
	return r, nil
}

func (r *MongoRepository) ensureIndexes() error {
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

	return nil
}

func withTimeout(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, 5*time.Second)
}

func (r *MongoRepository) GetProgress(ctx context.Context, userID string) (*Progress, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	var p Progress
	err := r.progress.FindOne(timeoutCtx, bson.M{"user_id": userID}).Decode(&p)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *MongoRepository) IncrementProgress(ctx context.Context, userID string, xpDelta, barakahDelta int) (*Progress, error) {
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

	var p Progress
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

func (r *MongoRepository) ListLeaderboardProgress(ctx context.Context, limit int) ([]Progress, error) {
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

	out := make([]Progress, 0)
	for cur.Next(ctx) {
		var p Progress
		if err := cur.Decode(&p); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, cur.Err()
}

func (r *MongoRepository) GetStreak(ctx context.Context, userID string) (*Streak, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	var s Streak
	err := r.streaks.FindOne(timeoutCtx, bson.M{"user_id": userID}).Decode(&s)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *MongoRepository) UpsertStreak(ctx context.Context, streak *Streak) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	_, err := r.streaks.UpdateOne(timeoutCtx, bson.M{"user_id": streak.UserID}, bson.M{"$set": streak}, options.Update().SetUpsert(true))
	return err
}

func (r *MongoRepository) GetCompletedDates(ctx context.Context, userID string, dates []string) (map[string]bool, error) {
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
		var ut struct {
			Date string `bson:"date"`
		}
		if err := cur.Decode(&ut); err != nil {
			return nil, err
		}
		result[ut.Date] = true
	}
	return result, cur.Err()
}

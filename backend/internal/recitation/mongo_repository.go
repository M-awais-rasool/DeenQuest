package recitation

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoRepository struct {
	recitationAttempts *mongo.Collection
}

func NewMongoRepository(db *mongo.Database) (*MongoRepository, error) {
	r := &MongoRepository{
		recitationAttempts: db.Collection("recitation_attempts"),
	}
	if err := r.ensureIndexes(); err != nil {
		return nil, err
	}
	return r, nil
}

func (r *MongoRepository) ensureIndexes() error {
	ctx := context.Background()
	_, err := r.recitationAttempts.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "level_id", Value: 1}, {Key: "lesson_index", Value: 1}, {Key: "created_at", Value: -1}},
		Options: options.Index().SetBackground(true),
	})
	return err
}

func withTimeout(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, 5*time.Second)
}

func (r *MongoRepository) SaveRecitationAttempt(ctx context.Context, attempt *RecitationAttempt) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	_, err := r.recitationAttempts.InsertOne(timeoutCtx, attempt)
	return err
}

func (r *MongoRepository) CountUserRecitationAttempts(ctx context.Context, userID string, levelID, lessonIndex int) (int, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	n, err := r.recitationAttempts.CountDocuments(timeoutCtx, bson.M{
		"user_id":      userID,
		"level_id":     levelID,
		"lesson_index": lessonIndex,
	})
	return int(n), err
}

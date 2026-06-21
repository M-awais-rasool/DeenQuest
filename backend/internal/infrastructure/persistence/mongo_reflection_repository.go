package persistence

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/chawais/talent-flow/backend/internal/domain/reflection"
)

// MongoReflectionRepository stores the reflection journal (collection: reflections).
type MongoReflectionRepository struct {
	col *mongo.Collection
}

func NewMongoReflectionRepository(db *mongo.Database) (*MongoReflectionRepository, error) {
	r := &MongoReflectionRepository{col: db.Collection("reflections")}
	if _, err := r.col.Indexes().CreateOne(context.Background(), mongo.IndexModel{
		Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "created_at", Value: -1}},
		Options: options.Index().SetBackground(true),
	}); err != nil {
		return nil, err
	}
	return r, nil
}

func (r *MongoReflectionRepository) Save(ctx context.Context, ref *reflection.Reflection) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	_, err := r.col.InsertOne(timeoutCtx, ref)
	return err
}

func (r *MongoReflectionRepository) List(ctx context.Context, userID string, limit int) ([]reflection.Reflection, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	findOpts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
	if limit > 0 {
		findOpts.SetLimit(int64(limit))
	}
	cur, err := r.col.Find(timeoutCtx, bson.M{"user_id": userID}, findOpts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]reflection.Reflection, 0, 16)
	for cur.Next(ctx) {
		var ref reflection.Reflection
		if err := cur.Decode(&ref); err != nil {
			return nil, err
		}
		out = append(out, ref)
	}
	return out, cur.Err()
}

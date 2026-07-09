package reflection

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MongoRepository stores the reflection journal (collection: reflections).
type MongoRepository struct {
	col *mongo.Collection
}

func NewMongoRepository(db *mongo.Database) (*MongoRepository, error) {
	r := &MongoRepository{col: db.Collection("reflections")}
	if _, err := r.col.Indexes().CreateOne(context.Background(), mongo.IndexModel{
		Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "created_at", Value: -1}},
		Options: options.Index().SetBackground(true),
	}); err != nil {
		return nil, err
	}
	return r, nil
}

func (r *MongoRepository) Save(ctx context.Context, ref *Reflection) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	_, err := r.col.InsertOne(timeoutCtx, ref)
	return err
}

func (r *MongoRepository) List(ctx context.Context, userID string, limit int) ([]Reflection, error) {
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
	out := make([]Reflection, 0, 16)
	for cur.Next(ctx) {
		var ref Reflection
		if err := cur.Decode(&ref); err != nil {
			return nil, err
		}
		out = append(out, ref)
	}
	return out, cur.Err()
}

func withTimeout(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, 5*time.Second)
}

package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type JobLog struct {
	ID        string      `bson:"_id" json:"id"`
	Topic     string      `bson:"topic" json:"topic"`
	EventType string      `bson:"event_type" json:"event_type"`
	Payload   interface{} `bson:"payload" json:"payload"`
	Status    string      `bson:"status" json:"status"`
	Error     string      `bson:"error,omitempty" json:"error,omitempty"`
	CreatedAt time.Time   `bson:"created_at" json:"created_at"`
}

type JobLogRepository struct {
	collection *mongo.Collection
}

func NewJobLogRepository(db *mongo.Database) *JobLogRepository {
	repo := &JobLogRepository{collection: db.Collection("job_logs")}
	_, _ = repo.collection.Indexes().CreateOne(context.Background(), mongo.IndexModel{Keys: bson.D{{Key: "created_at", Value: -1}}})
	return repo
}

func (r *JobLogRepository) Save(ctx context.Context, topic, eventType string, payload interface{}, status, errMsg string) {
	item := JobLog{
		ID:        uuid.NewString(),
		Topic:     topic,
		EventType: eventType,
		Payload:   payload,
		Status:    status,
		Error:     errMsg,
		CreatedAt: time.Now().UTC(),
	}
	_, _ = r.collection.InsertOne(ctx, item)
}

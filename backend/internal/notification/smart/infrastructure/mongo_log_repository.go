package infrastructure

import (
	"context"
	"time"

	"github.com/chawais/deenquest/backend/internal/notification/smart/domain"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoLogRepository struct {
	collection *mongo.Collection
}

func NewMongoLogRepository(db *mongo.Database) *MongoLogRepository {
	coll := db.Collection("notification_logs")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, _ = coll.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "notification_type", Value: 1}, {Key: "created_at", Value: -1}},
	})
	return &MongoLogRepository{collection: coll}
}

func (r *MongoLogRepository) SaveLog(ctx context.Context, log *domain.NotificationLog) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if log.ID == "" {
		log.ID = uuid.NewString()
	}
	if log.CreatedAt.IsZero() {
		log.CreatedAt = time.Now().UTC()
	}

	_, err := r.collection.InsertOne(ctx, log)
	return err
}

func (r *MongoLogRepository) GetLastNotificationTime(ctx context.Context, userID string, notifType domain.NotificationType) (*time.Time, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	opts := options.FindOne().SetSort(bson.D{{Key: "created_at", Value: -1}})
	var log domain.NotificationLog
	err := r.collection.FindOne(ctx, bson.M{
		"user_id":           userID,
		"notification_type": string(notifType),
		"status":            "sent",
	}, opts).Decode(&log)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &log.CreatedAt, nil
}

package infrastructure

import (
	"context"
	"time"

	"github.com/chawais/deenquest/backend/internal/notification/smart/domain"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
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

func (r *MongoLogRepository) GetLastNotificationTimes(ctx context.Context, userIDs []string) ([]domain.LastNotification, error) {
	if len(userIDs) == 0 {
		return nil, nil
	}

	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	cur, err := r.collection.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"user_id": bson.M{"$in": userIDs},
			"status":  "sent",
		}}},
		{{Key: "$sort", Value: bson.D{
			{Key: "user_id", Value: 1},
			{Key: "notification_type", Value: 1},
			{Key: "created_at", Value: -1},
		}}},
		{{Key: "$group", Value: bson.M{
			"_id": bson.M{
				"user_id": "$user_id",
				"type":    "$notification_type",
			},
			"sent_at": bson.M{"$first": "$created_at"},
		}}},
	})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var rows []struct {
		ID struct {
			UserID string `bson:"user_id"`
			Type   string `bson:"type"`
		} `bson:"_id"`
		SentAt time.Time `bson:"sent_at"`
	}
	if err := cur.All(ctx, &rows); err != nil {
		return nil, err
	}

	out := make([]domain.LastNotification, 0, len(rows))
	for _, row := range rows {
		out = append(out, domain.LastNotification{
			UserID: row.ID.UserID,
			Type:   domain.NotificationType(row.ID.Type),
			SentAt: row.SentAt,
		})
	}
	return out, nil
}

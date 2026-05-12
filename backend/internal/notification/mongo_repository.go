package notification

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoTokenRepository struct {
	collection *mongo.Collection
}

func NewMongoTokenRepository(db *mongo.Database) (*MongoTokenRepository, error) {
	repo := &MongoTokenRepository{collection: db.Collection("notification_tokens")}
	indexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "expo_push_token", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "enabled", Value: 1}}},
	}
	_, err := repo.collection.Indexes().CreateMany(context.Background(), indexes)
	if err != nil {
		return nil, err
	}
	return repo, nil
}

func (r *MongoTokenRepository) Upsert(ctx context.Context, token *UserToken) (*UserToken, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	now := time.Now().UTC()
	update := bson.M{
		"$set": bson.M{
			"user":            token.User,
			"user_id":         token.User.ID,
			"expo_push_token": token.ExpoPushToken,
			"platform":        token.Platform,
			"device_id":       token.DeviceID,
			"app_version":     token.AppVersion,
			"enabled":         true,
			"last_seen_at":    now,
			"updated_at":      now,
		},
		"$setOnInsert": bson.M{
			"_id":        uuid.NewString(),
			"created_at": now,
		},
	}

	opts := options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After)
	var saved UserToken
	err := r.collection.FindOneAndUpdate(ctx, bson.M{"expo_push_token": token.ExpoPushToken}, update, opts).Decode(&saved)
	if err != nil {
		return nil, err
	}
	return &saved, nil
}

func (r *MongoTokenRepository) GetActiveByUserID(ctx context.Context, userID string) (*UserToken, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	opts := options.FindOne().SetSort(bson.D{{Key: "last_seen_at", Value: -1}})
	var token UserToken
	err := r.collection.FindOne(ctx, bson.M{"user_id": userID, "enabled": true}, opts).Decode(&token)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &token, nil
}

func (r *MongoTokenRepository) Disable(ctx context.Context, userID, expoPushToken string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	_, err := r.collection.UpdateOne(ctx, bson.M{
		"user_id":         userID,
		"expo_push_token": expoPushToken,
	}, bson.M{"$set": bson.M{
		"enabled":    false,
		"updated_at": time.Now().UTC(),
	}})
	return err
}

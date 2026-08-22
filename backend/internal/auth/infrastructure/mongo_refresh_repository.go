package infrastructure

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/chawais/deenquest/backend/internal/auth/domain"
)

type MongoRefreshTokenRepository struct {
	collection *mongo.Collection
}

func NewMongoRefreshTokenRepository(db *mongo.Database) (*MongoRefreshTokenRepository, error) {
	coll := db.Collection("refresh_tokens")

	_, err := coll.Indexes().CreateMany(context.Background(), []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "token_hash", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{Keys: bson.D{{Key: "family_id", Value: 1}}},
		{Keys: bson.D{{Key: "user_id", Value: 1}}},
		{
			Keys:    bson.D{{Key: "expires_at", Value: 1}},
			Options: options.Index().SetExpireAfterSeconds(0),
		},
	})
	if err != nil {
		return nil, err
	}

	return &MongoRefreshTokenRepository{collection: coll}, nil
}

func (r *MongoRefreshTokenRepository) Create(ctx context.Context, token *domain.RefreshToken) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	_, err := r.collection.InsertOne(ctx, token)
	return err
}

func (r *MongoRefreshTokenRepository) Consume(ctx context.Context, hash string, at time.Time) (*domain.RefreshToken, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var token domain.RefreshToken
	err := r.collection.FindOneAndUpdate(
		ctx,
		bson.M{"token_hash": hash, "used_at": nil, "revoked_at": nil},
		bson.M{"$set": bson.M{"used_at": at}},
		options.FindOneAndUpdate().SetReturnDocument(options.Before),
	).Decode(&token)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &token, nil
}

func (r *MongoRefreshTokenRepository) GetByHash(ctx context.Context, hash string) (*domain.RefreshToken, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var token domain.RefreshToken
	err := r.collection.FindOne(ctx, bson.M{"token_hash": hash}).Decode(&token)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &token, nil
}

func (r *MongoRefreshTokenRepository) RevokeFamily(ctx context.Context, familyID string, at time.Time) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	_, err := r.collection.UpdateMany(
		ctx,
		bson.M{"family_id": familyID, "revoked_at": nil},
		bson.M{"$set": bson.M{"revoked_at": at}},
	)
	return err
}

func (r *MongoRefreshTokenRepository) RevokeByID(ctx context.Context, userID, id string, at time.Time) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var token domain.RefreshToken
	err := r.collection.FindOne(ctx, bson.M{"_id": id, "user_id": userID}).Decode(&token)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return mongo.ErrNoDocuments
	}
	if err != nil {
		return err
	}

	return r.RevokeFamily(ctx, token.FamilyID, at)
}

func (r *MongoRefreshTokenRepository) ListActive(ctx context.Context, userID string, now time.Time) ([]domain.RefreshToken, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	cur, err := r.collection.Find(
		ctx,
		bson.M{
			"user_id":    userID,
			"used_at":    nil,
			"revoked_at": nil,
			"expires_at": bson.M{"$gt": now},
		},
		options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}}),
	)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	tokens := make([]domain.RefreshToken, 0, 8)
	if err := cur.All(ctx, &tokens); err != nil {
		return nil, err
	}
	return tokens, nil
}

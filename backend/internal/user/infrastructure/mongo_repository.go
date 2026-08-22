package infrastructure

import (
	"context"
	"errors"
	"time"

	"github.com/chawais/deenquest/backend/internal/user/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoRepository struct {
	collection *mongo.Collection
}

func NewMongoRepository(db *mongo.Database) (*MongoRepository, error) {
	repo := &MongoRepository{collection: db.Collection("users")}
	_, err := repo.collection.Indexes().CreateMany(context.Background(), []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{
				{Key: "identities.provider", Value: 1},
				{Key: "identities.subject", Value: 1},
			},
			Options: options.Index().SetUnique(true).SetSparse(true),
		},
	})
	if err != nil {
		return nil, err
	}
	return repo, nil
}

func (r *MongoRepository) Create(ctx context.Context, user *domain.User) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	_, err := r.collection.InsertOne(ctx, user)
	return err
}

func (r *MongoRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	var u domain.User
	err := r.collection.FindOne(ctx, bson.M{"email": email}).Decode(&u)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *MongoRepository) GetByID(ctx context.Context, id string) (*domain.User, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	var u domain.User
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&u)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *MongoRepository) Update(ctx context.Context, user *domain.User) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	_, err := r.collection.UpdateByID(ctx, user.ID, bson.M{"$set": bson.M{
		"email":        user.Email,
		"role":         user.Role,
		"display_name": user.DisplayName,
		"avatar_url":   user.AvatarURL,
		"bio":          user.Bio,
		"title":        user.Title,
		"is_verified":  user.IsVerified,
		"updated_at":   user.UpdatedAt,
	}})
	return err
}

func (r *MongoRepository) Delete(ctx context.Context, id string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

func (r *MongoRepository) GetByIdentity(ctx context.Context, provider, subject string) (*domain.User, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	var u domain.User
	err := r.collection.FindOne(ctx, bson.M{
		"identities": bson.M{"$elemMatch": bson.M{"provider": provider, "subject": subject}},
	}).Decode(&u)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *MongoRepository) LinkIdentity(ctx context.Context, userID string, identity domain.LinkedIdentity) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{
			"_id": userID,
			"identities": bson.M{"$not": bson.M{"$elemMatch": bson.M{
				"provider": identity.Provider,
				"subject":  identity.Subject,
			}}},
		},
		bson.M{
			"$push": bson.M{"identities": identity},
			"$set":  bson.M{"updated_at": time.Now().UTC()},
		},
	)
	return err
}

package infrastructure

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/chawais/deenquest/backend/internal/recitation/domain"
)

const AudioSpoolTTL = 20 * time.Minute

type MongoAudioStore struct {
	clips *mongo.Collection
}

type spooledClip struct {
	ID        string           `bson:"_id"`
	Data      primitive.Binary `bson:"data"`
	CreatedAt time.Time        `bson:"created_at"`
}

func NewMongoAudioStore(db *mongo.Database) (*MongoAudioStore, error) {
	s := &MongoAudioStore{clips: db.Collection("recitation_audio_spool")}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := s.clips.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "created_at", Value: 1}},
		Options: options.Index().
			SetExpireAfterSeconds(int32(AudioSpoolTTL.Seconds())).
			SetName("created_at_ttl"),
	})
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (s *MongoAudioStore) Put(ctx context.Context, id string, data []byte) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()

	_, err := s.clips.InsertOne(timeoutCtx, spooledClip{
		ID:        id,
		Data:      primitive.Binary{Subtype: 0x00, Data: data},
		CreatedAt: time.Now(),
	})
	return err
}

func (s *MongoAudioStore) Get(ctx context.Context, id string) ([]byte, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()

	var clip spooledClip
	if err := s.clips.FindOne(timeoutCtx, bson.M{"_id": id}).Decode(&clip); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, domain.ErrJobNotFound
		}
		return nil, err
	}
	return clip.Data.Data, nil
}

func (s *MongoAudioStore) Delete(ctx context.Context, id string) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()

	_, err := s.clips.DeleteOne(timeoutCtx, bson.M{"_id": id})
	return err
}

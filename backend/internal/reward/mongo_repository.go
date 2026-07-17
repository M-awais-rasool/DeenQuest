package reward

import (
	"context"
	"errors"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoRepository struct {
	rewards     *mongo.Collection
	userRewards *mongo.Collection

	staticMu      sync.RWMutex
	cachedRewards []Reward
	rewardsLoaded bool
}

func NewMongoRepository(db *mongo.Database) (*MongoRepository, error) {
	r := &MongoRepository{
		rewards:     db.Collection("rewards"),
		userRewards: db.Collection("user_rewards"),
	}
	if err := r.ensureIndexes(); err != nil {
		return nil, err
	}
	return r, nil
}

func (r *MongoRepository) ensureIndexes() error {
	ctx := context.Background()
	_, err := r.userRewards.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "reward_id", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	return err
}

func withTimeout(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, 5*time.Second)
}

// rewards are immutable between deploys; serve a cached snapshot and only hit
// Mongo on a cold cache (first read or after a re-seed / CRUD write).
func (r *MongoRepository) rewardsSnapshot(ctx context.Context) ([]Reward, error) {
	r.staticMu.RLock()
	if r.rewardsLoaded {
		rewards := r.cachedRewards
		r.staticMu.RUnlock()
		return rewards, nil
	}
	r.staticMu.RUnlock()

	r.staticMu.Lock()
	defer r.staticMu.Unlock()
	if r.rewardsLoaded {
		return r.cachedRewards, nil
	}

	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.rewards.Find(timeoutCtx, bson.M{}, options.Find().SetSort(bson.D{{Key: "sort_order", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]Reward, 0, 16)
	for cur.Next(ctx) {
		var rw Reward
		if err := cur.Decode(&rw); err != nil {
			return nil, err
		}
		out = append(out, rw)
	}
	if err := cur.Err(); err != nil {
		return nil, err
	}
	r.cachedRewards = out
	r.rewardsLoaded = true
	return r.cachedRewards, nil
}

func (r *MongoRepository) invalidateRewards() {
	r.staticMu.Lock()
	r.cachedRewards, r.rewardsLoaded = nil, false
	r.staticMu.Unlock()
}

func (r *MongoRepository) SeedRewards(ctx context.Context, rewards []Reward) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	for _, rw := range rewards {
		_, err := r.rewards.UpdateByID(timeoutCtx, rw.ID, bson.M{"$setOnInsert": rw}, options.Update().SetUpsert(true))
		if err != nil {
			return err
		}
	}
	r.invalidateRewards()
	return nil
}

func (r *MongoRepository) ListAllRewards(ctx context.Context) ([]Reward, error) {
	return r.rewardsSnapshot(ctx)
}

func (r *MongoRepository) GetRewardByID(ctx context.Context, id string) (*Reward, error) {
	rewards, err := r.rewardsSnapshot(ctx)
	if err != nil {
		return nil, err
	}
	for i := range rewards {
		if rewards[i].ID == id {
			rw := rewards[i]
			return &rw, nil
		}
	}
	return nil, nil
}

func (r *MongoRepository) CreateReward(ctx context.Context, reward *Reward) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	if _, err := r.rewards.InsertOne(timeoutCtx, reward); err != nil {
		return err
	}
	r.invalidateRewards()
	return nil
}

func (r *MongoRepository) UpdateReward(ctx context.Context, reward *Reward) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	res, err := r.rewards.ReplaceOne(timeoutCtx, bson.M{"_id": reward.ID}, reward)
	if err != nil {
		return err
	}
	if res.MatchedCount == 0 {
		return errors.New("reward not found")
	}
	r.invalidateRewards()
	return nil
}

func (r *MongoRepository) DeleteReward(ctx context.Context, id string) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	res, err := r.rewards.DeleteOne(timeoutCtx, bson.M{"_id": id})
	if err != nil {
		return err
	}
	if res.DeletedCount == 0 {
		return errors.New("reward not found")
	}
	r.invalidateRewards()
	return nil
}

func (r *MongoRepository) GetUserRewards(ctx context.Context, userID string) ([]UserReward, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.userRewards.Find(timeoutCtx, bson.M{"user_id": userID})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]UserReward, 0, 10)
	for cur.Next(ctx) {
		var ur UserReward
		if err := cur.Decode(&ur); err != nil {
			return nil, err
		}
		out = append(out, ur)
	}
	return out, cur.Err()
}

func (r *MongoRepository) GrantUserReward(ctx context.Context, ur *UserReward) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	_, err := r.userRewards.UpdateOne(
		timeoutCtx,
		bson.M{"user_id": ur.UserID, "reward_id": ur.RewardID},
		bson.M{"$setOnInsert": ur},
		options.Update().SetUpsert(true),
	)
	return err
}

package learningagent

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type StateStore struct {
	db *mongo.Database
}

func NewStateStore(db *mongo.Database) *StateStore {
	return &StateStore{db: db}
}

func (s *StateStore) GetOrCreate(ctx context.Context, userID string) (*LearningState, error) {
	coll := s.db.Collection("user_learning_states")

	var state LearningState
	err := coll.FindOne(ctx, bson.M{"user_id": userID}).Decode(&state)
	if err == mongo.ErrNoDocuments {
		return defaultState(userID), nil
	}
	if err != nil {
		return nil, err
	}
	return &state, nil
}

func (s *StateStore) Save(ctx context.Context, state *LearningState) error {
	state.UpdatedAt = time.Now()
	coll := s.db.Collection("user_learning_states")
	_, err := coll.ReplaceOne(ctx, bson.M{"user_id": state.UserID}, state, options.Replace().SetUpsert(true))
	return err
}

func defaultState(userID string) *LearningState {
	return &LearningState{
		UserID:     userID,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
		SkillProfile: make(map[UserCategory]map[string]*SkillProfile),
		Engagement: EngagementProfile{
			Level:      EngagementModerate,
			Score:      0.5,
			LastActive: time.Now(),
		},
		LearningSpeed: LearningSpeedProfile{
			Classification: SpeedUnknown,
		},
		WeakAreas:   []string{},
		StrongAreas: []string{},
	}
}

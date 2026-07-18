package coach

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	colBatches     = "telemetry_batches"
	colEvents      = "telemetry_events"
	colSkillStates = "user_skill_state"
	colInsights    = "coach_insights"

	rawEventTTL = 30 * 24 * time.Hour
)

type MongoRepository struct {
	batches     *mongo.Collection
	events      *mongo.Collection
	skillStates *mongo.Collection
	insights    *mongo.Collection
}

func NewMongoRepository(db *mongo.Database) (*MongoRepository, error) {
	r := &MongoRepository{
		batches:     db.Collection(colBatches),
		events:      db.Collection(colEvents),
		skillStates: db.Collection(colSkillStates),
		insights:    db.Collection(colInsights),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.events.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "event.ts", Value: -1}}},
		{
			Keys:    bson.D{{Key: "created_at", Value: 1}},
			Options: options.Index().SetExpireAfterSeconds(int32(rawEventTTL.Seconds())),
		},
	})
	if err != nil {
		return nil, fmt.Errorf("create telemetry_events indexes: %w", err)
	}

	_, err = r.batches.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "created_at", Value: 1}},
		Options: options.Index().SetExpireAfterSeconds(int32((48 * time.Hour).Seconds())),
	})
	if err != nil {
		return nil, fmt.Errorf("create telemetry_batches index: %w", err)
	}

	_, err = r.insights.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "status", Value: 1}, {Key: "expires_at", Value: 1}},
	})
	if err != nil {
		return nil, fmt.Errorf("create coach_insights index: %w", err)
	}

	return r, nil
}

func (r *MongoRepository) ClaimBatch(ctx context.Context, userID, key string) (bool, error) {
	_, err := r.batches.InsertOne(ctx, bson.M{
		"_id":        userID + ":" + key,
		"user_id":    userID,
		"created_at": time.Now(),
	})
	if mongo.IsDuplicateKeyError(err) {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("claim telemetry batch: %w", err)
	}
	return true, nil
}

func (r *MongoRepository) StoreEvents(ctx context.Context, events []StoredEvent) error {
	if len(events) == 0 {
		return nil
	}
	docs := make([]interface{}, len(events))
	for i, e := range events {
		docs[i] = e
	}
	_, err := r.events.InsertMany(ctx, docs, options.InsertMany().SetOrdered(false))
	if err != nil {
		return fmt.Errorf("store telemetry events: %w", err)
	}
	return nil
}

func (r *MongoRepository) GetSkillState(ctx context.Context, userID string) (*UserSkillState, error) {
	var state UserSkillState
	err := r.skillStates.FindOne(ctx, bson.M{"_id": userID}).Decode(&state)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get skill state: %w", err)
	}
	return &state, nil
}

func (r *MongoRepository) SaveSkillState(ctx context.Context, state *UserSkillState) error {
	_, err := r.skillStates.ReplaceOne(ctx, bson.M{"_id": state.UserID}, state,
		options.Replace().SetUpsert(true))
	if err != nil {
		return fmt.Errorf("save skill state: %w", err)
	}
	return nil
}

func (r *MongoRepository) UpsertInsights(ctx context.Context, insights []Insight) error {
	if len(insights) == 0 {
		return nil
	}
	models := make([]mongo.WriteModel, 0, len(insights))
	for _, ins := range insights {
		models = append(models, mongo.NewUpdateOneModel().
			SetFilter(bson.M{"_id": ins.ID}).
			SetUpdate(bson.M{
				"$set": bson.M{
					"user_id":           ins.UserID,
					"rule":              ins.Rule,
					"severity":          ins.Severity,
					"skills":            ins.Skills,
					"count":             ins.Count,
					"title":             ins.Title,
					"detail":            ins.Detail,
					"why":               ins.Why,
					"practice_level_id": ins.PracticeLevelID,
					"practice_minutes":  ins.PracticeMinutes,
					"status":            InsightActive,
					"updated_at":        ins.UpdatedAt,
					"expires_at":        ins.ExpiresAt,
				},
				"$setOnInsert": bson.M{"created_at": ins.CreatedAt},
			}).
			SetUpsert(true))
	}
	_, err := r.insights.BulkWrite(ctx, models, options.BulkWrite().SetOrdered(false))
	if err != nil {
		return fmt.Errorf("upsert insights: %w", err)
	}
	return nil
}

func (r *MongoRepository) ExpireInsightsNotIn(ctx context.Context, userID string, activeIDs []string, now time.Time) error {
	if activeIDs == nil {
		activeIDs = []string{}
	}
	_, err := r.insights.UpdateMany(ctx,
		bson.M{"user_id": userID, "status": InsightActive, "_id": bson.M{"$nin": activeIDs}},
		bson.M{"$set": bson.M{"status": InsightExpired, "updated_at": now}})
	if err != nil {
		return fmt.Errorf("expire stale insights: %w", err)
	}
	return nil
}

func (r *MongoRepository) ActiveInsights(ctx context.Context, userID string, now time.Time) ([]Insight, error) {
	cur, err := r.insights.Find(ctx,
		bson.M{"user_id": userID, "status": InsightActive, "expires_at": bson.M{"$gt": now}},
		options.Find().SetSort(bson.D{{Key: "created_at", Value: 1}}))
	if err != nil {
		return nil, fmt.Errorf("find active insights: %w", err)
	}
	var out []Insight
	if err := cur.All(ctx, &out); err != nil {
		return nil, fmt.Errorf("decode active insights: %w", err)
	}
	return out, nil
}

func (r *MongoRepository) GetInsight(ctx context.Context, userID, insightID string) (*Insight, error) {
	var ins Insight
	err := r.insights.FindOne(ctx, bson.M{"_id": insightID, "user_id": userID}).Decode(&ins)
	if err == mongo.ErrNoDocuments {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get insight: %w", err)
	}
	return &ins, nil
}

func (r *MongoRepository) MarkInsightDone(ctx context.Context, userID, insightID string) error {
	_, err := r.insights.UpdateOne(ctx,
		bson.M{"_id": insightID, "user_id": userID},
		bson.M{"$set": bson.M{"status": InsightDone, "updated_at": time.Now()}})
	if err != nil {
		return fmt.Errorf("mark insight done: %w", err)
	}
	return nil
}

func (r *MongoRepository) EachSkillState(ctx context.Context, fn func(*UserSkillState) error) error {
	cur, err := r.skillStates.Find(ctx, bson.M{})
	if err != nil {
		return fmt.Errorf("iterate skill states: %w", err)
	}
	defer func() { _ = cur.Close(ctx) }()
	for cur.Next(ctx) {
		var state UserSkillState
		if err := cur.Decode(&state); err != nil {
			return fmt.Errorf("decode skill state: %w", err)
		}
		if err := fn(&state); err != nil {
			return err
		}
	}
	return cur.Err()
}

func (r *MongoRepository) PurgeUser(ctx context.Context, userID string) error {
	for _, col := range []*mongo.Collection{r.events, r.batches, r.insights} {
		if _, err := col.DeleteMany(ctx, bson.M{"user_id": userID}); err != nil {
			return fmt.Errorf("purge %s: %w", col.Name(), err)
		}
	}
	if _, err := r.skillStates.DeleteOne(ctx, bson.M{"_id": userID}); err != nil {
		return fmt.Errorf("purge skill state: %w", err)
	}
	return nil
}

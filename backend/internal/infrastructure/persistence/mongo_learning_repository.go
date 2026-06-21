package persistence

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/chawais/talent-flow/backend/internal/domain/learning"
)

// MongoLearningRepository persists LearnerState (learner_states) and
// Recommendation (recommendations). It follows the same conventions as
// MongoCoreRepository (withTimeout, $set upserts, index creation on init).
type MongoLearningRepository struct {
	states          *mongo.Collection
	recommendations *mongo.Collection
}

func NewMongoLearningRepository(db *mongo.Database) (*MongoLearningRepository, error) {
	r := &MongoLearningRepository{
		states:          db.Collection("learner_states"),
		recommendations: db.Collection("recommendations"),
	}
	if err := r.ensureIndexes(); err != nil {
		return nil, err
	}
	return r, nil
}

func (r *MongoLearningRepository) ensureIndexes() error {
	ctx := context.Background()

	if _, err := r.states.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "user_id", Value: 1}},
		Options: options.Index().SetUnique(true),
	}); err != nil {
		return err
	}
	// Pattern sweep scans by segment + recency...
	if _, err := r.states.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "segment", Value: 1}, {Key: "last_event_at", Value: 1}},
		Options: options.Index().SetBackground(true),
	}); err != nil {
		return err
	}
	// ...and by next-due-date, so the sweep can target only users with a
	// revision coming due (sparse: zero/absent next_due_at isn't indexed).
	if _, err := r.states.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "next_due_at", Value: 1}},
		Options: options.Index().SetBackground(true).SetSparse(true),
	}); err != nil {
		return err
	}

	if _, err := r.recommendations.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "status", Value: 1}, {Key: "priority", Value: -1}},
		Options: options.Index().SetBackground(true),
	}); err != nil {
		return err
	}
	return nil
}

func (r *MongoLearningRepository) GetState(ctx context.Context, userID string) (*learning.LearnerState, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	var s learning.LearnerState
	err := r.states.FindOne(timeoutCtx, bson.M{"user_id": userID}).Decode(&s)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *MongoLearningRepository) UpsertState(ctx context.Context, state *learning.LearnerState) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	_, err := r.states.UpdateOne(
		timeoutCtx,
		bson.M{"user_id": state.UserID},
		bson.M{"$set": state},
		options.Update().SetUpsert(true),
	)
	return err
}

func (r *MongoLearningRepository) ListStates(ctx context.Context, limit, offset int) ([]learning.LearnerState, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	findOpts := options.Find().SetSort(bson.D{{Key: "last_event_at", Value: 1}})
	if limit > 0 {
		findOpts.SetLimit(int64(limit))
	}
	if offset > 0 {
		findOpts.SetSkip(int64(offset))
	}
	cur, err := r.states.Find(timeoutCtx, bson.M{}, findOpts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]learning.LearnerState, 0, 64)
	for cur.Next(ctx) {
		var s learning.LearnerState
		if err := cur.Decode(&s); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, cur.Err()
}

// ListSweepCandidates returns only states the sweep must act on: idle-but-not-yet
// -inactive learners, OR learners with a revision now due. Backed by the
// (segment,last_event_at) and next_due_at indexes.
func (r *MongoLearningRepository) ListSweepCandidates(ctx context.Context, inactiveBefore, dueBefore time.Time, limit, offset int) ([]learning.LearnerState, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()

	filter := bson.M{"$or": []bson.M{
		{"last_event_at": bson.M{"$lt": inactiveBefore}, "segment": bson.M{"$ne": string(learning.SegmentInactive)}},
		{"next_due_at": bson.M{"$lte": dueBefore}},
	}}
	findOpts := options.Find().SetSort(bson.D{{Key: "last_event_at", Value: 1}})
	if limit > 0 {
		findOpts.SetLimit(int64(limit))
	}
	if offset > 0 {
		findOpts.SetSkip(int64(offset))
	}

	cur, err := r.states.Find(timeoutCtx, filter, findOpts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]learning.LearnerState, 0, 64)
	for cur.Next(ctx) {
		var s learning.LearnerState
		if err := cur.Decode(&s); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, cur.Err()
}

// ReplaceActiveRecommendations swaps a user's active recommendation set: the old
// active ones are deleted (not retained), then the new ones inserted. Deleting
// keeps the collection bounded to ~the active set per user — cheaper storage and
// faster reads than accumulating dismissed history.
func (r *MongoLearningRepository) ReplaceActiveRecommendations(ctx context.Context, userID string, recs []learning.Recommendation) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()

	if _, err := r.recommendations.DeleteMany(
		timeoutCtx,
		bson.M{"user_id": userID, "status": learning.RecStatusActive},
	); err != nil {
		return err
	}

	if len(recs) == 0 {
		return nil
	}
	docs := make([]interface{}, 0, len(recs))
	for i := range recs {
		docs = append(docs, recs[i])
	}
	_, err := r.recommendations.InsertMany(timeoutCtx, docs, options.InsertMany().SetOrdered(false))
	return err
}

func (r *MongoLearningRepository) ListActiveRecommendations(ctx context.Context, userID string) ([]learning.Recommendation, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	cur, err := r.recommendations.Find(
		timeoutCtx,
		bson.M{"user_id": userID, "status": learning.RecStatusActive},
		options.Find().SetSort(bson.D{{Key: "priority", Value: -1}, {Key: "created_at", Value: -1}}),
	)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]learning.Recommendation, 0, 8)
	for cur.Next(ctx) {
		var rec learning.Recommendation
		if err := cur.Decode(&rec); err != nil {
			return nil, err
		}
		out = append(out, rec)
	}
	return out, cur.Err()
}

// Stats aggregates learner_states + recommendations into the admin read-model
// in a single states aggregation ($facet) plus two cheap counts.
func (r *MongoLearningRepository) Stats(ctx context.Context, now time.Time) (*learning.AgentStats, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()

	pipeline := mongo.Pipeline{
		{{Key: "$facet", Value: bson.M{
			"bySegment": mongo.Pipeline{
				{{Key: "$group", Value: bson.M{"_id": "$segment", "n": bson.M{"$sum": 1}}}},
			},
			"totals": mongo.Pipeline{
				{{Key: "$group", Value: bson.M{
					"_id":     nil,
					"total":   bson.M{"$sum": 1},
					"avgEng":  bson.M{"$avg": "$engagement"},
					"avgRisk": bson.M{"$avg": "$dropout_risk"},
					"events":  bson.M{"$sum": "$total_events"},
				}}},
			},
			"due": mongo.Pipeline{
				{{Key: "$match", Value: bson.M{"next_due_at": bson.M{"$gt": time.Time{}, "$lte": now}}}},
				{{Key: "$count", Value: "n"}},
			},
		}}},
	}

	cur, err := r.states.Aggregate(timeoutCtx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var raw []struct {
		BySegment []struct {
			ID string `bson:"_id"`
			N  int    `bson:"n"`
		} `bson:"bySegment"`
		Totals []struct {
			Total   int     `bson:"total"`
			AvgEng  float64 `bson:"avgEng"`
			AvgRisk float64 `bson:"avgRisk"`
			Events  int64   `bson:"events"`
		} `bson:"totals"`
		Due []struct {
			N int `bson:"n"`
		} `bson:"due"`
	}
	if err := cur.All(ctx, &raw); err != nil {
		return nil, err
	}

	stats := &learning.AgentStats{Segments: map[string]int{}}
	if len(raw) > 0 {
		f := raw[0]
		for _, s := range f.BySegment {
			if s.ID != "" {
				stats.Segments[s.ID] = s.N
			}
		}
		if len(f.Totals) > 0 {
			stats.TotalLearners = f.Totals[0].Total
			stats.AvgEngagement = f.Totals[0].AvgEng
			stats.AvgDropoutRisk = f.Totals[0].AvgRisk
			stats.TotalEvents = f.Totals[0].Events
		}
		if len(f.Due) > 0 {
			stats.DueRevisions = f.Due[0].N
		}
	}

	activeCount, err := r.recommendations.CountDocuments(timeoutCtx, bson.M{"status": learning.RecStatusActive})
	if err != nil {
		return nil, err
	}
	stats.ActiveRecommendations = int(activeCount)

	return stats, nil
}

// SkillStruggles unwinds the per-user skills map and ranks each skill by how
// many learners are weak in it (most-struggled first).
func (r *MongoLearningRepository) SkillStruggles(ctx context.Context, limit int) ([]learning.SkillStruggle, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()

	if limit <= 0 {
		limit = 20
	}
	pipeline := mongo.Pipeline{
		{{Key: "$project", Value: bson.M{"skillsArr": bson.M{"$objectToArray": "$skills"}}}},
		{{Key: "$unwind", Value: "$skillsArr"}},
		{{Key: "$group", Value: bson.M{
			"_id":        "$skillsArr.k",
			"learners":   bson.M{"$sum": 1},
			"avgMastery": bson.M{"$avg": "$skillsArr.v.mastery"},
			"weak":       bson.M{"$sum": bson.M{"$cond": []interface{}{bson.M{"$lt": []interface{}{"$skillsArr.v.mastery", 0.5}}, 1, 0}}},
		}}},
		{{Key: "$sort", Value: bson.D{{Key: "weak", Value: -1}, {Key: "avgMastery", Value: 1}}}},
		{{Key: "$limit", Value: int64(limit)}},
	}

	cur, err := r.states.Aggregate(timeoutCtx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]learning.SkillStruggle, 0, limit)
	for cur.Next(ctx) {
		var row struct {
			ID         string  `bson:"_id"`
			Learners   int     `bson:"learners"`
			AvgMastery float64 `bson:"avgMastery"`
			Weak       int     `bson:"weak"`
		}
		if err := cur.Decode(&row); err != nil {
			return nil, err
		}
		out = append(out, learning.SkillStruggle{
			Tag:          row.ID,
			Learners:     row.Learners,
			WeakLearners: row.Weak,
			AvgMastery:   row.AvgMastery,
		})
	}
	return out, cur.Err()
}

func (r *MongoLearningRepository) SetMotivation(ctx context.Context, userID, message string) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	_, err := r.states.UpdateOne(
		timeoutCtx,
		bson.M{"user_id": userID},
		bson.M{"$set": bson.M{"motivation": message, "motivation_at": time.Now().UTC()}},
	)
	return err
}

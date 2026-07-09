package learning

import (
	"context"
	"time"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/chawais/deenquest/backend/internal/learning/model"
)

// MongoMistakeRepository stores the mistake notebook (collection: mistakes).
type MongoMistakeRepository struct {
	col *mongo.Collection
}

func NewMongoMistakeRepository(db *mongo.Database) (*MongoMistakeRepository, error) {
	r := &MongoMistakeRepository{col: db.Collection("mistakes")}
	ctx := context.Background()
	// One row per (user, level, lesson) — upserts increment it.
	if _, err := r.col.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "level_id", Value: 1}, {Key: "lesson_index", Value: 1}},
		Options: options.Index().SetUnique(true),
	}); err != nil {
		return nil, err
	}
	// Listing: a user's open mistakes, newest first.
	if _, err := r.col.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "resolved", Value: 1}, {Key: "last_at", Value: -1}},
		Options: options.Index().SetBackground(true),
	}); err != nil {
		return nil, err
	}
	return r, nil
}

func (r *MongoMistakeRepository) RecordMistake(ctx context.Context, m model.Mistake) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()

	now := time.Now().UTC()
	_, err := r.col.UpdateOne(
		timeoutCtx,
		bson.M{"user_id": m.UserID, "level_id": m.LevelID, "lesson_index": m.LessonIndex},
		bson.M{
			"$inc": bson.M{"count": 1},
			"$set": bson.M{
				"last_at":     now,
				"resolved":    false, // a fresh wrong re-opens it
				"course_type": m.CourseType,
				"skill_tags":  m.SkillTags,
			},
			"$setOnInsert": bson.M{"_id": uuid.NewString(), "first_at": now},
		},
		options.Update().SetUpsert(true),
	)
	return err
}

func (r *MongoMistakeRepository) ListMistakes(ctx context.Context, userID string, includeResolved bool, limit int) ([]model.Mistake, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()

	filter := bson.M{"user_id": userID}
	if !includeResolved {
		filter["resolved"] = false
	}
	findOpts := options.Find().SetSort(bson.D{{Key: "last_at", Value: -1}})
	if limit > 0 {
		findOpts.SetLimit(int64(limit))
	}
	cur, err := r.col.Find(timeoutCtx, filter, findOpts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]model.Mistake, 0, 16)
	for cur.Next(ctx) {
		var m model.Mistake
		if err := cur.Decode(&m); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, cur.Err()
}

// TopMissed ranks the most-missed (level, lesson) across all learners.
func (r *MongoMistakeRepository) TopMissed(ctx context.Context, limit int) ([]model.LessonStruggle, error) {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()

	if limit <= 0 {
		limit = 20
	}
	pipeline := mongo.Pipeline{
		{{Key: "$group", Value: bson.M{
			"_id":      bson.M{"level": "$level_id", "lesson": "$lesson_index"},
			"mistakes": bson.M{"$sum": "$count"},
			"learners": bson.M{"$addToSet": "$user_id"},
		}}},
		{{Key: "$project", Value: bson.M{"mistakes": 1, "learners": bson.M{"$size": "$learners"}}}},
		{{Key: "$sort", Value: bson.D{{Key: "mistakes", Value: -1}}}},
		{{Key: "$limit", Value: int64(limit)}},
	}

	cur, err := r.col.Aggregate(timeoutCtx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	out := make([]model.LessonStruggle, 0, limit)
	for cur.Next(ctx) {
		var row struct {
			ID struct {
				Level  int `bson:"level"`
				Lesson int `bson:"lesson"`
			} `bson:"_id"`
			Mistakes int `bson:"mistakes"`
			Learners int `bson:"learners"`
		}
		if err := cur.Decode(&row); err != nil {
			return nil, err
		}
		out = append(out, model.LessonStruggle{
			LevelID:     row.ID.Level,
			LessonIndex: row.ID.Lesson,
			Mistakes:    row.Mistakes,
			Learners:    row.Learners,
		})
	}
	return out, cur.Err()
}

func (r *MongoMistakeRepository) ResolveMistake(ctx context.Context, userID, id string) error {
	timeoutCtx, cancel := withTimeout(ctx)
	defer cancel()
	_, err := r.col.UpdateOne(
		timeoutCtx,
		bson.M{"_id": id, "user_id": userID},
		bson.M{"$set": bson.M{"resolved": true, "resolved_at": time.Now().UTC()}},
	)
	return err
}

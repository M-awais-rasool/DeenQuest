package infrastructure

import (
	"context"
	"time"

	"github.com/chawais/deenquest/backend/internal/coach/application"

	"github.com/chawais/deenquest/backend/internal/coach/domain"

	"go.mongodb.org/mongo-driver/bson"
)

func (r *MongoRepository) CountActiveInsights(ctx context.Context, now time.Time) (int, int, error) {
	base := bson.M{"status": domain.InsightActive, "expires_at": bson.M{"$gt": now}}

	total, err := r.insights.CountDocuments(ctx, base)
	if err != nil {
		return 0, 0, err
	}

	decayFilter := bson.M{
		"status":     domain.InsightActive,
		"expires_at": bson.M{"$gt": now},
		"rule":       domain.RuleDecay,
	}
	decay, err := r.insights.CountDocuments(ctx, decayFilter)
	if err != nil {
		return 0, 0, err
	}

	return int(total), int(decay), nil
}

func (r *MongoRepository) CountEvents(ctx context.Context) (int64, error) {
	return r.events.EstimatedDocumentCount(ctx)
}

func (r *MongoRepository) MostMissedLessons(ctx context.Context, limit int) ([]application.LessonStruggle, error) {
	pipeline := []bson.M{
		{"$match": bson.M{
			"event.type":     domain.EventQuestionAnswered,
			"event.correct":  false,
			"event.level_id": bson.M{"$gt": 0},
		}},
		{"$group": bson.M{
			"_id": bson.M{
				"level_id":     "$event.level_id",
				"lesson_index": "$event.lesson_index",
			},
			"mistakes": bson.M{"$sum": 1},
			"learners": bson.M{"$addToSet": "$user_id"},
		}},
		{"$project": bson.M{
			"mistakes": 1,
			"learners": bson.M{"$size": "$learners"},
		}},
		{"$sort": bson.M{"mistakes": -1, "_id.level_id": 1, "_id.lesson_index": 1}},
		{"$limit": limit},
	}

	cursor, err := r.events.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var rows []struct {
		ID struct {
			LevelID     int `bson:"level_id"`
			LessonIndex int `bson:"lesson_index"`
		} `bson:"_id"`
		Mistakes int `bson:"mistakes"`
		Learners int `bson:"learners"`
	}
	if err := cursor.All(ctx, &rows); err != nil {
		return nil, err
	}

	out := make([]application.LessonStruggle, 0, len(rows))
	for _, row := range rows {
		out = append(out, application.LessonStruggle{
			LevelID:     row.ID.LevelID,
			LessonIndex: row.ID.LessonIndex,
			Mistakes:    row.Mistakes,
			Learners:    row.Learners,
		})
	}
	return out, nil
}

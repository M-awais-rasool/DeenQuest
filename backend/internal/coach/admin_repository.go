package coach

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
)

type AdminRepository interface {
	// EachSkillState streams every learner's state.
	EachSkillState(ctx context.Context, fn func(*UserSkillState) error) error

	// CountActiveInsights returns active insights in total, and how many of
	// those are decay findings (a skill that needs revisiting).
	CountActiveInsights(ctx context.Context, now time.Time) (total, decay int, err error)

	// CountEvents returns how many raw telemetry events are retained.
	CountEvents(ctx context.Context) (int64, error)

	// MostMissedLessons groups wrong answers by level and lesson.
	MostMissedLessons(ctx context.Context, limit int) ([]LessonStruggle, error)
}

func (r *MongoRepository) CountActiveInsights(ctx context.Context, now time.Time) (int, int, error) {
	base := bson.M{"status": InsightActive, "expires_at": bson.M{"$gt": now}}

	total, err := r.insights.CountDocuments(ctx, base)
	if err != nil {
		return 0, 0, err
	}

	decayFilter := bson.M{
		"status":     InsightActive,
		"expires_at": bson.M{"$gt": now},
		"rule":       RuleDecay,
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

func (r *MongoRepository) MostMissedLessons(ctx context.Context, limit int) ([]LessonStruggle, error) {
	pipeline := []bson.M{
		{"$match": bson.M{
			"event.type":    EventQuestionAnswered,
			"event.correct": false,
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

	out := make([]LessonStruggle, 0, len(rows))
	for _, row := range rows {
		out = append(out, LessonStruggle{
			LevelID:     row.ID.LevelID,
			LessonIndex: row.ID.LessonIndex,
			Mistakes:    row.Mistakes,
			Learners:    row.Learners,
		})
	}
	return out, nil
}

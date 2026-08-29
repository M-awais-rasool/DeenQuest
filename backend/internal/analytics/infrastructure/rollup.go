package infrastructure

import (
	"context"
	"fmt"
	"sort"
	"time"

	"github.com/chawais/deenquest/backend/internal/analytics/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const dayLayout = "2006-01-02"

func (r *MongoRepository) RollUpDay(ctx context.Context, date string) error {
	day, err := time.Parse(dayLayout, date)
	if err != nil {
		return fmt.Errorf("roll up %q: %w", date, err)
	}
	dayStart := day.UTC()
	dayEnd := dayStart.AddDate(0, 0, 1)

	snap := domain.DailySnapshot{Date: date, ComputedAt: time.Now().UTC()}

	n, err := r.userDailyTasks.CountDocuments(ctx, bson.M{"date": date, "completed": true})
	if err != nil {
		return fmt.Errorf("count task completions for %s: %w", date, err)
	}
	snap.TaskCompletions = int(n)

	n, err = r.userLevels.CountDocuments(ctx, bson.M{
		"completed":    true,
		"completed_at": bson.M{"$gte": dayStart, "$lt": dayEnd},
	})
	if err != nil {
		return fmt.Errorf("count level completions for %s: %w", date, err)
	}
	snap.LevelCompletions = int(n)

	n, err = r.recitation.CountDocuments(ctx, bson.M{
		"created_at": bson.M{"$gte": dayStart, "$lt": dayEnd},
	})
	if err != nil {
		return fmt.Errorf("count recitation attempts for %s: %w", date, err)
	}
	snap.RecitationAttempts = int(n)

	ids, err := r.userDailyTasks.Distinct(ctx, "user_id", bson.M{"date": date})
	if err != nil {
		return fmt.Errorf("count active users for %s: %w", date, err)
	}
	snap.ActiveUsers = len(ids)

	_, err = r.dailySnapshots.ReplaceOne(ctx,
		bson.M{"_id": date}, snap, options.Replace().SetUpsert(true))
	if err != nil {
		return fmt.Errorf("store snapshot for %s: %w", date, err)
	}
	return nil
}

func (r *MongoRepository) BackfillMissingDays(ctx context.Context) (int, error) {
	rawDays, err := r.distinctRawDays(ctx)
	if err != nil {
		return 0, err
	}
	if len(rawDays) == 0 {
		return 0, nil
	}

	haveDays, err := r.snapshotDays(ctx)
	if err != nil {
		return 0, err
	}

	today := time.Now().UTC().Format(dayLayout)
	missing := make([]string, 0)
	for _, day := range rawDays {
		if day >= today || haveDays[day] {
			continue
		}
		missing = append(missing, day)
	}
	sort.Strings(missing)

	for _, day := range missing {
		if err := r.RollUpDay(ctx, day); err != nil {
			return len(missing), err
		}
	}
	return len(missing), nil
}

func (r *MongoRepository) distinctRawDays(ctx context.Context) ([]string, error) {
	seen := map[string]struct{}{}

	taskDays, err := r.userDailyTasks.Distinct(ctx, "date", bson.M{})
	if err != nil {
		return nil, fmt.Errorf("list task days: %w", err)
	}
	for _, d := range taskDays {
		if s, ok := d.(string); ok && s != "" {
			seen[s] = struct{}{}
		}
	}

	cur, err := r.userLevels.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"completed": true, "completed_at": bson.M{"$ne": nil}}}},
		{{Key: "$group", Value: bson.M{
			"_id": bson.M{"$dateToString": bson.M{"format": "%Y-%m-%d", "date": "$completed_at"}},
		}}},
	})
	if err != nil {
		return nil, fmt.Errorf("list level days: %w", err)
	}
	defer cur.Close(ctx)

	var rows []struct {
		ID string `bson:"_id"`
	}
	if err := cur.All(ctx, &rows); err != nil {
		return nil, fmt.Errorf("read level days: %w", err)
	}
	for _, row := range rows {
		if row.ID != "" {
			seen[row.ID] = struct{}{}
		}
	}

	days := make([]string, 0, len(seen))
	for d := range seen {
		days = append(days, d)
	}
	sort.Strings(days)
	return days, nil
}

func (r *MongoRepository) snapshotDays(ctx context.Context) (map[string]bool, error) {
	cur, err := r.dailySnapshots.Find(ctx, bson.M{}, options.Find().SetProjection(bson.M{"_id": 1}))
	if err != nil {
		return nil, fmt.Errorf("list snapshots: %w", err)
	}
	defer cur.Close(ctx)

	var rows []struct {
		Date string `bson:"_id"`
	}
	if err := cur.All(ctx, &rows); err != nil {
		return nil, fmt.Errorf("read snapshots: %w", err)
	}

	out := make(map[string]bool, len(rows))
	for _, row := range rows {
		out[row.Date] = true
	}
	return out, nil
}

// snapshotsSince reads finished days from the given date forward, oldest first.
func (r *MongoRepository) snapshotsSince(ctx context.Context, from string) ([]domain.DailySnapshot, error) {
	cur, err := r.dailySnapshots.Find(ctx,
		bson.M{"_id": bson.M{"$gte": from}},
		options.Find().SetSort(bson.D{{Key: "_id", Value: 1}}))
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var out []domain.DailySnapshot
	if err := cur.All(ctx, &out); err != nil {
		return nil, err
	}
	return out, nil
}

type lifetimeTotals struct {
	TaskCompletions    int64
	LevelCompletions   int64
	RecitationAttempts int64
}

func (r *MongoRepository) lifetimeTotals(ctx context.Context) (lifetimeTotals, error) {
	cur, err := r.dailySnapshots.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$group", Value: bson.M{
			"_id":         nil,
			"tasks":       bson.M{"$sum": "$task_completions"},
			"levels":      bson.M{"$sum": "$level_completions"},
			"recitations": bson.M{"$sum": "$recitation_attempts"},
		}}},
	})
	if err != nil {
		return lifetimeTotals{}, err
	}
	defer cur.Close(ctx)

	var rows []struct {
		Tasks       int64 `bson:"tasks"`
		Levels      int64 `bson:"levels"`
		Recitations int64 `bson:"recitations"`
	}
	if err := cur.All(ctx, &rows); err != nil || len(rows) == 0 {
		return lifetimeTotals{}, err
	}
	return lifetimeTotals{
		TaskCompletions:    rows[0].Tasks,
		LevelCompletions:   rows[0].Levels,
		RecitationAttempts: rows[0].Recitations,
	}, nil
}

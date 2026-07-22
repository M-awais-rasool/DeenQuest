package infrastructure

import (
	"context"
	"sort"
	"strconv"
	"sync"
	"time"

	"github.com/chawais/deenquest/backend/internal/analytics/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoRepository struct {
	users          *mongo.Collection
	progress       *mongo.Collection
	streaks        *mongo.Collection
	levels         *mongo.Collection
	dailyTasks     *mongo.Collection
	userLevels     *mongo.Collection
	userDailyTasks *mongo.Collection
	recitation     *mongo.Collection

	mu       sync.Mutex
	cached   *domain.AdminAnalytics
	cachedAt time.Time
	ttl      time.Duration
}

func NewMongoRepository(db *mongo.Database) *MongoRepository {
	return &MongoRepository{
		users:          db.Collection("users"),
		progress:       db.Collection("progress"),
		streaks:        db.Collection("streaks"),
		levels:         db.Collection("levels"),
		dailyTasks:     db.Collection("daily_tasks"),
		userLevels:     db.Collection("user_levels"),
		userDailyTasks: db.Collection("user_daily_tasks"),
		recitation:     db.Collection("recitation_attempts"),
		ttl:            30 * time.Second,
	}
}

const analyticsSeriesDays = 14

func (r *MongoRepository) GetAdminAnalytics(ctx context.Context) (*domain.AdminAnalytics, error) {
	r.mu.Lock()
	if r.cached != nil && time.Since(r.cachedAt) < r.ttl {
		cached := r.cached
		r.mu.Unlock()
		return cached, nil
	}
	r.mu.Unlock()

	ctx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	now := time.Now().UTC()
	today := now.Format("2006-01-02")
	weekAgo := now.AddDate(0, 0, -6).Format("2006-01-02")
	seriesStart := now.AddDate(0, 0, -(analyticsSeriesDays - 1)).Truncate(24 * time.Hour)
	seriesStartStr := seriesStart.Format("2006-01-02")

	out := &domain.AdminAnalytics{}

	var wg sync.WaitGroup
	run := func(f func()) {
		wg.Add(1)
		go func() {
			defer wg.Done()
			f()
		}()
	}

	run(func() { out.TotalUsers, _ = r.users.EstimatedDocumentCount(ctx) })
	run(func() { out.TotalLevels, _ = r.levels.EstimatedDocumentCount(ctx) })
	run(func() { out.TotalTasks, _ = r.dailyTasks.EstimatedDocumentCount(ctx) })
	run(func() { out.RecitationAttempts, _ = r.recitation.EstimatedDocumentCount(ctx) })

	run(func() { out.LevelsCompleted, _ = r.userLevels.CountDocuments(ctx, bson.M{"completed": true}) })
	run(func() { out.TasksCompleted, _ = r.userDailyTasks.CountDocuments(ctx, bson.M{"completed": true}) })

	run(func() {
		if v, err := r.sumInt(ctx, r.progress, "$total_xp", bson.M{}); err == nil {
			out.TotalXP = v
		}
	})
	run(func() { out.AvgStreak, out.LongestStreak = r.streakStats(ctx) })

	run(func() {
		if ids, err := r.userDailyTasks.Distinct(ctx, "user_id", bson.M{"date": today}); err == nil {
			out.ActiveToday = int64(len(ids))
		}
	})
	run(func() {
		if ids, err := r.userDailyTasks.Distinct(ctx, "user_id", bson.M{"date": bson.M{"$gte": weekAgo}}); err == nil {
			out.ActiveWeek = int64(len(ids))
		}
	})

	run(func() { out.Series = r.activitySeries(ctx, seriesStart, seriesStartStr) })
	run(func() { out.LevelsByDifficulty = r.levelsByDifficulty(ctx) })
	run(func() { out.TopLevels = r.topLevels(ctx) })

	wg.Wait()

	r.mu.Lock()
	r.cached, r.cachedAt = out, time.Now()
	r.mu.Unlock()

	return out, nil
}

func (r *MongoRepository) sumInt(ctx context.Context, coll *mongo.Collection, field string, match bson.M) (int64, error) {
	cur, err := coll.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: match}},
		{{Key: "$group", Value: bson.M{"_id": nil, "total": bson.M{"$sum": field}}}},
	})
	if err != nil {
		return 0, err
	}
	defer cur.Close(ctx)
	var rows []struct {
		Total int64 `bson:"total"`
	}
	if err := cur.All(ctx, &rows); err != nil || len(rows) == 0 {
		return 0, err
	}
	return rows[0].Total, nil
}

func (r *MongoRepository) streakStats(ctx context.Context) (float64, int) {
	cur, err := r.streaks.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$group", Value: bson.M{
			"_id": nil,
			"avg": bson.M{"$avg": "$current_streak"},
			"max": bson.M{"$max": "$longest_streak"},
		}}},
	})
	if err != nil {
		return 0, 0
	}
	defer cur.Close(ctx)
	var rows []struct {
		Avg float64 `bson:"avg"`
		Max int     `bson:"max"`
	}
	if err := cur.All(ctx, &rows); err != nil || len(rows) == 0 {
		return 0, 0
	}
	return rows[0].Avg, rows[0].Max
}

// activitySeries returns a zero-filled day-by-day series for the window,
// combining level completions (by completed_at) and task completions (by date).
func (r *MongoRepository) activitySeries(ctx context.Context, start time.Time, startStr string) []domain.AnalyticsTimePoint {
	points := make([]domain.AnalyticsTimePoint, analyticsSeriesDays)
	index := make(map[string]int, analyticsSeriesDays)
	for i := 0; i < analyticsSeriesDays; i++ {
		d := start.AddDate(0, 0, i).Format("2006-01-02")
		points[i] = domain.AnalyticsTimePoint{Date: d}
		index[d] = i
	}

	// Task completions: group by the YYYY-MM-DD `date` string.
	if cur, err := r.userDailyTasks.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"completed": true, "date": bson.M{"$gte": startStr}}}},
		{{Key: "$group", Value: bson.M{"_id": "$date", "count": bson.M{"$sum": 1}}}},
	}); err == nil {
		var rows []struct {
			ID    string `bson:"_id"`
			Count int    `bson:"count"`
		}
		_ = cur.All(ctx, &rows)
		for _, row := range rows {
			if i, ok := index[row.ID]; ok {
				points[i].TaskCompletions = row.Count
			}
		}
	}

	// Level completions: derive the day from completed_at.
	if cur, err := r.userLevels.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"completed": true, "completed_at": bson.M{"$gte": start}}}},
		{{Key: "$group", Value: bson.M{
			"_id":   bson.M{"$dateToString": bson.M{"format": "%Y-%m-%d", "date": "$completed_at"}},
			"count": bson.M{"$sum": 1},
		}}},
	}); err == nil {
		var rows []struct {
			ID    string `bson:"_id"`
			Count int    `bson:"count"`
		}
		_ = cur.All(ctx, &rows)
		for _, row := range rows {
			if i, ok := index[row.ID]; ok {
				points[i].LevelCompletions = row.Count
			}
		}
	}

	return points
}

func (r *MongoRepository) levelsByDifficulty(ctx context.Context) []domain.AnalyticsLabelCount {
	cur, err := r.levels.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$group", Value: bson.M{"_id": "$difficulty", "count": bson.M{"$sum": 1}}}},
	})
	if err != nil {
		return nil
	}
	defer cur.Close(ctx)
	var rows []struct {
		ID    string `bson:"_id"`
		Count int    `bson:"count"`
	}
	if err := cur.All(ctx, &rows); err != nil {
		return nil
	}
	out := make([]domain.AnalyticsLabelCount, 0, len(rows))
	for _, row := range rows {
		label := row.ID
		if label == "" {
			label = "unset"
		}
		out = append(out, domain.AnalyticsLabelCount{Label: label, Count: row.Count})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Label < out[j].Label })
	return out
}

func (r *MongoRepository) topLevels(ctx context.Context) []domain.AnalyticsLabelCount {
	cur, err := r.userLevels.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"completed": true}}},
		{{Key: "$group", Value: bson.M{"_id": "$level_id", "count": bson.M{"$sum": 1}}}},
		{{Key: "$sort", Value: bson.D{{Key: "count", Value: -1}}}},
		{{Key: "$limit", Value: 6}},
	})
	if err != nil {
		return nil
	}
	defer cur.Close(ctx)
	var rows []struct {
		ID    int `bson:"_id"`
		Count int `bson:"count"`
	}
	if err := cur.All(ctx, &rows); err != nil || len(rows) == 0 {
		return nil
	}

	// Resolve level_id → title.
	ids := make([]int, 0, len(rows))
	for _, row := range rows {
		ids = append(ids, row.ID)
	}
	titles := r.levelTitles(ctx, ids)

	out := make([]domain.AnalyticsLabelCount, 0, len(rows))
	for _, row := range rows {
		label := titles[row.ID]
		if label == "" {
			label = "Level " + strconv.Itoa(row.ID)
		}
		out = append(out, domain.AnalyticsLabelCount{Label: label, Count: row.Count})
	}
	return out
}

func (r *MongoRepository) levelTitles(ctx context.Context, ids []int) map[int]string {
	titles := make(map[int]string, len(ids))
	cur, err := r.levels.Find(ctx, bson.M{"_id": bson.M{"$in": ids}}, options.Find().SetProjection(bson.M{"title": 1}))
	if err != nil {
		return titles
	}
	defer cur.Close(ctx)
	var rows []struct {
		ID    int    `bson:"_id"`
		Title string `bson:"title"`
	}
	if err := cur.All(ctx, &rows); err != nil {
		return titles
	}
	for _, row := range rows {
		titles[row.ID] = row.Title
	}
	return titles
}

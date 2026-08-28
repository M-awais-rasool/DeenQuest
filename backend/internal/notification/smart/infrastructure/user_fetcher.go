package infrastructure

import (
	"context"
	"sync"
	"time"

	"github.com/chawais/deenquest/backend/internal/notification/smart/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type UserFetcher struct {
	streaks    *mongo.Collection
	tokens     *mongo.Collection
	dailyTasks *mongo.Collection

	locMu     sync.RWMutex
	locations map[string]*time.Location
}

func NewUserFetcher(db *mongo.Database) *UserFetcher {
	return &UserFetcher{
		streaks:    db.Collection("streaks"),
		tokens:     db.Collection("notification_tokens"),
		dailyTasks: db.Collection("user_daily_tasks"),
		locations:  make(map[string]*time.Location),
	}
}

func (f *UserFetcher) FetchUserPage(
	ctx context.Context,
	afterID string,
	limit int,
	activeHours domain.HourSet,
	now time.Time,
) ([]domain.UserContext, string, error) {
	ctx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	if limit <= 0 {
		limit = 100
	}

	filter := bson.M{"enabled": true}
	if afterID != "" {
		filter["_id"] = bson.M{"$gt": afterID}
	}

	cur, err := f.tokens.Find(ctx, filter,
		options.Find().
			SetSort(bson.D{{Key: "_id", Value: 1}}).
			SetLimit(int64(limit)).
			SetProjection(bson.M{"_id": 1, "user_id": 1, "expo_push_token": 1, "timezone": 1}),
	)
	if err != nil {
		return nil, "", err
	}
	defer cur.Close(ctx)

	var tokenDocs []struct {
		ID            string `bson:"_id"`
		UserID        string `bson:"user_id"`
		ExpoPushToken string `bson:"expo_push_token"`
		Timezone      string `bson:"timezone"`
	}
	if err := cur.All(ctx, &tokenDocs); err != nil {
		return nil, "", err
	}

	if len(tokenDocs) == 0 {
		return nil, "", nil
	}

	nextCursor := ""
	if len(tokenDocs) == limit {
		nextCursor = tokenDocs[len(tokenDocs)-1].ID
	}

	type tokenInfo struct {
		expoPushToken string
		timezone      string
	}
	userIDs := make([]string, 0, len(tokenDocs))
	tokenMap := make(map[string]tokenInfo, len(tokenDocs))

	for _, t := range tokenDocs {
		if t.UserID == "" || t.ExpoPushToken == "" {
			continue
		}
		if _, seen := tokenMap[t.UserID]; seen {
			continue
		}
		if !activeHours.Contains(now.In(f.location(t.Timezone)).Hour()) {
			continue
		}
		userIDs = append(userIDs, t.UserID)
		tokenMap[t.UserID] = tokenInfo{expoPushToken: t.ExpoPushToken, timezone: t.Timezone}
	}

	if len(userIDs) == 0 {
		return nil, nextCursor, nil
	}

	streakMap, err := f.loadStreaks(ctx, userIDs)
	if err != nil {
		return nil, "", err
	}

	today := now.UTC().Format("2006-01-02")
	taskMap, err := f.loadTodayTasks(ctx, userIDs, today)
	if err != nil {
		return nil, "", err
	}

	users := make([]domain.UserContext, 0, len(userIDs))
	for _, uid := range userIDs {
		ti := tokenMap[uid]
		streak := streakMap[uid]
		tasks := taskMap[uid]

		users = append(users, domain.UserContext{
			UserID:          uid,
			ExpoPushToken:   ti.expoPushToken,
			Timezone:        ti.timezone,
			CurrentStreak:   streak.CurrentStreak,
			LongestStreak:   streak.LongestStreak,
			LastCompletedAt: streak.LastCompleted,
			TodayTasksTotal: tasks.total,
			TodayTasksDone:  tasks.done,
		})
	}

	return users, nextCursor, nil
}

type streakInfo struct {
	CurrentStreak int
	LongestStreak int
	LastCompleted time.Time
}

func (f *UserFetcher) loadStreaks(ctx context.Context, userIDs []string) (map[string]streakInfo, error) {
	cur, err := f.streaks.Find(ctx,
		bson.M{"user_id": bson.M{"$in": userIDs}},
		options.Find().SetProjection(bson.M{
			"_id": 0, "user_id": 1, "current_streak": 1, "longest_streak": 1, "last_completed_at": 1,
		}),
	)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var docs []struct {
		UserID        string    `bson:"user_id"`
		CurrentStreak int       `bson:"current_streak"`
		LongestStreak int       `bson:"longest_streak"`
		LastCompleted time.Time `bson:"last_completed_at"`
	}
	if err := cur.All(ctx, &docs); err != nil {
		return nil, err
	}

	out := make(map[string]streakInfo, len(docs))
	for _, d := range docs {
		out[d.UserID] = streakInfo{d.CurrentStreak, d.LongestStreak, d.LastCompleted}
	}
	return out, nil
}

type taskCounts struct {
	total int
	done  int
}

func (f *UserFetcher) loadTodayTasks(ctx context.Context, userIDs []string, today string) (map[string]taskCounts, error) {
	cur, err := f.dailyTasks.Aggregate(ctx, mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"user_id": bson.M{"$in": userIDs},
			"date":    today,
		}}},
		{{Key: "$group", Value: bson.M{
			"_id":   "$user_id",
			"total": bson.M{"$sum": 1},
			"done":  bson.M{"$sum": bson.M{"$cond": []interface{}{"$completed", 1, 0}}},
		}}},
	})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var docs []struct {
		UserID string `bson:"_id"`
		Total  int    `bson:"total"`
		Done   int    `bson:"done"`
	}
	if err := cur.All(ctx, &docs); err != nil {
		return nil, err
	}

	out := make(map[string]taskCounts, len(docs))
	for _, d := range docs {
		out[d.UserID] = taskCounts{total: d.Total, done: d.Done}
	}
	return out, nil
}

func (f *UserFetcher) location(name string) *time.Location {
	if name == "" {
		return time.UTC
	}

	f.locMu.RLock()
	loc, ok := f.locations[name]
	f.locMu.RUnlock()
	if ok {
		return loc
	}

	loc, err := time.LoadLocation(name)
	if err != nil || loc == nil {
		loc = time.UTC
	}

	f.locMu.Lock()
	f.locations[name] = loc
	f.locMu.Unlock()
	return loc
}

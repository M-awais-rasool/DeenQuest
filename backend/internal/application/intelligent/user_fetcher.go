package intelligent

import (
	"context"
	"time"

	domain "github.com/chawais/talent-flow/backend/internal/domain/intelligent"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type UserFetcher struct {
	streaks      *mongo.Collection
	tokens       *mongo.Collection
	dailyTasks   *mongo.Collection
}

func NewUserFetcher(db *mongo.Database) *UserFetcher {
	return &UserFetcher{
		streaks:    db.Collection("streaks"),
		tokens:     db.Collection("notification_tokens"),
		dailyTasks: db.Collection("user_daily_tasks"),
	}
}

func (f *UserFetcher) FetchAllUsers(ctx context.Context, limit int, offset int) ([]domain.UserContext, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	today := time.Now().UTC().Format("2006-01-02")
	yesterday := time.Now().UTC().AddDate(0, 0, -1).Format("2006-01-02")

	tokenCursor, err := f.tokens.Find(ctx, bson.M{"enabled": true})
	if err != nil {
		return nil, err
	}
	defer tokenCursor.Close(ctx)

	var tokenDocs []struct {
		UserID        string `bson:"user_id"`
		ExpoPushToken string `bson:"expo_push_token"`
		Timezone      string `bson:"timezone"`
	}
	if err := tokenCursor.All(ctx, &tokenDocs); err != nil {
		return nil, err
	}

	if len(tokenDocs) == 0 {
		return []domain.UserContext{}, nil
	}

	type tokenInfo struct {
		expoPushToken string
		timezone      string
	}
	userIDs := make([]string, 0, len(tokenDocs))
	tokenMap := make(map[string]tokenInfo, len(tokenDocs))
	for _, t := range tokenDocs {
		if t.UserID != "" {
			userIDs = append(userIDs, t.UserID)
			if _, exists := tokenMap[t.UserID]; !exists {
				tokenMap[t.UserID] = tokenInfo{
					expoPushToken: t.ExpoPushToken,
					timezone:      t.Timezone,
				}
			}
		}
	}

	if len(userIDs) == 0 {
		return []domain.UserContext{}, nil
	}

	streakCursor, err := f.streaks.Find(ctx, bson.M{
		"user_id": bson.M{"$in": userIDs},
	})
	if err != nil {
		return nil, err
	}
	defer streakCursor.Close(ctx)

	streakMap := make(map[string]struct {
		CurrentStreak int
		LongestStreak int
		LastCompleted time.Time
	})
	for streakCursor.Next(ctx) {
		var doc struct {
			UserID        string    `bson:"user_id"`
			CurrentStreak int       `bson:"current_streak"`
			LongestStreak int       `bson:"longest_streak"`
			LastCompleted time.Time `bson:"last_completed_at"`
		}
		if err := streakCursor.Decode(&doc); err != nil {
			continue
		}
		streakMap[doc.UserID] = struct {
			CurrentStreak int
			LongestStreak int
			LastCompleted time.Time
		}{doc.CurrentStreak, doc.LongestStreak, doc.LastCompleted}
	}

	taskPipeline := []bson.M{
		{"$match": bson.M{
			"user_id": bson.M{"$in": userIDs},
			"date":    bson.M{"$in": []string{today, yesterday}},
		}},
		{"$group": bson.M{
			"_id": bson.M{
				"user_id": "$user_id",
				"date":    "$date",
			},
			"total":   bson.M{"$sum": 1},
			"done":    bson.M{"$sum": bson.M{"$cond": []interface{}{"$completed", 1, 0}}},
		}},
	}

	taskCursor, err := f.dailyTasks.Aggregate(ctx, taskPipeline)
	if err != nil {
		return nil, err
	}
	defer taskCursor.Close(ctx)

	type taskKey struct {
		userID string
		date   string
	}
	taskMap := make(map[taskKey]struct {
		total int
		done  int
	})
	for taskCursor.Next(ctx) {
		var doc struct {
			ID    struct {
				UserID string `bson:"user_id"`
				Date   string `bson:"date"`
			} `bson:"_id"`
			Total int `bson:"total"`
			Done  int `bson:"done"`
		}
		if err := taskCursor.Decode(&doc); err != nil {
			continue
		}
		taskMap[taskKey{doc.ID.UserID, doc.ID.Date}] = struct {
			total int
			done  int
		}{doc.Total, doc.Done}
	}

	users := make([]domain.UserContext, 0, len(userIDs))
	for _, uid := range userIDs {
		ti, ok := tokenMap[uid]
		if !ok || ti.expoPushToken == "" {
			continue
		}

		streak := streakMap[uid]
		todayKey := taskKey{uid, today}
		yesterdayKey := taskKey{uid, yesterday}

		todayTasks := taskMap[todayKey]
		_ = taskMap[yesterdayKey]

		users = append(users, domain.UserContext{
			UserID:          uid,
			ExpoPushToken:   ti.expoPushToken,
			Timezone:        ti.timezone,
			CurrentStreak:   streak.CurrentStreak,
			LongestStreak:   streak.LongestStreak,
			LastCompletedAt: streak.LastCompleted,
			TodayTasksTotal: todayTasks.total,
			TodayTasksDone:  todayTasks.done,
		})
	}

	if limit > 0 && len(users) > limit {
		users = users[:limit]
	}

	// Apply offset for pagination
	if offset > 0 && offset < len(users) {
		users = users[offset:]
	} else if offset >= len(users) {
		return []domain.UserContext{}, nil
	}

	return users, nil
}

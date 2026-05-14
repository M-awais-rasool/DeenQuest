package notifications

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type UserFetcher struct {
	streaks    *mongo.Collection
	tokens     *mongo.Collection
	dailyTasks *mongo.Collection
}

func NewUserFetcher(db *mongo.Database) *UserFetcher {
	return &UserFetcher{
		streaks:    db.Collection("streaks"),
		tokens:     db.Collection("notification_tokens"),
		dailyTasks: db.Collection("user_daily_tasks"),
	}
}

func (f *UserFetcher) FetchInactiveUsers(ctx context.Context, inactivityThreshold time.Duration, limit int) ([]InactiveUser, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	cutoff := time.Now().UTC().Add(-inactivityThreshold)

	filter := bson.M{
		"last_completed_at": bson.M{"$lt": cutoff},
	}

	opts := options.Find().SetLimit(int64(limit))
	cursor, err := f.streaks.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var streaks []struct {
		ID              string    `bson:"_id"`
		UserID          string    `bson:"user_id"`
		CurrentStreak   int       `bson:"current_streak"`
		LastCompletedAt time.Time `bson:"last_completed_at"`
	}
	if err := cursor.All(ctx, &streaks); err != nil {
		return nil, err
	}

	if len(streaks) == 0 {
		return []InactiveUser{}, nil
	}

	userIDs := make([]string, 0, len(streaks))
	for _, s := range streaks {
		if s.UserID != "" {
			userIDs = append(userIDs, s.UserID)
		}
	}

	if len(userIDs) == 0 {
		return []InactiveUser{}, nil
	}

	tokenMap, err := f.getUserTokens(ctx, userIDs)
	if err != nil {
		return nil, err
	}

	lessonMap, err := f.getCompletedLessons(ctx, userIDs)
	if err != nil {
		return nil, err
	}

	users := make([]InactiveUser, 0, len(streaks))
	for _, s := range streaks {
		if s.UserID == "" {
			continue
		}

		token, ok := tokenMap[s.UserID]
		if !ok || token == "" {
			continue
		}

		users = append(users, InactiveUser{
			UserID:           s.UserID,
			Streak:           s.CurrentStreak,
			LastCompletedAt:  s.LastCompletedAt,
			CompletedLessons: lessonMap[s.UserID],
			ExpoPushToken:    token,
		})
	}

	return users, nil
}

func (f *UserFetcher) getUserTokens(ctx context.Context, userIDs []string) (map[string]string, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	cursor, err := f.tokens.Find(ctx, bson.M{
		"user_id": bson.M{"$in": userIDs},
		"enabled": true,
	})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	tokenMap := make(map[string]string)
	for cursor.Next(ctx) {
		var doc struct {
			UserID        string `bson:"user_id"`
			ExpoPushToken string `bson:"expo_push_token"`
		}
		if err := cursor.Decode(&doc); err != nil {
			continue
		}
		if _, exists := tokenMap[doc.UserID]; !exists {
			tokenMap[doc.UserID] = doc.ExpoPushToken
		}
	}

	return tokenMap, nil
}

func (f *UserFetcher) getCompletedLessons(ctx context.Context, userIDs []string) (map[string]int, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	pipeline := []bson.M{
		{"$match": bson.M{
			"user_id":   bson.M{"$in": userIDs},
			"completed": true,
		}},
		{"$group": bson.M{
			"_id":   "$user_id",
			"count": bson.M{"$sum": 1},
		}},
	}

	cursor, err := f.dailyTasks.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	lessonMap := make(map[string]int)
	for cursor.Next(ctx) {
		var doc struct {
			ID    string `bson:"_id"`
			Count int    `bson:"count"`
		}
		if err := cursor.Decode(&doc); err != nil {
			continue
		}
		lessonMap[doc.ID] = doc.Count
	}

	return lessonMap, nil
}

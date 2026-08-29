package app

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.uber.org/zap"

	"github.com/chawais/deenquest/backend/internal/platform/logger"
)

type retentionRule struct {
	collection string
	field      string
	keep       time.Duration
	why        string
}

var retentionRules = []retentionRule{
	{
		collection: "user_daily_tasks",
		field:      "created_at",
		keep:       90 * 24 * time.Hour,
		why:        "one row per user per task per day — the fastest-growing collection in the app",
	},
	{
		collection: "notification_logs",
		field:      "created_at",
		keep:       30 * 24 * time.Hour,
		why:        "read only to answer 'is this user on cooldown', and the longest cooldown is 12 hours",
	},
	{
		collection: "recitation_attempts",
		field:      "created_at",
		keep:       60 * 24 * time.Hour,
		why:        "each row carries a full transcript; nothing reads them after the attempt is scored",
	},
	{
		collection: "user_quests",
		field:      "created_at",
		keep:       60 * 24 * time.Hour,
		why:        "boards are drawn per week and only the current week is ever read",
	},
}

func applyRetention(ctx context.Context, db *mongo.Database) error {
	for _, rule := range retentionRules {
		seconds := int32(rule.keep.Seconds())
		name := rule.field + "_ttl"

		_, err := db.Collection(rule.collection).Indexes().CreateOne(ctx, mongo.IndexModel{
			Keys:    bson.D{{Key: rule.field, Value: 1}},
			Options: options.Index().SetExpireAfterSeconds(seconds).SetName(name),
		})

		switch {
		case err == nil:
		case isIndexOptionsConflict(err):
			if err := updateTTL(ctx, db, rule.collection, name, seconds); err != nil {
				return fmt.Errorf("update TTL on %s: %w", rule.collection, err)
			}
			logger.Info("retention window changed",
				zap.String("collection", rule.collection),
				zap.Int("keep_days", int(rule.keep.Hours()/24)))
			continue
		default:
			return fmt.Errorf("create TTL index on %s: %w", rule.collection, err)
		}

		logger.Info("retention policy applied",
			zap.String("collection", rule.collection),
			zap.Int("keep_days", int(rule.keep.Hours()/24)))
	}
	return nil
}

const indexOptionsConflict = 85

func isIndexOptionsConflict(err error) bool {
	var cmdErr mongo.CommandError
	if errors.As(err, &cmdErr) {
		return cmdErr.Code == indexOptionsConflict
	}
	var writeErr mongo.WriteException
	if errors.As(err, &writeErr) {
		for _, we := range writeErr.WriteErrors {
			if we.Code == indexOptionsConflict {
				return true
			}
		}
	}
	return false
}

func updateTTL(ctx context.Context, db *mongo.Database, collection, index string, seconds int32) error {
	return db.RunCommand(ctx, bson.D{
		{Key: "collMod", Value: collection},
		{Key: "index", Value: bson.D{
			{Key: "name", Value: index},
			{Key: "expireAfterSeconds", Value: seconds},
		}},
	}).Err()
}

func prepareDataLifecycle(ctx context.Context, backfill, applyTTL func(context.Context) error) error {
	if err := backfill(ctx); err != nil {
		return fmt.Errorf("analytics backfill: %w", err)
	}
	return applyTTL(ctx)
}

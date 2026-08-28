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

// retentionRule is one collection's expiry policy.
//
// These live together rather than next to each repository on purpose. How long
// this system keeps a user's data is a single decision that someone should be
// able to audit in one screen, and the ordering constraint below — nothing may
// expire before analytics has counted it — only makes sense when the rules are
// visible side by side.
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

// applyRetention creates the TTL indexes.
//
// It must run after the analytics backfill. MongoDB starts deleting expired
// documents within about a minute of the index existing, and the lifetime
// figures on the admin dashboard are now sums of daily snapshots — so a day
// deleted before it was counted is a day that never happened. Backfill first,
// expire second, always.
//
// Creating an index that already exists with the same options is a no-op, so
// this is safe to run on every start.
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
			// The index exists with a different window, which is what happens
			// the first time anyone edits the table above. Creating it again
			// is an error; changing it is a collMod. Without this branch, a
			// one-line policy change would stop the app from starting.
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

// indexOptionsConflict is MongoDB's code for "that index exists, with
// different options".
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

// prepareDataLifecycle counts what is about to become deletable, then makes it
// deletable.
//
// The two steps are passed in rather than reached through the module graph so
// that the ordering — the part that actually matters — can be tested without a
// database. A failing backfill aborts before any TTL index exists, leaving the
// previous behaviour: data grows, but nothing is lost.
func prepareDataLifecycle(ctx context.Context, backfill, applyTTL func(context.Context) error) error {
	if err := backfill(ctx); err != nil {
		return fmt.Errorf("analytics backfill: %w", err)
	}
	return applyTTL(ctx)
}

package app

import (
	"context"
	"errors"
	"testing"
	"time"
)

// The whole point of prepareDataLifecycle is the order. If a TTL index is
// created before analytics has counted the days it is about to delete, those
// days are gone and the dashboard's lifetime totals are permanently short.
func TestRetentionIsNotAppliedWhenBackfillFails(t *testing.T) {
	applied := false
	backfillErr := errors.New("mongo unreachable")

	err := prepareDataLifecycle(context.Background(),
		func(context.Context) error { return backfillErr },
		func(context.Context) error { applied = true; return nil },
	)

	if !errors.Is(err, backfillErr) {
		t.Errorf("error = %v, want it to wrap the backfill failure", err)
	}
	if applied {
		t.Error("TTL indexes were created after the backfill failed — the days they delete would never be counted")
	}
}

func TestRetentionIsAppliedAfterBackfillSucceeds(t *testing.T) {
	var order []string

	err := prepareDataLifecycle(context.Background(),
		func(context.Context) error { order = append(order, "backfill"); return nil },
		func(context.Context) error { order = append(order, "ttl"); return nil },
	)
	if err != nil {
		t.Fatalf("prepareDataLifecycle: %v", err)
	}

	if len(order) != 2 || order[0] != "backfill" || order[1] != "ttl" {
		t.Errorf("ran %v, want [backfill ttl]", order)
	}
}

func TestRetentionErrorPropagates(t *testing.T) {
	ttlErr := errors.New("index conflict")

	err := prepareDataLifecycle(context.Background(),
		func(context.Context) error { return nil },
		func(context.Context) error { return ttlErr },
	)
	if !errors.Is(err, ttlErr) {
		t.Errorf("error = %v, want the TTL failure", err)
	}
}

// A typo in a collection name does not fail loudly: MongoDB creates the
// collection and the index, and the rule silently protects nothing.
func TestRetentionRulesAreWellFormed(t *testing.T) {
	known := map[string]bool{
		"user_daily_tasks":    true,
		"notification_logs":   true,
		"recitation_attempts": true,
		"user_quests":         true,
		"duels":               true,
		"group_challenges":    true,
		"coach_events":        true,
	}

	seen := map[string]bool{}
	for _, rule := range retentionRules {
		if !known[rule.collection] {
			t.Errorf("rule for %q does not name a collection this app writes to", rule.collection)
		}
		if seen[rule.collection] {
			t.Errorf("two retention rules for %q; the second index would conflict", rule.collection)
		}
		seen[rule.collection] = true

		if rule.field == "" {
			t.Errorf("rule for %q has no field to expire on", rule.collection)
		}
		if rule.why == "" {
			t.Errorf("rule for %q does not say why", rule.collection)
		}

		// A window shorter than a day would delete data the daily rollup has
		// not had a chance to count; anything past two years is not retention.
		if rule.keep < 24*time.Hour {
			t.Errorf("rule for %q keeps %v, which is shorter than the rollup interval", rule.collection, rule.keep)
		}
		if rule.keep > 730*24*time.Hour {
			t.Errorf("rule for %q keeps %v — that is not a retention policy", rule.collection, rule.keep)
		}
	}

	if len(retentionRules) == 0 {
		t.Error("no retention rules; the collections this was built for grow without bound")
	}
}

// The rollup runs at 03:20 and the TTL windows are measured in days, so no
// window may be so short that a row can expire before the night that counts it.
func TestEveryWindowOutlivesOneRollupCycle(t *testing.T) {
	const rollupCycle = 48 * time.Hour // a missed night plus the next one

	for _, rule := range retentionRules {
		if rule.keep <= rollupCycle {
			t.Errorf("%s keeps %v, which is not long enough to survive a missed rollup night",
				rule.collection, rule.keep)
		}
	}
}

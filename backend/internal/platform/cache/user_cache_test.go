package cache

import (
	"context"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
)

type sample struct {
	XP    int    `json:"xp"`
	Label string `json:"label"`
}

func newTestCache(t *testing.T) (*UserCache, *miniredis.Miniredis) {
	t.Helper()

	server := miniredis.RunT(t)
	client, err := NewRedisClient(server.Addr(), "", 0)
	if err != nil {
		t.Fatalf("connect miniredis: %v", err)
	}
	t.Cleanup(func() { _ = client.Close() })

	return NewUserCache(client), server
}

func TestSetThenGetRoundTrips(t *testing.T) {
	c, _ := newTestCache(t)
	ctx := context.Background()

	c.Set(ctx, "alice", "progress", sample{XP: 120, Label: "hi"}, time.Minute)

	var got sample
	if !c.Get(ctx, "alice", "progress", &got) {
		t.Fatal("Get reported a miss for a value just written")
	}
	if got.XP != 120 || got.Label != "hi" {
		t.Errorf("got %+v, want {XP:120 Label:hi}", got)
	}
}

func TestGetMissesWhenNothingWasWritten(t *testing.T) {
	c, _ := newTestCache(t)

	var got sample
	if c.Get(context.Background(), "alice", "progress", &got) {
		t.Error("Get reported a hit for a key that was never written")
	}
}

// The whole point of the generation counter: one write retires every entry the
// user owns, no matter which module wrote it.
func TestInvalidateRetiresEveryNameForThatUser(t *testing.T) {
	c, _ := newTestCache(t)
	ctx := context.Background()

	c.Set(ctx, "alice", "progress", sample{XP: 1}, time.Minute)
	c.Set(ctx, "alice", "levels:qaida", sample{XP: 2}, time.Minute)
	c.Set(ctx, "alice", "tasks:2026-08-29", sample{XP: 3}, time.Minute)

	c.Invalidate(ctx, "alice")

	for _, name := range []string{"progress", "levels:qaida", "tasks:2026-08-29"} {
		var got sample
		if c.Get(ctx, "alice", name, &got) {
			t.Errorf("%q still resolved after Invalidate", name)
		}
	}
}

func TestInvalidateLeavesOtherUsersAlone(t *testing.T) {
	c, _ := newTestCache(t)
	ctx := context.Background()

	c.Set(ctx, "alice", "progress", sample{XP: 1}, time.Minute)
	c.Set(ctx, "bob", "progress", sample{XP: 2}, time.Minute)

	c.Invalidate(ctx, "alice")

	var got sample
	if !c.Get(ctx, "bob", "progress", &got) {
		t.Fatal("invalidating alice also retired bob's entry")
	}
	if got.XP != 2 {
		t.Errorf("bob's XP = %d, want 2", got.XP)
	}
}

// A stale value must not come back when the generation moves forward and back
// again — writes after an invalidation land under the new generation.
func TestWritesAfterInvalidateAreVisible(t *testing.T) {
	c, _ := newTestCache(t)
	ctx := context.Background()

	c.Set(ctx, "alice", "progress", sample{XP: 1}, time.Minute)
	c.Invalidate(ctx, "alice")
	c.Set(ctx, "alice", "progress", sample{XP: 2}, time.Minute)

	var got sample
	if !c.Get(ctx, "alice", "progress", &got) {
		t.Fatal("value written after Invalidate did not resolve")
	}
	if got.XP != 2 {
		t.Errorf("XP = %d, want 2", got.XP)
	}
}

func TestValuesExpire(t *testing.T) {
	c, server := newTestCache(t)
	ctx := context.Background()

	c.Set(ctx, "alice", "progress", sample{XP: 1}, time.Minute)
	server.FastForward(61 * time.Second)

	var got sample
	if c.Get(ctx, "alice", "progress", &got) {
		t.Error("value survived its TTL")
	}
}

// The counter must outlive every value written under it. If it expired first
// the generation would reset and older entries could resolve again.
func TestVersionOutlivesValues(t *testing.T) {
	c, server := newTestCache(t)
	ctx := context.Background()

	c.Invalidate(ctx, "alice")

	ttl := server.TTL("uv:alice")
	if ttl < time.Hour {
		t.Errorf("version TTL = %v, want at least an hour", ttl)
	}
	if ttl != versionTTL {
		t.Errorf("version TTL = %v, want %v", ttl, versionTTL)
	}
}

func TestSharedEntriesIgnoreUserInvalidation(t *testing.T) {
	c, _ := newTestCache(t)
	ctx := context.Background()

	c.SetShared(ctx, "leaderboard:100", []sample{{XP: 9}}, time.Minute)
	c.Invalidate(ctx, "alice")

	var got []sample
	if !c.GetShared(ctx, "leaderboard:100", &got) {
		t.Fatal("a shared entry was retired by a per-user invalidation")
	}
	if len(got) != 1 || got[0].XP != 9 {
		t.Errorf("got %+v, want [{XP:9}]", got)
	}
}

// Redis is optional at runtime, so every method has to tolerate its absence.
func TestNilCacheIsSafe(t *testing.T) {
	var c *UserCache
	ctx := context.Background()

	var got sample
	if c.Get(ctx, "alice", "progress", &got) {
		t.Error("nil cache reported a hit")
	}
	if c.GetShared(ctx, "leaderboard", &got) {
		t.Error("nil cache reported a shared hit")
	}

	c.Set(ctx, "alice", "progress", sample{}, time.Minute)
	c.SetShared(ctx, "leaderboard", sample{}, time.Minute)
	c.Invalidate(ctx, "alice")
}

func TestNilRedisIsSafe(t *testing.T) {
	c := NewUserCache(nil)
	ctx := context.Background()

	var got sample
	if c.Get(ctx, "alice", "progress", &got) {
		t.Error("cache with no Redis reported a hit")
	}

	c.Set(ctx, "alice", "progress", sample{}, time.Minute)
	c.Invalidate(ctx, "alice")
}

// An empty user id would collide every anonymous caller onto one key.
func TestEmptyUserIDIsNotCached(t *testing.T) {
	c, _ := newTestCache(t)
	ctx := context.Background()

	c.Set(ctx, "", "progress", sample{XP: 1}, time.Minute)

	var got sample
	if c.Get(ctx, "", "progress", &got) {
		t.Error("an empty user id was cached")
	}
}

func TestNonPositiveTTLIsNotCached(t *testing.T) {
	c, _ := newTestCache(t)
	ctx := context.Background()

	c.Set(ctx, "alice", "progress", sample{XP: 1}, 0)

	var got sample
	if c.Get(ctx, "alice", "progress", &got) {
		t.Error("a zero TTL was cached")
	}
}

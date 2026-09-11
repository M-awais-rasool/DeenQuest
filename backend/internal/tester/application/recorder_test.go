package application

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/chawais/deenquest/backend/internal/tester/domain"
)

type recordingRepo struct {
	mu    sync.Mutex
	pings []domain.Ping
}

func (r *recordingRepo) RecordActivity(_ context.Context, p domain.Ping) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.pings = append(r.pings, p)
	return nil
}

func (r *recordingRepo) Activity(context.Context, string, string) ([]domain.ActivityDay, error) {
	return nil, nil
}
func (r *recordingRepo) Roster(context.Context) ([]domain.RosterEntry, error) { return nil, nil }
func (r *recordingRepo) SaveRoster(context.Context, []domain.RosterEntry, bool) error {
	return nil
}
func (r *recordingRepo) DeleteRoster(context.Context, string) error { return nil }
func (r *recordingRepo) Accounts(context.Context, []string, []string) ([]domain.Account, error) {
	return nil, nil
}

func (r *recordingRepo) settled(t *testing.T, want int) []domain.Ping {
	t.Helper()

	deadline := time.Now().Add(2 * time.Second)
	for {
		r.mu.Lock()
		got := append([]domain.Ping(nil), r.pings...)
		r.mu.Unlock()

		if len(got) >= want || time.Now().After(deadline) {
			return got
		}
		time.Sleep(time.Millisecond)
	}
}

func testRecorder(repo domain.Repository, clock *time.Time) *Recorder {
	rec := NewRecorder(repo, time.UTC, 5*time.Minute)
	rec.now = func() time.Time { return *clock }
	return rec
}

// The first request of a day is the one the report is about, so it must not
// wait out the write window.
func TestFirstTouchWritesImmediately(t *testing.T) {
	repo := &recordingRepo{}
	clock := time.Date(2026, 9, 12, 8, 0, 0, 0, time.UTC)
	rec := testRecorder(repo, &clock)

	rec.Touch("u1", "android")

	pings := repo.settled(t, 1)
	if len(pings) != 1 {
		t.Fatalf("got %d writes, want 1", len(pings))
	}
	if pings[0].UserID != "u1" || pings[0].Date != "2026-09-12" || pings[0].Client != "android" {
		t.Errorf("ping = %+v", pings[0])
	}
}

// Polling endpoints fire many times a minute; only one write per window may
// reach MongoDB, and it must carry every request made in between.
func TestTouchesInsideTheWindowAreHeldAndCounted(t *testing.T) {
	repo := &recordingRepo{}
	clock := time.Date(2026, 9, 12, 8, 0, 0, 0, time.UTC)
	rec := testRecorder(repo, &clock)

	rec.Touch("u1", "android")
	for i := 0; i < 50; i++ {
		clock = clock.Add(2 * time.Second)
		rec.Touch("u1", "android")
	}
	if got := len(repo.settled(t, 1)); got != 1 {
		t.Fatalf("got %d writes during the window, want 1", got)
	}

	clock = clock.Add(5 * time.Minute)
	rec.Touch("u1", "android")

	pings := repo.settled(t, 2)
	if len(pings) != 2 {
		t.Fatalf("got %d writes, want 2", len(pings))
	}
	if pings[1].Requests != 51 {
		t.Errorf("second write carried %d requests, want 51", pings[1].Requests)
	}
}

// Midnight is a new key, so the new day is recorded on the first request after
// it rather than five minutes later.
func TestCrossingMidnightStartsANewDay(t *testing.T) {
	repo := &recordingRepo{}
	clock := time.Date(2026, 9, 12, 23, 59, 0, 0, time.UTC)
	rec := testRecorder(repo, &clock)

	rec.Touch("u1", "")
	clock = clock.Add(2 * time.Minute)
	rec.Touch("u1", "")

	pings := repo.settled(t, 2)
	if len(pings) != 2 {
		t.Fatalf("got %d writes, want 2", len(pings))
	}

	// Two independent rows, written by two goroutines: which one lands first
	// is not part of the contract.
	dates := map[string]bool{}
	for _, p := range pings {
		dates[p.Date] = true
	}
	if !dates["2026-09-12"] || !dates["2026-09-13"] {
		t.Errorf("dates = %v, want both sides of midnight", dates)
	}
}

// A user who closes the app mid-window would otherwise leave their last
// requests unwritten and their entry in the map forever.
func TestSweepFlushesAndForgetsIdleUsers(t *testing.T) {
	repo := &recordingRepo{}
	clock := time.Date(2026, 9, 12, 8, 0, 0, 0, time.UTC)
	rec := testRecorder(repo, &clock)

	rec.Touch("u1", "android")
	clock = clock.Add(time.Second)
	rec.Touch("u1", "android") // held

	clock = clock.Add(30 * time.Minute)
	rec.Touch("u2", "ios") // any later request runs the sweep

	pings := repo.settled(t, 3)
	if len(pings) != 3 {
		t.Fatalf("got %d writes, want 3", len(pings))
	}

	rec.mu.Lock()
	held := len(rec.users)
	rec.mu.Unlock()
	if held != 1 {
		t.Errorf("recorder holds %d users, want only the active one", held)
	}
}

func TestFlushDrainsHeldRequests(t *testing.T) {
	repo := &recordingRepo{}
	clock := time.Date(2026, 9, 12, 8, 0, 0, 0, time.UTC)
	rec := testRecorder(repo, &clock)

	rec.Touch("u1", "android")
	clock = clock.Add(time.Second)
	rec.Touch("u1", "android")
	repo.settled(t, 1)

	rec.Flush(context.Background())

	pings := repo.settled(t, 2)
	if len(pings) != 2 {
		t.Fatalf("got %d writes, want 2", len(pings))
	}
	if pings[1].Requests != 1 {
		t.Errorf("flushed %d requests, want 1", pings[1].Requests)
	}
}

// Anonymous traffic reaches the tracker whenever a route is public.
func TestTouchIgnoresAnEmptyUser(t *testing.T) {
	repo := &recordingRepo{}
	clock := time.Now()
	rec := testRecorder(repo, &clock)

	rec.Touch("", "android")

	if got := len(repo.settled(t, 0)); got != 0 {
		t.Errorf("got %d writes, want none", got)
	}
}

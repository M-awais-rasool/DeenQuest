package application

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/chawais/deenquest/backend/internal/challenge/domain"
	progressapp "github.com/chawais/deenquest/backend/internal/progress/application"
)

// waitFor polls until cond holds or the deadline passes. The queue is
// asynchronous by design, so tests assert on the outcome rather than on timing.
func waitFor(t *testing.T, timeout time.Duration, cond func() bool) bool {
	t.Helper()
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if cond() {
			return true
		}
		time.Sleep(2 * time.Millisecond)
	}
	return cond()
}

func startQueue(t *testing.T, svc *Service) *ActivityQueue {
	t.Helper()
	q := NewActivityQueue(svc)
	ctx, cancel := context.WithCancel(context.Background())
	go q.Start(ctx)
	t.Cleanup(func() {
		cancel()
		q.Drain(2 * time.Second)
	})
	return q
}

func TestQueueScoresQuestsOffTheRequestPath(t *testing.T) {
	repo := newMemRepo()
	svc, _ := newTestService(repo)
	q := startQueue(t, svc)

	q.OnActivity(context.Background(), "alice", progressapp.SourceLesson, 25)

	ok := waitFor(t, 2*time.Second, func() bool {
		return questProgress(repo, "alice", domain.MetricXP) == 25
	})
	if !ok {
		t.Fatalf("XP quest progress = %d, want 25", questProgress(repo, "alice", domain.MetricXP))
	}
}

// The caller's context belongs to an HTTP request that is already finished by
// the time a worker picks the job up. Cancelling it must not cancel the work.
func TestQueueIgnoresTheCallersCancelledContext(t *testing.T) {
	repo := newMemRepo()
	svc, _ := newTestService(repo)
	q := startQueue(t, svc)

	ctx, cancel := context.WithCancel(context.Background())
	q.OnActivity(ctx, "alice", progressapp.SourceLesson, 25)
	cancel()

	ok := waitFor(t, 2*time.Second, func() bool {
		return questProgress(repo, "alice", domain.MetricXP) == 25
	})
	if !ok {
		t.Fatalf("XP quest progress = %d, want 25 despite the caller cancelling",
			questProgress(repo, "alice", domain.MetricXP))
	}
}

// Quest payouts award XP with SourceChallenge, which re-enters the listener.
// Scoring that would let a reward score the quest that produced it.
func TestQueueIgnoresChallengeSourcedActivity(t *testing.T) {
	repo := newMemRepo()
	svc, _ := newTestService(repo)
	q := startQueue(t, svc)

	q.OnActivity(context.Background(), "alice", progressapp.SourceChallenge, 100)

	time.Sleep(50 * time.Millisecond)
	if got := questProgress(repo, "alice", domain.MetricXP); got != 0 {
		t.Errorf("XP quest progress = %d, want 0", got)
	}
	if got := q.depth(); got != 0 {
		t.Errorf("queued %d jobs, want 0", got)
	}
}

func TestQueueIgnoresEmptyUserID(t *testing.T) {
	repo := newMemRepo()
	svc, _ := newTestService(repo)
	q := NewActivityQueue(svc)

	q.OnActivity(context.Background(), "", progressapp.SourceLesson, 25)

	if got := q.depth(); got != 0 {
		t.Errorf("queued %d jobs for an empty user id, want 0", got)
	}
}

// Enqueuing must never block the caller, which is the entire reason the queue
// exists. With no workers running, one user's shard fills and the rest is shed.
func TestOnActivityNeverBlocksWhenTheQueueIsFull(t *testing.T) {
	repo := newMemRepo()
	svc, _ := newTestService(repo)
	q := NewActivityQueue(svc)

	overflow := 64
	done := make(chan struct{})
	go func() {
		defer close(done)
		for i := 0; i < shardBuffer+overflow; i++ {
			q.OnActivity(context.Background(), "alice", progressapp.SourceLesson, 1)
		}
	}()

	select {
	case <-done:
	case <-time.After(5 * time.Second):
		t.Fatal("OnActivity blocked once the buffer filled")
	}

	if got := q.depth(); got != shardBuffer {
		t.Errorf("buffered %d jobs, want %d", got, shardBuffer)
	}
	if got := q.dropped.Load(); got != uint64(overflow) {
		t.Errorf("dropped %d jobs, want %d", got, overflow)
	}
}

// Scoring is a read-modify-write over a user's quests, so all of one user's
// jobs must land on the same worker. Two workers on one user would interleave
// and lose progress.
func TestJobsForOneUserAlwaysLandOnOneShard(t *testing.T) {
	repo := newMemRepo()
	svc, _ := newTestService(repo)
	q := NewActivityQueue(svc)

	for i := 0; i < 50; i++ {
		q.OnActivity(context.Background(), "alice", progressapp.SourceLesson, 1)
	}

	occupied := 0
	for _, shard := range q.shards {
		if len(shard) > 0 {
			occupied++
		}
	}
	if occupied != 1 {
		t.Errorf("one user spread across %d shards, want 1", occupied)
	}
}

// Different users should still be able to run in parallel, otherwise the
// sharding would have serialised the whole queue.
func TestDifferentUsersSpreadAcrossShards(t *testing.T) {
	repo := newMemRepo()
	svc, _ := newTestService(repo)
	q := NewActivityQueue(svc)

	for _, id := range []string{"alice", "bob", "carol", "dave", "erin", "frank", "grace", "heidi"} {
		q.OnActivity(context.Background(), id, progressapp.SourceLesson, 1)
	}

	occupied := 0
	for _, shard := range q.shards {
		if len(shard) > 0 {
			occupied++
		}
	}
	if occupied < 2 {
		t.Errorf("eight users landed on %d shard(s); the hash is not spreading", occupied)
	}
}

func TestQueueDrainsConcurrentActivity(t *testing.T) {
	repo := newMemRepo()
	svc, _ := newTestService(repo)
	q := startQueue(t, svc)

	const callers = 20
	var wg sync.WaitGroup
	for i := 0; i < callers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			q.OnActivity(context.Background(), "alice", progressapp.SourceLesson, 1)
		}()
	}
	wg.Wait()

	ok := waitFor(t, 3*time.Second, func() bool {
		return questProgress(repo, "alice", domain.MetricXP) == callers
	})
	if !ok {
		t.Errorf("XP quest progress = %d, want %d",
			questProgress(repo, "alice", domain.MetricXP), callers)
	}
	if got := q.dropped.Load(); got != 0 {
		t.Errorf("dropped %d jobs under a load the buffer covers", got)
	}
}

// Start is called from a worker goroutine; a second call must not double the
// worker pool.
func TestStartIsIdempotent(t *testing.T) {
	repo := newMemRepo()
	svc, _ := newTestService(repo)
	q := NewActivityQueue(svc)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go q.Start(ctx)
	waitFor(t, time.Second, func() bool { return q.started.Load() })

	returned := make(chan struct{})
	go func() {
		q.Start(ctx)
		close(returned)
	}()

	select {
	case <-returned:
	case <-time.After(time.Second):
		t.Fatal("second Start blocked instead of returning immediately")
	}
}

// questProgress reads through the fake's lock: the workers are writing to it
// while the test polls.
func questProgress(repo *memRepo, userID string, metric domain.Metric) int {
	defer repo.lock()()

	total := 0
	for _, q := range repo.quests {
		if q.UserID == userID && q.Metric == metric {
			total += q.Progress
		}
	}
	return total
}

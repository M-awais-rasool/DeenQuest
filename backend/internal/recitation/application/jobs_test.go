package application

import (
	"context"
	"errors"
	"io"
	"sync"
	"testing"
	"time"

	"github.com/chawais/deenquest/backend/internal/recitation/domain"
	"github.com/chawais/deenquest/backend/internal/recitation/infrastructure"
)

type fakeChecker struct {
	mu       sync.Mutex
	calls    int
	resolve  error
	check    error
	score    int
	block    chan struct{}
	lastRead []byte
}

func (f *fakeChecker) ResolveLesson(context.Context, int, int) (string, int, error) {
	if f.resolve != nil {
		return "", 0, f.resolve
	}
	return "بسم الله", 25, nil
}

func (f *fakeChecker) CheckRecitation(_ context.Context, _ string, _, _ int,
	audio io.Reader, _ string) (*domain.RecitationCheckResult, error) {
	if f.block != nil {
		<-f.block
	}

	body, _ := io.ReadAll(audio)

	f.mu.Lock()
	f.calls++
	f.lastRead = body
	f.mu.Unlock()

	if f.check != nil {
		return nil, f.check
	}
	return &domain.RecitationCheckResult{Score: f.score, Message: "ok"}, nil
}

func (f *fakeChecker) callCount() int {
	f.mu.Lock()
	defer f.mu.Unlock()
	return f.calls
}

type fakeAudio struct {
	mu    sync.Mutex
	clips map[string][]byte
	fail  error
}

func newFakeAudio() *fakeAudio { return &fakeAudio{clips: map[string][]byte{}} }

func (f *fakeAudio) Put(_ context.Context, id string, data []byte) error {
	if f.fail != nil {
		return f.fail
	}
	f.mu.Lock()
	defer f.mu.Unlock()
	f.clips[id] = data
	return nil
}

func (f *fakeAudio) Get(_ context.Context, id string) ([]byte, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	data, ok := f.clips[id]
	if !ok {
		return nil, domain.ErrJobNotFound
	}
	return data, nil
}

func (f *fakeAudio) Delete(_ context.Context, id string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	delete(f.clips, id)
	return nil
}

func (f *fakeAudio) count() int {
	f.mu.Lock()
	defer f.mu.Unlock()
	return len(f.clips)
}

func newTestQueue(t *testing.T, checker Checker, cfg QueueConfig) (*JobQueue, *fakeAudio) {
	t.Helper()
	audio := newFakeAudio()
	return NewJobQueue(checker, infrastructure.NewMemoryJobStore(), audio, cfg), audio
}

func waitFor(t *testing.T, what string, cond func() bool) {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		if cond() {
			return
		}
		time.Sleep(5 * time.Millisecond)
	}
	t.Fatalf("timed out waiting for %s", what)
}

// The whole point of the change: submitting must not wait on transcription.
func TestSubmitReturnsBeforeTranscribing(t *testing.T) {
	checker := &fakeChecker{score: 90, block: make(chan struct{})}
	q, _ := newTestQueue(t, checker, QueueConfig{})

	accepted, err := q.Submit(context.Background(), "u1", 1, 0, []byte("clip"), "a.m4a")
	if err != nil {
		t.Fatalf("Submit: %v", err)
	}
	if accepted.Status != domain.JobQueued {
		t.Errorf("status = %q, want queued", accepted.Status)
	}
	if accepted.JobID == "" {
		t.Error("no job id handed back")
	}
	if checker.callCount() != 0 {
		t.Error("Submit transcribed inline — the request path is still blocked on Whisper")
	}
	if accepted.EstimatedWait <= 0 {
		t.Error("no wait estimate: the client has nothing to show but a spinner")
	}
	close(checker.block)
}

func TestWorkerGradesAndPublishesResult(t *testing.T) {
	checker := &fakeChecker{score: 78}
	q, audio := newTestQueue(t, checker, QueueConfig{})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go q.Start(ctx)

	accepted, err := q.Submit(ctx, "u1", 1, 0, []byte("clip-bytes"), "a.m4a")
	if err != nil {
		t.Fatalf("Submit: %v", err)
	}

	var state *domain.JobState
	waitFor(t, "the job to finish", func() bool {
		state, err = q.Status(ctx, "u1", accepted.JobID)
		return err == nil && state.Status.Terminal()
	})

	if state.Status != domain.JobDone {
		t.Fatalf("status = %q (%s), want done", state.Status, state.Error)
	}
	if state.Result == nil || state.Result.Score != 78 {
		t.Fatalf("result = %+v, want score 78", state.Result)
	}
	if string(checker.lastRead) != "clip-bytes" {
		t.Errorf("worker transcribed %q, want the submitted clip", checker.lastRead)
	}

	// The clip is the largest thing a job holds; it must not survive it.
	waitFor(t, "the spooled clip to be dropped", func() bool { return audio.count() == 0 })
}

func TestQueueRefusesWorkItCannotGetTo(t *testing.T) {
	checker := &fakeChecker{block: make(chan struct{})}
	q, audio := newTestQueue(t, checker, QueueConfig{MaxDepth: 2})
	defer close(checker.block)

	for i := 0; i < 2; i++ {
		if _, err := q.Submit(context.Background(), "u1", 1, 0, []byte("clip"), "a.m4a"); err != nil {
			t.Fatalf("Submit %d: %v", i, err)
		}
	}

	_, err := q.Submit(context.Background(), "u1", 1, 0, []byte("clip"), "a.m4a")
	if !errors.Is(err, domain.ErrQueueFull) {
		t.Fatalf("err = %v, want ErrQueueFull", err)
	}
	if audio.count() != 2 {
		t.Errorf("spooled %d clips, want 2 — a refused submission must not cost storage", audio.count())
	}
}

// A bad level_id is the client's mistake, and it should hear about it now
// rather than after sitting in the queue.
func TestSubmitRejectsUnknownLessonUpFront(t *testing.T) {
	checker := &fakeChecker{resolve: errors.New("level 99 not found")}
	q, audio := newTestQueue(t, checker, QueueConfig{})

	if _, err := q.Submit(context.Background(), "u1", 99, 0, []byte("clip"), "a.m4a"); err == nil {
		t.Fatal("Submit accepted a lesson that does not exist")
	}
	if audio.count() != 0 {
		t.Error("rejected submission still spooled its audio")
	}
}

func TestSubmitRejectsEmptyAudio(t *testing.T) {
	q, _ := newTestQueue(t, &fakeChecker{}, QueueConfig{})
	if _, err := q.Submit(context.Background(), "u1", 1, 0, nil, "a.m4a"); err == nil {
		t.Fatal("Submit accepted an empty clip")
	}
}

// Job ids are unguessable, but a leaked one must not expose a transcript.
func TestStatusIsScopedToTheSubmitter(t *testing.T) {
	q, _ := newTestQueue(t, &fakeChecker{}, QueueConfig{})

	accepted, err := q.Submit(context.Background(), "owner", 1, 0, []byte("clip"), "a.m4a")
	if err != nil {
		t.Fatalf("Submit: %v", err)
	}

	if _, err := q.Status(context.Background(), "someone-else", accepted.JobID); !errors.Is(err, domain.ErrJobNotFound) {
		t.Fatalf("err = %v, want ErrJobNotFound for another user's job", err)
	}
}

func TestStatusOnUnknownJob(t *testing.T) {
	q, _ := newTestQueue(t, &fakeChecker{}, QueueConfig{})
	if _, err := q.Status(context.Background(), "u1", "no-such-job"); !errors.Is(err, domain.ErrJobNotFound) {
		t.Fatalf("err = %v, want ErrJobNotFound", err)
	}
}

// A worker that dies mid-clip — the ordinary case being a deploy — must not
// leave the client polling a job that will never move.
func TestAbandonedJobIsReportedFailed(t *testing.T) {
	store := infrastructure.NewMemoryJobStore()
	audio := newFakeAudio()
	q := NewJobQueue(&fakeChecker{}, store, audio, QueueConfig{Lease: 50 * time.Millisecond})

	started := time.Now().Add(-time.Minute)
	job := &domain.Job{
		ID:         "job-1",
		UserID:     "u1",
		AudioID:    "job-1",
		Status:     domain.JobRunning,
		EnqueuedAt: started,
		StartedAt:  &started,
	}
	if err := store.Save(context.Background(), job); err != nil {
		t.Fatalf("Save: %v", err)
	}
	if err := audio.Put(context.Background(), "job-1", []byte("clip")); err != nil {
		t.Fatalf("Put: %v", err)
	}

	state, err := q.Status(context.Background(), "u1", "job-1")
	if err != nil {
		t.Fatalf("Status: %v", err)
	}
	if state.Status != domain.JobFailed {
		t.Fatalf("status = %q, want failed", state.Status)
	}
	if audio.count() != 0 {
		t.Error("an abandoned job kept its spooled clip")
	}
}

func TestWorkerReportsGradingFailureToTheClient(t *testing.T) {
	checker := &fakeChecker{check: ErrTranscriberBusy}
	q, audio := newTestQueue(t, checker, QueueConfig{})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go q.Start(ctx)

	accepted, err := q.Submit(ctx, "u1", 1, 0, []byte("clip"), "a.m4a")
	if err != nil {
		t.Fatalf("Submit: %v", err)
	}

	var state *domain.JobState
	waitFor(t, "the job to fail", func() bool {
		state, err = q.Status(ctx, "u1", accepted.JobID)
		return err == nil && state.Status.Terminal()
	})

	if state.Status != domain.JobFailed {
		t.Fatalf("status = %q, want failed", state.Status)
	}
	if state.Error == "" {
		t.Error("failed job carries no message for the learner")
	}
	if audio.count() != 0 {
		t.Error("failed job kept its spooled clip")
	}
}

// Position is what the client turns into "3 ahead of you", so it has to count
// down as the queue drains, not stay put.
func TestPositionCountsDownAsTheQueueDrains(t *testing.T) {
	checker := &fakeChecker{block: make(chan struct{})}
	q, _ := newTestQueue(t, checker, QueueConfig{})

	var ids []string
	for i := 0; i < 3; i++ {
		accepted, err := q.Submit(context.Background(), "u1", 1, 0, []byte("clip"), "a.m4a")
		if err != nil {
			t.Fatalf("Submit %d: %v", i, err)
		}
		if accepted.Position != i {
			t.Errorf("submission %d reported position %d", i, accepted.Position)
		}
		ids = append(ids, accepted.JobID)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go q.Start(ctx)

	// The worker claims the first clip and stalls on it, leaving one ahead.
	waitFor(t, "the first clip to be claimed", func() bool {
		state, err := q.Status(ctx, "u1", ids[2])
		return err == nil && state.Position == 1
	})

	// Let that clip through; the last job moves up again.
	checker.block <- struct{}{}
	waitFor(t, "the queue to advance", func() bool {
		state, err := q.Status(ctx, "u1", ids[2])
		return err == nil && state.Position == 0
	})
	close(checker.block)
}

func TestEstimateTracksMeasuredDuration(t *testing.T) {
	store := infrastructure.NewMemoryJobStore()
	q := NewJobQueue(&fakeChecker{}, store, newFakeAudio(), QueueConfig{Workers: 2})

	// Nothing measured yet: fall back to the assumed rate, halved by 2 workers.
	if got, want := q.estimate(context.Background(), 3), 12; got != want {
		t.Errorf("cold estimate = %d, want %d", got, want)
	}

	for i := 0; i < 40; i++ {
		store.ObserveDuration(context.Background(), 2)
	}
	if got, want := q.estimate(context.Background(), 3), 4; got != want {
		t.Errorf("warm estimate = %d, want %d", got, want)
	}
}

func TestPollIntervalStaysWithinBounds(t *testing.T) {
	cases := []struct{ wait, want int }{
		{0, 800},
		{1, 800},
		{6, 2000},
		{600, 5000},
	}
	for _, tc := range cases {
		if got := pollInterval(tc.wait); got != tc.want {
			t.Errorf("pollInterval(%d) = %d, want %d", tc.wait, got, tc.want)
		}
	}
}

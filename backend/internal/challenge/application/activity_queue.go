package application

import (
	"context"
	"hash/fnv"
	"sync"
	"sync/atomic"
	"time"

	"go.uber.org/zap"

	"github.com/chawais/deenquest/backend/internal/challenge/domain"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
	progressapp "github.com/chawais/deenquest/backend/internal/progress/application"
)

// ActivityQueue moves challenge scoring off the request path.
//
// Awarding XP used to fan out inline: weekly quests were loaded and written,
// open duels scored, group challenges contributed to — ten to twenty round
// trips before the user's "lesson complete" response could be written. None of
// that is anything the user is waiting to see; the XP and the streak are.
//
// This is also the piece Kafka was nominally for. It does not need Kafka: a
// single API container with in-process channels gives the same guarantees for a
// fraction of the memory, and when durability is eventually wanted, Redis
// Streams are already running on the box.
//
// Jobs are sharded by user rather than sharing one channel. Scoring is a
// read-modify-write over that user's quests, duels and groups, so two workers
// on the same user at the same time would race and silently lose progress.
// Hashing the user id onto a fixed worker makes each user's activity strictly
// serial while different users still run in parallel.
type ActivityQueue struct {
	svc    *Service
	shards []chan activityJob

	wg      sync.WaitGroup
	started atomic.Bool

	// dropped counts jobs shed under overload. It is reported on an interval
	// rather than per drop, so a saturated queue cannot also flood the log it
	// is trying to warn through.
	dropped atomic.Uint64
}

type activityJob struct {
	userID string
	source progressapp.ActivitySource
	xp     int
}

const (
	// Each job is several MongoDB round trips, so the useful worker count is
	// bounded by what the database can absorb, not by CPU.
	activityWorkers = 4

	// Per-shard buffer. Deep enough to ride out a burst, shallow enough that a
	// permanently saturated queue sheds instead of growing until the container
	// is killed. At roughly 64 bytes a job this is well under a megabyte.
	shardBuffer = 1024

	// How long a worker gets for one job: well past the p99, short enough that
	// a stuck job cannot occupy a worker indefinitely.
	activityJobTimeout = 15 * time.Second

	dropReportInterval = time.Minute
)

func NewActivityQueue(svc *Service) *ActivityQueue {
	shards := make([]chan activityJob, activityWorkers)
	for i := range shards {
		shards[i] = make(chan activityJob, shardBuffer)
	}
	return &ActivityQueue{svc: svc, shards: shards}
}

// OnActivity implements progressapp.ActivityListener. It only enqueues, so the
// caller's request is never blocked by scoring.
func (q *ActivityQueue) OnActivity(_ context.Context, userID string, source progressapp.ActivitySource, xp int) {
	if source == progressapp.SourceChallenge || userID == "" {
		return
	}

	job := activityJob{userID: userID, source: source, xp: xp}

	select {
	case q.shards[q.shardFor(userID)] <- job:
	default:
		// Shedding here is deliberate. Under sustained overload quest and duel
		// progress degrades before anything the user is looking at — XP and
		// streaks are already committed by the time we get here — and blocking
		// would push the latency back onto the request this queue protects.
		q.dropped.Add(1)
	}
}

func (q *ActivityQueue) shardFor(userID string) int {
	h := fnv.New32a()
	_, _ = h.Write([]byte(userID))
	return int(h.Sum32() % uint32(len(q.shards)))
}

// Start launches the workers and blocks until ctx is cancelled. The context
// given here outlives any single request, which is the point: a job enqueued by
// a request must not die when that request's connection closes.
func (q *ActivityQueue) Start(ctx context.Context) {
	if !q.started.CompareAndSwap(false, true) {
		return
	}

	for i := range q.shards {
		q.wg.Add(1)
		go q.work(ctx, q.shards[i])
	}

	go q.reportDrops(ctx)

	logger.Info("challenge activity queue started",
		zap.Int("workers", len(q.shards)),
		zap.Int("buffer_per_worker", shardBuffer))

	<-ctx.Done()
}

func (q *ActivityQueue) work(ctx context.Context, jobs <-chan activityJob) {
	defer q.wg.Done()

	for {
		select {
		case <-ctx.Done():
			return
		case job := <-jobs:
			q.apply(ctx, job)
		}
	}
}

func (q *ActivityQueue) apply(ctx context.Context, job activityJob) {
	deltas := domain.DeltasFor(string(job.source), job.xp)
	if len(deltas) == 0 {
		return
	}

	jobCtx, cancel := context.WithTimeout(ctx, activityJobTimeout)
	defer cancel()

	if err := q.svc.applyDeltas(jobCtx, job.userID, deltas); err != nil {
		logger.Warn("challenge: failed to apply activity",
			zap.String("user_id", job.userID),
			zap.String("source", string(job.source)),
			zap.Error(err))
	}
}

func (q *ActivityQueue) reportDrops(ctx context.Context) {
	ticker := time.NewTicker(dropReportInterval)
	defer ticker.Stop()

	var reported uint64
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			total := q.dropped.Load()
			if total == reported {
				continue
			}
			logger.Warn("challenge activity queue shed jobs; scoring is behind",
				zap.Uint64("dropped_since_last_report", total-reported),
				zap.Uint64("dropped_total", total),
				zap.Int("queue_depth", q.depth()))
			reported = total
		}
	}
}

// Drain waits for the workers to stop after the context Start was given is
// cancelled, so shutdown does not abandon a job mid-write.
func (q *ActivityQueue) Drain(timeout time.Duration) {
	if !q.started.Load() {
		return
	}

	done := make(chan struct{})
	go func() {
		q.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(timeout):
		logger.Warn("challenge activity queue did not drain in time",
			zap.Int("queue_depth", q.depth()))
	}
}

func (q *ActivityQueue) depth() int {
	total := 0
	for _, shard := range q.shards {
		total += len(shard)
	}
	return total
}

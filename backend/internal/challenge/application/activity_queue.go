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

type ActivityQueue struct {
	svc     *Service
	shards  []chan activityJob
	wg      sync.WaitGroup
	started atomic.Bool
	dropped atomic.Uint64
}

type activityJob struct {
	userID string
	source progressapp.ActivitySource
	xp     int
}

const (
	activityWorkers    = 4
	shardBuffer        = 1024
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

func (q *ActivityQueue) OnActivity(_ context.Context, userID string, source progressapp.ActivitySource, xp int) {
	if source == progressapp.SourceChallenge || userID == "" {
		return
	}

	job := activityJob{userID: userID, source: source, xp: xp}

	select {
	case q.shards[q.shardFor(userID)] <- job:
	default:
		q.dropped.Add(1)
	}
}

func (q *ActivityQueue) shardFor(userID string) int {
	h := fnv.New32a()
	_, _ = h.Write([]byte(userID))
	return int(h.Sum32() % uint32(len(q.shards)))
}

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

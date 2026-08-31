package application

import (
	"bytes"
	"context"
	"errors"
	"io"
	"math"
	"sync"
	"sync/atomic"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/chawais/deenquest/backend/internal/platform/logger"
	"github.com/chawais/deenquest/backend/internal/recitation/domain"
)

type QueueConfig struct {
	Workers    int
	MaxDepth   int
	JobTimeout time.Duration

	Lease time.Duration
}

const (
	defaultWorkers    = 1
	defaultMaxDepth   = 120
	defaultJobTimeout = 90 * time.Second
	defaultLease      = 3 * time.Minute

	assumedSecondsPerClip = 6.0
)

func (c QueueConfig) withDefaults() QueueConfig {
	if c.Workers < 1 {
		c.Workers = defaultWorkers
	}
	if c.MaxDepth < 1 {
		c.MaxDepth = defaultMaxDepth
	}
	if c.JobTimeout <= 0 {
		c.JobTimeout = defaultJobTimeout
	}
	if c.Lease <= 0 {
		c.Lease = defaultLease
	}
	return c
}

type Checker interface {
	ResolveLesson(ctx context.Context, levelID, lessonIndex int) (string, int, error)
	CheckRecitation(ctx context.Context, userID string, levelID, lessonIndex int,
		audio io.Reader, filename string) (*domain.RecitationCheckResult, error)
}

type JobQueue struct {
	svc   Checker
	jobs  domain.JobStore
	audio domain.AudioStore
	cfg   QueueConfig

	wg      sync.WaitGroup
	started atomic.Bool
	refused atomic.Uint64
}

func NewJobQueue(svc Checker, jobs domain.JobStore, audio domain.AudioStore, cfg QueueConfig) *JobQueue {
	return &JobQueue{svc: svc, jobs: jobs, audio: audio, cfg: cfg.withDefaults()}
}

func (q *JobQueue) Submit(
	ctx context.Context,
	userID string,
	levelID, lessonIndex int,
	audio []byte,
	filename string,
) (*domain.JobAccepted, error) {
	if len(audio) == 0 {
		return nil, errors.New("audio file is empty")
	}
	if _, _, err := q.svc.ResolveLesson(ctx, levelID, lessonIndex); err != nil {
		return nil, err
	}

	depth, err := q.jobs.Depth(ctx)
	if err != nil {
		return nil, err
	}
	if depth >= q.cfg.MaxDepth {
		q.refused.Add(1)
		return nil, domain.ErrQueueFull
	}

	job := &domain.Job{
		ID:          uuid.New().String(),
		UserID:      userID,
		LevelID:     levelID,
		LessonIndex: lessonIndex,
		Filename:    filename,
		Status:      domain.JobQueued,
		EnqueuedAt:  time.Now(),
	}
	job.AudioID = job.ID

	if err := q.audio.Put(ctx, job.AudioID, audio); err != nil {
		return nil, err
	}

	position, err := q.jobs.Enqueue(ctx, job, q.cfg.MaxDepth)
	if err != nil {
		_ = q.audio.Delete(ctx, job.AudioID)
		if errors.Is(err, domain.ErrQueueFull) {
			q.refused.Add(1)
		}
		return nil, err
	}

	wait := q.estimate(ctx, position)
	return &domain.JobAccepted{
		JobID:         job.ID,
		Status:        domain.JobQueued,
		Position:      position,
		EstimatedWait: wait,
		PollAfterMS:   pollInterval(wait),
	}, nil
}

func (q *JobQueue) Status(ctx context.Context, userID, jobID string) (*domain.JobState, error) {
	job, err := q.jobs.Get(ctx, jobID)
	if err != nil {
		return nil, err
	}

	if job.UserID != userID {
		return nil, domain.ErrJobNotFound
	}

	position := -1
	if job.Status == domain.JobQueued {
		if p, err := q.jobs.Position(ctx, job.ID); err == nil {
			position = p
		}
	}

	if !job.Status.Terminal() && q.abandoned(job, position) {
		job.Status = domain.JobFailed
		job.Error = "transcription did not finish — please record again"
		now := time.Now()
		job.FinishedAt = &now
		if err := q.jobs.Save(ctx, job); err != nil {
			logger.Warn("recitation: failed to mark abandoned job", zap.Error(err))
		}
		if err := q.audio.Delete(ctx, job.AudioID); err != nil {
			logger.Warn("recitation: failed to drop an abandoned job's audio", zap.Error(err))
		}
	}

	state := &domain.JobState{
		JobID:  job.ID,
		Status: job.Status,
		Result: job.Result,
		Error:  job.Error,
	}
	if job.Status.Terminal() {
		return state, nil
	}

	if position < 0 {
		position = 0
	}
	state.Position = position
	state.EstimatedWait = q.estimate(ctx, position)
	state.PollAfterMS = pollInterval(state.EstimatedWait)
	return state, nil
}

func (q *JobQueue) abandoned(job *domain.Job, position int) bool {
	now := time.Now()
	if job.Stale(q.cfg.Lease, now) {
		return true
	}
	if job.Status != domain.JobQueued {
		return false
	}
	return position < 0 && now.Sub(job.EnqueuedAt) > q.cfg.Lease
}

func (q *JobQueue) estimate(ctx context.Context, position int) int {
	secondsPerClip := q.jobs.AverageDuration(ctx)
	if secondsPerClip <= 0 {
		secondsPerClip = assumedSecondsPerClip
	}
	ahead := float64(position + 1)
	return int(math.Ceil(ahead * secondsPerClip / float64(q.cfg.Workers)))
}

func pollInterval(estimatedWait int) int {
	ms := estimatedWait * 1000 / 3
	if ms < 800 {
		ms = 800
	}
	if ms > 5000 {
		ms = 5000
	}
	return ms
}

func (q *JobQueue) Start(ctx context.Context) {
	if !q.started.CompareAndSwap(false, true) {
		return
	}

	for i := 0; i < q.cfg.Workers; i++ {
		q.wg.Add(1)
		go q.work(ctx)
	}

	logger.Info("recitation job queue started",
		zap.Int("workers", q.cfg.Workers),
		zap.Int("max_depth", q.cfg.MaxDepth))

	<-ctx.Done()
}

func (q *JobQueue) work(ctx context.Context) {
	defer q.wg.Done()

	for {
		if ctx.Err() != nil {
			return
		}

		job, err := q.jobs.Claim(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			logger.Warn("recitation: claim failed", zap.Error(err))
			// A broken store would otherwise spin this loop at full speed.
			select {
			case <-ctx.Done():
				return
			case <-time.After(time.Second):
			}
			continue
		}
		if job == nil {
			continue
		}
		q.run(ctx, job)
	}
}

func (q *JobQueue) run(ctx context.Context, job *domain.Job) {
	started := time.Now()
	job.Status = domain.JobRunning
	job.StartedAt = &started
	if err := q.jobs.Save(ctx, job); err != nil {
		logger.Warn("recitation: failed to mark job running", zap.Error(err))
	}

	jobCtx, cancel := context.WithTimeout(ctx, q.cfg.JobTimeout)
	defer cancel()

	audio, err := q.audio.Get(jobCtx, job.AudioID)
	if err != nil {
		q.fail(ctx, job, "the recording expired before it could be checked", err)
		return
	}

	result, err := q.svc.CheckRecitation(jobCtx, job.UserID, job.LevelID, job.LessonIndex,
		bytes.NewReader(audio), job.Filename)

	if delErr := q.audio.Delete(context.WithoutCancel(ctx), job.AudioID); delErr != nil {
		logger.Warn("recitation: failed to drop spooled audio",
			zap.String("job_id", job.ID), zap.Error(delErr))
	}

	if err != nil {
		q.fail(ctx, job, userFacingError(err), err)
		return
	}

	finished := time.Now()
	job.Status = domain.JobDone
	job.Result = result
	job.FinishedAt = &finished
	if err := q.jobs.Save(ctx, job); err != nil {
		logger.Error("recitation: graded a clip but could not store the result",
			zap.String("job_id", job.ID), zap.Error(err))
	}

	elapsed := finished.Sub(started)
	q.jobs.ObserveDuration(ctx, elapsed.Seconds())

	logger.Info("recitation job completed",
		zap.String("job_id", job.ID),
		zap.String("user_id", job.UserID),
		zap.Int("score", result.Score),
		zap.Duration("took", elapsed))
}

func (q *JobQueue) fail(ctx context.Context, job *domain.Job, message string, cause error) {
	finished := time.Now()
	job.Status = domain.JobFailed
	job.Error = message
	job.FinishedAt = &finished

	if err := q.jobs.Save(ctx, job); err != nil {
		logger.Warn("recitation: failed to record job failure", zap.Error(err))
	}
	logger.Error("recitation job failed",
		zap.String("job_id", job.ID),
		zap.String("user_id", job.UserID),
		zap.Error(cause))
}

func userFacingError(err error) string {
	switch {
	case errors.Is(err, ErrTranscriberBusy):
		return "the transcriber was busy — please try again in a moment"
	case errors.Is(err, context.DeadlineExceeded):
		return "checking your recitation took too long — please try again"
	default:
		return "we could not check this recitation — please record it again"
	}
}

func (q *JobQueue) Drain(timeout time.Duration) {
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
		logger.Warn("recitation queue workers did not stop in time")
	}
}

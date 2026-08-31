package infrastructure

import (
	"context"
	"sync"
	"time"

	"github.com/chawais/deenquest/backend/internal/recitation/domain"
)

const memoryQueueCap = 4096

// MemoryJobStore is the store used when Redis is not available. The rest of
// the app already degrades that way (caching and rate limiting simply switch
// off), and recitation should not be the one feature that stops working on a
// laptop. Jobs are lost on restart, which is the honest trade for a queue that
// exists only in this process.
type MemoryJobStore struct {
	mu      sync.Mutex
	jobs    map[string]*domain.Job
	order   []string
	avgSecs float64

	pending chan string
}

func NewMemoryJobStore() *MemoryJobStore {
	return &MemoryJobStore{
		jobs:    make(map[string]*domain.Job),
		pending: make(chan string, memoryQueueCap),
	}
}

func (s *MemoryJobStore) Enqueue(_ context.Context, job *domain.Job, maxDepth int) (int, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if maxDepth > 0 && len(s.order) >= maxDepth {
		return 0, domain.ErrQueueFull
	}
	if len(s.order) >= memoryQueueCap {
		return 0, domain.ErrQueueFull
	}

	clone := *job
	s.jobs[job.ID] = &clone
	s.order = append(s.order, job.ID)
	s.pending <- job.ID

	return len(s.order) - 1, nil
}

func (s *MemoryJobStore) Claim(ctx context.Context) (*domain.Job, error) {
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case id := <-s.pending:
		s.mu.Lock()
		s.dropFromOrderLocked(id)
		job, ok := s.jobs[id]
		s.mu.Unlock()
		if !ok {
			return nil, nil
		}
		clone := *job
		return &clone, nil
	case <-time.After(claimBlock):
		return nil, nil
	}
}

func (s *MemoryJobStore) dropFromOrderLocked(id string) {
	for i, queued := range s.order {
		if queued == id {
			s.order = append(s.order[:i], s.order[i+1:]...)
			return
		}
	}
}

func (s *MemoryJobStore) Get(_ context.Context, id string) (*domain.Job, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	job, ok := s.jobs[id]
	if !ok {
		return nil, domain.ErrJobNotFound
	}
	clone := *job
	return &clone, nil
}

func (s *MemoryJobStore) Save(_ context.Context, job *domain.Job) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	clone := *job
	s.jobs[job.ID] = &clone
	return nil
}

func (s *MemoryJobStore) Position(_ context.Context, id string) (int, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i, queued := range s.order {
		if queued == id {
			return i, nil
		}
	}
	return -1, nil
}

func (s *MemoryJobStore) Depth(_ context.Context) (int, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	return len(s.order), nil
}

func (s *MemoryJobStore) ObserveDuration(_ context.Context, seconds float64) {
	const alpha = 0.2

	s.mu.Lock()
	defer s.mu.Unlock()
	if s.avgSecs <= 0 {
		s.avgSecs = seconds
		return
	}
	s.avgSecs = alpha*seconds + (1-alpha)*s.avgSecs
}

func (s *MemoryJobStore) AverageDuration(_ context.Context) float64 {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.avgSecs
}

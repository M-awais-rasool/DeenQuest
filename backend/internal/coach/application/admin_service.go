package application

import (
	"context"
	"sync"
	"time"

	"github.com/chawais/deenquest/backend/internal/coach/domain"
)

type AdminService struct {
	repo AdminRepository

	mu       sync.Mutex
	cached   *snapshot
	cachedAt time.Time
	ttl      time.Duration
}

type snapshot struct {
	stats      AgentStats
	curriculum Curriculum
}

func NewAdminService(repo AdminRepository) *AdminService {
	return &AdminService{repo: repo, ttl: adminCacheTTL}
}

func (s *AdminService) Stats(ctx context.Context) (*AgentStats, error) {
	snap, err := s.load(ctx)
	if err != nil {
		return nil, err
	}
	stats := snap.stats
	return &stats, nil
}

func (s *AdminService) Curriculum(ctx context.Context) (*Curriculum, error) {
	snap, err := s.load(ctx)
	if err != nil {
		return nil, err
	}
	cur := snap.curriculum
	return &cur, nil
}

func (s *AdminService) load(ctx context.Context) (*snapshot, error) {
	s.mu.Lock()
	if s.cached != nil && time.Since(s.cachedAt) < s.ttl {
		cached := s.cached
		s.mu.Unlock()
		return cached, nil
	}
	s.mu.Unlock()

	ctx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	now := time.Now().UTC()

	// One pass over every learner covers segments, both gauges and the
	// per-skill totals.
	fold := newStatsFold()
	if err := s.repo.EachSkillState(ctx, func(state *domain.UserSkillState) error {
		fold.add(state, now)
		return nil
	}); err != nil {
		return nil, err
	}

	activeInsights, dueRevisions, err := s.repo.CountActiveInsights(ctx, now)
	if err != nil {
		return nil, err
	}

	totalEvents, err := s.repo.CountEvents(ctx)
	if err != nil {
		return nil, err
	}

	missed, err := s.repo.MostMissedLessons(ctx, adminTopN)
	if err != nil {
		return nil, err
	}

	snap := &snapshot{
		stats: AgentStats{
			TotalLearners:         fold.learners,
			Segments:              fold.segments,
			ActiveRecommendations: activeInsights,
			DueRevisions:          dueRevisions,
			AvgEngagement:         fold.avgEngagement(),
			AvgDropoutRisk:        fold.avgDropoutRisk(),
			TotalEvents:           totalEvents,
		},
		curriculum: Curriculum{
			TopWeakSkills:    fold.weakestSkills(adminTopN),
			TopMissedLessons: missed,
		},
	}

	s.mu.Lock()
	s.cached, s.cachedAt = snap, time.Now()
	s.mu.Unlock()

	return snap, nil
}

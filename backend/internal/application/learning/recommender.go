package learning

import (
	"context"
	"time"

	domain "github.com/chawais/talent-flow/backend/internal/domain/learning"
	"github.com/chawais/talent-flow/backend/internal/domain/progress"
)

// RecommenderService is the deterministic Recommender reactor. It reads the
// LearnerState + the user's level landscape, runs the pure Recommend engine, and
// persists the resulting active recommendation set.
type RecommenderService struct {
	learningRepo domain.Repository
	progressRepo progress.CoreRepository
}

func NewRecommenderService(learningRepo domain.Repository, progressRepo progress.CoreRepository) *RecommenderService {
	return &RecommenderService{learningRepo: learningRepo, progressRepo: progressRepo}
}

// State is a passthrough read used by the HTTP read API.
func (s *RecommenderService) State(ctx context.Context, userID string) (*domain.LearnerState, error) {
	return s.learningRepo.GetState(ctx, userID)
}

// Stats returns the admin monitoring read-model.
func (s *RecommenderService) Stats(ctx context.Context) (*domain.AgentStats, error) {
	return s.learningRepo.Stats(ctx, time.Now().UTC())
}

// Review returns just the due-revision recommendations — the "Daily Review" set.
// Reuses Get (read-mostly: recomputes only when state changed) and filters.
func (s *RecommenderService) Review(ctx context.Context, userID string) ([]domain.Recommendation, error) {
	recs, err := s.Get(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]domain.Recommendation, 0, len(recs))
	for _, r := range recs {
		if r.Kind == domain.RecRevision {
			out = append(out, r)
		}
	}
	return out, nil
}

// Get is the read-mostly path used by the HTTP API. It serves the user's cached
// active recommendations and only recomputes (a write) when they are stale —
// i.e. the learner's state changed after the recommendations were generated, or
// there are none yet. This keeps GETs read-only in the common case (no write
// amplification on every poll), which is the key latency/cost win.
func (s *RecommenderService) Get(ctx context.Context, userID string) ([]domain.Recommendation, error) {
	state, err := s.learningRepo.GetState(ctx, userID)
	if err != nil {
		return nil, err
	}
	if state == nil {
		return []domain.Recommendation{}, nil
	}

	recs, err := s.learningRepo.ListActiveRecommendations(ctx, userID)
	if err != nil {
		return nil, err
	}
	// Fresh if recommendations were generated at/after the last state change.
	if len(recs) > 0 && !recs[0].CreatedAt.Before(state.UpdatedAt) {
		return recs, nil
	}
	return s.refreshFrom(ctx, state)
}

// Refresh forces a recompute + persist from the user's current state.
func (s *RecommenderService) Refresh(ctx context.Context, userID string) ([]domain.Recommendation, error) {
	state, err := s.learningRepo.GetState(ctx, userID)
	if err != nil {
		return nil, err
	}
	if state == nil {
		return []domain.Recommendation{}, nil
	}
	return s.refreshFrom(ctx, state)
}

// refreshFrom recomputes recommendations from an already-loaded state (no extra
// state read) and persists them. Used by Get (on staleness), Refresh, and the
// sweep — the sweep passes the state it already holds, avoiding a re-read.
func (s *RecommenderService) refreshFrom(ctx context.Context, state *domain.LearnerState) ([]domain.Recommendation, error) {
	courseType := progress.CourseType(state.CourseType)
	if courseType == "" {
		courseType = progress.CourseQaida
	}
	levels, err := s.buildLevelInfos(ctx, state.UserID, courseType)
	if err != nil {
		return nil, err
	}

	recs := Recommend(state, levels, time.Now().UTC())
	if err := s.learningRepo.ReplaceActiveRecommendations(ctx, state.UserID, recs); err != nil {
		return nil, err
	}
	if recs == nil {
		recs = []domain.Recommendation{}
	}
	return recs, nil
}

// RefreshFrom recomputes from an already-loaded state (exported for the sweep).
func (s *RecommenderService) RefreshFrom(ctx context.Context, state *domain.LearnerState) ([]domain.Recommendation, error) {
	return s.refreshFrom(ctx, state)
}

// buildLevelInfos joins the course's levels with the user's per-level progress
// to compute completed/unlocked flags (mirrors CoreService.GetLevels logic).
func (s *RecommenderService) buildLevelInfos(ctx context.Context, userID string, courseType progress.CourseType) ([]LevelInfo, error) {
	levels, err := s.progressRepo.ListLevelsByCourse(ctx, courseType)
	if err != nil {
		return nil, err
	}
	ids := make([]int, 0, len(levels))
	for _, l := range levels {
		ids = append(ids, l.ID)
	}
	userLevels, err := s.progressRepo.GetUserLevelsByLevelIDs(ctx, userID, ids)
	if err != nil {
		return nil, err
	}
	ulMap := make(map[int]progress.UserLevel, len(userLevels))
	highestCompleted := 0
	for _, ul := range userLevels {
		ulMap[ul.LevelID] = ul
	}
	for _, l := range levels {
		if ul, ok := ulMap[l.ID]; ok && ul.Completed && l.CourseLevel > highestCompleted {
			highestCompleted = l.CourseLevel
		}
	}

	out := make([]LevelInfo, 0, len(levels))
	for _, l := range levels {
		ul, hasProgress := ulMap[l.ID]
		completed := hasProgress && ul.Completed
		unlocked := completed || hasProgress || l.CourseLevel <= highestCompleted+1
		out = append(out, LevelInfo{
			ID:          l.ID,
			CourseLevel: l.CourseLevel,
			Title:       l.Title,
			Difficulty:  string(l.Difficulty),
			SkillTags:   levelTags(l),
			Completed:   completed,
			Unlocked:    unlocked,
		})
	}
	return out, nil
}

// levelTags aggregates de-duplicated skill tags across a level's lessons + mini-game.
func levelTags(l progress.Level) []string {
	seen := make(map[string]struct{})
	var tags []string
	add := func(ts []string) {
		for _, t := range ts {
			if t == "" {
				continue
			}
			if _, ok := seen[t]; ok {
				continue
			}
			seen[t] = struct{}{}
			tags = append(tags, t)
		}
	}
	for i := range l.Lessons {
		add(l.Lessons[i].SkillTags)
	}
	add(l.MiniGame.SkillTags)
	return tags
}

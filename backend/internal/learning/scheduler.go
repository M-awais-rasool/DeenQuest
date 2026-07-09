package learning

import (
	"context"
	"math"
	"time"

	"github.com/robfig/cron/v3"
	"go.uber.org/zap"

	"github.com/chawais/deenquest/backend/internal/learning/model"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
)

// Scheduler runs the periodic "pattern sweep": it re-evaluates every learner's
// segment + dropout risk against the current clock (so idle users flip to
// inactive over time) and refreshes their recommendations. This is what makes
// the agent react to behavior *patterns* (revision-due, rising dropout risk,
// improving streaks) rather than to individual actions. Mirrors the existing
// intelligent/scheduler.go cron design.
type Scheduler struct {
	cron        *cron.Cron
	repo        model.Repository
	recommender *RecommenderService
	notifier    Notifier
	spec        string
}

// Notifier is the optional indirect-notification hook. When wired, the sweep
// calls it for learners who slip into the inactive segment. Kept loosely coupled
// so the existing notification engine (or any other reactor) can implement it.
type Notifier interface {
	NotifyReengage(ctx context.Context, userID string)
}

// NewScheduler builds the sweep. Default cadence is every 15 minutes.
func NewScheduler(repo model.Repository, recommender *RecommenderService) *Scheduler {
	return &Scheduler{
		cron:        cron.New(),
		repo:        repo,
		recommender: recommender,
		spec:        "*/15 * * * *",
	}
}

// SetNotifier wires the optional indirect-notification hook.
func (s *Scheduler) SetNotifier(n Notifier) { s.notifier = n }

// SetSpec overrides the cron spec (e.g. "*/1 * * * *" for testing).
func (s *Scheduler) SetSpec(spec string) { s.spec = spec }

func (s *Scheduler) Start(ctx context.Context) error {
	if _, err := s.cron.AddFunc(s.spec, func() {
		runCtx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()
		logger.Info("learning pattern sweep triggered")
		s.sweep(runCtx)
	}); err != nil {
		return err
	}
	s.cron.Start()
	logger.Info("learning pattern sweep scheduler started", zap.String("spec", s.spec))

	<-ctx.Done()
	s.cron.Stop()
	logger.Info("learning pattern sweep scheduler stopped")
	return nil
}

func (s *Scheduler) sweep(ctx context.Context) {
	const pageSize = 500
	now := time.Now().UTC()
	inactiveBefore := now.Add(-time.Duration(inactiveDays) * 24 * time.Hour)
	offset, processed, reengaged, refreshed := 0, 0, 0, 0

	for {
		// Only learners who need attention: idle-not-yet-inactive, or with a
		// revision now due. O(candidates), not O(all users).
		states, err := s.repo.ListSweepCandidates(ctx, inactiveBefore, now, pageSize, offset)
		if err != nil {
			logger.Error("learning sweep: list candidates failed", zap.Error(err))
			return
		}
		if len(states) == 0 {
			break
		}
		for i := range states {
			st := &states[i]
			prevSeg := st.Segment
			prevRisk := st.DropoutRisk
			hadDue := !st.NextDueAt.IsZero() && !st.NextDueAt.After(now)

			// Re-derive segment + risk against the current clock.
			recompute(st, now)

			stateChanged := st.Segment != prevSeg || math.Abs(st.DropoutRisk-prevRisk) > 0.01
			if stateChanged {
				st.UpdatedAt = now
				if err := s.repo.UpsertState(ctx, st); err != nil {
					logger.Warn("learning sweep: upsert state failed", zap.String("user_id", st.UserID), zap.Error(err))
				}
			}

			// Indirect notification: a learner who just slipped to inactive.
			if st.Segment == model.SegmentInactive && prevSeg != model.SegmentInactive && s.notifier != nil {
				s.notifier.NotifyReengage(ctx, st.UserID)
				reengaged++
			}

			// Only rewrite recommendations when the segment changed or a revision
			// is actually due — avoids touching every candidate every tick.
			if stateChanged || hadDue {
				if _, err := s.recommender.RefreshFrom(ctx, st); err != nil {
					logger.Warn("learning sweep: refresh recommendations failed", zap.String("user_id", st.UserID), zap.Error(err))
				} else {
					refreshed++
				}
			}
			processed++
		}
		if len(states) < pageSize {
			break
		}
		offset += pageSize
	}

	logger.Info("learning pattern sweep completed",
		zap.Int("candidates", processed),
		zap.Int("recs_refreshed", refreshed),
		zap.Int("reengage_triggered", reengaged),
	)
}

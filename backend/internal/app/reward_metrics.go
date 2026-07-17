package app

import (
	"context"

	"golang.org/x/sync/errgroup"

	"github.com/chawais/deenquest/backend/internal/level"
	"github.com/chawais/deenquest/backend/internal/progress"
	"github.com/chawais/deenquest/backend/internal/reward"
)

type rewardMetrics struct {
	level    *level.Service
	progress *progress.Service
}

func (m rewardMetrics) Metrics(ctx context.Context, userID string) (reward.Metrics, error) {
	var (
		completed int
		pub       *progress.PublicProgressResponse
	)
	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() (err error) { completed, err = m.level.CompletedLevelCount(gctx, userID); return })
	g.Go(func() (err error) { pub, err = m.progress.GetPublicProgress(gctx, userID); return })
	if err := g.Wait(); err != nil {
		return reward.Metrics{}, err
	}
	return reward.Metrics{
		CompletedLevels: completed,
		XP:              pub.XP,
		StreakDays:      pub.CurrentStreak,
	}, nil
}

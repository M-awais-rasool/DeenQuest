package app

import (
	"context"

	"golang.org/x/sync/errgroup"

	levelapp "github.com/chawais/deenquest/backend/internal/level/application"
	progressapp "github.com/chawais/deenquest/backend/internal/progress/application"
	rewardapp "github.com/chawais/deenquest/backend/internal/reward/application"
)

type rewardMetrics struct {
	level    *levelapp.Service
	progress *progressapp.Service
}

func (m rewardMetrics) Metrics(ctx context.Context, userID string) (rewardapp.Metrics, error) {
	var (
		completed int
		pub       *progressapp.PublicProgressResponse
	)
	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() (err error) { completed, err = m.level.CompletedLevelCount(gctx, userID); return })
	g.Go(func() (err error) { pub, err = m.progress.GetPublicProgress(gctx, userID); return })
	if err := g.Wait(); err != nil {
		return rewardapp.Metrics{}, err
	}
	return rewardapp.Metrics{
		CompletedLevels: completed,
		XP:              pub.XP,
		StreakDays:      pub.CurrentStreak,
	}, nil
}

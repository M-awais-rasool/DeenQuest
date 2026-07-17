package reward

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"golang.org/x/sync/errgroup"
)

type Metrics struct {
	CompletedLevels int
	XP              int
	StreakDays      int
}

type MetricsProvider interface {
	Metrics(ctx context.Context, userID string) (Metrics, error)
}

type Service struct {
	repo    Repository
	metrics MetricsProvider
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) SetMetricsProvider(mp MetricsProvider) { s.metrics = mp }

func (s *Service) Seed(ctx context.Context) error {
	return s.repo.SeedRewards(ctx, SeedRewards())
}

func (s *Service) GetRewards(ctx context.Context, userID string) ([]RewardWithStatus, error) {
	var (
		allRewards  []Reward
		userRewards []UserReward
	)
	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() (err error) { allRewards, err = s.repo.ListAllRewards(gctx); return })
	g.Go(func() (err error) { userRewards, err = s.repo.GetUserRewards(gctx, userID); return })
	if err := g.Wait(); err != nil {
		return nil, fmt.Errorf("load rewards data: %w", err)
	}

	m := Metrics{}
	if s.metrics != nil {
		resolved, err := s.metrics.Metrics(ctx, userID)
		if err != nil {
			return nil, fmt.Errorf("resolve reward metrics: %w", err)
		}
		m = resolved
	}

	grantedMap := make(map[string]UserReward, len(userRewards))
	for _, ur := range userRewards {
		grantedMap[ur.RewardID] = ur
	}

	result := make([]RewardWithStatus, 0, len(allRewards))
	for _, rw := range allRewards {
		rws := RewardWithStatus{Reward: rw}
		current := metricValue(rw.Trigger, m)
		rws.Current = current
		rws.Progress = progressRatio(current, rw.Required)
		if ur, ok := grantedMap[rw.ID]; ok {
			rws.Unlocked = true
			t := ur.UnlockedAt
			rws.UnlockedAt = &t
		}
		result = append(result, rws)
	}
	return result, nil
}

// Grant evaluates every not-yet-granted reward against the supplied metrics and
// grants the ones whose threshold is met. Metric-driven so the reward package
// stays ignorant of level/progress internals.
func (s *Service) Grant(ctx context.Context, userID string, m Metrics) ([]Reward, error) {
	var (
		allRewards  []Reward
		userRewards []UserReward
	)
	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() (err error) { allRewards, err = s.repo.ListAllRewards(gctx); return })
	g.Go(func() (err error) { userRewards, err = s.repo.GetUserRewards(gctx, userID); return })
	if err := g.Wait(); err != nil {
		return nil, fmt.Errorf("load reward-eligibility data: %w", err)
	}
	if len(allRewards) == 0 {
		return nil, nil
	}

	granted := make(map[string]struct{}, len(userRewards))
	for _, ur := range userRewards {
		granted[ur.RewardID] = struct{}{}
	}

	var newlyGranted []Reward
	for _, rw := range allRewards {
		if _, already := granted[rw.ID]; already {
			continue
		}
		if metricValue(rw.Trigger, m) >= rw.Required {
			ur := &UserReward{
				ID:         uuid.NewString(),
				UserID:     userID,
				RewardID:   rw.ID,
				UnlockedAt: time.Now().UTC(),
			}
			if err := s.repo.GrantUserReward(ctx, ur); err != nil {
				return nil, fmt.Errorf("grant reward %s: %w", rw.ID, err)
			}
			newlyGranted = append(newlyGranted, rw)
		}
	}
	return newlyGranted, nil
}

// metricValue resolves the correct user metric for a given reward trigger.
func metricValue(trigger RewardTrigger, m Metrics) int {
	switch trigger {
	case TriggerLevelsCompleted:
		return m.CompletedLevels
	case TriggerXP:
		return m.XP
	case TriggerStreakDays:
		return m.StreakDays
	default:
		return 0
	}
}

// progressRatio returns a 0.0–1.0 ratio clamped to 1.
func progressRatio(current, required int) float64 {
	if required <= 0 {
		return 1.0
	}
	ratio := float64(current) / float64(required)
	if ratio > 1.0 {
		return 1.0
	}
	return ratio
}

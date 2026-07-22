package application

import (
	"context"
	"time"

	"github.com/chawais/deenquest/backend/internal/progress/domain"

	"github.com/google/uuid"
	"golang.org/x/sync/errgroup"
)

type Service struct {
	repo domain.Repository
}

func NewService(repo domain.Repository) *Service {
	return &Service{repo: repo}
}

// GetUserProgress returns XP, streak, and the last 7 days completion status.
func (s *Service) GetUserProgress(ctx context.Context, userID string) (*ProgressResponse, error) {
	now := time.Now().UTC()
	dates := make([]string, 7)
	for i := 0; i < 7; i++ {
		dates[i] = now.AddDate(0, 0, -(6 - i)).Format("2006-01-02")
	}

	var (
		prog           *domain.Progress
		streak         *domain.Streak
		completedDates map[string]bool
	)
	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() (err error) { prog, err = s.repo.GetProgress(gctx, userID); return })
	g.Go(func() (err error) { streak, err = s.repo.GetStreak(gctx, userID); return })
	g.Go(func() (err error) { completedDates, err = s.repo.GetCompletedDates(gctx, userID, dates); return })
	if err := g.Wait(); err != nil {
		return nil, err
	}

	if prog == nil {
		prog = &domain.Progress{Level: 1}
	}
	if streak == nil {
		streak = &domain.Streak{}
	}

	weekly := make([]bool, 7)
	for i, d := range dates {
		weekly[i] = completedDates[d]
	}

	lastCompleted := ""
	if !streak.LastCompletedAt.IsZero() {
		lastCompleted = streak.LastCompletedAt.UTC().Format(time.RFC3339)
	}

	return &ProgressResponse{
		XP:                prog.TotalXP,
		Level:             prog.Level,
		BarakahScore:      prog.BarakahScore,
		CurrentStreak:     streak.CurrentStreak,
		LongestStreak:     streak.LongestStreak,
		Freezes:           streak.Freezes,
		WeeklyCompletions: weekly,
		LastCompletedAt:   lastCompleted,
	}, nil
}

// GetPublicProgress returns the subset of progress data that is safe to show publicly.
func (s *Service) GetPublicProgress(ctx context.Context, userID string) (*PublicProgressResponse, error) {
	var (
		prog   *domain.Progress
		streak *domain.Streak
	)
	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() (err error) { prog, err = s.repo.GetProgress(gctx, userID); return })
	g.Go(func() (err error) { streak, err = s.repo.GetStreak(gctx, userID); return })
	if err := g.Wait(); err != nil {
		return nil, err
	}

	if prog == nil {
		prog = &domain.Progress{Level: 1}
	}
	currentStreak := 0
	if streak != nil {
		currentStreak = streak.CurrentStreak
	}

	return &PublicProgressResponse{
		XP:            prog.TotalXP,
		Level:         prog.Level,
		BarakahScore:  prog.BarakahScore,
		CurrentStreak: currentStreak,
	}, nil
}

func (s *Service) GetLeaderboard(ctx context.Context, limit int) ([]LeaderboardEntry, error) {
	rows, err := s.repo.ListLeaderboardProgress(ctx, limit)
	if err != nil {
		return nil, err
	}

	result := make([]LeaderboardEntry, 0, len(rows))
	for i, row := range rows {
		level := row.Level
		if level < 1 {
			level = 1
		}
		result = append(result, LeaderboardEntry{
			Rank:   i + 1,
			UserID: row.UserID,
			Level:  level,
			XP:     row.TotalXP,
		})
	}

	return result, nil
}

func (s *Service) Award(ctx context.Context, userID string, xpDelta, barakahDelta int) (*domain.Progress, error) {
	return s.repo.IncrementProgress(ctx, userID, xpDelta, barakahDelta)
}

// domain.Streak-freeze tuning.
const (
	maxStreakFreezes = 2 // never hoard more than this
	freezeEarnEvery  = 7 // earn one freeze each N-day milestone
)

func dayStartUTC(t time.Time) time.Time {
	t = t.UTC()
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC)
}

func advanceStreak(prev domain.Streak, now time.Time) domain.Streak {
	s := prev
	if s.LastCompletedAt.IsZero() {
		s.CurrentStreak = 1
		if s.LongestStreak < 1 {
			s.LongestStreak = 1
		}
		s.LastCompletedAt = now
		s.UpdatedAt = now
		return s
	}

	days := int(dayStartUTC(now).Sub(dayStartUTC(s.LastCompletedAt)).Hours() / 24)
	switch {
	case days <= 0:
		// Same day (or clock skew) — no count change, no freeze earned.
		s.LastCompletedAt = now
		s.UpdatedAt = now
		return s
	case days == 1:
		s.CurrentStreak++
	default: // missed (days-1) full days
		gap := days - 1
		if s.Freezes >= gap {
			s.Freezes -= gap // a freeze covers the missed day(s)
			s.CurrentStreak++
		} else {
			s.CurrentStreak = 1
		}
	}

	// Earn a freeze on each new milestone (capped).
	if s.CurrentStreak%freezeEarnEvery == 0 && s.Freezes < maxStreakFreezes {
		s.Freezes++
	}
	if s.CurrentStreak > s.LongestStreak {
		s.LongestStreak = s.CurrentStreak
	}
	s.LastCompletedAt = now
	s.UpdatedAt = now
	return s
}

// BumpStreak advances the user's daily streak and returns the updated streak.
func (s *Service) BumpStreak(ctx context.Context, userID string) (*domain.Streak, error) {
	cur, err := s.repo.GetStreak(ctx, userID)
	if err != nil {
		return nil, err
	}
	prev := domain.Streak{ID: uuid.NewString(), UserID: userID}
	if cur != nil {
		prev = *cur
	}

	next := advanceStreak(prev, time.Now().UTC())
	if next.ID == "" {
		next.ID = uuid.NewString()
	}
	next.UserID = userID

	if err := s.repo.UpsertStreak(ctx, &next); err != nil {
		return nil, err
	}
	return &next, nil
}

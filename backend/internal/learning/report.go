package learning

import (
	"context"
	"fmt"
	"time"

	"golang.org/x/sync/errgroup"

	"github.com/chawais/deenquest/backend/internal/learning/model"
	"github.com/chawais/deenquest/backend/internal/progress"
)

// ReportService is the Parent/Teacher Agent: it rolls a learner's week into a
// single friendly report (deterministic headline + optional AI narrative). Reads
// only — combines learner_states + progress + streak.
type ReportService struct {
	learningRepo model.Repository
	progressRepo progress.CoreRepository
	coach        Generator // optional
}

func NewReportService(l model.Repository, p progress.CoreRepository) *ReportService {
	return &ReportService{learningRepo: l, progressRepo: p}
}

// SetCoach wires the optional AI narrative (Gemini).
func (s *ReportService) SetCoach(g Generator) { s.coach = g }

const reportSystemPrompt = "You are summarizing a child's week of Qur'an learning for their parent or teacher. " +
	"Write TWO short, warm, encouraging sentences (max 40 words). Be specific but positive. " +
	"No religious rulings. Plain text, no quotes."

// Weekly builds the report for a user over the last 7 days.
func (s *ReportService) Weekly(ctx context.Context, userID string) (*model.WeeklyReport, error) {
	now := time.Now().UTC()
	dates := make([]string, 7)
	for i := 0; i < 7; i++ {
		dates[i] = now.AddDate(0, 0, -(6 - i)).Format("2006-01-02")
	}

	var (
		state      *model.LearnerState
		prog       *progress.Progress
		streak     *progress.Streak
		completed  map[string]bool
		userLevels []progress.UserLevel
	)
	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() (err error) { state, err = s.learningRepo.GetState(gctx, userID); return })
	g.Go(func() (err error) { prog, err = s.progressRepo.GetProgress(gctx, userID); return })
	g.Go(func() (err error) { streak, err = s.progressRepo.GetStreak(gctx, userID); return })
	g.Go(func() (err error) { completed, err = s.progressRepo.GetCompletedDates(gctx, userID, dates); return })
	g.Go(func() (err error) { userLevels, err = s.progressRepo.GetUserLevels(gctx, userID); return })
	if err := g.Wait(); err != nil {
		return nil, err
	}

	r := &model.WeeklyReport{UserID: userID, Level: 1, Segment: string(model.SegmentActive)}

	r.WeeklyActivity = make([]bool, 7)
	for i, d := range dates {
		if completed[d] {
			r.WeeklyActivity[i] = true
			r.ActiveDays++
		}
	}
	if prog != nil {
		r.XP = prog.TotalXP
		if prog.Level > 0 {
			r.Level = prog.Level
		}
	}
	if streak != nil {
		r.CurrentStreak = streak.CurrentStreak
		r.LongestStreak = streak.LongestStreak
		r.Freezes = streak.Freezes
	}
	for _, ul := range userLevels {
		if ul.Completed {
			r.LevelsCompleted++
		}
	}
	if state != nil {
		r.Segment = string(state.Segment)
		r.Engagement = state.Engagement
		r.DropoutRisk = state.DropoutRisk
		r.StrongCount = len(state.StrongAreas)
		r.WeakAreas = state.WeakAreas
		if len(r.WeakAreas) > 4 {
			r.WeakAreas = r.WeakAreas[:4]
		}
	}

	r.Headline = headline(r)

	if s.coach != nil {
		gctx2, cancel := context.WithTimeout(ctx, 8*time.Second)
		defer cancel()
		prompt := fmt.Sprintf("Active %d of 7 days, current streak %d, level %d, %d levels completed, segment %q.",
			r.ActiveDays, r.CurrentStreak, r.Level, r.LevelsCompleted, r.Segment)
		if out, err := s.coach.Generate(gctx2, reportSystemPrompt, prompt); err == nil && out != "" {
			r.Narrative = out
		}
	}
	return r, nil
}

func headline(r *model.WeeklyReport) string {
	switch {
	case r.ActiveDays >= 5:
		return fmt.Sprintf("A strong week — active %d of 7 days!", r.ActiveDays)
	case r.ActiveDays >= 2:
		return fmt.Sprintf("Good progress — active %d of 7 days.", r.ActiveDays)
	case r.ActiveDays == 1:
		return "A gentle week — one day of practice."
	default:
		return "A quiet week — a fresh start awaits."
	}
}

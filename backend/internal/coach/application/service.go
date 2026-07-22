package application

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/chawais/deenquest/backend/internal/coach/domain"

	"go.uber.org/zap"

	leveldomain "github.com/chawais/deenquest/backend/internal/level/domain"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
	progressdomain "github.com/chawais/deenquest/backend/internal/progress/domain"
)

// XPAwarder is the slice of progressapp.Service the coach needs to grant XP for
type XPAwarder interface {
	Award(ctx context.Context, userID string, xpDelta, barakahDelta int) (*progressdomain.Progress, error)
}

var (
	ErrInsightNotFound = errors.New("coach: insight not found")
	ErrNoPractice      = errors.New("coach: insight has no practice drill")
)

// Service orchestrates the coach: ingest → skill model → rules → insights →
// practice. Every step is deterministic; the Phraser only decorates copy.
type Service struct {
	repo     domain.Repository
	progress XPAwarder
	phraser  *Phraser
	now      func() time.Time // injectable clock for tests
}

func NewService(repo domain.Repository, awarder XPAwarder, phraser *Phraser) *Service {
	return &Service{repo: repo, progress: awarder, phraser: phraser, now: time.Now}
}

// --- ingest ----------------------------------------------------------------
func (s *Service) Ingest(ctx context.Context, userID, idempotencyKey string, events []domain.TelemetryEvent) (int, error) {
	if len(events) == 0 {
		return 0, nil
	}
	if len(events) > domain.MaxBatchEvents {
		events = events[:domain.MaxBatchEvents]
	}

	if idempotencyKey != "" {
		fresh, err := s.repo.ClaimBatch(ctx, userID, idempotencyKey)
		if err != nil {
			return 0, err
		}
		if !fresh {
			return 0, nil // duplicate delivery — already processed
		}
	}

	now := s.now()
	accepted := make([]domain.TelemetryEvent, 0, len(events))
	for _, ev := range events {
		if ev.Type == "" || ev.TS <= 0 {
			continue
		}
		at := ev.Time()
		if now.Sub(at) > domain.MaxEventAge || at.After(now.Add(5*time.Minute)) {
			continue // stale or clock-skewed
		}
		accepted = append(accepted, ev)
	}
	if len(accepted) == 0 {
		return 0, nil
	}

	stored := make([]domain.StoredEvent, len(accepted))
	for i, ev := range accepted {
		stored[i] = domain.StoredEvent{
			ID:        fmt.Sprintf("%s:%d:%d", userID, ev.TS, i),
			UserID:    userID,
			Event:     ev,
			CreatedAt: now,
		}
	}
	if err := s.repo.StoreEvents(ctx, stored); err != nil {
		// Raw storage is for Phase-2 replay; the skill model matters more.
		logger.Warn("coach: storing raw events failed", zap.Error(err))
	}

	state, err := s.repo.GetSkillState(ctx, userID)
	if err != nil {
		return 0, err
	}
	if state == nil {
		state = domain.NewUserSkillState(userID)
	}
	for _, ev := range accepted {
		domain.ApplyEvent(state, ev, now)
	}
	domain.Prune(state, now)
	if err := s.repo.SaveSkillState(ctx, state); err != nil {
		return 0, err
	}

	// Fire-and-forget rule evaluation: pure functions over the doc we already
	// hold, so the ingest response never waits on insight writes.
	go func(st domain.UserSkillState) {
		bg, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := s.reconcileInsights(bg, &st, now); err != nil {
			logger.Error("coach: rule evaluation failed", zap.String("user_id", st.UserID), zap.Error(err))
		}
	}(*state)

	return len(accepted), nil
}

// EvaluateUser re-runs the rules for one user synchronously (tests, sweep).
func (s *Service) EvaluateUser(ctx context.Context, userID string) error {
	state, err := s.repo.GetSkillState(ctx, userID)
	if err != nil || state == nil {
		return err
	}
	return s.reconcileInsights(ctx, state, s.now())
}

func (s *Service) reconcileInsights(ctx context.Context, state *domain.UserSkillState, now time.Time) error {
	insights := domain.EvaluateRules(state, now)
	ids := make([]string, len(insights))
	for i, ins := range insights {
		ids[i] = ins.ID
	}
	if err := s.repo.UpsertInsights(ctx, insights); err != nil {
		return err
	}
	return s.repo.ExpireInsightsNotIn(ctx, state.UserID, ids, now)
}

// --- read: the UI contract -------------------------------------------------
func (s *Service) CoachState(ctx context.Context, userID string) (*domain.CoachStateDTO, error) {
	state, err := s.repo.GetSkillState(ctx, userID)
	if err != nil {
		return nil, err
	}
	if state == nil || len(state.Days) == 0 {
		return nil, nil
	}
	now := s.now()

	insights, err := s.repo.ActiveInsights(ctx, userID, now)
	if err != nil {
		return nil, err
	}

	week, weekDelta := domain.WeekAccuracy(state, now)
	lessons := domain.LessonsInWindow(state, now, 7)

	dto := &domain.CoachStateDTO{
		Subtitle:        fmt.Sprintf("Watched your last %d lessons", lessons),
		WeekAccuracy:    week,
		WeekDeltaPct:    weekDelta,
		LessonsAnalyzed: lessons,
		Insights:        []domain.InsightDTO{},
	}
	if lessons == 0 {
		dto.Subtitle = "Watching your practice"
	}

	var top *domain.Insight
	for i := range insights {
		ins := insights[i]
		if ins.Rule == domain.RuleWin {
			dto.Win = domain.WinParts{
				Bold:       domain.LatinName(ins.Skills[0]),
				Middle:     " is now ",
				BoldAccent: fmt.Sprintf("%d%% accurate", ins.Count),
				Tail:       " — mastered!",
			}
			continue
		}
		if top == nil {
			top = &insights[i]
		}
		dto.Insights = append(dto.Insights, s.insightDTO(ctx, userID, ins))
	}

	if top != nil {
		dto.Message = HomeMessage(*top)
		dto.FixMinutes = top.PracticeMinutes
		dto.InsightID = top.ID
		dto.PracticeLevelID = top.PracticeLevelID
		if top.PracticeLevelID != 0 {
			dto.SuggestedMission = domain.SuggestedMission{
				Title:    missionTitle(*top),
				Subtitle: "Suggested for you",
				XP:       domain.PracticeXP,
				LevelID:  top.PracticeLevelID,
			}
		}
	} else {
		dto.Message = domain.MessageParts{
			Before:    "You're doing great — ",
			Highlight: "keep practicing",
			Tail:      " and I'll flag anything that needs work!",
		}
	}
	return dto, nil
}

func (s *Service) insightDTO(ctx context.Context, userID string, ins domain.Insight) domain.InsightDTO {
	glyph, isArabic := insightGlyph(ins)
	bg, fg := tileColors(ins.Severity)
	return domain.InsightDTO{
		ID:              ins.ID,
		Glyph:           glyph,
		GlyphIsArabic:   isArabic,
		TileBg:          bg,
		TileFg:          fg,
		Title:           ins.Title,
		Detail:          s.phraser.Detail(ctx, userID, ins),
		Severity:        ins.Severity,
		PracticeMinutes: ins.PracticeMinutes,
		PracticeLevelID: ins.PracticeLevelID,
		Why:             ins.Why,
	}
}

func insightGlyph(ins domain.Insight) (glyph string, isArabic bool) {
	if len(ins.Skills) == 2 && domain.ContainsArabic(ins.Skills[0]) && domain.ContainsArabic(ins.Skills[1]) {
		// Zero-width non-joiner keeps the two letters in isolated form.
		return ins.Skills[0] + "‌" + ins.Skills[1], true
	}
	if len(ins.Skills) >= 1 && domain.ContainsArabic(ins.Skills[0]) {
		return ins.Skills[0], true
	}
	return "mic", false
}

// tileColors matches the Teal Night palette used by the shipped mock UI.
func tileColors(severity string) (bg, fg string) {
	if severity == domain.SeverityLow {
		return "#2A2440", "#C4B2FF"
	}
	return "#3D2A14", "#F79A59"
}

func missionTitle(ins domain.Insight) string {
	if ins.Rule == domain.RuleConfusionPair && len(ins.Skills) == 2 {
		return fmt.Sprintf("Coach practice: %s vs %s", ins.Skills[0], ins.Skills[1])
	}
	return "Coach practice: " + ins.Title
}

// --- practice --------------------------------------------------------------
func (s *Service) Practice(ctx context.Context, userID, insightID string) (*leveldomain.Level, error) {
	ins, err := s.repo.GetInsight(ctx, userID, insightID)
	if err != nil {
		return nil, err
	}
	if ins == nil {
		return nil, ErrInsightNotFound
	}
	if ins.PracticeLevelID == 0 {
		return nil, ErrNoPractice
	}
	a, b, ok := domain.PairFromPracticeID(ins.PracticeLevelID)
	if !ok {
		return nil, ErrNoPractice
	}
	return domain.CompilePairPractice(a, b)
}

func (s *Service) CompletePractice(ctx context.Context, userID, insightID string) (int, error) {
	ins, err := s.repo.GetInsight(ctx, userID, insightID)
	if err != nil {
		return 0, err
	}
	if ins == nil {
		return 0, ErrInsightNotFound
	}
	if ins.Status != domain.InsightActive {
		return 0, nil // already completed/expired — no double XP
	}
	if err := s.repo.MarkInsightDone(ctx, userID, insightID); err != nil {
		return 0, err
	}

	if ins.Rule == domain.RuleConfusionPair && len(ins.Skills) == 2 {
		if err := s.repo.ClearConfusionPair(ctx, userID, ins.Skills[0], ins.Skills[1]); err != nil {
			logger.Warn("coach: clearing confusion counters failed", zap.Error(err))
		} else if err := s.EvaluateUser(ctx, userID); err != nil {
			logger.Warn("coach: post-practice re-evaluation failed", zap.Error(err))
		}
	}

	xp := 0
	if s.progress != nil {
		if _, err := s.progress.Award(ctx, userID, domain.PracticeXP, 0); err != nil {
			logger.Warn("coach: awarding practice XP failed", zap.Error(err))
		} else {
			xp = domain.PracticeXP
		}
	}
	return xp, nil
}

// --- nightly sweep ---------------------------------------------------------
func (s *Service) SweepAll(ctx context.Context) (users int, err error) {
	err = s.repo.EachSkillState(ctx, func(state *domain.UserSkillState) error {
		if err := s.reconcileInsights(ctx, state, s.now()); err != nil {
			logger.Error("coach: sweep failed for user", zap.String("user_id", state.UserID), zap.Error(err))
			return nil // keep sweeping other users
		}
		users++
		return nil
	})
	return users, err
}

// PurgeUser removes all coach data for a user (account-deletion path).
func (s *Service) PurgeUser(ctx context.Context, userID string) error {
	return s.repo.PurgeUser(ctx, userID)
}

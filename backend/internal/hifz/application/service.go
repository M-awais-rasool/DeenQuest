package application

import (
	"context"
	"errors"
	"fmt"
	"io"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/chawais/deenquest/backend/internal/hifz/domain"
	"github.com/chawais/deenquest/backend/internal/platform/logger"
	progressdomain "github.com/chawais/deenquest/backend/internal/progress/domain"
	qurandomain "github.com/chawais/deenquest/backend/internal/quran/domain"
	recitationapp "github.com/chawais/deenquest/backend/internal/recitation/application"
	recitationdomain "github.com/chawais/deenquest/backend/internal/recitation/domain"
)

var (
	ErrNoPlanSelected = errors.New("no active hifz plan")
	ErrNothingDue     = errors.New("nothing to review right now")
)

type QuranSource interface {
	GetSurahList(ctx context.Context) ([]qurandomain.SurahSummary, error)
	GetSurahByID(ctx context.Context, id int, translationEdition string) (*qurandomain.SurahDetail, error)
}

// Grader transcribes and scores recitation audio against expected text.
// Satisfied by the recitation module's service.
type Grader interface {
	GradeAgainstText(ctx context.Context, expectedText string, audio io.Reader, filename string) (*recitationapp.Grade, error)
}

// XPAwarder is the progress module's currency seam.
type XPAwarder interface {
	Award(ctx context.Context, userID string, xpDelta, barakahDelta int) (*progressdomain.Progress, error)
}

type Service struct {
	repo   domain.Repository
	quran  QuranSource
	grader Grader
	xp     XPAwarder

	// surah metadata rarely changes; cache it for the process lifetime so
	// segmentation does not hit the quran service on every request.
	metaMu   sync.RWMutex
	metaByID map[int]domain.SurahMeta
	metaAt   time.Time
}

func NewService(repo domain.Repository, quran QuranSource, grader Grader, xp XPAwarder) *Service {
	return &Service{repo: repo, quran: quran, grader: grader, xp: xp}
}

const metaTTL = 6 * time.Hour

// ─────────────────────────────────────────────
// Reference data
// ─────────────────────────────────────────────

func (s *Service) surahMeta(ctx context.Context) (map[int]domain.SurahMeta, error) {
	s.metaMu.RLock()
	if s.metaByID != nil && time.Since(s.metaAt) < metaTTL {
		m := s.metaByID
		s.metaMu.RUnlock()
		return m, nil
	}
	s.metaMu.RUnlock()

	list, err := s.quran.GetSurahList(ctx)
	if err != nil {
		// Fall back to a stale cache rather than failing the whole screen.
		s.metaMu.RLock()
		defer s.metaMu.RUnlock()
		if s.metaByID != nil {
			return s.metaByID, nil
		}
		return nil, fmt.Errorf("load surah list: %w", err)
	}

	m := make(map[int]domain.SurahMeta, len(list))
	for _, su := range list {
		m[su.ID] = domain.SurahMeta{
			ID:          su.ID,
			Name:        su.Name,
			EnglishName: su.EnglishName,
			AyahCount:   su.NumberOfAyahs,
		}
	}

	s.metaMu.Lock()
	s.metaByID, s.metaAt = m, time.Now()
	s.metaMu.Unlock()
	return m, nil
}

// Settings returns the tunable configuration, seeding defaults on first use.
func (s *Service) Settings(ctx context.Context) (*domain.Settings, error) {
	cfg, err := s.repo.GetSettings(ctx)
	if err != nil {
		return nil, err
	}
	if cfg == nil || cfg.Session.ChallengeCount == 0 {
		seeded := domain.DefaultSettings()
		if err := s.repo.SaveSettings(ctx, &seeded); err != nil {
			logger.Warn("hifz: could not persist default settings", zap.Error(err))
		}
		return &seeded, nil
	}
	return cfg, nil
}

func (s *Service) portionsFor(
	ctx context.Context,
	plan *domain.Plan,
	enrollment *domain.Enrollment,
) ([]domain.Portion, error) {
	meta, err := s.surahMeta(ctx)
	if err != nil {
		return nil, err
	}
	return domain.BuildPortions(*plan, meta, portionSize(enrollment, plan))
}

func portionSize(enrollment *domain.Enrollment, plan *domain.Plan) int {
	if enrollment != nil && enrollment.AyahsPerPortion > 0 {
		return enrollment.AyahsPerPortion
	}
	if plan != nil {
		return plan.Segmentation.AyahsPerPortion
	}
	return 0
}

func (s *Service) ayahTexts(ctx context.Context, p domain.Portion) (numbers []int, texts []string, err error) {
	surah, err := s.quran.GetSurahByID(ctx, p.SurahID, "")
	if err != nil {
		return nil, nil, fmt.Errorf("load surah %d: %w", p.SurahID, err)
	}
	for _, a := range surah.Ayahs {
		if a.NumberInSurah < p.AyahStart || a.NumberInSurah > p.AyahEnd {
			continue
		}
		numbers = append(numbers, a.NumberInSurah)
		texts = append(texts, domain.StripBasmalah(a.Text, p.SurahID, a.NumberInSurah))
	}
	if len(texts) == 0 {
		return nil, nil, domain.ErrPortionNotFound
	}
	return numbers, texts, nil
}

func (s *Service) contextWords(ctx context.Context, p domain.Portion) []string {
	surah, err := s.quran.GetSurahByID(ctx, p.SurahID, "")
	if err != nil {
		return nil
	}
	var out []string
	for _, a := range surah.Ayahs {
		if a.NumberInSurah >= p.AyahStart && a.NumberInSurah <= p.AyahEnd {
			continue // words inside the portion are handled separately
		}
		out = append(out, domain.SplitWords(domain.StripBasmalah(a.Text, p.SurahID, a.NumberInSurah))...)
		if len(out) > 200 {
			break
		}
	}
	return out
}

type PlanView struct {
	domain.Plan
	PortionCount   int  `json:"portion_count"`
	AyahCount      int  `json:"ayah_count"`
	Enrolled       bool `json:"enrolled"`
	PortionsSealed int  `json:"portions_sealed"`
}

func (s *Service) ListPlans(ctx context.Context, userID string) ([]PlanView, error) {
	plans, err := s.repo.ListPlans(ctx, true)
	if err != nil {
		return nil, err
	}
	meta, err := s.surahMeta(ctx)
	if err != nil {
		return nil, err
	}

	enrollment, _ := s.repo.ActiveEnrollment(ctx, userID)

	views := make([]PlanView, 0, len(plans))
	for _, plan := range plans {
		portions, err := domain.BuildPortions(plan, meta, plan.Segmentation.AyahsPerPortion)
		if err != nil {
			logger.Warn("hifz: skipping unbuildable plan",
				zap.String("plan", plan.ID), zap.Error(err))
			continue
		}

		view := PlanView{
			Plan:         plan,
			PortionCount: len(portions),
			AyahCount:    domain.TotalAyahs(portions),
			Enrolled:     enrollment != nil && enrollment.PlanID == plan.ID,
		}
		if view.Enrolled {
			states, _ := s.repo.ListPortionStates(ctx, userID, plan.ID)
			for i := range states {
				if states[i].Stage == domain.StageSealed {
					view.PortionsSealed++
				}
			}
		}
		views = append(views, view)
	}

	sort.SliceStable(views, func(i, j int) bool { return views[i].Order < views[j].Order })
	return views, nil
}

type EnrollInput struct {
	PlanID    string
	ReciterID string
}

// Enroll activates a plan for a user, deactivating any previous one. Portion
// progress is keyed by portion ID, so re-enrolling in an old plan resumes it.
func (s *Service) Enroll(ctx context.Context, userID string, in EnrollInput) (*domain.Enrollment, error) {
	plan, err := s.repo.GetPlan(ctx, in.PlanID)
	if err != nil {
		return nil, err
	}
	if plan == nil {
		return nil, domain.ErrPlanNotFound
	}

	cfg, err := s.Settings(ctx)
	if err != nil {
		return nil, err
	}

	reciter := in.ReciterID
	if reciter == "" && len(cfg.Reciters) > 0 {
		reciter = cfg.Reciters[0].ID
	}

	if err := s.repo.DeactivateEnrollments(ctx, userID); err != nil {
		return nil, err
	}

	existing, _ := s.repo.ListEnrollments(ctx, userID)
	enrollment := &domain.Enrollment{
		ID:              userID + ":" + plan.ID,
		UserID:          userID,
		PlanID:          plan.ID,
		ReciterID:       reciter,
		AyahsPerPortion: plan.Segmentation.AyahsPerPortion,
		StartedAt:       time.Now(),
		Active:          true,
	}
	for _, e := range existing {
		if e.LongestStreak > enrollment.LongestStreak {
			enrollment.LongestStreak = e.LongestStreak
		}
		if e.PlanID == plan.ID {
			enrollment.StreakDays = e.StreakDays
			enrollment.LastStreakDay = e.LastStreakDay
			enrollment.StartedAt = e.StartedAt
			if e.AyahsPerPortion > 0 {
				enrollment.AyahsPerPortion = e.AyahsPerPortion
			}
		}
	}

	if err := s.repo.SaveEnrollment(ctx, enrollment); err != nil {
		return nil, err
	}
	return enrollment, nil
}

// ─────────────────────────────────────────────
// Overview (the Hifz home screen)
// ─────────────────────────────────────────────

func (s *Service) Overview(ctx context.Context, userID string) (*domain.Overview, error) {
	enrollment, err := s.repo.ActiveEnrollment(ctx, userID)
	if err != nil {
		return nil, err
	}
	if enrollment == nil {
		return &domain.Overview{Enrolled: false}, nil
	}

	plan, err := s.repo.GetPlan(ctx, enrollment.PlanID)
	if err != nil {
		return nil, err
	}
	if plan == nil {
		return &domain.Overview{Enrolled: false}, nil
	}

	cfg, err := s.Settings(ctx)
	if err != nil {
		return nil, err
	}
	portions, err := s.portionsFor(ctx, plan, enrollment)
	if err != nil {
		return nil, err
	}
	states, err := s.repo.ListPortionStates(ctx, userID, plan.ID)
	if err != nil {
		return nil, err
	}
	byPortion := indexStates(states)

	now := time.Now()
	meta, _ := s.surahMeta(ctx)

	// Lists are initialised so they marshal as [] rather than null.
	out := &domain.Overview{
		Enrolled:      true,
		PlanID:        plan.ID,
		PlanTitle:     plan.Title,
		PlanAccent:    plan.Accent,
		PortionsTotal: len(portions),
		AyahsTotal:    domain.TotalAyahs(portions),
		StreakDays:    enrollment.StreakDays,
		LongestStreak: enrollment.LongestStreak,
		ReviewedToday: enrollment.LastStreakDay == domain.DayKey(now),
		Weakest:       []domain.PortionStrength{},
		Surahs:        []domain.SurahStrength{},
	}

	rows := make([]domain.PortionStrength, 0, len(portions))
	bySurah := map[int][]domain.PortionStrength{}
	weightedSum, weight := 0.0, 0

	for _, p := range portions {
		st := byPortion[p.ID]
		row := domain.BuildPortionStrength(p, st, cfg.SRS, now)
		rows = append(rows, row)
		bySurah[p.SurahID] = append(bySurah[p.SurahID], row)

		weight += p.AyahCount()
		weightedSum += row.Strength * float64(p.AyahCount())

		if row.Sealed {
			out.PortionsSealed++
			out.AyahsMemorized += p.AyahCount()
		}
		switch {
		case domain.IsSabqi(st, cfg.SRS, now):
			out.SabqiCount++
		case domain.IsDue(st, now):
			out.ManzilCount++
		}
		if out.NextUpID == "" && (st == nil || st.Stage != domain.StageSealed) {
			out.NextUpID = p.ID
			out.NextUpLabel = p.Label
		}
	}

	out.SabaqCount = min(newPortionsPerDay(cfg), countUnsealed(portions, byPortion))
	if cap := cfg.SRS.ManzilDailyCap; cap > 0 && out.ManzilCount > cap {
		out.ManzilCount = cap
	}

	if weight > 0 {
		out.OverallStrength = weightedSum / float64(weight)
	}
	out.OverallPct = int(out.OverallStrength*100 + 0.5)
	out.Rating = domain.Label(out.OverallStrength, cfg.SRS)

	// Weakest five started portions — the "memory strength" list.
	started := make([]domain.PortionStrength, 0, len(rows))
	for _, r := range rows {
		if r.Started {
			started = append(started, r)
		}
	}
	domain.SortPortionStrength(started)
	if len(started) > 5 {
		started = started[:5]
	}
	if started != nil {
		out.Weakest = started
	}

	// Surah roll-ups, in plan order.
	seen := map[int]bool{}
	for _, p := range portions {
		if seen[p.SurahID] {
			continue
		}
		seen[p.SurahID] = true
		m := meta[p.SurahID]
		out.Surahs = append(out.Surahs, domain.RollUpSurah(
			p.SurahID, m.Name, m.EnglishName, m.AyahCount, bySurah[p.SurahID], cfg.SRS,
		))
	}

	if n, err := s.repo.CountMistakes(ctx, userID); err == nil {
		out.MistakeCount = n
	}
	return out, nil
}

// ─────────────────────────────────────────────
// Today — Sabaq / Sabqi / Manzil
// ─────────────────────────────────────────────

type QueueItem struct {
	Portion  domain.Portion         `json:"portion"`
	Strength domain.PortionStrength `json:"strength"`
}

// TodayPlan is the three-queue daily session, in the order it should be run:
// revision before new memorization.
type TodayPlan struct {
	Enrolled  bool   `json:"enrolled"`
	PlanID    string `json:"plan_id,omitempty"`
	PlanTitle string `json:"plan_title,omitempty"`
	// ReciterID is echoed back so the plan picker can restore the learner's
	// chosen voice instead of defaulting to the first one.
	ReciterID string `json:"reciter_id,omitempty"`

	Sabqi  []QueueItem `json:"sabqi"`
	Manzil []QueueItem `json:"manzil"`
	Sabaq  []QueueItem `json:"sabaq"`

	EstimatedMinutes int  `json:"estimated_minutes"`
	AllDone          bool `json:"all_done"`
	StreakDays       int  `json:"streak_days"`
	ReviewedToday    bool `json:"reviewed_today"`
}

func (s *Service) Today(ctx context.Context, userID string) (*TodayPlan, error) {
	enrollment, err := s.repo.ActiveEnrollment(ctx, userID)
	if err != nil {
		return nil, err
	}
	if enrollment == nil {
		return &TodayPlan{Enrolled: false}, nil
	}

	plan, err := s.repo.GetPlan(ctx, enrollment.PlanID)
	if err != nil || plan == nil {
		return &TodayPlan{Enrolled: false}, err
	}

	cfg, err := s.Settings(ctx)
	if err != nil {
		return nil, err
	}
	portions, err := s.portionsFor(ctx, plan, enrollment)
	if err != nil {
		return nil, err
	}
	states, err := s.repo.ListPortionStates(ctx, userID, plan.ID)
	if err != nil {
		return nil, err
	}
	byPortion := indexStates(states)
	now := time.Now()

	out := &TodayPlan{
		Enrolled:      true,
		PlanID:        plan.ID,
		PlanTitle:     plan.Title,
		ReciterID:     enrollment.ReciterID,
		StreakDays:    enrollment.StreakDays,
		ReviewedToday: enrollment.LastStreakDay == domain.DayKey(now),

		Sabqi:  []QueueItem{},
		Manzil: []QueueItem{},
		Sabaq:  []QueueItem{},
	}

	var manzil []QueueItem
	for _, p := range portions {
		st := byPortion[p.ID]
		item := QueueItem{Portion: p, Strength: domain.BuildPortionStrength(p, st, cfg.SRS, now)}

		switch {
		case domain.IsSabqi(st, cfg.SRS, now):
			out.Sabqi = append(out.Sabqi, item)
		case domain.IsDue(st, now):
			manzil = append(manzil, item)
		case st == nil || st.Stage != domain.StageSealed:
			if len(out.Sabaq) < newPortionsPerDay(cfg) {
				out.Sabaq = append(out.Sabaq, item)
			}
		}
	}

	// Weakest first, then capped: an uncapped review queue is how SRS apps die.
	sort.SliceStable(manzil, func(i, j int) bool {
		return manzil[i].Strength.Strength < manzil[j].Strength.Strength
	})
	if cap := cfg.SRS.ManzilDailyCap; cap > 0 && len(manzil) > cap {
		manzil = manzil[:cap]
	}
	if manzil != nil {
		out.Manzil = manzil
	}

	// Rough pacing: revision is fast, new memorization is not.
	out.EstimatedMinutes = len(out.Sabqi)*2 + len(out.Manzil)*3 + len(out.Sabaq)*6
	out.AllDone = len(out.Sabqi) == 0 && len(out.Manzil) == 0 && len(out.Sabaq) == 0
	return out, nil
}

// ─────────────────────────────────────────────
// Sessions
// ─────────────────────────────────────────────

// SessionView is what the client needs to render a session.
type SessionView struct {
	Session   *domain.Session        `json:"session"`
	Rules     domain.SessionRules    `json:"rules"`
	Ayahs     []SessionAyah          `json:"ayahs"`
	ReciterID string                 `json:"reciter_id"`
	Strength  domain.PortionStrength `json:"strength"`
}

type SessionAyah struct {
	Number      int    `json:"number"`
	Text        string `json:"text"`
	Translation string `json:"translation,omitempty"`
}

func (s *Service) StartSession(ctx context.Context, userID, portionID string, queue domain.Queue) (*SessionView, error) {
	enrollment, err := s.repo.ActiveEnrollment(ctx, userID)
	if err != nil {
		return nil, err
	}
	if enrollment == nil {
		return nil, ErrNoPlanSelected
	}
	plan, err := s.repo.GetPlan(ctx, enrollment.PlanID)
	if err != nil {
		return nil, err
	}
	if plan == nil {
		return nil, domain.ErrPlanNotFound
	}

	cfg, err := s.Settings(ctx)
	if err != nil {
		return nil, err
	}
	rules := cfg.Rules()

	portions, err := s.portionsFor(ctx, plan, enrollment)
	if err != nil {
		return nil, err
	}
	portion, ok := findPortion(portions, portionID)
	if !ok {
		return nil, domain.ErrPortionNotFound
	}

	state, err := s.repo.GetPortionState(ctx, userID, portion.ID)
	if err != nil {
		return nil, err
	}

	numbers, texts, err := s.ayahTexts(ctx, portion)
	if err != nil {
		return nil, err
	}

	// Snapshot the text on the state the first time we see this portion, so a
	// stored attempt's word indices stay meaningful.
	if state == nil {
		state = newPortionState(userID, plan.ID, portion)
	}
	if len(state.AyahTexts) == 0 {
		state.AyahTexts = texts
		if err := s.repo.SavePortionState(ctx, state); err != nil {
			return nil, err
		}
	}

	session := &domain.Session{
		ID:        uuid.New().String(),
		UserID:    userID,
		PlanID:    plan.ID,
		PortionID: portion.ID,
		Queue:     queue,
		Portion:   portion,
		AyahTexts: texts,
		Stage:     startStage(state, queue, rules),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	session.Challenges = domain.GenerateChallenges(domain.GenParams{
		Portion:      portion,
		AyahNumbers:  numbers,
		AyahTexts:    texts,
		ContextWords: s.contextWords(ctx, portion),
		Rules:        rules,
		Settings:     cfg,
		Seed:         session.ID,
	})

	if err := s.repo.SaveSession(ctx, session); err != nil {
		return nil, err
	}

	ayahs := make([]SessionAyah, len(texts))
	for i := range texts {
		ayahs[i] = SessionAyah{Number: numbers[i], Text: texts[i]}
	}

	return &SessionView{
		Session:   session,
		Rules:     rules,
		Ayahs:     ayahs,
		ReciterID: enrollment.ReciterID,
		Strength:  domain.BuildPortionStrength(portion, state, cfg.SRS, time.Now()),
	}, nil
}

func startStage(state *domain.PortionState, queue domain.Queue, rules domain.SessionRules) domain.Stage {
	if queue == domain.QueueSabaq || state == nil || state.Stage != domain.StageSealed {
		if state != nil && state.Stage != "" && state.Stage != domain.StageSealed {
			return state.Stage // resume where the learner left off
		}
		return domain.StageListen
	}
	if rules.BlindRequiredToSeal {
		return domain.StageChallenges
	}
	return domain.StageChallenges
}

// StageResult is one submitted stage or challenge outcome.
type StageResult struct {
	Stage      domain.Stage
	Challenge  string
	RawScore   int
	HintsUsed  int
	LatencyMS  int
	Overridden bool
}

func (s *Service) SubmitStage(ctx context.Context, userID, sessionID string, in StageResult) (*domain.Session, error) {
	session, cfg, rules, err := s.loadSession(ctx, userID, sessionID)
	if err != nil {
		return nil, err
	}

	baseline, _ := s.repo.AvgLatency(ctx, userID)
	accuracy := domain.AttemptAccuracy(in.RawScore, in.HintsUsed, in.LatencyMS, baseline, cfg.SRS)

	scored := in.Stage != domain.StageListen && in.Stage != domain.StageShadow
	if scored {
		session.Accuracies = append(session.Accuracies, accuracy)
	}

	attempt := &domain.Attempt{
		ID:            uuid.New().String(),
		UserID:        userID,
		PortionID:     session.PortionID,
		SessionID:     session.ID,
		Queue:         session.Queue,
		Stage:         in.Stage,
		ChallengeType: in.Challenge,
		Accuracy:      accuracy,
		RawScore:      in.RawScore,
		LatencyMS:     in.LatencyMS,
		HintsUsed:     in.HintsUsed,
		Overridden:    in.Overridden,
		CreatedAt:     time.Now(),
	}
	if err := s.repo.SaveAttempt(ctx, attempt); err != nil {
		logger.Warn("hifz: failed to save attempt", zap.Error(err))
	}

	// Challenges advance within the stage until they run out.
	if in.Stage == domain.StageChallenges {
		session.ChallengeIdx++
		if session.ChallengeIdx < len(session.Challenges) {
			session.UpdatedAt = time.Now()
			return session, s.repo.SaveSession(ctx, session)
		}
	}

	session.Stage = session.Stage.Next(rules)
	session.UpdatedAt = time.Now()
	return session, s.repo.SaveSession(ctx, session)
}

// ReciteResult is the graded outcome of one recitation submission.
type ReciteResult struct {
	Score       int                 `json:"score"`
	Words       []domain.WordResult `json:"words"`
	Message     string              `json:"message"`
	Transcript  string              `json:"transcript"`
	Passed      bool                `json:"passed"`
	Tip         string              `json:"tip,omitempty"`
	Explanation string              `json:"explanation,omitempty"`
	Stage       domain.Stage        `json:"stage"`
	NextStage   domain.Stage        `json:"next_stage"`
	AyahNumber  int                 `json:"ayah_number,omitempty"`
}

func (s *Service) SubmitRecitation(
	ctx context.Context,
	userID, sessionID string,
	ayahNumber int,
	lastAyah bool,
	audio io.Reader,
	filename string,
) (*ReciteResult, error) {
	session, cfg, rules, err := s.loadSession(ctx, userID, sessionID)
	if err != nil {
		return nil, err
	}

	expected, err := expectedAyahText(session, ayahNumber)
	if err != nil {
		return nil, err
	}

	grade, err := s.grader.GradeAgainstText(ctx, expected, audio, filename)
	if err != nil {
		return nil, err
	}

	score := grade.Score + rules.LenienceBonus
	if score > 100 {
		score = 100
	}

	threshold := rules.OpenRecitePass
	if session.Stage == domain.StageBlindRecite {
		threshold = rules.BlindRecitePass
	}
	passed := score >= threshold

	baseline, _ := s.repo.AvgLatency(ctx, userID)
	accuracy := domain.AttemptAccuracy(score, 0, 0, baseline, cfg.SRS)
	session.Accuracies = append(session.Accuracies, accuracy)

	words := convertWords(grade.Words)
	attempt := &domain.Attempt{
		ID:          uuid.New().String(),
		UserID:      userID,
		PortionID:   session.PortionID,
		SessionID:   session.ID,
		Queue:       session.Queue,
		Stage:       session.Stage,
		AyahNumber:  ayahNumber,
		Accuracy:    accuracy,
		RawScore:    score,
		WordResults: words,
		Transcript:  grade.Transcript,
		CreatedAt:   time.Now(),
	}
	if err := s.repo.SaveAttempt(ctx, attempt); err != nil {
		logger.Warn("hifz: failed to save recitation attempt", zap.Error(err))
	}

	s.recordMistakes(ctx, userID, session, ayahNumber, words)

	result := &ReciteResult{
		Score:      score,
		Words:      words,
		Message:    grade.Message,
		Transcript: grade.Transcript,
		Passed:     passed,
		Stage:      session.Stage,
		NextStage:  session.Stage,
		AyahNumber: ayahNumber,
	}
	if grade.Coaching != nil {
		result.Tip = grade.Coaching.Tip
		result.Explanation = grade.Coaching.Explanation
	}

	if lastAyah {
		if session.Stage == domain.StageBlindRecite && passed {
			if err := s.markBlindVerified(ctx, userID, session, score); err != nil {
				logger.Warn("hifz: failed to mark blind verified", zap.Error(err))
			}
		}
		session.Stage = session.Stage.Next(rules)
		result.NextStage = session.Stage
	}

	session.UpdatedAt = time.Now()
	if err := s.repo.SaveSession(ctx, session); err != nil {
		return nil, err
	}
	return result, nil
}

// CompletionResult is the end-of-session payload behind the result screen.
type CompletionResult struct {
	PortionLabel   string                 `json:"portion_label"`
	Queue          domain.Queue           `json:"queue"`
	Accuracy       float64                `json:"accuracy"`
	AccuracyPct    int                    `json:"accuracy_pct"`
	Passed         bool                   `json:"passed"`
	Sealed         bool                   `json:"sealed"`
	FirstSeal      bool                   `json:"first_seal"`
	XPEarned       int                    `json:"xp_earned"`
	Before         domain.PortionStrength `json:"before"`
	After          domain.PortionStrength `json:"after"`
	NextReviewAt   *time.Time             `json:"next_review_at,omitempty"`
	IntervalDays   int                    `json:"interval_days"`
	StreakDays     int                    `json:"streak_days"`
	StreakExtended bool                   `json:"streak_extended"`
	AyahsMemorized int                    `json:"ayahs_memorized"`
}

func (s *Service) CompleteSession(ctx context.Context, userID, sessionID string) (*CompletionResult, error) {
	session, cfg, rules, err := s.loadSession(ctx, userID, sessionID)
	if err != nil {
		return nil, err
	}

	state, err := s.repo.GetPortionState(ctx, userID, session.PortionID)
	if err != nil {
		return nil, err
	}
	if state == nil {
		state = newPortionState(userID, session.PlanID, session.Portion)
	}

	now := time.Now()
	before := domain.BuildPortionStrength(session.Portion, state, cfg.SRS, now)

	accuracy := mean(session.Accuracies)
	threshold := float64(rules.BlindRecitePass) / 100
	if !rules.BlindRequiredToSeal {
		threshold = float64(rules.OpenRecitePass) / 100
	}
	passed := accuracy >= threshold

	wasSealed := state.Stage == domain.StageSealed
	if passed {
		state.Stage = domain.StageSealed
		if state.SealedAt == nil {
			sealed := now
			state.SealedAt = &sealed
		}
	} else if !wasSealed {
		// Keep an unsealed portion where it is so the learner resumes mid-pipeline
		// rather than starting over.
		state.Stage = session.Stage
	}

	domain.Fold(state, accuracy, passed, cfg.SRS, now)
	if err := s.repo.SavePortionState(ctx, state); err != nil {
		return nil, err
	}

	result := &CompletionResult{
		PortionLabel: session.Portion.Label,
		Queue:        session.Queue,
		Accuracy:     accuracy,
		AccuracyPct:  int(accuracy*100 + 0.5),
		Passed:       passed,
		Sealed:       state.Stage == domain.StageSealed,
		FirstSeal:    !wasSealed && state.Stage == domain.StageSealed,
		Before:       before,
		After:        domain.BuildPortionStrength(session.Portion, state, cfg.SRS, now),
		NextReviewAt: state.NextReviewAt,
		IntervalDays: state.IntervalDays,
	}

	// XP scales with accuracy, and a first seal is worth more than a review.
	if plan, err := s.repo.GetPlan(ctx, session.PlanID); err == nil && plan != nil {
		result.XPEarned = sessionXP(plan.XPPerPortion, accuracy, result.FirstSeal)
	}
	if result.XPEarned > 0 && s.xp != nil {
		if _, err := s.xp.Award(ctx, userID, result.XPEarned, 0); err != nil {
			logger.Warn("hifz: failed to award XP", zap.Error(err))
		}
	}

	// Streak — the habit, not the plan.
	if enrollment, err := s.repo.ActiveEnrollment(ctx, userID); err == nil && enrollment != nil {
		day, streak, best := domain.NextStreak(
			enrollment.LastStreakDay, enrollment.StreakDays, enrollment.LongestStreak, now)
		result.StreakExtended = day != enrollment.LastStreakDay
		enrollment.LastStreakDay, enrollment.StreakDays, enrollment.LongestStreak = day, streak, best
		enrollment.LastSessionAt = now
		if err := s.repo.SaveEnrollment(ctx, enrollment); err != nil {
			logger.Warn("hifz: failed to save enrollment", zap.Error(err))
		}
		result.StreakDays = streak
	}

	if result.Sealed {
		result.AyahsMemorized = session.Portion.AyahCount()
	}

	session.Finished = true
	session.XPAwarded = result.XPEarned
	session.UpdatedAt = now
	if err := s.repo.SaveSession(ctx, session); err != nil {
		logger.Warn("hifz: failed to close session", zap.Error(err))
	}
	return result, nil
}

func (s *Service) ResetPortion(ctx context.Context, userID, portionID string) error {
	return s.repo.DeletePortionState(ctx, userID, portionID)
}

// PurgeUser removes all hifz data for a user (account-deletion path).
func (s *Service) PurgeUser(ctx context.Context, userID string) error {
	return s.repo.PurgeUser(ctx, userID)
}

// ─────────────────────────────────────────────
// Mistakes
// ─────────────────────────────────────────────

func (s *Service) Mistakes(ctx context.Context, userID string, limit int) ([]domain.Mistake, error) {
	if limit <= 0 || limit > 100 {
		limit = 30
	}
	mistakes, err := s.repo.ListMistakes(ctx, userID, limit)
	if err != nil {
		return nil, err
	}
	if mistakes == nil {
		return []domain.Mistake{}, nil // marshal as [], not null
	}
	return mistakes, nil
}

// recordMistakes folds wrong/missing words into the rolling ledger.
func (s *Service) recordMistakes(ctx context.Context, userID string, session *domain.Session, ayahNumber int, words []domain.WordResult) {
	var out []domain.Mistake
	now := time.Now()
	idx := 0
	for _, w := range words {
		if w.Status == "extra" {
			continue // extras are not positions in the ayah
		}
		if w.Status == "wrong" || w.Status == "missing" {
			out = append(out, domain.Mistake{
				ID:           domain.MistakeID(userID, session.Portion.SurahID, ayahNumber, idx),
				UserID:       userID,
				SurahID:      session.Portion.SurahID,
				AyahNumber:   ayahNumber,
				WordIndex:    idx,
				Word:         w.Text,
				MissCount:    1,
				LastMissedAt: now,
			})
		}
		idx++
	}
	if len(out) == 0 {
		return
	}
	if err := s.repo.BumpMistakes(ctx, out); err != nil {
		logger.Warn("hifz: failed to record mistakes", zap.Error(err))
	}
}

// ─────────────────────────────────────────────
// Internals
// ─────────────────────────────────────────────

func (s *Service) loadSession(ctx context.Context, userID, sessionID string) (
	*domain.Session, *domain.Settings, domain.SessionRules, error,
) {
	session, err := s.repo.GetSession(ctx, sessionID)
	if err != nil {
		return nil, nil, domain.SessionRules{}, err
	}
	if session == nil || session.UserID != userID {
		return nil, nil, domain.SessionRules{}, domain.ErrSessionNotFound
	}
	if session.Finished {
		return nil, nil, domain.SessionRules{}, domain.ErrSessionFinished
	}
	cfg, err := s.Settings(ctx)
	if err != nil {
		return nil, nil, domain.SessionRules{}, err
	}
	return session, cfg, cfg.Rules(), nil
}

func (s *Service) markBlindVerified(ctx context.Context, userID string, session *domain.Session, score int) error {
	state, err := s.repo.GetPortionState(ctx, userID, session.PortionID)
	if err != nil {
		return err
	}
	if state == nil {
		state = newPortionState(userID, session.PlanID, session.Portion)
	}
	state.BlindVerified = true
	if score > state.BestBlindScore {
		state.BestBlindScore = score
	}
	state.UpdatedAt = time.Now()
	return s.repo.SavePortionState(ctx, state)
}

func newPortionState(userID, planID string, p domain.Portion) *domain.PortionState {
	return &domain.PortionState{
		ID:        domain.PortionStateID(userID, p.ID),
		UserID:    userID,
		PlanID:    planID,
		PortionID: p.ID,
		SurahID:   p.SurahID,
		AyahStart: p.AyahStart,
		AyahEnd:   p.AyahEnd,
		Stage:     domain.StageListen,
		UpdatedAt: time.Now(),
	}
}

func expectedAyahText(session *domain.Session, ayahNumber int) (string, error) {
	offset := ayahNumber - session.Portion.AyahStart
	if offset < 0 || offset >= len(session.AyahTexts) {
		// Fall back to the whole portion when the client submits one take.
		if ayahNumber == 0 {
			return strings.Join(session.AyahTexts, " "), nil
		}
		return "", fmt.Errorf("ayah %d is not inside portion %s", ayahNumber, session.PortionID)
	}
	return session.AyahTexts[offset], nil
}

func convertWords(in []recitationdomain.WordResult) []domain.WordResult {
	out := make([]domain.WordResult, 0, len(in))
	for _, w := range in {
		out = append(out, domain.WordResult{
			Text:       w.Text,
			Status:     string(w.Status),
			Confidence: w.Confidence,
		})
	}
	return out
}

func indexStates(states []domain.PortionState) map[string]*domain.PortionState {
	out := make(map[string]*domain.PortionState, len(states))
	for i := range states {
		out[states[i].PortionID] = &states[i]
	}
	return out
}

func findPortion(portions []domain.Portion, id string) (domain.Portion, bool) {
	for _, p := range portions {
		if p.ID == id {
			return p, true
		}
	}
	return domain.Portion{}, false
}

func countUnsealed(portions []domain.Portion, states map[string]*domain.PortionState) int {
	n := 0
	for _, p := range portions {
		if st := states[p.ID]; st == nil || st.Stage != domain.StageSealed {
			n++
		}
	}
	return n
}

func mean(xs []float64) float64 {
	if len(xs) == 0 {
		return 0
	}
	sum := 0.0
	for _, x := range xs {
		sum += x
	}
	return sum / float64(len(xs))
}

// sessionXP scales the plan's per-portion XP by how well the session went, with
// a bonus the first time a portion is sealed.
func sessionXP(base int, accuracy float64, firstSeal bool) int {
	if base <= 0 {
		base = 40
	}
	xp := int(float64(base) * (0.4 + 0.6*accuracy))
	if firstSeal {
		xp = xp * 3 / 2
	}
	if xp < 5 {
		xp = 5
	}
	return xp
}

// newPortionsPerDay is the global pace that replaced the old per-learner
// setting. Falls back to one portion a day.
func newPortionsPerDay(cfg *domain.Settings) int {
	if cfg != nil && cfg.SRS.NewPortionsPerDay > 0 {
		return cfg.SRS.NewPortionsPerDay
	}
	return 1
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

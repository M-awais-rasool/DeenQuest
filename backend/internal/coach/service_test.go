package coach

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/chawais/deenquest/backend/internal/progress"
)

// fakeRepo is an in-memory Repository; mutexed because Ingest evaluates rules
// in a background goroutine.
type fakeRepo struct {
	mu       sync.Mutex
	batches  map[string]bool
	events   []StoredEvent
	states   map[string]*UserSkillState
	insights map[string]*Insight
}

func newFakeRepo() *fakeRepo {
	return &fakeRepo{
		batches:  map[string]bool{},
		states:   map[string]*UserSkillState{},
		insights: map[string]*Insight{},
	}
}

func (f *fakeRepo) ClaimBatch(_ context.Context, userID, key string) (bool, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	id := userID + ":" + key
	if f.batches[id] {
		return false, nil
	}
	f.batches[id] = true
	return true, nil
}

func (f *fakeRepo) StoreEvents(_ context.Context, events []StoredEvent) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.events = append(f.events, events...)
	return nil
}

func cloneState(s *UserSkillState) *UserSkillState {
	if s == nil {
		return nil
	}
	cp := *s
	cp.Skills = make(map[string]*SkillStat, len(s.Skills))
	for k, v := range s.Skills {
		vv := *v
		cp.Skills[k] = &vv
	}
	cp.Confusions = make(map[string]map[string]int, len(s.Confusions))
	for k, days := range s.Confusions {
		dd := make(map[string]int, len(days))
		for d, n := range days {
			dd[d] = n
		}
		cp.Confusions[k] = dd
	}
	cp.Days = make(map[string]*DayStat, len(s.Days))
	for k, v := range s.Days {
		vv := *v
		cp.Days[k] = &vv
	}
	return &cp
}

func (f *fakeRepo) GetSkillState(_ context.Context, userID string) (*UserSkillState, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	return cloneState(f.states[userID]), nil
}

func (f *fakeRepo) SaveSkillState(_ context.Context, state *UserSkillState) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.states[state.UserID] = cloneState(state)
	return nil
}

func (f *fakeRepo) UpsertInsights(_ context.Context, insights []Insight) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, ins := range insights {
		ins := ins
		if existing := f.insights[ins.ID]; existing != nil {
			ins.CreatedAt = existing.CreatedAt
		}
		ins.Status = InsightActive
		f.insights[ins.ID] = &ins
	}
	return nil
}

func (f *fakeRepo) ExpireInsightsNotIn(_ context.Context, userID string, activeIDs []string, now time.Time) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	keep := map[string]bool{}
	for _, id := range activeIDs {
		keep[id] = true
	}
	for id, ins := range f.insights {
		if ins.UserID == userID && ins.Status == InsightActive && !keep[id] {
			ins.Status = InsightExpired
		}
	}
	return nil
}

func (f *fakeRepo) ActiveInsights(_ context.Context, userID string, now time.Time) ([]Insight, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	var out []Insight
	for _, ins := range f.insights {
		if ins.UserID == userID && ins.Status == InsightActive && ins.ExpiresAt.After(now) {
			out = append(out, *ins)
		}
	}
	return out, nil
}

func (f *fakeRepo) GetInsight(_ context.Context, userID, insightID string) (*Insight, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	ins := f.insights[insightID]
	if ins == nil || ins.UserID != userID {
		return nil, nil
	}
	cp := *ins
	return &cp, nil
}

func (f *fakeRepo) MarkInsightDone(_ context.Context, userID, insightID string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if ins := f.insights[insightID]; ins != nil && ins.UserID == userID {
		ins.Status = InsightDone
	}
	return nil
}

func (f *fakeRepo) ClearConfusionPair(_ context.Context, userID, a, b string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if st := f.states[userID]; st != nil {
		delete(st.Confusions, a+"→"+b)
		delete(st.Confusions, b+"→"+a)
	}
	return nil
}

func (f *fakeRepo) EachSkillState(_ context.Context, fn func(*UserSkillState) error) error {
	f.mu.Lock()
	states := make([]*UserSkillState, 0, len(f.states))
	for _, s := range f.states {
		states = append(states, cloneState(s))
	}
	f.mu.Unlock()
	for _, s := range states {
		if err := fn(s); err != nil {
			return err
		}
	}
	return nil
}

func (f *fakeRepo) PurgeUser(_ context.Context, userID string) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	delete(f.states, userID)
	for id, ins := range f.insights {
		if ins.UserID == userID {
			delete(f.insights, id)
		}
	}
	return nil
}

type fakeAwarder struct {
	mu    sync.Mutex
	calls int
	xp    int
}

func (f *fakeAwarder) Award(_ context.Context, _ string, xpDelta, _ int) (*progress.Progress, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.calls++
	f.xp += xpDelta
	return &progress.Progress{}, nil
}

func newTestService(repo *fakeRepo, awarder XPAwarder) *Service {
	svc := NewService(repo, awarder, NewPhraser(nil, nil, false))
	svc.now = func() time.Time { return testNow }
	return svc
}

func TestIngestIdempotency(t *testing.T) {
	repo := newFakeRepo()
	svc := newTestService(repo, nil)
	ctx := context.Background()

	events := []TelemetryEvent{answerEvent("ت", true, testNow)}
	n, err := svc.Ingest(ctx, "u1", "batch-1", events)
	if err != nil || n != 1 {
		t.Fatalf("first ingest = (%d, %v), want (1, nil)", n, err)
	}
	n, err = svc.Ingest(ctx, "u1", "batch-1", events)
	if err != nil || n != 0 {
		t.Fatalf("duplicate ingest = (%d, %v), want (0, nil)", n, err)
	}
	if got := repo.states["u1"].Skills["ت"].Attempts; got != 1 {
		t.Errorf("attempts after duplicate batch = %d, want 1 (not double-counted)", got)
	}
}

func TestIngestDropsStaleEvents(t *testing.T) {
	repo := newFakeRepo()
	svc := newTestService(repo, nil)

	stale := answerEvent("ت", true, testNow.AddDate(0, 0, -8))
	future := answerEvent("ت", true, testNow.Add(time.Hour))
	fresh := answerEvent("ت", true, testNow)

	n, err := svc.Ingest(context.Background(), "u1", "", []TelemetryEvent{stale, future, fresh})
	if err != nil || n != 1 {
		t.Fatalf("ingest = (%d, %v), want (1, nil): stale+future dropped", n, err)
	}
}

func TestThreeMistakesProduceInsight(t *testing.T) {
	// The Phase-1 exit criterion: a real insight appears after 3 induced mistakes.
	repo := newFakeRepo()
	svc := newTestService(repo, nil)
	ctx := context.Background()

	var events []TelemetryEvent
	for i := 0; i < 3; i++ {
		events = append(events, confusionEvent("ث", "ت", testNow))
	}
	if _, err := svc.Ingest(ctx, "u1", "b1", events); err != nil {
		t.Fatal(err)
	}
	// Evaluate synchronously — the ingest-triggered goroutine is best-effort.
	if err := svc.EvaluateUser(ctx, "u1"); err != nil {
		t.Fatal(err)
	}

	state, err := svc.CoachState(ctx, "u1")
	if err != nil {
		t.Fatal(err)
	}
	if state == nil {
		t.Fatal("coach state is nil after ingesting events")
	}
	if len(state.Insights) != 1 {
		t.Fatalf("insights = %d, want 1", len(state.Insights))
	}
	ins := state.Insights[0]
	if ins.Severity != SeverityHigh || ins.PracticeLevelID == 0 {
		t.Errorf("expected a high-severity insight with practice, got %+v", ins)
	}
	// Pair is canonical (alphabet order): ت before ث regardless of direction.
	if state.Message.ArabicA != "ت" || state.Message.ArabicB != "ث" {
		t.Errorf("home message letters = %q/%q, want ت/ث", state.Message.ArabicA, state.Message.ArabicB)
	}
	if state.SuggestedMission.LevelID != ins.PracticeLevelID {
		t.Errorf("mission level %d != insight practice level %d", state.SuggestedMission.LevelID, ins.PracticeLevelID)
	}
	if len(state.WeekAccuracy) != 7 {
		t.Errorf("week accuracy has %d entries, want 7", len(state.WeekAccuracy))
	}
}

func TestCoachStateNilForNewUser(t *testing.T) {
	svc := newTestService(newFakeRepo(), nil)
	state, err := svc.CoachState(context.Background(), "nobody")
	if err != nil || state != nil {
		t.Errorf("new user coach state = (%v, %v), want (nil, nil)", state, err)
	}
}

func TestPracticeFlowAwardsXPOnce(t *testing.T) {
	repo := newFakeRepo()
	awarder := &fakeAwarder{}
	svc := newTestService(repo, awarder)
	ctx := context.Background()

	var events []TelemetryEvent
	for i := 0; i < 3; i++ {
		events = append(events, confusionEvent("ث", "ت", testNow))
	}
	_, _ = svc.Ingest(ctx, "u1", "b1", events)
	_ = svc.EvaluateUser(ctx, "u1")

	insightID := InsightID("u1", RuleConfusionPair, []string{"ت", "ث"})

	lvl, err := svc.Practice(ctx, "u1", insightID)
	if err != nil {
		t.Fatal(err)
	}
	if lvl.ID != PairPracticeID("ت", "ث") || len(lvl.Lessons) != 4 {
		t.Errorf("practice level = id %d with %d lessons", lvl.ID, len(lvl.Lessons))
	}

	xp, err := svc.CompletePractice(ctx, "u1", insightID)
	if err != nil || xp != PracticeXP {
		t.Fatalf("complete = (%d, %v), want (%d, nil)", xp, err, PracticeXP)
	}
	xp, err = svc.CompletePractice(ctx, "u1", insightID)
	if err != nil || xp != 0 {
		t.Fatalf("second complete = (%d, %v), want (0, nil) — no double XP", xp, err)
	}
	if awarder.calls != 1 {
		t.Errorf("XP awarded %d times, want 1", awarder.calls)
	}

	// Done insights leave the active set.
	state, _ := svc.CoachState(ctx, "u1")
	if state != nil && len(state.Insights) != 0 {
		t.Errorf("insight should leave active set after completion, got %+v", state.Insights)
	}
}

func TestPracticeUnknownInsight(t *testing.T) {
	svc := newTestService(newFakeRepo(), nil)
	if _, err := svc.Practice(context.Background(), "u1", "missing"); err != ErrInsightNotFound {
		t.Errorf("err = %v, want ErrInsightNotFound", err)
	}
}

func TestCompletePracticeStaysDoneAcrossReEvaluation(t *testing.T) {
	repo := newFakeRepo()
	svc := newTestService(repo, &fakeAwarder{})
	ctx := context.Background()

	var events []TelemetryEvent
	for i := 0; i < 3; i++ {
		events = append(events, confusionEvent("ص", "ض", testNow))
	}
	_, _ = svc.Ingest(ctx, "u1", "b1", events)
	_ = svc.EvaluateUser(ctx, "u1")

	insightID := InsightID("u1", RuleConfusionPair, []string{"ص", "ض"})
	if _, err := svc.CompletePractice(ctx, "u1", insightID); err != nil {
		t.Fatal(err)
	}

	// The practice's telemetry lands afterwards (all-correct answers) and
	// triggers another evaluation — the insight must stay gone.
	correct := answerEvent("ص", true, testNow)
	_, _ = svc.Ingest(ctx, "u1", "b2", []TelemetryEvent{correct})
	_ = svc.EvaluateUser(ctx, "u1")
	active, _ := repo.ActiveInsights(ctx, "u1", testNow)
	if len(active) != 0 {
		t.Fatalf("insight resurrected after clean practice: %+v", active)
	}

	// Three FRESH confusions bring it back (updated, single tile).
	var fresh []TelemetryEvent
	for i := 0; i < 3; i++ {
		fresh = append(fresh, confusionEvent("ض", "ص", testNow))
	}
	_, _ = svc.Ingest(ctx, "u1", "b3", fresh)
	_ = svc.EvaluateUser(ctx, "u1")
	active, _ = repo.ActiveInsights(ctx, "u1", testNow)
	if len(active) != 1 || active[0].ID != insightID {
		t.Fatalf("fresh mistakes should reactivate the same single insight, got %+v", active)
	}
}

func TestSweepExpiresResolvedConfusions(t *testing.T) {
	repo := newFakeRepo()
	svc := newTestService(repo, nil)
	ctx := context.Background()

	var events []TelemetryEvent
	for i := 0; i < 3; i++ {
		events = append(events, confusionEvent("ث", "ت", testNow))
	}
	_, _ = svc.Ingest(ctx, "u1", "b1", events)
	_ = svc.EvaluateUser(ctx, "u1")

	// 8 days later the confusion window is empty — the sweep must retire the insight.
	svc.now = func() time.Time { return testNow.AddDate(0, 0, 8) }
	users, err := svc.SweepAll(ctx)
	if err != nil || users != 1 {
		t.Fatalf("sweep = (%d, %v), want (1, nil)", users, err)
	}
	active, _ := repo.ActiveInsights(ctx, "u1", svc.now())
	if len(active) != 0 {
		t.Errorf("confusion insight should expire once the window clears, got %+v", active)
	}
}

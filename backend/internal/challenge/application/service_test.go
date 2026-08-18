package application

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/chawais/deenquest/backend/internal/challenge/domain"
	progressapp "github.com/chawais/deenquest/backend/internal/progress/application"
	progressdomain "github.com/chawais/deenquest/backend/internal/progress/domain"
)

/* ─────────────────────────── fakes ─────────────────────────── */

type memRepo struct {
	templates      []domain.QuestTemplate
	quests         map[string]*domain.UserQuest
	duels          map[string]*domain.Duel
	groups         map[string]*domain.GroupChallenge
	encouragements map[string]bool

	failSaveQuest error
}

func newMemRepo() *memRepo {
	return &memRepo{
		templates:      domain.QuestCatalog(),
		quests:         map[string]*domain.UserQuest{},
		duels:          map[string]*domain.Duel{},
		groups:         map[string]*domain.GroupChallenge{},
		encouragements: map[string]bool{},
	}
}

func (m *memRepo) SeedQuestTemplates(_ context.Context, t []domain.QuestTemplate) error {
	m.templates = t
	return nil
}

func (m *memRepo) ListQuestTemplates(context.Context) ([]domain.QuestTemplate, error) {
	return m.templates, nil
}

func (m *memRepo) ListUserQuests(_ context.Context, userID, weekKey string) ([]domain.UserQuest, error) {
	var out []domain.UserQuest
	for _, q := range m.quests {
		if q.UserID == userID && q.WeekKey == weekKey {
			out = append(out, *q)
		}
	}
	return out, nil
}

func (m *memRepo) InsertUserQuests(_ context.Context, quests []domain.UserQuest) error {
	for i := range quests {
		q := quests[i]
		m.quests[q.ID] = &q
	}
	return nil
}

func (m *memRepo) SaveUserQuest(_ context.Context, q *domain.UserQuest) error {
	if m.failSaveQuest != nil {
		return m.failSaveQuest
	}
	c := *q
	m.quests[q.ID] = &c
	return nil
}

func (m *memRepo) CreateDuel(_ context.Context, d *domain.Duel) error {
	for _, existing := range m.duels {
		if existing.InviteCode == d.InviteCode {
			return domain.ErrCodeTaken
		}
	}
	c := *d
	m.duels[d.ID] = &c
	return nil
}

func (m *memRepo) SaveDuel(_ context.Context, d *domain.Duel) error {
	if _, ok := m.duels[d.ID]; !ok {
		return domain.ErrDuelNotFound
	}
	c := *d
	m.duels[d.ID] = &c
	return nil
}

func (m *memRepo) GetDuelByCode(_ context.Context, code string) (*domain.Duel, error) {
	for _, d := range m.duels {
		if d.InviteCode == code {
			c := *d
			return &c, nil
		}
	}
	return nil, nil
}

func (m *memRepo) ListOpenDuelsForUser(_ context.Context, userID string) ([]domain.Duel, error) {
	var out []domain.Duel
	for _, d := range m.duels {
		if (d.ChallengerID == userID || d.OpponentID == userID) &&
			(d.Status == domain.DuelPending || d.Status == domain.DuelActive) {
			out = append(out, *d)
		}
	}
	return out, nil
}

func (m *memRepo) ListRecentDuelsForUser(_ context.Context, userID string, limit int) ([]domain.Duel, error) {
	var out []domain.Duel
	for _, d := range m.duels {
		if (d.ChallengerID == userID || d.OpponentID == userID) && d.Status == domain.DuelCompleted {
			out = append(out, *d)
		}
		if limit > 0 && len(out) >= limit {
			break
		}
	}
	return out, nil
}

func (m *memRepo) CreateGroup(_ context.Context, g *domain.GroupChallenge) error {
	for _, existing := range m.groups {
		if existing.JoinCode == g.JoinCode {
			return domain.ErrCodeTaken
		}
	}
	c := *g
	m.groups[g.ID] = &c
	return nil
}

func (m *memRepo) SaveGroup(_ context.Context, g *domain.GroupChallenge) error {
	if _, ok := m.groups[g.ID]; !ok {
		return domain.ErrGroupNotFound
	}
	c := *g
	m.groups[g.ID] = &c
	return nil
}

func (m *memRepo) GetGroupByCode(_ context.Context, code string) (*domain.GroupChallenge, error) {
	for _, g := range m.groups {
		if g.JoinCode == code {
			c := *g
			return &c, nil
		}
	}
	return nil, nil
}

func (m *memRepo) ListGroupsForUser(_ context.Context, userID string) ([]domain.GroupChallenge, error) {
	var out []domain.GroupChallenge
	for _, g := range m.groups {
		if g.HasMember(userID) {
			out = append(out, *g)
		}
	}
	return out, nil
}

func (m *memRepo) RecordEncouragement(_ context.Context, e domain.Encouragement) error {
	key := e.UserID + "|" + e.TargetID + "|" + e.Date
	if m.encouragements[key] {
		return domain.ErrDuplicateEncouragement
	}
	m.encouragements[key] = true
	return nil
}

type fakeXP struct {
	awards  []int
	sources []progressapp.ActivitySource
	users   []string
}

func (f *fakeXP) AwardFrom(_ context.Context, userID string, xp, _ int, src progressapp.ActivitySource) (*progressdomain.Progress, error) {
	f.awards = append(f.awards, xp)
	f.sources = append(f.sources, src)
	f.users = append(f.users, userID)
	return &progressdomain.Progress{}, nil
}

func (f *fakeXP) total() int {
	sum := 0
	for _, a := range f.awards {
		sum += a
	}
	return sum
}

type fakeProfiles map[string]string

func (f fakeProfiles) DisplayNames(_ context.Context, ids []string) (map[string]string, error) {
	out := map[string]string{}
	for _, id := range ids {
		if n, ok := f[id]; ok {
			out[id] = n
		}
	}
	return out, nil
}

func newTestService(repo *memRepo) (*Service, *fakeXP) {
	xp := &fakeXP{}
	return NewService(repo, fakeProfiles{"alice": "Aisha", "bob": "Yusuf"}, xp), xp
}

/* ─────────────────────────── tests ─────────────────────────── */

func TestGetOverviewDrawsAStableWeeklyBoard(t *testing.T) {
	repo := newMemRepo()
	svc, _ := newTestService(repo)
	ctx := context.Background()

	first, err := svc.GetOverview(ctx, "alice")
	if err != nil {
		t.Fatalf("GetOverview: %v", err)
	}
	if len(first.Quests) != domain.WeeklyQuestCount {
		t.Fatalf("got %d quests, want %d", len(first.Quests), domain.WeeklyQuestCount)
	}
	if first.Duel != nil || first.Group != nil {
		t.Error("a fresh user should have no duel or group challenge")
	}

	// A second visit must reuse the board, not draw (or duplicate) a new one.
	second, err := svc.GetOverview(ctx, "alice")
	if err != nil {
		t.Fatalf("GetOverview #2: %v", err)
	}
	if len(second.Quests) != domain.WeeklyQuestCount {
		t.Fatalf("second visit got %d quests, want %d", len(second.Quests), domain.WeeklyQuestCount)
	}
	for i := range first.Quests {
		if first.Quests[i].ID != second.Quests[i].ID {
			t.Errorf("board changed between visits: %s vs %s", first.Quests[i].ID, second.Quests[i].ID)
		}
	}
}

func TestOnActivityAdvancesMatchingQuestsOnly(t *testing.T) {
	repo := newMemRepo()
	// Pin a single, known quest so the assertion does not depend on the draw.
	repo.templates = []domain.QuestTemplate{
		{ID: "q-lessons", Title: "Complete 3 lessons", Metric: domain.MetricLessons, Target: 3, RewardXP: 50, Glyph: "◆", Accent: "violet"},
	}
	svc, xp := newTestService(repo)
	ctx := context.Background()

	svc.OnActivity(ctx, "alice", progressapp.SourceLesson, 25)
	got := questByTitle(t, svc, "Complete 3 lessons")
	if got.Progress != 1 {
		t.Fatalf("lesson quest progress = %d, want 1", got.Progress)
	}

	// A daily task credits XP but must not move a lessons quest.
	svc.OnActivity(ctx, "alice", progressapp.SourceTask, 15)
	if got = questByTitle(t, svc, "Complete 3 lessons"); got.Progress != 1 {
		t.Errorf("task award moved the lessons quest to %d, want 1", got.Progress)
	}

	svc.OnActivity(ctx, "alice", progressapp.SourceLesson, 25)
	svc.OnActivity(ctx, "alice", progressapp.SourceLesson, 25)
	got = questByTitle(t, svc, "Complete 3 lessons")
	if !got.Completed || got.Progress != 3 {
		t.Fatalf("quest not completed: progress=%d completed=%v", got.Progress, got.Completed)
	}
	if xp.total() != 50 {
		t.Errorf("reward paid = %d XP, want 50", xp.total())
	}

	// Further activity must not re-pay a finished quest.
	svc.OnActivity(ctx, "alice", progressapp.SourceLesson, 25)
	if xp.total() != 50 {
		t.Errorf("reward paid twice: total = %d XP", xp.total())
	}
}

func TestQuestPayoutDoesNotScoreChallengesRecursively(t *testing.T) {
	repo := newMemRepo()
	repo.templates = []domain.QuestTemplate{
		{ID: "q-xp", Title: "Earn 50 XP", Metric: domain.MetricXP, Target: 50, RewardXP: 500, Glyph: "⚡", Accent: "gold"},
	}
	svc, xp := newTestService(repo)
	ctx := context.Background()

	svc.OnActivity(ctx, "alice", progressapp.SourceLesson, 50)

	q := questByTitle(t, svc, "Earn 50 XP")
	if !q.Completed {
		t.Fatalf("quest should have completed: %+v", q)
	}
	// The 500 XP payout must be tagged SourceChallenge and must not feed back in.
	if len(xp.sources) != 1 || xp.sources[0] != progressapp.SourceChallenge {
		t.Fatalf("payout sources = %v, want one SourceChallenge", xp.sources)
	}
	// Feeding the payout back in explicitly must be a no-op.
	before := q.Progress
	svc.OnActivity(ctx, "alice", progressapp.SourceChallenge, 500)
	if after := questByTitle(t, svc, "Earn 50 XP"); after.Progress != before {
		t.Errorf("challenge payout scored a quest: %d -> %d", before, after.Progress)
	}
}

func TestDuelCreateJoinAndScore(t *testing.T) {
	repo := newMemRepo()
	svc, _ := newTestService(repo)
	ctx := context.Background()

	created, err := svc.CreateDuel(ctx, "alice")
	if err != nil {
		t.Fatalf("CreateDuel: %v", err)
	}
	if created.Status != domain.DuelPending || created.InviteCode == "" {
		t.Fatalf("expected a pending duel with a code, got %+v", created)
	}
	if created.Rival != nil {
		t.Error("a pending duel should have no rival yet")
	}

	// One open duel at a time.
	if _, err := svc.CreateDuel(ctx, "alice"); !errors.Is(err, domain.ErrActiveDuel) {
		t.Errorf("second CreateDuel error = %v, want ErrActiveDuel", err)
	}
	// You cannot duel yourself.
	if _, err := svc.JoinDuel(ctx, "alice", created.InviteCode); !errors.Is(err, domain.ErrSelfJoin) {
		t.Errorf("self-join error = %v, want ErrSelfJoin", err)
	}
	// A wrong code is a clean not-found.
	if _, err := svc.JoinDuel(ctx, "bob", "ZZZZZZ"); !errors.Is(err, domain.ErrDuelNotFound) {
		t.Errorf("bad-code error = %v, want ErrDuelNotFound", err)
	}

	// The code is accepted however the user types it.
	joined, err := svc.JoinDuel(ctx, "bob", strings.ToLower(created.InviteCode[:3])+"-"+created.InviteCode[3:])
	if err != nil {
		t.Fatalf("JoinDuel: %v", err)
	}
	if joined.Status != domain.DuelActive {
		t.Fatalf("status after join = %s, want active", joined.Status)
	}
	if joined.Rival == nil || joined.Rival.DisplayName != "Aisha" {
		t.Fatalf("joiner's rival = %+v, want Aisha", joined.Rival)
	}
	if joined.InviteCode != "" {
		t.Error("an active duel should not keep advertising its code")
	}

	// XP from both sides lands on the right half of the scoreboard.
	svc.OnActivity(ctx, "alice", progressapp.SourceLesson, 40)
	svc.OnActivity(ctx, "bob", progressapp.SourceTask, 25)

	view, err := svc.GetOverview(ctx, "alice")
	if err != nil {
		t.Fatalf("GetOverview: %v", err)
	}
	if view.Duel == nil {
		t.Fatal("alice has no active duel")
	}
	if view.Duel.You.Score != 40 || view.Duel.Rival == nil || view.Duel.Rival.Score != 25 {
		t.Errorf("scoreboard = you %d / rival %+v, want 40 / 25", view.Duel.You.Score, view.Duel.Rival)
	}
	// The same duel read from the other side flips "you" and the rival.
	bobView, err := svc.GetOverview(ctx, "bob")
	if err != nil {
		t.Fatalf("GetOverview(bob): %v", err)
	}
	if bobView.Duel.You.Score != 25 || bobView.Duel.Rival.Score != 40 {
		t.Errorf("bob's scoreboard = you %d / rival %d, want 25 / 40", bobView.Duel.You.Score, bobView.Duel.Rival.Score)
	}
}

func TestDuelSettlesOnOverviewAndPaysTheWinner(t *testing.T) {
	repo := newMemRepo()
	svc, xp := newTestService(repo)
	ctx := context.Background()

	created, _ := svc.CreateDuel(ctx, "alice")
	if _, err := svc.JoinDuel(ctx, "bob", created.InviteCode); err != nil {
		t.Fatalf("JoinDuel: %v", err)
	}
	svc.OnActivity(ctx, "alice", progressapp.SourceLesson, 40)
	svc.OnActivity(ctx, "bob", progressapp.SourceLesson, 10)

	// Wind the clock past the end of the window.
	for _, d := range repo.duels {
		d.EndsAt = time.Now().UTC().Add(-time.Hour)
	}

	view, err := svc.GetOverview(ctx, "alice")
	if err != nil {
		t.Fatalf("GetOverview: %v", err)
	}
	if view.Duel != nil {
		t.Error("a settled duel should no longer be the active one")
	}
	if len(view.Results) != 1 || view.Results[0].Outcome != "won" {
		t.Fatalf("results = %+v, want one 'won'", view.Results)
	}

	paid := 0
	for i, u := range xp.users {
		if u == "alice" && xp.sources[i] == progressapp.SourceChallenge {
			paid += xp.awards[i]
		}
	}
	if paid < domain.DuelWinnerXP {
		t.Errorf("winner paid %d XP, want at least %d", paid, domain.DuelWinnerXP)
	}

	// Settling is not repeated on the next visit.
	before := len(xp.awards)
	if _, err := svc.GetOverview(ctx, "alice"); err != nil {
		t.Fatalf("GetOverview #2: %v", err)
	}
	if len(xp.awards) != before {
		t.Errorf("re-settled and paid again: %d -> %d awards", before, len(xp.awards))
	}

	// The loser sees the mirror outcome.
	bobView, _ := svc.GetOverview(ctx, "bob")
	if len(bobView.Results) != 1 || bobView.Results[0].Outcome != "lost" {
		t.Errorf("bob's result = %+v, want 'lost'", bobView.Results)
	}
}

func TestAStaleDuelDoesNotBlockANewOne(t *testing.T) {
	repo := newMemRepo()
	svc, _ := newTestService(repo)
	ctx := context.Background()

	created, _ := svc.CreateDuel(ctx, "alice")
	if _, err := svc.JoinDuel(ctx, "bob", created.InviteCode); err != nil {
		t.Fatalf("JoinDuel: %v", err)
	}
	// The week runs out, and the user goes straight to "new duel" without ever
	// loading the overview that would normally settle it.
	for _, d := range repo.duels {
		d.EndsAt = time.Now().UTC().Add(-time.Hour)
	}

	next, err := svc.CreateDuel(ctx, "alice")
	if err != nil {
		t.Fatalf("CreateDuel after a finished duel: %v", err)
	}
	if next.Status != domain.DuelPending {
		t.Errorf("new duel status = %s, want pending", next.Status)
	}

	// An invite nobody ever redeemed must also stop blocking once it expires.
	repo2 := newMemRepo()
	svc2, _ := newTestService(repo2)
	if _, err := svc2.CreateDuel(ctx, "alice"); err != nil {
		t.Fatalf("CreateDuel: %v", err)
	}
	for _, d := range repo2.duels {
		d.EndsAt = time.Now().UTC().Add(-time.Hour)
	}
	if _, err := svc2.CreateDuel(ctx, "alice"); err != nil {
		t.Errorf("CreateDuel after an expired invite: %v", err)
	}
}

func TestCreateGroupValidatesItsInput(t *testing.T) {
	repo := newMemRepo()
	svc, _ := newTestService(repo)
	ctx := context.Background()

	for _, tc := range []struct {
		name string
		req  CreateGroupRequest
	}{
		{"blank name", CreateGroupRequest{Name: "  ", Metric: domain.MetricXP, Target: 100}},
		{"unknown metric", CreateGroupRequest{Name: "Family", Metric: "vibes", Target: 100}},
		{"zero target", CreateGroupRequest{Name: "Family", Metric: domain.MetricXP, Target: 0}},
		{"absurd target", CreateGroupRequest{Name: "Family", Metric: domain.MetricXP, Target: maxGroupTarget + 1}},
		{"too long", CreateGroupRequest{Name: "Family", Metric: domain.MetricXP, Target: 10, Days: maxGroupDays + 1}},
	} {
		if _, err := svc.CreateGroup(ctx, "alice", tc.req); !errors.Is(err, ErrInvalidRequest) {
			t.Errorf("%s: error = %v, want ErrInvalidRequest", tc.name, err)
		}
	}
}

func TestGroupJoinAndSharedProgress(t *testing.T) {
	repo := newMemRepo()
	svc, _ := newTestService(repo)
	ctx := context.Background()

	group, err := svc.CreateGroup(ctx, "alice", CreateGroupRequest{
		Name: "Family Khatm", Description: "Finish Juz 30", Metric: domain.MetricXP, Target: 100,
	})
	if err != nil {
		t.Fatalf("CreateGroup: %v", err)
	}
	if !group.IsOwner || group.MemberCount != 1 || group.JoinCode == "" {
		t.Fatalf("unexpected new group: %+v", group)
	}

	if _, err := svc.JoinGroup(ctx, "alice", group.JoinCode); !errors.Is(err, domain.ErrAlreadyJoined) {
		t.Errorf("re-join error = %v, want ErrAlreadyJoined", err)
	}
	joined, err := svc.JoinGroup(ctx, "bob", group.JoinCode)
	if err != nil {
		t.Fatalf("JoinGroup: %v", err)
	}
	if joined.MemberCount != 2 || joined.IsOwner {
		t.Fatalf("joiner view = %+v, want 2 members and not owner", joined)
	}

	// Both members' XP pushes the one shared bar.
	svc.OnActivity(ctx, "alice", progressapp.SourceLesson, 30)
	svc.OnActivity(ctx, "bob", progressapp.SourceLesson, 20)

	view, err := svc.GetOverview(ctx, "alice")
	if err != nil {
		t.Fatalf("GetOverview: %v", err)
	}
	if view.Group == nil || view.Group.Progress != 50 || view.Group.Percent != 50 {
		t.Fatalf("group progress = %+v, want 50/50%%", view.Group)
	}
}

func TestEncourageRequiresASharedChallengeAndIsDailyCapped(t *testing.T) {
	repo := newMemRepo()
	svc, _ := newTestService(repo)
	ctx := context.Background()

	// No shared challenge yet.
	if err := svc.Encourage(ctx, "alice", "bob"); !errors.Is(err, domain.ErrNotAParticipant) {
		t.Errorf("stranger encourage error = %v, want ErrNotAParticipant", err)
	}
	if err := svc.Encourage(ctx, "alice", "alice"); !errors.Is(err, ErrInvalidRequest) {
		t.Errorf("self-encourage error = %v, want ErrInvalidRequest", err)
	}

	group, _ := svc.CreateGroup(ctx, "alice", CreateGroupRequest{
		Name: "Family", Metric: domain.MetricXP, Target: 100,
	})
	if _, err := svc.JoinGroup(ctx, "bob", group.JoinCode); err != nil {
		t.Fatalf("JoinGroup: %v", err)
	}

	if err := svc.Encourage(ctx, "alice", "bob"); err != nil {
		t.Fatalf("Encourage: %v", err)
	}
	// The same person cannot be farmed twice in a day.
	if err := svc.Encourage(ctx, "alice", "bob"); !errors.Is(err, domain.ErrDuplicateEncouragement) {
		t.Errorf("repeat encourage error = %v, want ErrDuplicateEncouragement", err)
	}
}

func TestOnActivitySwallowsRepositoryFailures(t *testing.T) {
	repo := newMemRepo()
	repo.templates = []domain.QuestTemplate{
		{ID: "q-xp", Title: "Earn 50 XP", Metric: domain.MetricXP, Target: 50, RewardXP: 10, Glyph: "⚡", Accent: "gold"},
	}
	svc, _ := newTestService(repo)
	repo.failSaveQuest = errors.New("mongo is down")

	// A broken challenge store must never be able to fail an XP award.
	svc.OnActivity(context.Background(), "alice", progressapp.SourceLesson, 50)
}

func questByTitle(t *testing.T, svc *Service, title string) QuestView {
	t.Helper()
	view, err := svc.GetOverview(context.Background(), "alice")
	if err != nil {
		t.Fatalf("GetOverview: %v", err)
	}
	for _, q := range view.Quests {
		if q.Title == title {
			return q
		}
	}
	t.Fatalf("quest %q not on the board (%+v)", title, view.Quests)
	return QuestView{}
}

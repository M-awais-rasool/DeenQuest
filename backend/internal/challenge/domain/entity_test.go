package domain

import (
	"testing"
	"time"
)

func activeDuel(now time.Time) *Duel {
	return &Duel{
		ID:           "duel-1",
		ChallengerID: "alice",
		OpponentID:   "bob",
		Status:       DuelActive,
		StartsAt:     now,
		EndsAt:       now.AddDate(0, 0, 7),
	}
}

func TestDuelAddScoreOnlyCreditsParticipantsInWindow(t *testing.T) {
	now := time.Date(2026, 8, 17, 12, 0, 0, 0, time.UTC)
	d := activeDuel(now)

	if !d.AddScore("alice", 40, now) || d.ChallengerScore != 40 {
		t.Fatalf("challenger not credited: %+v", d)
	}
	if !d.AddScore("bob", 25, now.Add(time.Hour)) || d.OpponentScore != 25 {
		t.Fatalf("opponent not credited: %+v", d)
	}

	// A stranger, a non-positive award, and an out-of-window award all no-op.
	for _, tc := range []struct {
		name   string
		user   string
		amount int
		at     time.Time
	}{
		{"stranger", "mallory", 50, now},
		{"zero", "alice", 0, now},
		{"negative", "alice", -10, now},
		{"before start", "alice", 10, now.Add(-time.Hour)},
		{"after end", "alice", 10, d.EndsAt},
	} {
		before := *d
		if d.AddScore(tc.user, tc.amount, tc.at) {
			t.Errorf("%s: AddScore reported a change", tc.name)
		}
		if d.ChallengerScore != before.ChallengerScore || d.OpponentScore != before.OpponentScore {
			t.Errorf("%s: scores moved (%+v -> %+v)", tc.name, before, d)
		}
	}

	// A pending duel has no clock running yet.
	pending := activeDuel(now)
	pending.Status = DuelPending
	if pending.AddScore("alice", 10, now) {
		t.Error("pending duel accepted a score")
	}
}

func TestDuelSettleDecidesWinnerOnlyAfterTheWindow(t *testing.T) {
	now := time.Date(2026, 8, 17, 12, 0, 0, 0, time.UTC)

	d := activeDuel(now)
	d.ChallengerScore, d.OpponentScore = 340, 315
	if d.Settle(now.Add(24 * time.Hour)) {
		t.Fatal("settled while the duel was still running")
	}
	if !d.Settle(d.EndsAt) {
		t.Fatal("did not settle at the end boundary")
	}
	if d.Status != DuelCompleted || d.WinnerID != "alice" {
		t.Errorf("got status=%s winner=%q, want completed/alice", d.Status, d.WinnerID)
	}
	// Settling is idempotent.
	if d.Settle(d.EndsAt.Add(time.Hour)) {
		t.Error("re-settled an already completed duel")
	}

	behind := activeDuel(now)
	behind.ChallengerScore, behind.OpponentScore = 100, 260
	behind.Settle(behind.EndsAt)
	if behind.WinnerID != "bob" {
		t.Errorf("winner = %q, want bob", behind.WinnerID)
	}

	draw := activeDuel(now)
	draw.ChallengerScore, draw.OpponentScore = 200, 200
	draw.Settle(draw.EndsAt)
	if draw.Status != DuelCompleted || draw.WinnerID != "" {
		t.Errorf("draw got status=%s winner=%q, want completed with no winner", draw.Status, draw.WinnerID)
	}
}

func TestDuelRivalAndScoreLookups(t *testing.T) {
	d := activeDuel(time.Now().UTC())
	d.ChallengerScore, d.OpponentScore = 10, 20

	if got := d.Rival("alice"); got != "bob" {
		t.Errorf("Rival(alice) = %q, want bob", got)
	}
	if got := d.Rival("mallory"); got != "" {
		t.Errorf("Rival(stranger) = %q, want empty", got)
	}
	if got := d.Score("bob"); got != 20 {
		t.Errorf("Score(bob) = %d, want 20", got)
	}
	if !d.Involves("alice") || d.Involves("mallory") || d.Involves("") {
		t.Error("Involves misidentified a participant")
	}
}

func TestGroupContributeCapsAtTargetAndCompletes(t *testing.T) {
	now := time.Date(2026, 8, 17, 12, 0, 0, 0, time.UTC)
	g := &GroupChallenge{
		ID: "g1", OwnerID: "alice", Metric: MetricXP, Target: 100,
		EndsAt: now.AddDate(0, 0, 14),
	}
	g.AddMember("alice", now)
	g.AddMember("bob", now)

	g.Contribute("alice", 30, now)
	g.Contribute("bob", 40, now)
	if g.Progress != 70 || g.Completed {
		t.Fatalf("progress = %d completed = %v, want 70/false", g.Progress, g.Completed)
	}
	if g.PercentComplete() != 70 {
		t.Errorf("PercentComplete = %d, want 70", g.PercentComplete())
	}

	// Overshooting the target caps progress and completes the challenge.
	g.Contribute("alice", 500, now)
	if g.Progress != 100 || !g.Completed || g.PercentComplete() != 100 {
		t.Fatalf("after overshoot: progress=%d completed=%v pct=%d", g.Progress, g.Completed, g.PercentComplete())
	}
	if g.Members[0].Contribution != 530 {
		t.Errorf("member contribution = %d, want the full 530 credited", g.Members[0].Contribution)
	}
	// A completed challenge stops accepting contributions.
	if g.Contribute("bob", 10, now) {
		t.Error("completed challenge accepted a contribution")
	}
}

func TestGroupContributeRejectsNonMembersAndExpiredChallenges(t *testing.T) {
	now := time.Date(2026, 8, 17, 12, 0, 0, 0, time.UTC)
	g := &GroupChallenge{ID: "g1", Target: 100, EndsAt: now.AddDate(0, 0, 1)}
	g.AddMember("alice", now)

	if g.Contribute("bob", 10, now) {
		t.Error("credited a non-member")
	}
	if g.Contribute("alice", 10, g.EndsAt) {
		t.Error("credited after the challenge ended")
	}
	if g.Progress != 0 {
		t.Errorf("progress = %d, want 0", g.Progress)
	}
}

func TestGroupAddMemberIsIdempotentAndCapped(t *testing.T) {
	now := time.Now().UTC()
	g := &GroupChallenge{ID: "g1", Target: 10, EndsAt: now.AddDate(0, 0, 7)}

	if !g.AddMember("alice", now) {
		t.Fatal("first join failed")
	}
	if g.AddMember("alice", now) {
		t.Error("duplicate join reported a change")
	}
	if len(g.Members) != 1 {
		t.Fatalf("members = %d, want 1", len(g.Members))
	}

	for i := 0; i < MaxGroupMembers; i++ {
		g.AddMember(string(rune('b'+i)), now)
	}
	if len(g.Members) != MaxGroupMembers {
		t.Errorf("members = %d, want capped at %d", len(g.Members), MaxGroupMembers)
	}
}

func TestPercentCompleteHandlesZeroTarget(t *testing.T) {
	g := &GroupChallenge{Progress: 5}
	if got := g.PercentComplete(); got != 0 {
		t.Errorf("PercentComplete with zero target = %d, want 0", got)
	}
}

func TestDeltasForCreditsXPAndTheSourceMetric(t *testing.T) {
	got := DeltasFor("lesson", 25)
	if got[MetricXP] != 25 || got[MetricLessons] != 1 {
		t.Errorf("lesson deltas = %v, want xp:25 lessons:1", got)
	}
	if _, ok := got[MetricTasks]; ok {
		t.Errorf("lesson award leaked into tasks: %v", got)
	}

	// An unknown source still counts XP.
	if got := DeltasFor("other", 10); got[MetricXP] != 10 || len(got) != 1 {
		t.Errorf("unknown-source deltas = %v, want xp:10 only", got)
	}
	// A zero award from a countable source counts the unit but no XP.
	got = DeltasFor("task", 0)
	if _, ok := got[MetricXP]; ok {
		t.Errorf("zero award credited XP: %v", got)
	}
	if got[MetricTasks] != 1 {
		t.Errorf("task unit not credited: %v", got)
	}
}

func TestNormalizeCodeMatchesGeneratedCodes(t *testing.T) {
	code, err := NewInviteCode()
	if err != nil {
		t.Fatalf("NewInviteCode: %v", err)
	}
	if len(code) != InviteCodeLength {
		t.Fatalf("code %q has length %d, want %d", code, len(code), InviteCodeLength)
	}
	if NormalizeCode(code) != code {
		t.Errorf("NormalizeCode changed an already-canonical code %q -> %q", code, NormalizeCode(code))
	}
	// However the user types it, it must resolve to the same stored code.
	typed := "  " + string(code[:3]) + "-" + string(code[3:]) + " "
	if got := NormalizeCode(typed); got != code {
		t.Errorf("NormalizeCode(%q) = %q, want %q", typed, got, code)
	}
	if got := NormalizeCode("ab-cd ef"); got != "ABCDEF" {
		t.Errorf("NormalizeCode lower-case = %q, want ABCDEF", got)
	}
}

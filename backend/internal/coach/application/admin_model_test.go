package application

import (
	"math"
	"testing"
	"time"

	"github.com/chawais/deenquest/backend/internal/coach/domain"
)

var adminNow = time.Date(2026, 7, 21, 12, 0, 0, 0, time.UTC)

// stateWith builds a learner whose single skill was last seen `daysAgo` with
// the given EMA accuracy.
func stateWith(ema float64, daysAgo int) *domain.UserSkillState {
	s := domain.NewUserSkillState("u1")
	s.Skills["ت"] = &domain.SkillStat{
		Attempts:    20,
		Correct:     int(ema * 20),
		EMAAccuracy: ema,
		LastSeen:    adminNow.AddDate(0, 0, -daysAgo),
	}
	return s
}

func TestSegmentOfInactiveWhenSilent(t *testing.T) {
	s := stateWith(0.9, inactiveDays+1)
	if got := SegmentOf(s, adminNow); got != SegmentInactive {
		t.Errorf("silent learner: got %q, want %q", got, SegmentInactive)
	}
}

func TestSegmentOfWeakBeatsImproving(t *testing.T) {
	// Low mastery, but this week's accuracy is above last week's. Weak must
	// win — see the ordering note in admin_entity.go.
	s := stateWith(0.3, 0)
	monday := domain.StartOfISOWeek(adminNow)
	s.Days[domain.DayKey(monday)] = &domain.DayStat{Attempts: 10, Correct: 8}
	s.Days[domain.DayKey(monday.AddDate(0, 0, -7))] = &domain.DayStat{Attempts: 10, Correct: 2}

	if got := SegmentOf(s, adminNow); got != SegmentWeak {
		t.Errorf("weak-but-improving learner: got %q, want %q", got, SegmentWeak)
	}
}

func TestSegmentOfImprovingWhenTrendingUp(t *testing.T) {
	s := stateWith(1.0, 0) // mastery above the weak floor
	monday := domain.StartOfISOWeek(adminNow)
	s.Days[domain.DayKey(monday)] = &domain.DayStat{Attempts: 10, Correct: 9}
	s.Days[domain.DayKey(monday.AddDate(0, 0, -7))] = &domain.DayStat{Attempts: 10, Correct: 4}

	if got := SegmentOf(s, adminNow); got != SegmentImproving {
		t.Errorf("trending-up learner: got %q, want %q", got, SegmentImproving)
	}
}

func TestEngagementScoreCountsDistinctDays(t *testing.T) {
	s := domain.NewUserSkillState("u1")
	for i := 0; i < 3; i++ {
		s.Days[domain.DayKey(adminNow.AddDate(0, 0, -i))] = &domain.DayStat{Attempts: 4, Correct: 3}
	}
	// A day outside the 7-day window must not count.
	s.Days[domain.DayKey(adminNow.AddDate(0, 0, -20))] = &domain.DayStat{Attempts: 9, Correct: 9}

	want := 3.0 / engagementWindow
	if got := EngagementScore(s, adminNow); math.Abs(got-want) > 1e-9 {
		t.Errorf("engagement: got %v, want %v", got, want)
	}
}

func TestDropoutRiskSaturates(t *testing.T) {
	if got := DropoutRisk(stateWith(0.8, 0), adminNow); got != 0 {
		t.Errorf("active learner risk: got %v, want 0", got)
	}
	if got := DropoutRisk(stateWith(0.8, 40), adminNow); got != 1 {
		t.Errorf("long-lapsed learner risk: got %v, want 1 (saturated)", got)
	}
	// A learner with no recorded answers is treated as fully lapsed.
	if got := DropoutRisk(domain.NewUserSkillState("u1"), adminNow); got != 1 {
		t.Errorf("never-active learner risk: got %v, want 1", got)
	}
}

func TestWeakestSkillsRanksAndAverages(t *testing.T) {
	f := newStatsFold()

	// Two learners weak at ب, one strong at ت.
	for i := 0; i < 2; i++ {
		s := domain.NewUserSkillState("u")
		s.Skills["ب"] = &domain.SkillStat{EMAAccuracy: 0.2, LastSeen: adminNow}
		f.add(s, adminNow)
	}
	strong := domain.NewUserSkillState("u3")
	strong.Skills["ت"] = &domain.SkillStat{EMAAccuracy: 0.95, LastSeen: adminNow}
	f.add(strong, adminNow)

	rows := f.weakestSkills(adminTopN)
	if len(rows) != 2 {
		t.Fatalf("got %d skill rows, want 2", len(rows))
	}
	if rows[0].Tag != "ب" {
		t.Errorf("hardest skill: got %q, want %q", rows[0].Tag, "ب")
	}
	if rows[0].WeakLearners != 2 || rows[0].Learners != 2 {
		t.Errorf("ب counts: got %d weak / %d learners, want 2 / 2",
			rows[0].WeakLearners, rows[0].Learners)
	}
	// AvgMastery is a running sum until weakestSkills divides it.
	if math.Abs(rows[0].AvgMastery-0.2) > 1e-9 {
		t.Errorf("ب avg mastery: got %v, want ~0.2", rows[0].AvgMastery)
	}
	if rows[1].WeakLearners != 0 {
		t.Errorf("ت weak learners: got %d, want 0", rows[1].WeakLearners)
	}
}

func TestStatsFoldAveragesAcrossLearners(t *testing.T) {
	f := newStatsFold()
	f.add(stateWith(0.9, 0), adminNow)  // risk 0
	f.add(stateWith(0.9, 14), adminNow) // risk 1 (saturated)

	if f.learners != 2 {
		t.Fatalf("learners: got %d, want 2", f.learners)
	}
	if got := f.avgDropoutRisk(); math.Abs(got-0.5) > 1e-9 {
		t.Errorf("avg dropout risk: got %v, want 0.5", got)
	}
}

func TestStatsFoldEmptyIsZeroNotNaN(t *testing.T) {
	f := newStatsFold()
	if got := f.avgEngagement(); got != 0 {
		t.Errorf("avg engagement with no learners: got %v, want 0", got)
	}
	if got := f.avgDropoutRisk(); got != 0 {
		t.Errorf("avg dropout risk with no learners: got %v, want 0", got)
	}
	if rows := f.weakestSkills(adminTopN); len(rows) != 0 {
		t.Errorf("weakest skills with no learners: got %d rows, want 0", len(rows))
	}
}

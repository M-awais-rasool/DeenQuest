package domain

import (
	"math"
	"testing"
	"time"
)

func cfg() SRSConfig { return DefaultSettings().SRS }

func sealedState(ema float64, reviewedDaysAgo int, reps int, blind bool) *PortionState {
	t := time.Now().AddDate(0, 0, -reviewedDaysAgo)
	return &PortionState{
		Stage:         StageSealed,
		EMAAccuracy:   ema,
		Reps:          reps,
		LastReviewAt:  &t,
		BlindVerified: blind,
	}
}

func TestStrength_FadesOverTime(t *testing.T) {
	now := time.Now()
	fresh := Strength(sealedState(1.0, 0, 1, true), cfg(), now)
	oneHalfLife := Strength(sealedState(1.0, 14, 1, true), cfg(), now)
	twoHalfLives := Strength(sealedState(1.0, 28, 1, true), cfg(), now)

	if fresh <= oneHalfLife || oneHalfLife <= twoHalfLives {
		t.Fatalf("strength must decay monotonically: %.3f, %.3f, %.3f", fresh, oneHalfLife, twoHalfLives)
	}
	if math.Abs(fresh-1.0) > 0.001 {
		t.Errorf("a just-reviewed perfect portion should read ~1.0, got %.3f", fresh)
	}
	// One rep → half-life is the base 14 days, so 14 days out should be ~0.5.
	if math.Abs(oneHalfLife-0.5) > 0.02 {
		t.Errorf("after one half-life expected ~0.5, got %.3f", oneHalfLife)
	}
}

func TestStrength_UnverifiedIsPenalised(t *testing.T) {
	now := time.Now()
	verified := Strength(sealedState(1.0, 0, 1, true), cfg(), now)
	openBookOnly := Strength(sealedState(1.0, 0, 1, false), cfg(), now)

	if openBookOnly >= verified {
		t.Fatalf("a portion never recited blind must read weaker: blind=%.3f open=%.3f", verified, openBookOnly)
	}
	if math.Abs(openBookOnly-cfg().UnverifiedPenalty) > 0.001 {
		t.Errorf("expected the penalty factor %.2f, got %.3f", cfg().UnverifiedPenalty, openBookOnly)
	}
}

func TestStrength_NeverReviewedIsZero(t *testing.T) {
	if got := Strength(&PortionState{}, cfg(), time.Now()); got != 0 {
		t.Errorf("a portion with no review history should read 0, got %.3f", got)
	}
	if got := Strength(nil, cfg(), time.Now()); got != 0 {
		t.Errorf("nil state should read 0, got %.3f", got)
	}
}

func TestEffectiveHalfLife_GrowsWithReps(t *testing.T) {
	c := cfg()
	one := EffectiveHalfLife(1, c)
	seven := EffectiveHalfLife(7, c)
	if seven <= one {
		t.Fatalf("more reps must slow the fade: 1 rep=%.1f 7 reps=%.1f", one, seven)
	}
	if math.Abs(one-c.BaseHalfLifeDays) > 0.001 {
		t.Errorf("one rep should equal the base half-life, got %.2f", one)
	}
}

func TestLabel_Thresholds(t *testing.T) {
	c := cfg()
	cases := []struct {
		strength float64
		want     StrengthLabel
	}{
		{0.95, StrengthStrong},
		{0.75, StrengthStrong},
		{0.74, StrengthMedium},
		{0.45, StrengthMedium},
		{0.44, StrengthWeak},
		{0.0, StrengthWeak},
	}
	for _, tc := range cases {
		if got := Label(tc.strength, c); got != tc.want {
			t.Errorf("Label(%.2f) = %s, want %s", tc.strength, got, tc.want)
		}
	}
}

func TestFold_PassAdvancesLadder(t *testing.T) {
	c := cfg()
	now := time.Now()
	st := &PortionState{}

	wantLadder := []int{1, 3, 7, 16, 35, 70, 70}
	for i, want := range wantLadder {
		Fold(st, 0.9, true, c, now)
		if st.IntervalDays != want {
			t.Fatalf("pass %d: interval = %d, want %d", i+1, st.IntervalDays, want)
		}
	}
	if st.Reps != len(wantLadder) {
		t.Errorf("reps = %d, want %d", st.Reps, len(wantLadder))
	}
	if st.NextReviewAt == nil || !st.NextReviewAt.After(now) {
		t.Error("a passed fold must schedule a future review")
	}
}

func TestFold_LapseResetsToFirstRung(t *testing.T) {
	c := cfg()
	now := time.Now()
	st := &PortionState{}
	for i := 0; i < 4; i++ {
		Fold(st, 0.9, true, c, now)
	}
	if st.IntervalDays == c.IntervalLadder[0] {
		t.Fatal("precondition failed: interval should have advanced")
	}

	Fold(st, 0.2, false, c, now)
	if st.IntervalDays != c.IntervalLadder[0] {
		t.Errorf("after a lapse interval = %d, want %d", st.IntervalDays, c.IntervalLadder[0])
	}
	if st.Reps != 0 {
		t.Errorf("a lapse should reset reps, got %d", st.Reps)
	}
	if st.Lapses != 1 {
		t.Errorf("lapses = %d, want 1", st.Lapses)
	}
}

func TestFold_SeedsEMAOnFirstObservation(t *testing.T) {
	st := &PortionState{}
	Fold(st, 0.8, true, cfg(), time.Now())
	if math.Abs(st.EMAAccuracy-0.8) > 0.001 {
		t.Errorf("first fold should seed the EMA at the observation, got %.3f", st.EMAAccuracy)
	}
}

func TestFold_MaintainsDSRFields(t *testing.T) {
	// Stability and Difficulty are not used for scheduling yet, but must be
	// populated from the first write so a future FSRS scheduler needs no migration.
	st := &PortionState{}
	Fold(st, 0.9, true, cfg(), time.Now())
	if st.Stability <= 0 {
		t.Error("stability should be populated on the first fold")
	}
	if st.Difficulty < 1 || st.Difficulty > 10 {
		t.Errorf("difficulty must stay in [1,10], got %.2f", st.Difficulty)
	}

	easy := &PortionState{}
	hard := &PortionState{}
	for i := 0; i < 10; i++ {
		Fold(easy, 1.0, true, cfg(), time.Now())
		Fold(hard, 0.3, false, cfg(), time.Now())
	}
	if easy.Difficulty >= hard.Difficulty {
		t.Errorf("consistently-failed portions should read harder: easy=%.2f hard=%.2f",
			easy.Difficulty, hard.Difficulty)
	}
}

func TestAttemptAccuracy_HintsAndLatency(t *testing.T) {
	c := cfg()

	if got := AttemptAccuracy(100, 0, 0, 0, c); math.Abs(got-1.0) > 0.001 {
		t.Errorf("clean perfect answer = %.3f, want 1.0", got)
	}

	oneHint := AttemptAccuracy(100, 1, 0, 0, c)
	twoHints := AttemptAccuracy(100, 2, 0, 0, c)
	if !(oneHint < 1.0 && twoHints < oneHint) {
		t.Errorf("each hint must cost: 0=%.3f 1=%.3f 2=%.3f", 1.0, oneHint, twoHints)
	}

	// Slow answers are discounted, but never below 80% of their value.
	slow := AttemptAccuracy(100, 0, 20000, 2000, c)
	if slow >= 1.0 {
		t.Errorf("a very slow answer should be discounted, got %.3f", slow)
	}
	if slow < 0.8 {
		t.Errorf("latency alone must not drag below 0.8, got %.3f", slow)
	}

	// No baseline yet → no latency adjustment at all.
	if got := AttemptAccuracy(100, 0, 20000, 0, c); math.Abs(got-1.0) > 0.001 {
		t.Errorf("without a baseline latency must be ignored, got %.3f", got)
	}
}

func TestIsDueAndIsSabqi(t *testing.T) {
	now := time.Now()
	past := now.Add(-time.Hour)
	future := now.Add(48 * time.Hour)
	sealed := now.AddDate(0, 0, -2)
	old := now.AddDate(0, 0, -30)

	due := &PortionState{Stage: StageSealed, NextReviewAt: &past}
	notDue := &PortionState{Stage: StageSealed, NextReviewAt: &future}
	unsealed := &PortionState{Stage: StageChallenges, NextReviewAt: &past}

	if !IsDue(due, now) {
		t.Error("a sealed portion past its review date is due")
	}
	if IsDue(notDue, now) {
		t.Error("a portion scheduled in the future is not due")
	}
	if IsDue(unsealed, now) {
		t.Error("an unsealed portion is never 'due' — it is still being learned")
	}

	recent := &PortionState{Stage: StageSealed, SealedAt: &sealed}
	ancient := &PortionState{Stage: StageSealed, SealedAt: &old}
	if !IsSabqi(recent, cfg(), now) {
		t.Error("sealed 2 days ago should be Sabqi")
	}
	if IsSabqi(ancient, cfg(), now) {
		t.Error("sealed 30 days ago is Manzil, not Sabqi")
	}
}

func TestNextStreak(t *testing.T) {
	now := time.Date(2026, 7, 25, 12, 0, 0, 0, time.UTC)
	yesterday := DayKey(now.AddDate(0, 0, -1))

	// Same day twice is idempotent.
	day, streak, best := NextStreak(DayKey(now), 5, 9, now)
	if day != DayKey(now) || streak != 5 || best != 9 {
		t.Errorf("same-day activity should not change the streak, got %s/%d/%d", day, streak, best)
	}

	// Consecutive day continues.
	_, streak, best = NextStreak(yesterday, 5, 5, now)
	if streak != 6 || best != 6 {
		t.Errorf("consecutive day should continue: streak=%d best=%d", streak, best)
	}

	// A gap restarts but keeps the record.
	_, streak, best = NextStreak(DayKey(now.AddDate(0, 0, -4)), 12, 12, now)
	if streak != 1 {
		t.Errorf("a gap should restart the streak, got %d", streak)
	}
	if best != 12 {
		t.Errorf("the record should survive a break, got %d", best)
	}
}

func TestStageNext_RespectsPresetSkips(t *testing.T) {
	full := DifficultyPreset{ShadowRequired: true, BlindRequiredToSeal: true}
	if got := StageListen.Next(full); got != StageShadow {
		t.Errorf("listen → %s, want shadow", got)
	}
	if got := StageChallenges.Next(full); got != StageBlindRecite {
		t.Errorf("challenges → %s, want blind_recite", got)
	}

	lean := DifficultyPreset{ShadowRequired: false, BlindRequiredToSeal: false}
	if got := StageListen.Next(lean); got != StageOpenRecite {
		t.Errorf("with shadow off, listen → %s, want open_recite", got)
	}
	if got := StageChallenges.Next(lean); got != StageSealed {
		t.Errorf("with blind optional, challenges → %s, want sealed", got)
	}
	if got := StageSealed.Next(full); got != StageSealed {
		t.Errorf("sealed is terminal, got %s", got)
	}
}

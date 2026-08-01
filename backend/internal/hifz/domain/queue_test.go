package domain

import (
	"testing"
	"time"
)

func at(days int) *time.Time {
	t := time.Now().AddDate(0, 0, days)
	return &t
}

func TestQueueOf_WalksSabaqToSabqiToManzil(t *testing.T) {
	now := time.Now()
	c := cfg()

	cases := []struct {
		name  string
		state *PortionState
		want  Queue
	}{
		{"never opened", nil, QueueSabaq},
		{"mid-pipeline", &PortionState{Stage: StageChallenges}, QueueSabaq},
		{"sealed today", &PortionState{Stage: StageSealed, SealedAt: at(0)}, QueueSabqi},
		{"sealed 6 days ago", &PortionState{Stage: StageSealed, SealedAt: at(-6)}, QueueSabqi},
		{"sealed 8 days ago", &PortionState{Stage: StageSealed, SealedAt: at(-8)}, QueueManzil},
		{"sealed a month ago", &PortionState{Stage: StageSealed, SealedAt: at(-30)}, QueueManzil},
	}
	for _, tc := range cases {
		if got := QueueOf(tc.state, c, now); got != tc.want {
			t.Errorf("%s: QueueOf = %s, want %s", tc.name, got, tc.want)
		}
	}
}

func TestIsSealed_NeedsBothTheStageAndTheDate(t *testing.T) {
	if (&PortionState{Stage: StageSealed}).IsSealed() {
		t.Error("a sealed stage with no seal date is not memorized — a failed session leaves one")
	}
	if (&PortionState{SealedAt: at(0)}).IsSealed() {
		t.Error("a seal date without the stage is not memorized either")
	}
	if !(&PortionState{Stage: StageSealed, SealedAt: at(0)}).IsSealed() {
		t.Error("stage and date together are a seal")
	}
	if (*PortionState)(nil).IsSealed() {
		t.Error("nil state is never sealed")
	}
}

func TestQueueOf_UndatedSealIsStillSabaq(t *testing.T) {
	// Regression: a session that ran the whole pipeline without passing used to
	// write Stage=sealed with no SealedAt. That fell out of the Sabqi window
	// check and landed in Manzil, so a portion the learner had *not* memorized
	// showed up as long-term revision — and Sabaq handed out the next one.
	broken := &PortionState{Stage: StageSealed, LastReviewAt: at(0), NextReviewAt: at(1)}

	if got := QueueOf(broken, cfg(), time.Now()); got != QueueSabaq {
		t.Errorf("an undated seal belongs back in Sabaq, got %s", got)
	}
	if IsDue(broken, time.Now()) {
		t.Error("an unmemorized portion is never due for revision")
	}
}

func TestSabqiDue_IsDailyRegardlessOfTheLadder(t *testing.T) {
	now := time.Now()
	c := cfg()

	// Recent material is revised every day, so a long scheduled interval must
	// not keep it out of today's Sabqi.
	notYetToday := &PortionState{
		Stage:        StageSealed,
		SealedAt:     at(-2),
		LastReviewAt: at(-1),
		NextReviewAt: at(30),
	}
	if !SabqiDue(notYetToday, c, now) {
		t.Error("a portion sealed 2 days ago and not yet revised today is Sabqi work")
	}

	alreadyToday := &PortionState{
		Stage:        StageSealed,
		SealedAt:     at(-2),
		LastReviewAt: at(0),
		NextReviewAt: at(1),
	}
	if SabqiDue(alreadyToday, c, now) {
		t.Error("Sabqi must clear once it has been revised today")
	}
}

func TestManzilDue_FollowsTheLadder(t *testing.T) {
	now := time.Now()
	c := cfg()

	due := &PortionState{
		Stage: StageSealed, SealedAt: at(-40), LastReviewAt: at(-8), NextReviewAt: at(-1),
	}
	resting := &PortionState{
		Stage: StageSealed, SealedAt: at(-40), LastReviewAt: at(-1), NextReviewAt: at(6),
	}
	recent := &PortionState{
		Stage: StageSealed, SealedAt: at(-1), LastReviewAt: at(-1), NextReviewAt: at(-1),
	}

	if !ManzilDue(due, c, now) {
		t.Error("an old portion past its review date is Manzil work")
	}
	if ManzilDue(resting, c, now) {
		t.Error("an old portion scheduled for later is resting, not due")
	}
	if ManzilDue(recent, c, now) {
		t.Error("a portion still inside the Sabqi window is never Manzil")
	}
}

func TestSealedOnAndReviewedOn(t *testing.T) {
	now := time.Now()

	if !SealedOn(&PortionState{SealedAt: at(0)}, now) {
		t.Error("a portion sealed today was today's Sabaq")
	}
	if SealedOn(&PortionState{SealedAt: at(-1)}, now) {
		t.Error("yesterday's seal is not today's Sabaq")
	}
	if SealedOn(nil, now) {
		t.Error("nil state has never been sealed")
	}
	if !ReviewedOn(&PortionState{LastReviewAt: at(0)}, now) {
		t.Error("a review today counts as reviewed today")
	}
	if ReviewedOn(&PortionState{}, now) {
		t.Error("a portion with no review history has not been reviewed today")
	}
}

func TestFold_HoldsTheDailyIntervalWhileSabqi(t *testing.T) {
	c := cfg()
	now := time.Now()

	// A week of daily Sabqi must not push the next review out by months.
	st := &PortionState{Stage: StageSealed, SealedAt: at(0)}
	for i := 0; i < 5; i++ {
		Fold(st, 0.9, true, c, now)
		if st.IntervalDays != c.IntervalLadder[0] {
			t.Fatalf("Sabqi review %d: interval = %d, want %d",
				i+1, st.IntervalDays, c.IntervalLadder[0])
		}
	}

	// Once it graduates to Manzil the ladder starts climbing.
	st.SealedAt = at(-30)
	Fold(st, 0.9, true, c, now)
	if st.IntervalDays != c.IntervalLadder[1] {
		t.Errorf("first Manzil review: interval = %d, want %d",
			st.IntervalDays, c.IntervalLadder[1])
	}
}

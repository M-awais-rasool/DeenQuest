package application

import (
	"fmt"
	"testing"
	"time"

	"github.com/chawais/deenquest/backend/internal/hifz/domain"
)

func testPortions(n int) []domain.Portion {
	out := make([]domain.Portion, 0, n)
	for i := 1; i <= n; i++ {
		out = append(out, domain.Portion{
			ID:         fmt.Sprintf("p%d", i),
			SurahID:    2,
			AyahStart:  i * 10,
			AyahEnd:    i*10 + 4,
			OrderIndex: i - 1,
			Label:      fmt.Sprintf("Portion %d", i),
		})
	}
	return out
}

func ago(days int) *time.Time {
	t := time.Now().AddDate(0, 0, -days)
	return &t
}

func ahead(days int) *time.Time {
	t := time.Now().AddDate(0, 0, days)
	return &t
}

func sealed(sealedDaysAgo, reviewedDaysAgo, nextInDays int) *domain.PortionState {
	return &domain.PortionState{
		Stage:        domain.StageSealed,
		SealedAt:     ago(sealedDaysAgo),
		LastReviewAt: ago(reviewedDaysAgo),
		NextReviewAt: ahead(nextInDays),
		EMAAccuracy:  0.9,
		Reps:         1,
	}
}

// byKey indexes the three queue views so assertions read by name.
func byKey(views []QueueView) map[domain.Queue]QueueView {
	out := map[domain.Queue]QueueView{}
	for _, v := range views {
		out[v.Key] = v
	}
	return out
}

func build(states map[string]*domain.PortionState, portions int) []QueueView {
	cfg := domain.DefaultSettings()
	return buildQueues(testPortions(portions), states, &cfg, time.Now())
}

func TestBuildQueues_OrderIsSabaqThenSabqiThenManzil(t *testing.T) {
	views := build(map[string]*domain.PortionState{}, 3)

	want := []domain.Queue{domain.QueueSabaq, domain.QueueSabqi, domain.QueueManzil}
	if len(views) != len(want) {
		t.Fatalf("expected %d queues, got %d", len(want), len(views))
	}
	for i, q := range want {
		if views[i].Key != q {
			t.Errorf("queue %d = %s, want %s", i, views[i].Key, q)
		}
	}
}

func TestBuildQueues_NewLearnerHasNothingToRevise(t *testing.T) {
	q := byKey(build(map[string]*domain.PortionState{}, 3))

	if q[domain.QueueSabaq].Status != domain.QueueDue || len(q[domain.QueueSabaq].Items) != 1 {
		t.Errorf("Sabaq should offer one new portion, got %s with %d items",
			q[domain.QueueSabaq].Status, len(q[domain.QueueSabaq].Items))
	}
	// The bug this replaced: an empty Sabqi/Manzil rendered as "done for today".
	for _, key := range []domain.Queue{domain.QueueSabqi, domain.QueueManzil} {
		if got := q[key].Status; got != domain.QueueLocked {
			t.Errorf("%s should be locked before anything is memorized, got %s", key, got)
		}
		if q[key].TotalPortions != 0 {
			t.Errorf("%s should hold no portions yet, got %d", key, q[key].TotalPortions)
		}
	}
}

func TestBuildQueues_SabaqIsOneLessonADay(t *testing.T) {
	// Portion 1 was sealed earlier today — that was today's lesson.
	q := byKey(build(map[string]*domain.PortionState{
		"p1": sealed(0, 0, 1),
	}, 3))

	sabaq := q[domain.QueueSabaq]
	if sabaq.Status != domain.QueueDone || len(sabaq.Items) != 0 {
		t.Errorf("Sabaq should be done for the day, got %s with %d items",
			sabaq.Status, len(sabaq.Items))
	}
	if sabaq.TotalPortions != 2 {
		t.Errorf("two portions remain unmemorized, got %d", sabaq.TotalPortions)
	}

	sabqi := q[domain.QueueSabqi]
	if sabqi.Status != domain.QueueDone || sabqi.TotalPortions != 1 {
		t.Errorf("the just-sealed portion is Sabqi, revised today: %s / %d portions",
			sabqi.Status, sabqi.TotalPortions)
	}
}

func TestBuildQueues_SabqiComesBackTheNextDay(t *testing.T) {
	q := byKey(build(map[string]*domain.PortionState{
		"p1": sealed(1, 1, 30), // sealed yesterday, ladder says "much later"
	}, 3))

	sabqi := q[domain.QueueSabqi]
	if sabqi.Status != domain.QueueDue || len(sabqi.Items) != 1 {
		t.Errorf("yesterday's portion is due for Sabqi today, got %s with %d items",
			sabqi.Status, len(sabqi.Items))
	}
	if sabqi.EstimatedMinutes != queueMinutes[domain.QueueSabqi] {
		t.Errorf("one Sabqi portion should be %d min, got %d",
			queueMinutes[domain.QueueSabqi], sabqi.EstimatedMinutes)
	}
	// A new lesson is still available: nothing was sealed today.
	if q[domain.QueueSabaq].Status != domain.QueueDue {
		t.Errorf("Sabaq should be available again, got %s", q[domain.QueueSabaq].Status)
	}
}

func TestBuildQueues_ManzilRestsUntilItIsScheduled(t *testing.T) {
	q := byKey(build(map[string]*domain.PortionState{
		"p1": sealed(40, 1, 6), // old, revised yesterday, next review in 6 days
	}, 3))

	manzil := q[domain.QueueManzil]
	if manzil.Status != domain.QueueRest || len(manzil.Items) != 0 {
		t.Errorf("an old portion scheduled for later is resting, got %s with %d items",
			manzil.Status, len(manzil.Items))
	}
	if manzil.NextReviewAt == nil {
		t.Error("a resting Manzil must tell the learner when it comes back")
	}

	due := byKey(build(map[string]*domain.PortionState{
		"p1": sealed(40, 8, -1), // overdue
	}, 3))[domain.QueueManzil]
	if due.Status != domain.QueueDue || len(due.Items) != 1 {
		t.Errorf("an overdue old portion is Manzil work, got %s with %d items",
			due.Status, len(due.Items))
	}
}

func TestBuildQueues_ManzilIsCappedWeakestFirst(t *testing.T) {
	cfg := domain.DefaultSettings()
	cfg.SRS.ManzilDailyCap = 2

	states := map[string]*domain.PortionState{}
	for i := 1; i <= 5; i++ {
		st := sealed(40, 10, -1)
		st.EMAAccuracy = float64(i) / 10 // p1 weakest
		states[fmt.Sprintf("p%d", i)] = st
	}

	manzil := byKey(buildQueues(testPortions(5), states, &cfg, time.Now()))[domain.QueueManzil]
	if len(manzil.Items) != 2 {
		t.Fatalf("the daily cap should hold Manzil to 2, got %d", len(manzil.Items))
	}
	if manzil.Items[0].Portion.ID != "p1" || manzil.Items[1].Portion.ID != "p2" {
		t.Errorf("the weakest portions come first, got %s and %s",
			manzil.Items[0].Portion.ID, manzil.Items[1].Portion.ID)
	}
	if manzil.TotalPortions != 5 {
		t.Errorf("the cap trims today's work, not the queue's size: got %d", manzil.TotalPortions)
	}
}

func TestBuildQueues_UnfinishedPortionStaysTodaysSabaq(t *testing.T) {
	// One portion sealed today (allowance spent) and another left mid-pipeline:
	// the unfinished one must still be reachable.
	q := byKey(build(map[string]*domain.PortionState{
		"p1": sealed(0, 0, 1),
		"p2": {Stage: domain.StageChallenges},
	}, 3))

	sabaq := q[domain.QueueSabaq]
	if sabaq.Status != domain.QueueDue || len(sabaq.Items) != 1 {
		t.Fatalf("an abandoned portion should still be offered, got %s with %d items",
			sabaq.Status, len(sabaq.Items))
	}
	if sabaq.Items[0].Portion.ID != "p2" {
		t.Errorf("expected the unfinished portion, got %s", sabaq.Items[0].Portion.ID)
	}
}

func TestBuildQueues_FailedSessionDoesNotFakeAManzil(t *testing.T) {
	// The reported bug: finish a portion without passing and the state was
	// written as Stage=sealed with no seal date. Manzil then showed a tick for
	// revision the learner never did, Sabqi stayed locked, and Sabaq handed out
	// the next portion as though the first were memorized.
	q := byKey(build(map[string]*domain.PortionState{
		"p1": {Stage: domain.StageSealed, LastReviewAt: ago(0), NextReviewAt: ahead(1)},
	}, 3))

	if got := q[domain.QueueManzil].Status; got != domain.QueueLocked {
		t.Errorf("Manzil must stay locked, got %s with %d portions",
			got, q[domain.QueueManzil].TotalPortions)
	}
	if got := q[domain.QueueSabqi].Status; got != domain.QueueLocked {
		t.Errorf("Sabqi must stay locked, got %s", got)
	}

	sabaq := q[domain.QueueSabaq]
	if sabaq.Status != domain.QueueDue || len(sabaq.Items) != 1 {
		t.Fatalf("the unfinished portion is still Sabaq, got %s with %d items",
			sabaq.Status, len(sabaq.Items))
	}
	if sabaq.Items[0].Portion.ID != "p1" {
		t.Errorf("expected to be sent back to p1, got %s", sabaq.Items[0].Portion.ID)
	}
}

func TestStartStage_NeverOpensASessionOnTheTerminalStage(t *testing.T) {
	rules := domain.DefaultSettings().Session

	broken := &domain.PortionState{Stage: domain.StageSealed} // no seal date
	if got := startStage(broken, domain.QueueSabaq, rules); got != domain.StageBlindRecite {
		t.Errorf("an undated seal should retry the recall test, got %s", got)
	}

	if got := startStage(&domain.PortionState{Stage: domain.StageChallenges}, domain.QueueSabaq, rules); got != domain.StageChallenges {
		t.Errorf("an unfinished portion resumes where it stopped, got %s", got)
	}
	if got := startStage(nil, domain.QueueSabaq, rules); got != domain.StageListen {
		t.Errorf("a fresh portion starts at listen, got %s", got)
	}

	sealed := &domain.PortionState{Stage: domain.StageSealed, SealedAt: ago(20)}
	if got := startStage(sealed, domain.QueueManzil, rules); got != domain.StageBlindRecite {
		t.Errorf("Manzil recites from memory, got %s", got)
	}
	if got := startStage(sealed, domain.QueueSabqi, rules); got != domain.StageChallenges {
		t.Errorf("Sabqi warms up on the drills, got %s", got)
	}

	lean := domain.SessionRules{BlindRequiredToSeal: false}
	if got := resumeStage(domain.StageSealed, lean); got != domain.StageOpenRecite {
		t.Errorf("with blind recite off the retry is open-book, got %s", got)
	}
}

func TestBuildQueues_PlanFullyMemorized(t *testing.T) {
	states := map[string]*domain.PortionState{}
	for i := 1; i <= 3; i++ {
		states[fmt.Sprintf("p%d", i)] = sealed(40, 1, 6)
	}

	q := byKey(build(states, 3))
	if q[domain.QueueSabaq].Status != domain.QueueComplete {
		t.Errorf("with nothing left to learn Sabaq is complete, got %s", q[domain.QueueSabaq].Status)
	}
	if q[domain.QueueSabqi].Status != domain.QueueLocked {
		t.Errorf("no recent material means Sabqi is empty, got %s", q[domain.QueueSabqi].Status)
	}
}

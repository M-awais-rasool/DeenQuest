package application

import (
	"context"
	"sync"
	"testing"

	"github.com/chawais/deenquest/backend/internal/coach/domain"
)

// A background evaluation racing a completion must not resurrect the insight
// the completion just finished.
//
// This is the shape that made TestPracticeFlowAwardsXPOnce fail about one run
// in five: Ingest evaluates in the background, CompletePractice marks an
// insight done and re-evaluates, and if the two interleave the finished
// insight comes back as active. CompletePractice refuses to pay twice by
// reading that status, so a resurrected insight is claimable XP.
//
// Driving it directly rather than hoping the scheduler cooperates.
func TestConcurrentEvaluationCannotReviveACompletedInsight(t *testing.T) {
	for attempt := 0; attempt < 50; attempt++ {
		repo := newFakeRepo()
		awarder := &fakeAwarder{}
		svc := newTestService(repo, awarder)
		ctx := context.Background()

		var events []domain.TelemetryEvent
		for i := 0; i < 3; i++ {
			events = append(events, confusionEvent("ث", "ت", testNow))
		}
		if _, err := svc.Ingest(ctx, "u1", "b1", events); err != nil {
			t.Fatalf("ingest: %v", err)
		}
		if err := svc.EvaluateUser(ctx, "u1"); err != nil {
			t.Fatalf("evaluate: %v", err)
		}

		insightID := domain.InsightID("u1", domain.RuleConfusionPair, []string{"ت", "ث"})

		// Complete the practice while an evaluation runs alongside it.
		var wg sync.WaitGroup
		wg.Add(2)

		var firstXP int
		go func() {
			defer wg.Done()
			firstXP, _ = svc.CompletePractice(ctx, "u1", insightID)
		}()
		go func() {
			defer wg.Done()
			_ = svc.EvaluateUser(ctx, "u1")
		}()
		wg.Wait()

		// Whichever order they landed in, a second claim must pay nothing.
		secondXP, err := svc.CompletePractice(ctx, "u1", insightID)
		if err != nil {
			t.Fatalf("second CompletePractice: %v", err)
		}
		if secondXP != 0 {
			t.Fatalf("attempt %d: second completion paid %d XP — the insight was revived",
				attempt, secondXP)
		}
		if total := firstXP + secondXP; total != domain.PracticeXP {
			t.Fatalf("attempt %d: paid %d XP in total, want %d",
				attempt, total, domain.PracticeXP)
		}
		if awarder.calls > 1 {
			t.Fatalf("attempt %d: XP awarded %d times, want 1", attempt, awarder.calls)
		}
	}
}

// Several ingests for one user land at once. Each one evaluates in the
// background, and they must not corrupt each other's conclusions.
func TestConcurrentIngestsForOneUserConverge(t *testing.T) {
	repo := newFakeRepo()
	svc := newTestService(repo, &fakeAwarder{})
	ctx := context.Background()

	var wg sync.WaitGroup
	for i := 0; i < 8; i++ {
		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			var events []domain.TelemetryEvent
			for j := 0; j < 3; j++ {
				events = append(events, confusionEvent("ث", "ت", testNow))
			}
			_, _ = svc.Ingest(ctx, "u1", batchKey(n), events)
		}(i)
	}
	wg.Wait()

	if err := svc.EvaluateUser(ctx, "u1"); err != nil {
		t.Fatalf("evaluate: %v", err)
	}

	active, err := repo.ActiveInsights(ctx, "u1", testNow)
	if err != nil {
		t.Fatalf("ActiveInsights: %v", err)
	}

	seen := map[string]bool{}
	for _, ins := range active {
		if seen[ins.ID] {
			t.Errorf("insight %s appears twice in the active set", ins.ID)
		}
		seen[ins.ID] = true
	}
}

func batchKey(n int) string {
	return "batch-" + string(rune('a'+n))
}

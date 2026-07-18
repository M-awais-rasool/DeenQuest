package coach

import (
	"strings"
	"testing"
	"time"
)

func stateWithConfusion(n int) *UserSkillState {
	state := NewUserSkillState("u1")
	for i := 0; i < n; i++ {
		ApplyEvent(state, confusionEvent("ث", "ت", testNow), testNow)
	}
	return state
}

func TestConfusionRuleFiresAtThreshold(t *testing.T) {
	if got := EvaluateRules(stateWithConfusion(2), testNow); len(got) != 0 {
		t.Errorf("2 confusions should not fire the rule, got %+v", got)
	}

	insights := EvaluateRules(stateWithConfusion(3), testNow)
	if len(insights) != 1 {
		t.Fatalf("3 confusions should produce exactly 1 insight, got %d", len(insights))
	}
	ins := insights[0]
	if ins.Rule != RuleConfusionPair || ins.Severity != SeverityHigh {
		t.Errorf("rule/severity = %s/%s, want confusion_pair/high", ins.Rule, ins.Severity)
	}
	if ins.Count != 3 {
		t.Errorf("count = %d, want 3", ins.Count)
	}
	if ins.PracticeLevelID != PairPracticeID("ث", "ت") {
		t.Errorf("practice level id = %d, want %d", ins.PracticeLevelID, PairPracticeID("ث", "ت"))
	}
	if !strings.Contains(ins.Title, "Tha") || !strings.Contains(ins.Title, "Ta") {
		t.Errorf("title should name both letters, got %q", ins.Title)
	}
}

func TestSlowSkillRule(t *testing.T) {
	state := NewUserSkillState("u1")
	state.PaceBaselineMS = 1900
	state.Skills["ص"] = &SkillStat{
		Attempts: 6, Correct: 5, EMAAccuracy: 0.8,
		LastSeen: testNow, AvgLatencyMS: 4000, // > 1.8 × 1900
	}
	insights := EvaluateRules(state, testNow)
	if len(insights) != 1 || insights[0].Rule != RuleSlowSkill {
		t.Fatalf("want one slow_skill insight, got %+v", insights)
	}
	if insights[0].Severity != SeverityMed {
		t.Errorf("severity = %s, want med", insights[0].Severity)
	}

	// Thin data must not trigger it.
	state.Skills["ص"].Attempts = 3
	if got := EvaluateRules(state, testNow); len(got) != 0 {
		t.Errorf("thin data should not fire slow_skill, got %+v", got)
	}
}

func TestDecayRule(t *testing.T) {
	state := NewUserSkillState("u1")
	state.Skills["د"] = &SkillStat{
		Attempts: 12, Correct: 10, EMAAccuracy: 0.85,
		LastSeen: testNow.AddDate(0, 0, -12), // unseen 12d ⇒ mastery ≈ 0.47 < 0.6
	}
	insights := EvaluateRules(state, testNow)
	if len(insights) != 1 || insights[0].Rule != RuleDecay {
		t.Fatalf("want one decay insight, got %+v", insights)
	}
	if insights[0].Count != 12 {
		t.Errorf("days-unseen count = %d, want 12", insights[0].Count)
	}

	// A skill that was never learned well shouldn't be reported as "fading".
	state.Skills["د"].EMAAccuracy = 0.3
	if got := EvaluateRules(state, testNow); len(got) != 0 {
		t.Errorf("never-learned skill should not fire decay, got %+v", got)
	}
}

func TestWinRule(t *testing.T) {
	state := NewUserSkillState("u1")
	state.Skills["ب"] = &SkillStat{
		Attempts: 20, Correct: 19, EMAAccuracy: 0.97, LastSeen: testNow,
	}
	insights := EvaluateRules(state, testNow)
	if len(insights) != 1 || insights[0].Rule != RuleWin {
		t.Fatalf("want one win insight, got %+v", insights)
	}
	if insights[0].Severity != SeverityWin {
		t.Errorf("severity = %s, want win", insights[0].Severity)
	}
}

func TestRankingAndCap(t *testing.T) {
	state := stateWithConfusion(4) // HIGH
	// Two slow skills (MED) + one decayed (MED) + a win.
	state.PaceBaselineMS = 1000
	for _, tag := range []string{"ص", "ض", "ط"} {
		state.Skills[tag] = &SkillStat{
			Attempts: 8, Correct: 6, EMAAccuracy: 0.75,
			LastSeen: testNow, AvgLatencyMS: 3000,
		}
	}
	state.Skills["ب"] = &SkillStat{Attempts: 20, Correct: 19, EMAAccuracy: 0.97, LastSeen: testNow}

	insights := EvaluateRules(state, testNow)

	tiles := 0
	wins := 0
	for _, ins := range insights {
		if ins.Severity == SeverityWin {
			wins++
		} else {
			tiles++
		}
	}
	if tiles != MaxActiveInsights {
		t.Errorf("tile insights = %d, want capped at %d", tiles, MaxActiveInsights)
	}
	if wins != 1 {
		t.Errorf("win insights = %d, want 1 (win is never capped away)", wins)
	}
	if insights[0].Severity != SeverityHigh {
		t.Errorf("first insight severity = %s, want high (ranked first)", insights[0].Severity)
	}
}

func TestInsightIDDeterministic(t *testing.T) {
	a := EvaluateRules(stateWithConfusion(3), testNow)
	b := EvaluateRules(stateWithConfusion(5), testNow.Add(time.Hour))
	if a[0].ID != b[0].ID {
		t.Errorf("same rule+skills must produce the same id: %q vs %q", a[0].ID, b[0].ID)
	}
}

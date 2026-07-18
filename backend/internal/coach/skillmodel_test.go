package coach

import (
	"math"
	"testing"
	"time"
)

var testNow = time.Date(2026, 7, 18, 12, 0, 0, 0, time.UTC)

func boolPtr(b bool) *bool { return &b }

func answerEvent(tag string, correct bool, at time.Time) TelemetryEvent {
	return TelemetryEvent{
		Type:        EventQuestionAnswered,
		TS:          at.UnixMilli(),
		Interaction: "choice",
		SkillTags:   []string{tag},
		Correct:     boolPtr(correct),
		LatencyMS:   2000,
	}
}

func confusionEvent(expected, chosen string, at time.Time) TelemetryEvent {
	ev := answerEvent(expected, false, at)
	ev.Expected = expected
	ev.Chosen = chosen
	return ev
}

func TestApplyEventEMA(t *testing.T) {
	state := NewUserSkillState("u1")

	ApplyEvent(state, answerEvent("ت", true, testNow), testNow)
	s := state.Skills["ت"]
	if s == nil || s.EMAAccuracy != 1.0 {
		t.Fatalf("first correct answer should seed EMA at 1.0, got %+v", s)
	}

	ApplyEvent(state, answerEvent("ت", false, testNow), testNow)
	want := (1 - emaAlpha) * 1.0 // α·0 + (1-α)·1
	if math.Abs(s.EMAAccuracy-want) > 1e-9 {
		t.Errorf("EMA after one miss = %v, want %v", s.EMAAccuracy, want)
	}
	if s.Attempts != 2 || s.Correct != 1 {
		t.Errorf("attempts/correct = %d/%d, want 2/1", s.Attempts, s.Correct)
	}
}

func TestMasteryDecayHalfLife(t *testing.T) {
	s := &SkillStat{EMAAccuracy: 1.0, LastSeen: testNow.AddDate(0, 0, -14)}
	m := Mastery(s, testNow)
	if math.Abs(m-0.5) > 1e-9 {
		t.Errorf("mastery after one half-life = %v, want 0.5", m)
	}
	fresh := &SkillStat{EMAAccuracy: 0.9, LastSeen: testNow}
	if got := Mastery(fresh, testNow); math.Abs(got-0.9) > 1e-9 {
		t.Errorf("fresh mastery = %v, want 0.9", got)
	}
}

func TestConfusionTrackingAndWindow(t *testing.T) {
	state := NewUserSkillState("u1")

	// 3 recent confusions + 1 outside the 7-day window.
	for i := 0; i < 3; i++ {
		ApplyEvent(state, confusionEvent("ث", "ت", testNow), testNow)
	}
	old := testNow.AddDate(0, 0, -8)
	ApplyEvent(state, confusionEvent("ث", "ت", old), testNow)

	pairs := TopConfusions(state, testNow)
	if len(pairs) != 1 || pairs[0].Count != 3 {
		t.Fatalf("confusions = %+v, want one ث→ت pair with count 3", pairs)
	}

	Prune(state, testNow)
	if _, ok := state.Confusions["ث→ت"][dayKey(old)]; ok {
		t.Error("Prune should drop confusion buckets older than 7 days")
	}
}

func TestConfusionRequiresArabicTokens(t *testing.T) {
	state := NewUserSkillState("u1")
	ev := confusionEvent("ث", "ت", testNow)
	ev.Chosen = "B" // not Arabic — must not count
	ApplyEvent(state, ev, testNow)
	if len(state.Confusions) != 0 {
		t.Errorf("non-Arabic tokens must not enter the confusion matrix: %+v", state.Confusions)
	}

	ev = confusionEvent("ث", "ت", testNow)
	ev.Interaction = "record" // only choice/hunt count
	ApplyEvent(state, ev, testNow)
	if len(state.Confusions) != 0 {
		t.Errorf("non choice/hunt interactions must not enter the confusion matrix")
	}
}

func TestWeekAccuracyShape(t *testing.T) {
	state := NewUserSkillState("u1")
	// testNow (2026-07-18) is a Saturday; Monday of that week is 07-13.
	monday := time.Date(2026, 7, 13, 10, 0, 0, 0, time.UTC)
	ApplyEvent(state, answerEvent("ت", true, monday), testNow)
	ApplyEvent(state, answerEvent("ت", false, monday), testNow)

	week, _ := WeekAccuracy(state, testNow)
	if len(week) != 7 {
		t.Fatalf("week has %d entries, want 7", len(week))
	}
	if math.Abs(week[0]-0.5) > 1e-9 {
		t.Errorf("Monday accuracy = %v, want 0.5", week[0])
	}
	for i := 1; i < 7; i++ {
		if i == 5 { // Saturday has no data either in this test
			continue
		}
		if week[i] != -1 {
			t.Errorf("day %d accuracy = %v, want -1 (no data)", i, week[i])
		}
	}
}

func TestPaceBaseline(t *testing.T) {
	state := NewUserSkillState("u1")
	ApplyEvent(state, answerEvent("ت", true, testNow), testNow)
	if state.PaceBaselineMS != 2000 {
		t.Errorf("pace baseline seeded at %v, want 2000", state.PaceBaselineMS)
	}
}

func TestLessonsInWindow(t *testing.T) {
	state := NewUserSkillState("u1")
	lesson := TelemetryEvent{Type: EventLessonCompleted, TS: testNow.UnixMilli()}
	ApplyEvent(state, lesson, testNow)
	ApplyEvent(state, lesson, testNow)
	if got := LessonsInWindow(state, testNow, 7); got != 2 {
		t.Errorf("lessons in window = %d, want 2", got)
	}
}

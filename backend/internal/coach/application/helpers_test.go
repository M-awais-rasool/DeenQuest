package application

import (
	"time"

	"github.com/chawais/deenquest/backend/internal/coach/domain"
)

// Test helpers shared by the application-layer tests. They mirror the ones in
// the domain test package (the two packages cannot share a _test.go file).

var testNow = time.Date(2026, 7, 18, 12, 0, 0, 0, time.UTC)

func boolPtr(b bool) *bool { return &b }

func answerEvent(tag string, correct bool, at time.Time) domain.TelemetryEvent {
	return domain.TelemetryEvent{
		Type:        domain.EventQuestionAnswered,
		TS:          at.UnixMilli(),
		Interaction: "choice",
		SkillTags:   []string{tag},
		Correct:     boolPtr(correct),
		LatencyMS:   2000,
	}
}

func confusionEvent(expected, chosen string, at time.Time) domain.TelemetryEvent {
	ev := answerEvent(expected, false, at)
	ev.Expected = expected
	ev.Chosen = chosen
	return ev
}

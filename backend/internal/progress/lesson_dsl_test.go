package progress

import (
	"strings"
	"testing"
)

func dslIssues(t *testing.T, data map[string]any) []LintIssue {
	t.Helper()
	return ValidateLessonDSL(1, "lesson 1 (engine)", data)
}

func wantIssue(t *testing.T, issues []LintIssue, fragment string) {
	t.Helper()
	for _, issue := range issues {
		if strings.Contains(issue.Msg, fragment) {
			return
		}
	}
	t.Errorf("expected an issue containing %q, got %v", fragment, issues)
}

func TestValidateLessonDSL_Valid(t *testing.T) {
	valid := []map[string]any{
		{
			"interaction": "choice",
			"content": map[string]any{
				"rounds": []any{
					map[string]any{"prompt": "Tap Ta", "options": []any{"ت", "ث"}, "correct": float64(0)},
				},
			},
		},
		{
			"interaction":  "teach",
			"presentation": map[string]any{"glyph_size": "xl"},
			"content": map[string]any{
				"letters": []any{map[string]any{"letter": "ب", "name": "بَاء"}},
			},
		},
		{
			"interaction": "choice",
			"presentation": map[string]any{
				"layout": "binary",
			},
			"content": map[string]any{
				"rounds": []any{
					map[string]any{"prompt": "Two dots?", "arabic": "ت", "answer": true},
				},
			},
		},
		{
			"interaction": "hunt",
			"content": map[string]any{
				"target": "ث",
				"grid":   []any{"ت", "ث", "ب"},
			},
		},
	}

	for i, doc := range valid {
		if issues := dslIssues(t, doc); len(issues) > 0 {
			t.Errorf("case %d: expected clean, got %v", i, issues)
		}
	}
}

func TestValidateLessonDSL_Rejects(t *testing.T) {
	// Unknown interaction.
	wantIssue(t, dslIssues(t, map[string]any{
		"interaction": "dance",
		"content":     map[string]any{},
	}), "unknown interaction")

	// Missing content.
	wantIssue(t, dslIssues(t, map[string]any{
		"interaction": "choice",
	}), "no content")

	// Future engine version — no shipped app could play it.
	wantIssue(t, dslIssues(t, map[string]any{
		"interaction":        "steps",
		"min_engine_version": float64(99),
		"content":            map[string]any{"steps": []any{"a"}},
	}), "newer than the shipped engine")

	// Lightning timer under the floor.
	wantIssue(t, dslIssues(t, map[string]any{
		"interaction": "choice",
		"modifiers":   map[string]any{"timed_seconds": float64(3)},
		"content": map[string]any{
			"rounds": []any{
				map[string]any{"prompt": "x", "options": []any{"ت", "ث"}, "correct": float64(0)},
			},
		},
	}), "under the")

	// Correct index out of range.
	wantIssue(t, dslIssues(t, map[string]any{
		"interaction": "choice",
		"content": map[string]any{
			"rounds": []any{
				map[string]any{"prompt": "x", "options": []any{"ت", "ث"}, "correct": float64(5)},
			},
		},
	}), "out of range")

	// Non-Arabic answer options.
	wantIssue(t, dslIssues(t, map[string]any{
		"interaction": "choice",
		"content": map[string]any{
			"rounds": []any{
				map[string]any{"prompt": "x", "options": []any{"ta", "tha"}, "correct": float64(0)},
			},
		},
	}), "Arabic script")

	// Teach with no recognizable payload.
	wantIssue(t, dslIssues(t, map[string]any{
		"interaction": "teach",
		"content":     map[string]any{"bogus": true},
	}), "no known shape")
}

// TestNewCategoryNeedsNoCode is the scalability contract of Part 2 in
// executable form: a level introducing a CATEGORY that exists nowhere in the
// codebase ("tajweed" — no enum entry, no component, no chip color) and whose
// lessons are authored purely in the Lesson DSL must sail through the full
// content pipeline. If tomorrow brings 40 new lesson types, they are 40 JSON
// entries — zero new files. Only a genuinely new *interaction pattern*
// (beyond the 9 primitives) ever needs code.
func TestNewCategoryNeedsNoCode(t *testing.T) {
	newCategoryLevel := Level{
		ID:          950,
		CourseType:  CoursePractice,
		CourseLevel: 950,
		Title:       "Tajweed: Qalqalah",
		Theme:       "Tajweed Rules",
		Goal:        "Feel the echo letters bounce",
		XPReward:    15,
		Difficulty:  LevelEasy,
		Lessons: []Lesson{
			{
				Type:       "tajweed", // ← category invented right here, in data
				Title:      "Meet the Echo Letters",
				ScreenType: ScreenAction,
				Component:  EngineComponent,
				Data: map[string]any{
					"interaction": "teach",
					"content": map[string]any{
						"letters": []any{
							map[string]any{"letter": "ق", "name": "قَاف"},
							map[string]any{"letter": "ط", "name": "طَاء"},
							map[string]any{"letter": "ب", "name": "بَاء"},
						},
					},
				},
			},
			{
				Type:       "tajweed",
				Title:      "Which One Echoes?",
				ScreenType: ScreenQuiz,
				Component:  EngineComponent,
				Data: map[string]any{
					"interaction": "choice",
					"content": map[string]any{
						"rounds": []any{
							map[string]any{
								"prompt":  "Tap the qalqalah letter",
								"options": []any{"ق", "س", "م"},
								"correct": float64(0),
							},
						},
					},
				},
			},
		},
		MiniGame: MiniGame{
			Type:        GameTapMatch,
			Description: "Match the echo letters",
			Data: map[string]any{
				"pairs": []any{
					map[string]any{"left": "ق", "right": "قَاف"},
					map[string]any{"left": "ط", "right": "طَاء"},
				},
			},
		},
	}

	if issues := LintLevels([]Level{newCategoryLevel}); len(issues) > 0 {
		t.Errorf("a data-only new category should lint clean, got %v", issues)
	}
}

package domain

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

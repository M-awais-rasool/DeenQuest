package content

import (
	"testing"

	"github.com/chawais/deenquest/backend/internal/level"
)

func TestContentLintClean(t *testing.T) {
	issues := LintLevels(level.SeedLevels())
	for _, issue := range issues {
		t.Errorf("%s", issue)
	}
}

func TestNewCategoryNeedsNoCode(t *testing.T) {
	newCategoryLevel := level.Level{
		ID:          950,
		CourseType:  level.CoursePractice,
		CourseLevel: 950,
		Title:       "Tajweed: Qalqalah",
		Theme:       "Tajweed Rules",
		Goal:        "Feel the echo letters bounce",
		XPReward:    15,
		Difficulty:  level.LevelEasy,
		Lessons: []level.Lesson{
			{
				Type:       "tajweed", // ← category invented right here, in data
				Title:      "Meet the Echo Letters",
				ScreenType: level.ScreenAction,
				Component:  level.EngineComponent,
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
				ScreenType: level.ScreenQuiz,
				Component:  level.EngineComponent,
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
		MiniGame: level.MiniGame{
			Type:        level.GameTapMatch,
			Description: "Match the echo letters",
			Data: map[string]any{
				"pairs": []any{
					map[string]any{"left": "ق", "right": "قَاف"},
					map[string]any{"left": "ط", "right": "طَاء"},
				},
			},
		},
	}

	if issues := LintLevels([]level.Level{newCategoryLevel}); len(issues) > 0 {
		t.Errorf("a data-only new category should lint clean, got %v", issues)
	}
}

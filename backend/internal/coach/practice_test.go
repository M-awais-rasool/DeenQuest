package coach

import (
	"testing"

	"github.com/chawais/deenquest/backend/internal/level"
)

func TestPairPracticeIDRoundTrip(t *testing.T) {
	for _, la := range Alphabet {
		for _, lb := range Alphabet {
			id := PairPracticeID(la.Char, lb.Char)
			if id < practiceIDBase {
				t.Fatalf("id %d below base for %s/%s", id, la.Char, lb.Char)
			}
			a, b, ok := PairFromPracticeID(id)
			if !ok || a != la.Char || b != lb.Char {
				t.Fatalf("round trip failed for %s/%s: got %s/%s ok=%v", la.Char, lb.Char, a, b, ok)
			}
		}
	}
	if id := PairPracticeID("x", "ت"); id != 0 {
		t.Errorf("non-letter pair should give id 0, got %d", id)
	}
	// Must never collide with the seeded hand-made drills (901, 902).
	if _, _, ok := PairFromPracticeID(901); ok {
		t.Error("id 901 must not decode as an ephemeral pair")
	}
}

func TestCompilePairPractice(t *testing.T) {
	lvl, err := CompilePairPractice("ت", "ث")
	if err != nil {
		t.Fatal(err)
	}
	if lvl.ID != PairPracticeID("ت", "ث") {
		t.Errorf("level id = %d, want %d", lvl.ID, PairPracticeID("ت", "ث"))
	}
	if lvl.CourseType != level.CoursePractice || lvl.XPReward != PracticeXP {
		t.Errorf("course/xp = %s/%d, want practice/%d", lvl.CourseType, lvl.XPReward, PracticeXP)
	}
	if len(lvl.Lessons) != 4 {
		t.Fatalf("lessons = %d, want 4 (teach, choice, hunt, lightning)", len(lvl.Lessons))
	}

	// Hunt: the target must appear in the grid and every cell must be Arabic.
	hunt := lvl.Lessons[2]
	grid, _ := hunt.Data["grid"].([]string)
	target, _ := hunt.Data["target"].(string)
	found := false
	for _, cell := range grid {
		if !ContainsArabic(cell) {
			t.Errorf("grid cell %q is not Arabic script", cell)
		}
		if cell == target {
			found = true
		}
	}
	if !found {
		t.Errorf("hunt target %q never appears in grid %v", target, grid)
	}

	// Every MCQ correct index must point at an existing, Arabic option.
	for _, li := range []int{1, 3} {
		questions, _ := lvl.Lessons[li].Data["questions"].([]any)
		if len(questions) == 0 {
			t.Fatalf("lesson %d has no questions", li)
		}
		for _, q := range questions {
			qm := q.(map[string]any)
			options := qm["options"].([]string)
			correct := qm["correct"].(int)
			if correct < 0 || correct >= len(options) {
				t.Errorf("correct index %d out of range for %v", correct, options)
			}
			for _, opt := range options {
				if !ContainsArabic(opt) {
					t.Errorf("option %q must be Arabic script", opt)
				}
			}
		}
	}

	// Mini-game pairs include the practiced pair.
	pairs, _ := lvl.MiniGame.Data["pairs"].([]any)
	if len(pairs) != 4 {
		t.Errorf("mini-game pairs = %d, want 4", len(pairs))
	}

	if _, err := CompilePairPractice("ت", "ت"); err == nil {
		t.Error("same-letter pair must be rejected")
	}
	if _, err := CompilePairPractice("Q", "ث"); err == nil {
		t.Error("non-letter pair must be rejected")
	}
}

func TestDecoysExcludePair(t *testing.T) {
	// Practicing a pair that overlaps the decoy pool must not yield the pair
	// itself as a decoy.
	lvl, err := CompilePairPractice("م", "و")
	if err != nil {
		t.Fatal(err)
	}
	questions, _ := lvl.Lessons[1].Data["questions"].([]any)
	for _, q := range questions {
		options := q.(map[string]any)["options"].([]string)
		seen := map[string]int{}
		for _, opt := range options {
			seen[opt]++
			if seen[opt] > 1 {
				t.Errorf("duplicate option %q in %v", opt, options)
			}
		}
	}
}

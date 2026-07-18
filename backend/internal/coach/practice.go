package coach

import (
	"fmt"

	"github.com/chawais/deenquest/backend/internal/level"
)

const practiceIDBase = 900000
const PracticeXP = 15

func PairPracticeID(a, b string) int {
	ia, okA := letterIndex[a]
	ib, okB := letterIndex[b]
	if !okA || !okB {
		return 0
	}
	return practiceIDBase + ia*len(Alphabet) + ib
}

func PairFromPracticeID(id int) (a, b string, ok bool) {
	n := id - practiceIDBase
	max := len(Alphabet) * len(Alphabet)
	if n < 0 || n >= max {
		return "", "", false
	}
	return Alphabet[n/len(Alphabet)].Char, Alphabet[n%len(Alphabet)].Char, true
}

var easyDecoys = []string{"م", "و", "ل", "ك", "ع", "س"}

func CompilePairPractice(a, b string) (*level.Level, error) {
	la, okA := LookupLetter(a)
	lb, okB := LookupLetter(b)
	if !okA || !okB || a == b {
		return nil, fmt.Errorf("coach: no practice recipe for pair %q/%q", a, b)
	}

	decoys := pickDecoys(2, a, b)
	d1, d2 := decoys[0], decoys[1]
	d1Name := mustName(d1)

	lessons := []level.Lesson{
		{
			Type: level.LessonQaida, Title: "Look Closely",
			Description: fmt.Sprintf("Two letters, one difference — %s vs %s", a, b),
			ScreenType:  level.ScreenAction, Component: "LetterIntroComponent",
			SkillTags: []string{a, b},
			Data: map[string]any{
				"letters": []any{
					map[string]any{"letter": a, "name": la.Name},
					map[string]any{"letter": b, "name": lb.Name},
				},
			},
		},
		{
			Type: level.LessonQuiz, Title: "Pick the Right One",
			Description: "Choose carefully — the coach is watching",
			ScreenType:  level.ScreenQuiz, Component: "MCQComponent",
			SkillTags: []string{a, b},
			Data: map[string]any{
				"questions": []any{
					mcq(fmt.Sprintf("Tap %s", la.Name), []string{b, a, d1, d2}, 1),
					mcq(fmt.Sprintf("Tap %s", lb.Name), []string{a, d1, b, d2}, 2),
					mcq(fmt.Sprintf("Tap %s", d1Name), []string{b, d1, a, d2}, 1),
				},
			},
		},
		{
			Type: level.LessonQaida, Title: "Letter Hunt",
			Description: fmt.Sprintf("Find every %s — ignore the lookalikes", lb.Name),
			ScreenType:  level.ScreenAction, Component: "LetterHuntComponent",
			SkillTags: []string{b},
			Data: map[string]any{
				"instruction": fmt.Sprintf("Tap every %s — don't let %s trick you!", b, a),
				"target":      b,
				"grid":        []string{a, b, d1, b, d2, a, b, d1, a, b, d2, a},
			},
		},
		{
			Type: level.LessonRevision, Title: "Lightning Review",
			Description: "Fast rounds — trust your eyes",
			ScreenType:  level.ScreenQuiz, Component: "LightningRoundComponent",
			SkillTags: []string{a, b},
			Data: map[string]any{
				"seconds": 6,
				"questions": []any{
					mcq(fmt.Sprintf("Tap %s", la.Name), []string{b, a, d1}, 1),
					mcq(fmt.Sprintf("Tap %s", lb.Name), []string{b, d1, a}, 0),
					mcq(fmt.Sprintf("Tap %s", la.Name), []string{d2, b, a}, 2),
					mcq(fmt.Sprintf("Tap %s", lb.Name), []string{a, b, d2}, 1),
				},
			},
		},
	}

	return &level.Level{
		ID:          PairPracticeID(a, b),
		CourseType:  level.CoursePractice,
		CourseLevel: 1,
		Title:       fmt.Sprintf("Coach Practice: %s vs %s", LatinName(a), LatinName(b)),
		Theme:       "Targeted Practice",
		Goal:        fmt.Sprintf("Master the letters your coach flagged: %s vs %s", a, b),
		Lessons:     lessons,
		MiniGame: level.MiniGame{
			Type:        level.GameTapMatch,
			Description: "Match each letter to its name",
			SkillTags:   []string{a, b},
			Data: map[string]any{
				"pairs": []any{
					map[string]any{"left": a, "right": la.Name},
					map[string]any{"left": b, "right": lb.Name},
					map[string]any{"left": d1, "right": mustName(d1)},
					map[string]any{"left": d2, "right": mustName(d2)},
				},
			},
		},
		XPReward:   PracticeXP,
		Difficulty: level.LevelEasy,
	}, nil
}

func mcq(question string, options []string, correct int) map[string]any {
	return map[string]any{"question": question, "options": options, "correct": correct}
}

func pickDecoys(n int, exclude ...string) []string {
	excluded := map[string]bool{}
	for _, e := range exclude {
		excluded[e] = true
	}
	out := make([]string, 0, n)
	for _, d := range easyDecoys {
		if excluded[d] {
			continue
		}
		out = append(out, d)
		if len(out) == n {
			break
		}
	}
	return out
}

func mustName(char string) string {
	if l, ok := LookupLetter(char); ok {
		return l.Name
	}
	return char
}

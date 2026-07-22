package domain

import "fmt"

const LessonEngineVersion = 1

var validInteractions = map[string]bool{
	"teach":    true,
	"choice":   true,
	"match":    true,
	"sequence": true,
	"sort":     true,
	"hunt":     true,
	"steps":    true,
	"record":   true,
	"blank":    true,
}

func ValidateLessonDSL(id int, where string, data map[string]any) []LintIssue {
	var issues []LintIssue
	add := func(format string, args ...any) {
		issues = append(issues, LintIssue{LevelID: id, Where: where, Msg: fmt.Sprintf(format, args...)})
	}

	interaction := str(data, "interaction")
	if interaction == "" {
		add("engine lesson has no interaction")
		return issues
	}
	if !validInteractions[interaction] {
		add("unknown interaction %q", interaction)
		return issues
	}

	if v := int(num(data, "min_engine_version")); v > LessonEngineVersion {
		add("min_engine_version %d is newer than the shipped engine (v%d) — no app could play it", v, LessonEngineVersion)
	}

	content, _ := data["content"].(map[string]any)
	if content == nil {
		add("engine lesson has no content")
		return issues
	}

	presentation, _ := data["presentation"].(map[string]any)
	modifiers, _ := data["modifiers"].(map[string]any)

	switch interaction {
	case "teach":
		issues = append(issues, validateTeach(id, where, content)...)
	case "choice":
		issues = append(issues, validateChoice(id, where, content, presentation, modifiers)...)
	case "match":
		issues = append(issues, lintPairs(id, where, content, maxMatchPairs)...)
	case "sequence":
		parts := strList(content, "parts")
		if len(parts) == 0 {
			add("sequence has no parts")
		}
		for _, p := range append(parts, strList(content, "distractors")...) {
			if !containsArabic(p) {
				add("builder token %q must be Arabic script", p)
			}
		}
	case "sort":
		buckets := strList(content, "buckets")
		if len(buckets) < 2 || len(buckets) > 3 {
			add("must have 2–3 buckets, has %d", len(buckets))
		}
		items, _ := content["items"].([]any)
		if len(items) == 0 {
			add("no items to sort")
		}
		for _, it := range items {
			item, _ := it.(map[string]any)
			if item == nil {
				continue
			}
			if !containsArabic(str(item, "text")) {
				add("sort item %q must be Arabic script", str(item, "text"))
			}
			if b := int(num(item, "bucket")); b < 0 || b >= len(buckets) {
				add("item %q bucket index %d out of range", str(item, "text"), b)
			}
		}
	case "hunt":
		grid := strList(content, "grid")
		target := str(content, "target")
		if len(grid) == 0 || len(grid) > maxGridCells {
			add("grid must have 1..%d cells, has %d", maxGridCells, len(grid))
		}
		if !containsArabic(target) {
			add("target must be Arabic script")
		}
		found := false
		for _, cell := range grid {
			if cell == target {
				found = true
				break
			}
		}
		if !found {
			add("target %q never appears in the grid", target)
		}
	case "steps":
		if len(strList(content, "steps")) == 0 {
			add("steps interaction has no steps")
		}
	case "record":
		items, _ := content["items"].([]any)
		rounds, _ := content["rounds"].([]any)
		if len(items) == 0 && len(rounds) == 0 {
			add("record interaction has no items or rounds")
		}
	case "blank":
		issues = append(issues, lintFillBlank(id, where, content)...)
	}

	return issues
}

func validateTeach(id int, where string, content map[string]any) []LintIssue {
	letters, _ := content["letters"].([]any)
	tips := strList(content, "tips")
	hasForms := content["forms"] != nil && str(content, "letter") != ""
	hasHadith := str(content, "hadith") != ""
	hasReader := str(content, "text") != "" && str(content, "surah") != ""
	hasCert := str(content, "title") != "" && (str(content, "message") != "" || str(content, "next_phase") != "")
	hasDua := containsArabic(str(content, "arabic"))

	if len(letters) > 0 || len(tips) > 0 || hasForms || hasHadith || hasReader || hasCert || hasDua {
		return nil
	}
	return []LintIssue{{
		LevelID: id,
		Where:   where,
		Msg:     "teach content matches no known shape (letters / forms / tips / hadith / text+surah / title+message / arabic)",
	}}
}

func validateChoice(id int, where string, content, presentation, modifiers map[string]any) []LintIssue {
	var issues []LintIssue
	add := func(format string, args ...any) {
		issues = append(issues, LintIssue{LevelID: id, Where: where, Msg: fmt.Sprintf(format, args...)})
	}

	rounds, _ := content["rounds"].([]any)
	if len(rounds) == 0 {
		add("choice interaction has no rounds")
		return issues
	}

	if timed := num(modifiers, "timed_seconds"); timed > 0 && timed < minLightningSecs {
		add("timed_seconds %v is under the %d s floor", timed, minLightningSecs)
	}

	binary := presentation != nil && str(presentation, "layout") == "binary"

	for _, r := range rounds {
		round, _ := r.(map[string]any)
		if round == nil {
			continue
		}
		if binary {
			if !containsArabic(str(round, "arabic")) {
				add("binary round %q must show Arabic script", str(round, "prompt"))
			}
			if _, ok := round["answer"].(bool); !ok {
				add("binary round %q has no boolean answer", str(round, "prompt"))
			}
			continue
		}
		// Reflection rounds (no correct answer) only need options.
		if _, hasCorrect := round["correct"]; !hasCorrect {
			if len(strList(round, "options")) == 0 {
				add("round %q has neither correct index nor options", str(round, "prompt"))
			}
			continue
		}
		issues = append(issues, lintChoice(id, where, round, true)...)
	}

	return issues
}

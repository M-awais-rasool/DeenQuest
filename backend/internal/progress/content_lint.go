package progress

import (
	"fmt"
	"regexp"
	"strings"
)

// Content linting — the difficulty and correctness guards from the curriculum
// plan (§1.4), enforced as data checks so bad content can never ship. One
// source of truth used by cmd/contentlint (CI) and seed_content_test.go.

// LintIssue points at one problem in one level.
type LintIssue struct {
	LevelID int
	Where   string // "lesson 3 (MCQComponent)" / "mini_game" / "level"
	Msg     string
}

func (i LintIssue) String() string {
	return fmt.Sprintf("level %d · %s: %s", i.LevelID, i.Where, i.Msg)
}

// Difficulty guards (curriculum plan §1.4).
const (
	maxChoiceOptions  = 4
	maxGridCells      = 12
	minLightningSecs  = 6
	minLessonsQaida   = 4
	maxLessonsQaida   = 6
	maxMatchPairs     = 6
	minXP             = 10
	maxXP             = 100
	qaidaLevelCount   = 50
	practiceIDFloor   = 900
	certificateEvery  = 10
	componentCertName = "CertificateComponent"
)

// knownComponents mirrors the app's LESSON_COMPONENT_MAP — a content chunk may
// only reference components the app can actually render.
var knownComponents = map[string]bool{
	"LetterIntroComponent":     true,
	"PronunciationComponent":   true,
	"DuaCardComponent":         true,
	"HadithComponent":          true,
	"QuizComponent":            true,
	"TipsComponent":            true,
	"LetterFormsComponent":     true,
	"QuranReaderComponent":     true,
	"ReflectionComponent":      true,
	"PrayerChecklistComponent": true,
	"CertificateComponent":     true,
	"MCQComponent":             true,
	"FillBlankComponent":       true,
	"AyahBuilderComponent":     true,
	"MatchPairsComponent":      true,
	"ListenChooseComponent":    true,
	"TrueFalseComponent":       true,
	"LetterHuntComponent":      true,
	"SortBucketsComponent":     true,
	"LightningRoundComponent":  true,
}

var knownMiniGames = map[MiniGameType]bool{
	GameTapMatch:     true,
	GameListenChoose: true,
	GameDragDrop:     true,
	GameRepeatVoice:  true,
	GameMCQ:          true,
	GameMemoryCards:  true,
}

var arabicRe = regexp.MustCompile(`[\x{0600}-\x{06FF}\x{0750}-\x{077F}\x{08A0}-\x{08FF}\x{FB50}-\x{FDFF}\x{FE70}-\x{FEFF}]`)

func containsArabic(s string) bool { return arabicRe.MatchString(s) }

// LintLevels runs every guard over the given levels and returns all issues
// found (empty = clean).
func LintLevels(levels []Level) []LintIssue {
	var issues []LintIssue
	add := func(id int, where, format string, args ...any) {
		issues = append(issues, LintIssue{LevelID: id, Where: where, Msg: fmt.Sprintf(format, args...)})
	}

	seenIDs := map[int]bool{}
	qaidaIDs := map[int]bool{}

	for _, level := range levels {
		id := level.ID

		// ── level-shape guards ──
		if seenIDs[id] {
			add(id, "level", "duplicate level ID")
		}
		seenIDs[id] = true

		switch level.CourseType {
		case CourseQaida:
			qaidaIDs[id] = true
			if id < 1 || id > qaidaLevelCount {
				add(id, "level", "qaida level ID must be 1..%d", qaidaLevelCount)
			}
			if n := len(level.Lessons); n < minLessonsQaida || n > maxLessonsQaida {
				add(id, "level", "qaida level must have %d–%d lessons, has %d", minLessonsQaida, maxLessonsQaida, n)
			}
		case CoursePractice:
			if id < practiceIDFloor {
				add(id, "level", "practice level ID must be ≥ %d", practiceIDFloor)
			}
			if len(level.Lessons) == 0 {
				add(id, "level", "practice level has no lessons")
			}
		default:
			add(id, "level", "unknown course type %q", level.CourseType)
		}

		if level.CourseLevel != id {
			add(id, "level", "course_level (%d) must equal id", level.CourseLevel)
		}
		if strings.TrimSpace(level.Title) == "" {
			add(id, "level", "title is empty")
		}
		if strings.TrimSpace(level.Goal) == "" {
			add(id, "level", "goal is empty")
		}
		if level.XPReward < minXP || level.XPReward > maxXP {
			add(id, "level", "xp_reward %d outside %d..%d", level.XPReward, minXP, maxXP)
		}
		// Easy → normal only. "hard" is banned by design.
		if level.Difficulty != LevelEasy && level.Difficulty != LevelMedium {
			add(id, "level", "difficulty must be easy or medium, got %q", level.Difficulty)
		}

		// ── lesson guards ──
		for li, lesson := range level.Lessons {
			where := fmt.Sprintf("lesson %d (%s)", li+1, lesson.Component)
			if !knownComponents[lesson.Component] {
				add(id, where, "unknown component")
				continue
			}
			if strings.TrimSpace(lesson.Title) == "" {
				add(id, where, "title is empty")
			}
			issues = append(issues, lintLessonData(id, where, lesson)...)
		}

		// ── mini-game guards ──
		if !knownMiniGames[level.MiniGame.Type] {
			add(id, "mini_game", "unknown mini-game type %q", level.MiniGame.Type)
		}
		issues = append(issues, lintMiniGame(id, level.MiniGame)...)
	}

	// ── curriculum-shape guards (qaida course as a whole) ──
	if len(qaidaIDs) > 0 {
		for want := 1; want <= qaidaLevelCount; want++ {
			if !qaidaIDs[want] {
				issues = append(issues, LintIssue{LevelID: want, Where: "curriculum", Msg: "missing qaida level"})
			}
		}
		for _, level := range levels {
			if level.CourseType != CourseQaida || level.ID%certificateEvery != 0 {
				continue
			}
			hasCert := false
			for _, lesson := range level.Lessons {
				if lesson.Component == componentCertName {
					hasCert = true
					break
				}
			}
			if !hasCert {
				issues = append(issues, LintIssue{LevelID: level.ID, Where: "curriculum", Msg: "checkpoint level must end with a CertificateComponent"})
			}
		}
	}

	return issues
}

// lintLessonData checks per-component data invariants: index in range, option
// counts, timers, and the Arabic-only rule for interactive answers.
func lintLessonData(id int, where string, lesson Lesson) []LintIssue {
	var issues []LintIssue
	add := func(format string, args ...any) {
		issues = append(issues, LintIssue{LevelID: id, Where: where, Msg: fmt.Sprintf(format, args...)})
	}
	data := lesson.Data

	switch lesson.Component {
	case "MCQComponent", "QuizComponent":
		for _, q := range questionList(data) {
			issues = append(issues, lintChoice(id, where, q, true)...)
		}
	case "ListenChooseComponent":
		issues = append(issues, lintChoice(id, where, data, true)...)
		if str(data, "audio") == "" {
			add("audio is empty")
		}
	case "LightningRoundComponent":
		if secs := num(data, "seconds"); secs < minLightningSecs {
			add("timer %v s is under the %d s floor", secs, minLightningSecs)
		}
		qs := questionList(data)
		if len(qs) == 0 {
			add("no questions")
		}
		for _, q := range qs {
			issues = append(issues, lintChoice(id, where, q, true)...)
		}
	case "TrueFalseComponent":
		rounds, _ := data["rounds"].([]any)
		if len(rounds) == 0 {
			add("no rounds")
		}
		for _, r := range rounds {
			round, _ := r.(map[string]any)
			if round == nil {
				continue
			}
			if !containsArabic(str(round, "arabic")) {
				add("round %q must show Arabic script", str(round, "prompt"))
			}
			if _, ok := round["answer"].(bool); !ok {
				add("round %q has no boolean answer", str(round, "prompt"))
			}
		}
	case "LetterHuntComponent":
		grid := strList(data, "grid")
		target := str(data, "target")
		if len(grid) == 0 || len(grid) > maxGridCells {
			add("grid must have 1..%d cells, has %d", maxGridCells, len(grid))
		}
		if !containsArabic(target) {
			add("target must be Arabic script")
		}
		found := 0
		for _, cell := range grid {
			if !containsArabic(cell) {
				add("grid cell %q must be Arabic script", cell)
			}
			if cell == target {
				found++
			}
		}
		if found == 0 {
			add("target %q never appears in the grid", target)
		}
	case "SortBucketsComponent":
		buckets := strList(data, "buckets")
		if len(buckets) < 2 || len(buckets) > 3 {
			add("must have 2–3 buckets, has %d", len(buckets))
		}
		items, _ := data["items"].([]any)
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
	case "MatchPairsComponent":
		issues = append(issues, lintPairs(id, where, data, maxMatchPairs)...)
	case "FillBlankComponent":
		issues = append(issues, lintFillBlank(id, where, data)...)
	case "AyahBuilderComponent":
		parts := strList(data, "parts")
		if len(parts) == 0 {
			add("no parts to build")
		}
		for _, p := range append(parts, strList(data, "distractors")...) {
			if !containsArabic(p) {
				add("builder token %q must be Arabic script", p)
			}
		}
	case "LetterIntroComponent":
		letters, _ := data["letters"].([]any)
		if len(letters) == 0 && str(data, "letter") == "" {
			add("no letters")
		}
		for _, l := range letters {
			item, _ := l.(map[string]any)
			if item != nil && !containsArabic(str(item, "letter")) {
				add("letter %q must be Arabic script", str(item, "letter"))
			}
		}
	case "PronunciationComponent":
		items, _ := data["items"].([]any)
		if len(items) == 0 {
			add("no items")
		}
		for _, it := range items {
			item, _ := it.(map[string]any)
			if item != nil && !containsArabic(str(item, "arabic")) {
				add("item %q must be Arabic script", str(item, "arabic"))
			}
		}
	case "PrayerChecklistComponent":
		if len(strList(data, "steps")) == 0 {
			add("no steps")
		}
	case "DuaCardComponent":
		if !containsArabic(str(data, "arabic")) {
			add("arabic text missing")
		}
	case "QuranReaderComponent":
		if !containsArabic(str(data, "text")) {
			add("ayah text missing")
		}
	case "CertificateComponent":
		if str(data, "title") == "" {
			add("certificate title missing")
		}
	}

	return issues
}

func lintMiniGame(id int, game MiniGame) []LintIssue {
	var issues []LintIssue
	where := fmt.Sprintf("mini_game (%s)", game.Type)
	add := func(format string, args ...any) {
		issues = append(issues, LintIssue{LevelID: id, Where: where, Msg: fmt.Sprintf(format, args...)})
	}
	data := game.Data

	switch game.Type {
	case GameTapMatch, GameMemoryCards:
		issues = append(issues, lintPairs(id, where, data, maxMatchPairs)...)
	case GameMCQ, GameListenChoose:
		qs := questionList(data)
		if len(qs) == 0 {
			add("no questions")
		}
		for _, q := range qs {
			// listen_choose questions answer with Arabic; MCQ questions may
			// quiz meanings in English, so only enforce shape there.
			issues = append(issues, lintChoice(id, where, q, game.Type == GameListenChoose)...)
		}
	case GameDragDrop:
		rounds, _ := data["rounds"].([]any)
		if len(rounds) == 0 {
			add("no rounds")
		}
		for _, r := range rounds {
			round, _ := r.(map[string]any)
			if round == nil {
				continue
			}
			if len(strList(round, "parts")) == 0 {
				add("round %q has no parts", str(round, "word"))
			}
		}
	}
	return issues
}

// lintChoice validates one {options, correct} shape. arabicOptions enforces
// the Arabic-only rule on the answer options.
func lintChoice(id int, where string, q map[string]any, arabicOptions bool) []LintIssue {
	var issues []LintIssue
	add := func(format string, args ...any) {
		issues = append(issues, LintIssue{LevelID: id, Where: where, Msg: fmt.Sprintf(format, args...)})
	}

	options := strList(q, "options")
	if len(options) < 2 || len(options) > maxChoiceOptions {
		add("must have 2–%d options, has %d", maxChoiceOptions, len(options))
	}
	if correct := int(num(q, "correct")); correct < 0 || correct >= len(options) {
		add("correct index %d out of range for %d options", correct, len(options))
	}
	if arabicOptions {
		for _, opt := range options {
			if !containsArabic(opt) {
				add("option %q must be Arabic script", opt)
			}
		}
	}
	return issues
}

func questionList(data map[string]any) []map[string]any {
	if qs, ok := data["questions"].([]any); ok {
		out := make([]map[string]any, 0, len(qs))
		for _, q := range qs {
			if m, ok := q.(map[string]any); ok {
				out = append(out, m)
			}
		}
		return out
	}
	if _, ok := data["options"]; ok {
		return []map[string]any{data}
	}
	return nil
}

func lintPairs(id int, where string, data map[string]any, max int) []LintIssue {
	var issues []LintIssue
	add := func(format string, args ...any) {
		issues = append(issues, LintIssue{LevelID: id, Where: where, Msg: fmt.Sprintf(format, args...)})
	}
	pairs, _ := data["pairs"].([]any)
	if len(pairs) < 2 || len(pairs) > max {
		add("must have 2–%d pairs, has %d", max, len(pairs))
	}
	for _, p := range pairs {
		pair, _ := p.(map[string]any)
		if pair == nil {
			continue
		}
		if str(pair, "left") == "" || str(pair, "right") == "" {
			add("pair with empty side")
		}
	}
	return issues
}

func lintFillBlank(id int, where string, data map[string]any) []LintIssue {
	var issues []LintIssue
	add := func(format string, args ...any) {
		issues = append(issues, LintIssue{LevelID: id, Where: where, Msg: fmt.Sprintf(format, args...)})
	}
	sentence, _ := data["sentence"].([]any)
	bank := strList(data, "bank")
	if len(sentence) == 0 {
		add("sentence is empty")
	}
	if len(bank) == 0 || len(bank) > maxChoiceOptions {
		add("bank must have 1–%d words, has %d", maxChoiceOptions, len(bank))
	}
	blanks := 0
	for _, s := range sentence {
		token, _ := s.(map[string]any)
		if token == nil {
			continue
		}
		if isBlank, _ := token["blank"].(bool); isBlank {
			blanks++
			answer := str(token, "answer")
			if answer == "" {
				add("blank without an answer")
				continue
			}
			inBank := false
			for _, w := range bank {
				if w == answer {
					inBank = true
					break
				}
			}
			if !inBank {
				add("answer %q missing from the bank", answer)
			}
		}
	}
	if blanks == 0 {
		add("no blank in the sentence")
	}
	return issues
}

func str(m map[string]any, key string) string {
	s, _ := m[key].(string)
	return s
}

func num(m map[string]any, key string) float64 {
	switch v := m[key].(type) {
	case float64:
		return v
	case int:
		return float64(v)
	default:
		return 0
	}
}

func strList(m map[string]any, key string) []string {
	raw, _ := m[key].([]any)
	out := make([]string, 0, len(raw))
	for _, v := range raw {
		if s, ok := v.(string); ok {
			out = append(out, s)
		}
	}
	return out
}

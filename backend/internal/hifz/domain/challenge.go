package domain

import (
	"fmt"
	"hash/fnv"
	"math/rand"
	"sort"
	"strings"
	"unicode"
)

const (
	ChallengeClozeWord       = "cloze_word"
	ChallengeAyahOrder       = "ayah_order"
	ChallengeProgressiveFade = "progressive_fade"
	ChallengeNextAyah        = "next_ayah"
	ChallengeFirstLetter     = "first_letter"
	ChallengeWordMeaning     = "word_meaning"
)

// AllChallengeKinds is the catalog, in the order the admin panel lists them.
var AllChallengeKinds = []string{
	ChallengeClozeWord,
	ChallengeAyahOrder,
	ChallengeProgressiveFade,
	ChallengeNextAyah,
	ChallengeFirstLetter,
	ChallengeWordMeaning,
}

type Challenge struct {
	ID          string         `bson:"id"          json:"id"`
	Kind        string         `bson:"kind"        json:"kind"`
	Interaction string         `bson:"interaction" json:"interaction"` // lesson-engine interaction
	Component   string         `bson:"component"   json:"component"`   // client component to render
	Title       string         `bson:"title"       json:"title"`
	Instruction string         `bson:"instruction" json:"instruction"`
	AyahNumber  int            `bson:"ayah_number,omitempty" json:"ayah_number,omitempty"`
	Content     map[string]any `bson:"content"     json:"content"`
}

type ClozeToken struct {
	Text   string `bson:"text,omitempty"   json:"text,omitempty"`
	Blank  bool   `bson:"blank,omitempty"  json:"blank,omitempty"`
	Answer string `bson:"answer,omitempty" json:"answer,omitempty"`
	// Hint carries the first letter for first_letter challenges.
	Hint string `bson:"hint,omitempty" json:"hint,omitempty"`
}

var basmalahWords = []string{"بسم", "الله", "الرحمن", "الرحيم"}

func StripBasmalah(text string, surahID, ayahNumber int) string {
	trimmed := strings.TrimSpace(text)
	if ayahNumber != 1 || surahID == 1 {
		return trimmed
	}

	words := strings.Fields(trimmed)
	if len(words) <= len(basmalahWords) {
		// The ayah is the basmalah or shorter — stripping would leave nothing.
		return trimmed
	}
	for i, want := range basmalahWords {
		if normalizeForCompare(words[i]) != want {
			return trimmed
		}
	}
	return strings.Join(words[len(basmalahWords):], " ")
}

func SplitWords(text string) []string {
	raw := strings.Fields(strings.TrimSpace(text))
	out := make([]string, 0, len(raw))
	for _, w := range raw {
		if w = strings.TrimSpace(w); w != "" {
			out = append(out, w)
		}
	}
	return out
}

func FirstLetter(word string) string {
	for _, r := range word {
		if unicode.IsLetter(r) {
			return string(r)
		}
	}
	if word == "" {
		return ""
	}
	return string([]rune(word)[0])
}

func normalizeForCompare(s string) string {
	var b strings.Builder
	for _, r := range s {
		if unicode.Is(unicode.Mn, r) {
			continue
		}
		switch r {
		case 'أ', 'إ', 'آ', 'ٱ':
			r = 'ا'
		case 'ة':
			r = 'ه'
		case 'ى':
			r = 'ي'
		case 'ـ':
			continue
		}
		b.WriteRune(r)
	}
	return b.String()
}

// ─────────────────────────────────────────────
// Generation
// ─────────────────────────────────────────────

type GenParams struct {
	Portion     Portion
	AyahNumbers []int
	AyahTexts   []string
	// Context words come from the rest of the surah and make better distractors
	// than random vocabulary. Optional.
	ContextWords []string
	Preset       DifficultyPreset
	Settings     *Settings
	// Seed makes generation deterministic for a given session.
	Seed string
}

func GenerateChallenges(p GenParams) []Challenge {
	kinds := eligibleKinds(p)
	if len(kinds) == 0 {
		return nil
	}

	rng := rand.New(rand.NewSource(int64(hashSeed(p.Seed))))

	count := p.Preset.ChallengeCount
	if count <= 0 {
		count = 3
	}

	ordered := weightedOrder(kinds, p.Preset.ChallengeWeights, rng)

	out := make([]Challenge, 0, count)
	used := make(map[string]int, len(ordered))
	for i := 0; len(out) < count && i < count*len(ordered)*2; i++ {
		kind := ordered[i%len(ordered)]
		if used[kind] >= maxPerSession(kind) {
			continue
		}
		ch := generateOne(kind, p, rng, len(out))
		if ch == nil {
			used[kind] = maxPerSession(kind) // unbuildable here; stop retrying it
			continue
		}
		used[kind]++
		out = append(out, *ch)
	}
	return out
}

func maxPerSession(kind string) int {
	switch kind {
	case ChallengeAyahOrder, ChallengeProgressiveFade:
		return 1
	default:
		return 3
	}
}

func eligibleKinds(p GenParams) []string {
	enabled := p.Preset.EnabledChallenges
	if len(enabled) == 0 {
		enabled = []string{ChallengeClozeWord, ChallengeAyahOrder}
	}
	out := make([]string, 0, len(enabled))
	for _, k := range enabled {
		if p.Settings != nil && !p.Settings.ChallengeCfg(k).Enabled {
			continue
		}
		// ayah_order and next_ayah need at least two ayahs to be meaningful.
		if (k == ChallengeAyahOrder || k == ChallengeNextAyah) && len(p.AyahTexts) < 2 {
			continue
		}
		if k == ChallengeWordMeaning {
			continue // requires authored word meanings; not yet available
		}
		out = append(out, k)
	}
	return out
}

func weightedOrder(kinds []string, weights map[string]int, rng *rand.Rand) []string {
	ordered := append([]string(nil), kinds...)
	sort.SliceStable(ordered, func(i, j int) bool {
		wi, wj := weights[ordered[i]], weights[ordered[j]]
		if wi != wj {
			return wi > wj
		}
		return false
	})
	if len(ordered) > 1 {
		start := rng.Intn(len(ordered))
		ordered = append(ordered[start:], ordered[:start]...)
	}
	return ordered
}

func generateOne(kind string, p GenParams, rng *rand.Rand, seq int) *Challenge {
	switch kind {
	case ChallengeClozeWord:
		return genCloze(p, rng, seq)
	case ChallengeAyahOrder:
		return genAyahOrder(p, seq)
	case ChallengeProgressiveFade:
		return genProgressiveFade(p, rng, seq)
	case ChallengeNextAyah:
		return genNextAyah(p, rng, seq)
	case ChallengeFirstLetter:
		return genFirstLetter(p, rng, seq)
	default:
		return nil
	}
}

func challengeID(kind string, seq int, seed string) string {
	return fmt.Sprintf("%s-%d-%x", kind, seq, hashSeed(seed+kind)%0xffff)
}


func genCloze(p GenParams, rng *rand.Rand, seq int) *Challenge {
	i := rng.Intn(len(p.AyahTexts))
	words := SplitWords(p.AyahTexts[i])
	if len(words) < 3 {
		return nil
	}

	cfg := p.Settings.ChallengeCfg(ChallengeClozeWord)
	blanks := blankCount(len(words), cfg.HiddenWordPct)
	hidden := pickIndices(len(words), blanks, rng)

	tokens, answers := buildTokens(words, hidden, false)
	bank := buildBank(answers, words, p.ContextWords, cfg.DistractorCount, rng)

	return &Challenge{
		ID:          challengeID(ChallengeClozeWord, seq, p.Seed),
		Kind:        ChallengeClozeWord,
		Interaction: "blank",
		Component:   "HifzClozeChallenge",
		Title:       "Fill the gaps",
		Instruction: "Tap the missing words in order",
		AyahNumber:  p.AyahNumbers[i],
		Content: map[string]any{
			"sentence":    tokens,
			"bank":        bank,
			"ayah_number": p.AyahNumbers[i],
			"allow_hints": p.Preset.AllowHints,
		},
	}
}

// ── progressive_fade ─────────────────────────────────────────────────────────
func genProgressiveFade(p GenParams, rng *rand.Rand, seq int) *Challenge {
	i := rng.Intn(len(p.AyahTexts))
	words := SplitWords(p.AyahTexts[i])
	if len(words) < 4 {
		return nil
	}

	cfg := p.Settings.ChallengeCfg(ChallengeProgressiveFade)
	steps := cfg.FadeSteps
	if len(steps) == 0 {
		steps = []int{20, 45, 70, 100}
	}

	rounds := make([]map[string]any, 0, len(steps))
	for _, pct := range steps {
		blanks := blankCount(len(words), pct)
		hidden := pickIndices(len(words), blanks, rng)
		tokens, answers := buildTokens(words, hidden, false)
		rounds = append(rounds, map[string]any{
			"sentence":   tokens,
			"bank":       buildBank(answers, words, p.ContextWords, cfg.DistractorCount, rng),
			"hidden_pct": pct,
		})
	}

	return &Challenge{
		ID:          challengeID(ChallengeProgressiveFade, seq, p.Seed),
		Kind:        ChallengeProgressiveFade,
		Interaction: "blank",
		Component:   "HifzFadeChallenge",
		Title:       "Fading ayah",
		Instruction: "Each round hides a little more — keep going",
		AyahNumber:  p.AyahNumbers[i],
		Content: map[string]any{
			"rounds":      rounds,
			"ayah_number": p.AyahNumbers[i],
			"allow_hints": p.Preset.AllowHints,
		},
	}
}

// ── first_letter ─────────────────────────────────────────────────────────────
func genFirstLetter(p GenParams, rng *rand.Rand, seq int) *Challenge {
	i := rng.Intn(len(p.AyahTexts))
	words := SplitWords(p.AyahTexts[i])
	if len(words) < 3 {
		return nil
	}

	cfg := p.Settings.ChallengeCfg(ChallengeFirstLetter)
	hidden := make(map[int]bool, len(words))
	for idx := range words {
		hidden[idx] = true
	}
	tokens, answers := buildTokens(words, hidden, true)

	return &Challenge{
		ID:          challengeID(ChallengeFirstLetter, seq, p.Seed),
		Kind:        ChallengeFirstLetter,
		Interaction: "blank",
		Component:   "HifzFirstLetterChallenge",
		Title:       "First letters only",
		Instruction: "Rebuild the ayah from its first letters",
		AyahNumber:  p.AyahNumbers[i],
		Content: map[string]any{
			"sentence":    tokens,
			"bank":        buildBank(answers, words, p.ContextWords, cfg.DistractorCount, rng),
			"ayah_number": p.AyahNumbers[i],
		},
	}
}

// ── ayah_order ───────────────────────────────────────────────────────────────
func genAyahOrder(p GenParams, seq int) *Challenge {
	parts := make([]string, len(p.AyahTexts))
	copy(parts, p.AyahTexts)

	return &Challenge{
		ID:          challengeID(ChallengeAyahOrder, seq, p.Seed),
		Kind:        ChallengeAyahOrder,
		Interaction: "sequence",
		Component:   "HifzOrderChallenge",
		Title:       "Put them in order",
		Instruction: "Tap the ayahs in the order they are recited",
		Content: map[string]any{
			"parts":        parts,
			"ayah_numbers": p.AyahNumbers,
		},
	}
}

// ── next_ayah ────────────────────────────────────────────────────────────────
func genNextAyah(p GenParams, rng *rand.Rand, seq int) *Challenge {
	// Pick a cut point that has a successor inside the portion.
	cut := rng.Intn(len(p.AyahTexts) - 1)
	answer := p.AyahTexts[cut+1]

	options := []string{answer}
	for _, idx := range rng.Perm(len(p.AyahTexts)) {
		if len(options) >= 4 {
			break
		}
		if idx == cut+1 {
			continue
		}
		options = appendUnique(options, p.AyahTexts[idx])
	}
	if len(options) < 2 {
		return nil
	}

	shuffleStrings(options, rng)
	correct := indexOf(options, answer)

	return &Challenge{
		ID:          challengeID(ChallengeNextAyah, seq, p.Seed),
		Kind:        ChallengeNextAyah,
		Interaction: "choice",
		Component:   "HifzNextAyahChallenge",
		Title:       "What comes next?",
		Instruction: "Which ayah follows?",
		AyahNumber:  p.AyahNumbers[cut],
		Content: map[string]any{
			"prompt":      p.AyahTexts[cut],
			"prompt_ayah": p.AyahNumbers[cut],
			"options":     options,
			"correct":     correct,
		},
	}
}

// ─────────────────────────────────────────────
// Shared generation helpers
// ─────────────────────────────────────────────

func blankCount(wordCount, pct int) int {
	if pct <= 0 {
		pct = 30
	}
	n := wordCount * pct / 100
	if n < 1 {
		n = 1
	}
	if n > wordCount {
		n = wordCount
	}
	return n
}

func pickIndices(total, n int, rng *rand.Rand) map[int]bool {
	if n > total {
		n = total
	}
	chosen := make(map[int]bool, n)
	for _, idx := range rng.Perm(total)[:n] {
		chosen[idx] = true
	}
	return chosen
}

func buildTokens(words []string, hidden map[int]bool, withHints bool) ([]ClozeToken, []string) {
	tokens := make([]ClozeToken, 0, len(words))
	answers := make([]string, 0, len(hidden))
	for i, w := range words {
		if hidden[i] {
			t := ClozeToken{Blank: true, Answer: w}
			if withHints {
				t.Hint = FirstLetter(w)
			}
			tokens = append(tokens, t)
			answers = append(answers, w)
			continue
		}
		tokens = append(tokens, ClozeToken{Text: w})
	}
	return tokens, answers
}

func buildBank(answers, ayahWords, contextWords []string, distractors int, rng *rand.Rand) []string {
	bank := append([]string(nil), answers...)
	if distractors <= 0 {
		shuffleStrings(bank, rng)
		return bank
	}

	taken := make(map[string]bool, len(answers))
	for _, a := range answers {
		taken[normalizeForCompare(a)] = true
	}

	add := func(candidates []string) {
		for _, idx := range rng.Perm(len(candidates)) {
			if len(bank) >= len(answers)+distractors {
				return
			}
			w := candidates[idx]
			key := normalizeForCompare(w)
			if key == "" || taken[key] {
				continue
			}
			taken[key] = true
			bank = append(bank, w)
		}
	}

	add(ayahWords)
	add(contextWords)

	shuffleStrings(bank, rng)
	return bank
}

func appendUnique(list []string, v string) []string {
	for _, existing := range list {
		if existing == v {
			return list
		}
	}
	return append(list, v)
}

func indexOf(list []string, v string) int {
	for i, existing := range list {
		if existing == v {
			return i
		}
	}
	return 0
}

func shuffleStrings(list []string, rng *rand.Rand) {
	rng.Shuffle(len(list), func(i, j int) { list[i], list[j] = list[j], list[i] })
}

func hashSeed(s string) uint32 {
	h := fnv.New32a()
	_, _ = h.Write([]byte(s))
	return h.Sum32()
}

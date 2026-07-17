package recitation

import (
	"strings"
	"unicode"
)

// ─────────────────────────────────────────────
// Arabic Unicode Ranges & Normalization
// ─────────────────────────────────────────────

// Arabic harakat / tashkeel codepoints (diacritics to strip for comparison).
// U+064B FATHATAN .. U+065F WAVY HAMZA BELOW
// U+0610 SIGN SALLALLAHOU ALAYHE WASSALLAM .. U+061A
// U+06D6 .. U+06DC, U+06DF .. U+06E4, U+06E7, U+06E8, U+06EA .. U+06ED
func isArabicDiacritic(r rune) bool {
	return (r >= 0x064B && r <= 0x065F) ||
		(r >= 0x0610 && r <= 0x061A) ||
		(r >= 0x06D6 && r <= 0x06DC) ||
		(r >= 0x06DF && r <= 0x06E4) ||
		r == 0x06E7 || r == 0x06E8 ||
		(r >= 0x06EA && r <= 0x06ED)
}

// normalizeArabicRune maps a single Arabic rune to its canonical form.
func normalizeArabicRune(r rune) rune {
	switch r {
	// Alef variants → plain Alef (ا)
	case 'أ', 'إ', 'آ', 'ٱ': // أ إ آ ٱ (U+0671 alef wasla)
		return 'ا'
	// Taa marbouta (ة) → haa (ه)
	case 'ة':
		return 'ه'
	// Alef maqsura (ى) → ya (ي)
	case 'ى':
		return 'ي'
	// Waw with hamza (ؤ) → waw (و)
	case 'ؤ':
		return 'و'
	// Ya with hamza below (ئ) → ya (ي)
	case 'ئ':
		return 'ي'
	// Hamza on its own (ء) → strip (return 0 handled by caller)
	// Tatweel / kashida (ـ) → strip
	case 'ـ':
		return 0
	}
	return r
}

// NormalizeArabic strips diacritics and normalizes letter variants.
// The result is used for fuzzy comparison — NOT for display.
func NormalizeArabic(s string) string {
	var b strings.Builder
	b.Grow(len(s))
	for _, r := range s {
		// Skip diacritics entirely
		if isArabicDiacritic(r) {
			continue
		}
		// Skip non-arabic whitespace-like invisible chars
		if unicode.Is(unicode.Mn, r) {
			continue
		}
		canonical := normalizeArabicRune(r)
		if canonical == 0 {
			// tatweel or stripped char — skip
			continue
		}
		b.WriteRune(canonical)
	}
	return strings.TrimSpace(b.String())
}

// TokenizeArabic splits normalized Arabic text into word tokens.
func TokenizeArabic(s string) []string {
	normalized := NormalizeArabic(s)
	raw := strings.Fields(normalized)
	out := make([]string, 0, len(raw))
	for _, w := range raw {
		w = strings.Trim(w, "،.؟!\"'")
		if w != "" {
			out = append(out, w)
		}
	}
	return out
}

// ─────────────────────────────────────────────
// Levenshtein Distance
// ─────────────────────────────────────────────

// levenshtein computes the edit distance between two rune slices.
// Uses full DP matrix for correctness. O(m*n) time & space.
func levenshtein(a, b []rune) int {
	la, lb := len(a), len(b)
	if la == 0 {
		return lb
	}
	if lb == 0 {
		return la
	}

	// Allocate flat matrix as a single slice for cache friendliness
	dp := make([]int, (la+1)*(lb+1))
	stride := lb + 1

	for i := 0; i <= la; i++ {
		dp[i*stride] = i
	}
	for j := 0; j <= lb; j++ {
		dp[j] = j
	}

	for i := 1; i <= la; i++ {
		for j := 1; j <= lb; j++ {
			cost := 1
			if a[i-1] == b[j-1] {
				cost = 0
			}
			del := dp[(i-1)*stride+j] + 1
			ins := dp[i*stride+(j-1)] + 1
			sub := dp[(i-1)*stride+(j-1)] + cost
			min := del
			if ins < min {
				min = ins
			}
			if sub < min {
				min = sub
			}
			dp[i*stride+j] = min
		}
	}
	return dp[la*stride+lb]
}

// ─────────────────────────────────────────────
// Word-Level Comparison
// ─────────────────────────────────────────────

// toleranceForWord returns the maximum Levenshtein edits allowed for a word
// to be considered correctly recited. Scales with word length.
func toleranceForWord(word string) int {
	l := len([]rune(word))
	switch {
	case l <= 3:
		return 1
	case l <= 6:
		return 2
	default:
		return 3
	}
}

// ─────────────────────────────────────────────
// Wagner-Fischer Word-Sequence Alignment
// ─────────────────────────────────────────────

// gapPenalty is the DP cost of an unmatched word (missing or extra).
// Keeping it at 0.75 means a substitution (max cost 1.0) is always
// cheaper than a delete+insert pair (cost 1.5), so the aligner
// aggressively maps words — correct behaviour for recitation checking.
const gapPenalty = 0.75

// wordSimilarity returns a normalised Levenshtein ratio in [0, 1]
// between two pre-normalised Arabic word strings.
// 0 = identical, 1 = completely different.
func wordSimilarity(a, b string) float64 {
	ra, rb := []rune(a), []rune(b)
	la, lb := len(ra), len(rb)
	if la == 0 && lb == 0 {
		return 0
	}
	maxLen := la
	if lb > maxLen {
		maxLen = lb
	}
	return float64(levenshtein(ra, rb)) / float64(maxLen)
}

// DP operation codes used during backtrace.
const (
	opMatch  = 0 // align expected[i] with spoken[j]
	opDelete = 1 // expected[i] not spoken → missing
	opInsert = 2 // spoken[j] not expected → extra
)

// dpCell stores the minimum alignment cost and the operation that produced it.
type dpCell struct {
	cost float64
	op   int
}

// alignSequences runs Wagner-Fischer DP to find the globally optimal alignment
// between expected and spoken word sequences, then backtracks to produce
// per-word recitation results.
//
// Why DP instead of greedy:
//
//	The greedy left-to-right approach steals tokens for early words even when
//	a later expected word is a far better match.  DP considers all alignments
//	simultaneously and picks the globally cheapest one, correctly handling
//	skipped words, insertions, and reorderings introduced by STT errors.
//
// Output ordering:
//
//	Expected words appear first in their original sequence (correct/wrong/missing).
//	Extra spoken words are appended at the end for separate UI rendering.
func alignSequences(expected, spoken []string) ([]WordResult, int) {
	E, S := len(expected), len(spoken)

	// Pre-normalise once — avoids repeated work in the O(E×S) inner loop.
	expNorm := make([]string, E)
	for i, w := range expected {
		expNorm[i] = NormalizeArabic(w)
	}
	spkNorm := make([]string, S)
	for i, w := range spoken {
		spkNorm[i] = NormalizeArabic(w)
	}

	// ── DP table ─────────────────────────────────────────────────────────────
	// dp[i][j] = optimal cost to align expected[0..i-1] with spoken[0..j-1].
	dp := make([][]dpCell, E+1)
	for i := range dp {
		dp[i] = make([]dpCell, S+1)
	}
	for i := 1; i <= E; i++ {
		dp[i][0] = dpCell{float64(i) * gapPenalty, opDelete}
	}
	for j := 1; j <= S; j++ {
		dp[0][j] = dpCell{float64(j) * gapPenalty, opInsert}
	}

	for i := 1; i <= E; i++ {
		for j := 1; j <= S; j++ {
			sim := wordSimilarity(expNorm[i-1], spkNorm[j-1])
			matchCost := dp[i-1][j-1].cost + sim
			delCost := dp[i-1][j].cost + gapPenalty
			insCost := dp[i][j-1].cost + gapPenalty

			switch {
			case matchCost <= delCost && matchCost <= insCost:
				dp[i][j] = dpCell{matchCost, opMatch}
			case delCost <= insCost:
				dp[i][j] = dpCell{delCost, opDelete}
			default:
				dp[i][j] = dpCell{insCost, opInsert}
			}
		}
	}

	// ── Backtrace ─────────────────────────────────────────────────────────────
	type pair struct {
		expIdx int
		spkIdx int
		sim    float64
		op     int
	}

	rawPairs := make([]pair, 0, E+S)
	i, j := E, S
	for i > 0 || j > 0 {
		switch {
		case i == 0:
			rawPairs = append(rawPairs, pair{-1, j - 1, 0, opInsert})
			j--
		case j == 0:
			rawPairs = append(rawPairs, pair{i - 1, -1, 0, opDelete})
			i--
		default:
			switch dp[i][j].op {
			case opMatch:
				rawPairs = append(rawPairs, pair{
					i - 1, j - 1,
					wordSimilarity(expNorm[i-1], spkNorm[j-1]),
					opMatch,
				})
				i--
				j--
			case opDelete:
				rawPairs = append(rawPairs, pair{i - 1, -1, 0, opDelete})
				i--
			case opInsert:
				rawPairs = append(rawPairs, pair{-1, j - 1, 0, opInsert})
				j--
			}
		}
	}

	// Backtrace yields pairs in reverse; flip to natural reading order.
	for l, r := 0, len(rawPairs)-1; l < r; l, r = l+1, r-1 {
		rawPairs[l], rawPairs[r] = rawPairs[r], rawPairs[l]
	}

	// ── Classify & build result slices ────────────────────────────────────────
	origResults := make([]WordResult, 0, E)
	extraResults := make([]WordResult, 0)
	correctCount := 0

	for _, p := range rawPairs {
		switch p.op {
		case opMatch:
			expLen := len([]rune(expNorm[p.expIdx]))
			if expLen == 0 {
				expLen = 1
			}
			// Convert absolute-edit tolerance to a similarity ratio so it is
			// directly comparable to the [0,1] output of wordSimilarity.
			threshold := float64(toleranceForWord(expNorm[p.expIdx])) / float64(expLen)
			if p.sim <= threshold {
				origResults = append(origResults, WordResult{
					Text:       expected[p.expIdx],
					Status:     WordCorrect,
					Confidence: 1.0 - p.sim,
				})
				correctCount++
			} else {
				// Aligned but too dissimilar — display original word as wrong.
				origResults = append(origResults, WordResult{
					Text:       expected[p.expIdx],
					Status:     WordWrong,
					Confidence: 0,
				})
			}
		case opDelete:
			origResults = append(origResults, WordResult{
				Text:       expected[p.expIdx],
				Status:     WordMissing,
				Confidence: 0,
			})
		case opInsert:
			extraResults = append(extraResults, WordResult{
				Text:       spoken[p.spkIdx],
				Status:     WordExtra,
				Confidence: 0,
			})
		}
	}

	// Original words first (Ayah sequence preserved), extras appended —
	// matches the frontend split rendering in RecitationPanel.
	return append(origResults, extraResults...), correctCount
}

// ─────────────────────────────────────────────
// Public: CompareRecitation
// ─────────────────────────────────────────────

// CompareRecitation aligns the expected ayah words against the Whisper transcript
// using Wagner-Fischer DP sequence alignment and returns per-word results plus
// an overall accuracy score (0–100).
//
// The Ayah words are always returned in their original order. Extra words
// spoken by the user are appended after the Ayah words.
func CompareRecitation(expectedText, transcript string) ([]WordResult, int) {
	expectedTokens := TokenizeArabic(expectedText)
	spokenTokens := TokenizeArabic(transcript)

	if len(expectedTokens) == 0 {
		return nil, 0
	}

	results, correctCount := alignSequences(expectedTokens, spokenTokens)
	score := (correctCount * 100) / len(expectedTokens)
	return results, score
}

// ─────────────────────────────────────────────
// Scoring Helpers
// ─────────────────────────────────────────────

// ScoreToFeedback returns an encouraging Duolingo-style message.
func ScoreToFeedback(score int) string {
	switch {
	case score == 100:
		return "Perfect recitation! ماشاء الله! 🌟"
	case score >= 90:
		return "Excellent! Almost flawless. Keep it up! ✨"
	case score >= 75:
		return "Great job! Just a couple words to polish. 💪"
	case score >= 60:
		return "Good effort! Practice the highlighted words again. 🤲"
	case score >= 40:
		return "Keep going! Listen to the audio once more and retry. 📖"
	default:
		return "Don't give up! Every attempt brings you closer to Allah. 🌙"
	}
}

// ScoreToXP returns XP earned based on score and the ayah's base XP reward.
func ScoreToXP(score, baseXP int) int {
	switch {
	case score >= 90:
		return baseXP
	case score >= 70:
		return baseXP * 75 / 100
	case score >= 50:
		return baseXP * 50 / 100
	default:
		return baseXP * 20 / 100 // always award something for trying
	}
}

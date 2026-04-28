package service

import (
	"strings"
	"unicode"

	"github.com/chawais/talent-flow/backend/internal/core-service/model"
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
	// Alef variants → plain alef (ا)
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

// wordDistance returns the Levenshtein distance between two Arabic words
// after normalization. Words are compared at the rune level.
func wordDistance(a, b string) int {
	ra := []rune(NormalizeArabic(a))
	rb := []rune(NormalizeArabic(b))
	return levenshtein(ra, rb)
}

// ─────────────────────────────────────────────
// Word-Level Comparison
// ─────────────────────────────────────────────

// toleranceForWord determines the max edit distance allowed for a word to be
// considered "correct". Longer words allow a bit more variation.
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

// matchResult carries the outcome of matching one expected word.
type matchResult struct {
	spokenWord string
	distance   int
	found      bool
}

// findBestSpokenMatch finds the closest token in spokenTokens to expectedWord.
// It returns the best candidate and its edit distance.
// used marks tokens that have already been claimed by a previous match.
func findBestSpokenMatch(expectedWord string, spokenTokens []string, used []bool) matchResult {
	best := matchResult{distance: 9999}
	for i, tok := range spokenTokens {
		if used[i] {
			continue
		}
		d := wordDistance(expectedWord, tok)
		if d < best.distance {
			best = matchResult{spokenWord: tok, distance: d, found: true}
		}
	}
	return best
}

// ─────────────────────────────────────────────
// Public: CompareRecitation
// ─────────────────────────────────────────────

// CompareRecitation aligns the expected ayah words against the Whisper transcript
// and returns per-word results plus an overall accuracy score (0–100).
//
// Algorithm:
//  1. Normalize both strings and tokenize.
//  2. Greedy left-to-right matching: for each expected word find the nearest
//     un-claimed spoken token. If distance ≤ tolerance → correct, else → wrong.
//     Unmatched expected words → missing. Leftover spoken tokens → extra.
//  3. Score = (correct / expectedCount) × 100.
func CompareRecitation(expectedText, transcript string) ([]model.WordResult, int) {
	expectedTokens := TokenizeArabic(expectedText)
	spokenTokens := TokenizeArabic(transcript)

	used := make([]bool, len(spokenTokens))
	results := make([]model.WordResult, 0, len(expectedTokens))
	correctCount := 0

	for _, expWord := range expectedTokens {
		best := findBestSpokenMatch(expWord, spokenTokens, used)
		tol := toleranceForWord(expWord)

		if !best.found {
			// No spoken words left at all
			results = append(results, model.WordResult{
				Text:       expWord,
				Status:     model.WordMissing,
				Confidence: 0,
			})
			continue
		}

		if best.distance <= tol {
			// Mark the matched spoken token as used
			for i, tok := range spokenTokens {
				if !used[i] && tok == best.spokenWord {
					used[i] = true
					break
				}
			}
			expLen := float64(len([]rune(expWord)))
			confidence := 1.0 - float64(best.distance)/expLen
			if confidence < 0 {
				confidence = 0
			}
			results = append(results, model.WordResult{
				Text:       expWord,
				Status:     model.WordCorrect,
				Confidence: confidence,
			})
			correctCount++
		} else if best.distance <= tol*2 {
			// Close but not good enough — mark as wrong (learner can improve)
			for i, tok := range spokenTokens {
				if !used[i] && tok == best.spokenWord {
					used[i] = true
					break
				}
			}
			results = append(results, model.WordResult{
				Text:       expWord,
				Status:     model.WordWrong,
				Confidence: 0,
			})
		} else {
			// No reasonable match found
			results = append(results, model.WordResult{
				Text:   expWord,
				Status: model.WordMissing,
			})
		}
	}

	// Leftover spoken words that were never claimed → extra
	for i, tok := range spokenTokens {
		if !used[i] {
			results = append(results, model.WordResult{
				Text:       tok,
				Status:     model.WordExtra,
				Confidence: 0,
			})
		}
	}

	score := 0
	if len(expectedTokens) > 0 {
		score = (correctCount * 100) / len(expectedTokens)
	}

	return results, score
}

// ─────────────────────────────────────────────
// Scoring Helpers
// ─────────────────────────────────────────────

// ScoreToStars converts a 0-100 score into 1-3 stars.
func ScoreToStars(score int) int {
	switch {
	case score >= 90:
		return 3
	case score >= 65:
		return 2
	default:
		return 1
	}
}

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

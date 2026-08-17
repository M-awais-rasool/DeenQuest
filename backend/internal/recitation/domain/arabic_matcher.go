package domain

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
// U+06D6 .. U+06ED covers the Quranic annotation block in full: waqf marks,
// sajdah/rub-el-hizb signs, the end-of-ayah circle (U+06DD) and the small
// waw/ya (U+06E5, U+06E6). None of them are letters, and any that survive here
// are counted as a spelling error against Whisper's plain output.
func isArabicDiacritic(r rune) bool {
	return (r >= 0x064B && r <= 0x065F) ||
		(r >= 0x0610 && r <= 0x061A) ||
		(r >= 0x06D6 && r <= 0x06ED)
}

// superscriptAlef (dagger alef) spells a long ā that Uthmani script writes as a
// mark rather than a letter — ٱلرَّحْمَٰنِ, ذَٰلِكَ, ٱلصَّلَوٰةَ.
const superscriptAlef = 0x0670

// isIgnorable reports runes that carry no phonetic value and must never reach
// the comparison: invisible formatting (the BOM that alquran.cloud prefixes to
// Al-Fatiha 1, joiners, bidi marks), ayah numbers in either digit set, and
// punctuation such as the ornate ﴾﴿ brackets.
func isIgnorable(r rune) bool {
	switch {
	case r == 0xFEFF, r >= 0x200B && r <= 0x200F, r >= 0x2066 && r <= 0x2069:
		return true // zero-width & bidi formatting
	case r >= '0' && r <= '9', r >= 0x0660 && r <= 0x0669, r >= 0x06F0 && r <= 0x06F9:
		return true // ASCII, Arabic-Indic and extended Arabic-Indic digits
	case r == 0xFD3E || r == 0xFD3F:
		return true // ornate parentheses around ayah numbers
	}
	return unicode.IsPunct(r) || unicode.IsSymbol(r)
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
	// Hamza on its own (ء) → strip. Uthmani spells وَءَاتُوا۟ where Whisper
	// writes وآتوا; the seat-carried forms above already fold away, so the
	// bare hamza has to go too or the two spellings never line up.
	case 'ء':
		return 0
	// Tatweel / kashida (ـ) → strip
	case 'ـ':
		return 0
	}
	return r
}

// NormalizeArabic strips diacritics and normalizes letter variants so that the
// fully-vowelled Uthmani text the Quran API serves and the bare imla'i script
// Whisper returns collapse onto the same spelling.
// The result is used for fuzzy comparison — NOT for display.
func NormalizeArabic(s string) string {
	runes := []rune(s)
	out := make([]rune, 0, len(runes))

	// Whether a haraka has been skipped since the last letter was emitted. This
	// is what separates a silent carrier from a pronounced letter — see below.
	vowelledSinceLetter := false

	for i := 0; i < len(runes); i++ {
		r := runes[i]

		if r == superscriptAlef {
			last := len(out) - 1
			// A waw or ya carrying the dagger directly, with no haraka of its
			// own, is silent scaffolding: ٱلصَّلَوٰةَ is صلاة and يَغْشَىٰهَا is
			// يغشاها. When the carrier does have a haraka it is pronounced in
			// its own right and only the alef is added — ٱلسَّمَٰوَٰتِ is
			// سماوات, not سماات.
			carrier := last >= 0 && (out[last] == 'و' || out[last] == 'ي') && !vowelledSinceLetter

			switch {
			case !lettersFollowInWord(runes, i+1):
				// Word-final, where plain spelling simply stops: مُوسَىٰ is
				// written موسى and عَلَىٰ is على. Adding an alef here would put
				// the two orthographies further apart, not closer.
			case carrier:
				out[last] = 'ا'
				vowelledSinceLetter = false
			default:
				// Everywhere else the dagger is a full long ā that plain script
				// spells out: ٱلْكِتَٰبُ is الكتاب, ٱلْعَٰلَمِينَ is العالمين.
				out = append(out, 'ا')
				vowelledSinceLetter = false
			}
			continue
		}

		switch {
		case unicode.IsSpace(r):
			out = append(out, ' ')
			vowelledSinceLetter = false
			continue
		case isArabicDiacritic(r), unicode.Is(unicode.Mn, r):
			vowelledSinceLetter = true
			continue
		case isIgnorable(r):
			continue
		}

		if canonical := normalizeArabicRune(r); canonical != 0 {
			// Collapse a doubled letter onto one. The two orthographies disagree
			// about whether gemination is spelled out — Uthmani writes ٱلَّيْلِ
			// with a single shadda'd lam where plain script writes الليل with
			// two — and the disagreement is not consistent enough to predict
			// per word. Folding both to one lam makes gemination a thing the
			// grader simply does not judge, which is right: it is a property of
			// how a word sounds, not of whether the learner recited it.
			if n := len(out); n > 0 && out[n-1] == canonical {
				vowelledSinceLetter = false
				continue
			}
			out = append(out, canonical)
			vowelledSinceLetter = false
		}
	}
	return strings.TrimSpace(string(out))
}

// lettersFollowInWord reports whether another pronounceable letter appears
// before the current word ends.
func lettersFollowInWord(runes []rune, from int) bool {
	for _, r := range runes[from:] {
		switch {
		case unicode.IsSpace(r):
			return false
		case r == superscriptAlef:
			return true
		case isArabicDiacritic(r), unicode.Is(unicode.Mn, r), isIgnorable(r):
			continue
		}
		if normalizeArabicRune(r) != 0 {
			return true
		}
	}
	return false
}

// tokenize splits text into words, returning each word twice: the surface form
// exactly as written, and the normalized form used for comparison.
//
// The two must stay separate. The surface form is what the learner sees
// highlighted in the result panel, and it has to remain the real Quranic
// spelling — showing عَلَىٰ كُلِّ شَىْءٍ back as "علي كل شي" reads as a typo in the
// mushaf. Words that carry no letters at all (a bare ayah number, a lone waqf
// mark) normalize to nothing and are dropped from both, so they can never be
// counted as a word the learner failed to recite.
func tokenize(s string) (surface, normalized []string) {
	raw := strings.Fields(s)
	surface = make([]string, 0, len(raw))
	normalized = make([]string, 0, len(raw))
	for _, w := range raw {
		norm := NormalizeArabic(w)
		if norm == "" {
			continue
		}
		surface = append(surface, w)
		normalized = append(normalized, norm)
	}
	return surface, normalized
}

// TokenizeArabic splits normalized Arabic text into word tokens.
func TokenizeArabic(s string) []string {
	_, normalized := tokenize(s)
	return normalized
}

// ─────────────────────────────────────────────
// Levenshtein Distance
// ─────────────────────────────────────────────

func indelCost(r rune) float64 {
	switch r {
	case 'ا', 'و', 'ي':
		return 0.5
	}
	return 1
}

// levenshtein computes the weighted edit distance between two rune slices.
// Uses full DP matrix for correctness. O(m*n) time & space.
func levenshtein(a, b []rune) float64 {
	la, lb := len(a), len(b)
	if la == 0 || lb == 0 {
		total := 0.0
		for _, r := range a {
			total += indelCost(r)
		}
		for _, r := range b {
			total += indelCost(r)
		}
		return total
	}

	// Allocate flat matrix as a single slice for cache friendliness
	dp := make([]float64, (la+1)*(lb+1))
	stride := lb + 1

	for i := 1; i <= la; i++ {
		dp[i*stride] = dp[(i-1)*stride] + indelCost(a[i-1])
	}
	for j := 1; j <= lb; j++ {
		dp[j] = dp[j-1] + indelCost(b[j-1])
	}

	for i := 1; i <= la; i++ {
		for j := 1; j <= lb; j++ {
			cost := 1.0
			if a[i-1] == b[j-1] {
				cost = 0
			}
			best := dp[(i-1)*stride+(j-1)] + cost // substitute
			if del := dp[(i-1)*stride+j] + indelCost(a[i-1]); del < best {
				best = del
			}
			if ins := dp[i*stride+(j-1)] + indelCost(b[j-1]); ins < best {
				best = ins
			}
			dp[i*stride+j] = best
		}
	}
	return dp[la*stride+lb]
}

// ─────────────────────────────────────────────
// Word-Level Comparison
// ─────────────────────────────────────────────

// wordTolerance is the maximum weighted edit cost a word may carry and still
// count as recited. It is deliberately just under the cost of a consonant.
//
// A long vowel costs 0.5 to insert or delete, a consonant 1.0, so this forgives
// exactly one alef/waw/ya of spelling drift — the residue Whisper leaves after
// normalization — and nothing more. Raising it to 1.0 makes a substituted
// consonant free, which measured against the whole Quran left 97% of
// single-consonant errors undetected: the grader would agree with almost any
// wrong word. Scaling it with word length has the same effect on long words,
// which is why it no longer does.
const wordTolerance = 0.5

// toleranceEpsilon absorbs float64 rounding. One forgiven long vowel lands
// exactly on the limit (0.5/n on both sides), and without slack that verdict
// would rest on bit-level equality.
const toleranceEpsilon = 1e-9


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
	return levenshtein(ra, rb) / float64(maxLen)
}

// DP operation codes used during backtrace.
const (
	opMatch  = 0 // align expected[i] with spoken[j]
	opDelete = 1 // expected[i] not spoken → missing
	opInsert = 2 // spoken[j] not expected → extra
	opSplit  = 3 // one expected word transcribed as two: expected[i] ↔ spoken[j-1]+spoken[j]
	opMerge  = 4 // two expected words transcribed as one: expected[i-1]+expected[i] ↔ spoken[j]
)
const boundaryPenalty = 0.1

// isMatch decides whether a spoken word counts as the expected one. sim is a
// per-character ratio, so the tolerance is divided by the word's length to put
// both on the same scale.
func isMatch(expectedJoined string, sim float64) bool {
	length := len([]rune(expectedJoined))
	if length == 0 {
		length = 1
	}
	return sim <= wordTolerance/float64(length)+toleranceEpsilon
}

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
//
// Alignment runs on the normalized forms while every WordResult carries the
// surface form, so the panel shows the mushaf's own spelling.
// The third return value counts extra spoken words that are not part of the
// ayah at all — see the classification block for why the rest are forgiven.
func alignSequences(expected, expNorm, spoken, spkNorm []string) ([]WordResult, int, int) {
	E, S := len(expected), len(spoken)

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
			// Seeded with the plain match so it wins every tie.
			best := dpCell{dp[i-1][j-1].cost + wordSimilarity(expNorm[i-1], spkNorm[j-1]), opMatch}

			if c := dp[i-1][j].cost + gapPenalty; c < best.cost {
				best = dpCell{c, opDelete}
			}
			if c := dp[i][j-1].cost + gapPenalty; c < best.cost {
				best = dpCell{c, opInsert}
			}
			if j >= 2 {
				joined := expNorm[i-1]
				sim := wordSimilarity(joined, spkNorm[j-2]+spkNorm[j-1])
				if c := dp[i-1][j-2].cost + sim + boundaryPenalty; isMatch(joined, sim) && c < best.cost {
					best = dpCell{c, opSplit}
				}
			}
			if i >= 2 {
				joined := expNorm[i-2] + expNorm[i-1]
				sim := wordSimilarity(joined, spkNorm[j-1])
				if c := dp[i-2][j-1].cost + sim + boundaryPenalty; isMatch(joined, sim) && c < best.cost {
					best = dpCell{c, opMerge}
				}
			}
			dp[i][j] = best
		}
	}

	// ── Backtrace ─────────────────────────────────────────────────────────────
	type pair struct {
		expFrom, expTo int
		spkFrom, spkTo int
		sim            float64
		op             int
	}

	rawPairs := make([]pair, 0, E+S)
	i, j := E, S
	for i > 0 || j > 0 {
		switch {
		case i == 0:
			rawPairs = append(rawPairs, pair{-1, -1, j - 1, j - 1, 0, opInsert})
			j--
		case j == 0:
			rawPairs = append(rawPairs, pair{i - 1, i - 1, -1, -1, 0, opDelete})
			i--
		default:
			switch dp[i][j].op {
			case opMatch:
				rawPairs = append(rawPairs, pair{
					i - 1, i - 1, j - 1, j - 1,
					wordSimilarity(expNorm[i-1], spkNorm[j-1]),
					opMatch,
				})
				i--
				j--
			case opSplit:
				rawPairs = append(rawPairs, pair{
					i - 1, i - 1, j - 2, j - 1,
					wordSimilarity(expNorm[i-1], spkNorm[j-2]+spkNorm[j-1]),
					opSplit,
				})
				i--
				j -= 2
			case opMerge:
				rawPairs = append(rawPairs, pair{
					i - 2, i - 1, j - 1, j - 1,
					wordSimilarity(expNorm[i-2]+expNorm[i-1], spkNorm[j-1]),
					opMerge,
				})
				i -= 2
				j--
			case opDelete:
				rawPairs = append(rawPairs, pair{i - 1, i - 1, -1, -1, 0, opDelete})
				i--
			case opInsert:
				rawPairs = append(rawPairs, pair{-1, -1, j - 1, j - 1, 0, opInsert})
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
		case opMatch, opSplit, opMerge:
			joined := strings.Join(expNorm[p.expFrom:p.expTo+1], "")

			status, confidence := WordWrong, 0.0
			if isMatch(joined, p.sim) {
				status, confidence = WordCorrect, 1.0-p.sim
			}
			for idx := p.expFrom; idx <= p.expTo; idx++ {
				origResults = append(origResults, WordResult{
					Text:       expected[idx],
					Status:     status,
					Confidence: confidence,
				})
				if status == WordCorrect {
					correctCount++
				}
			}
		case opDelete:
			origResults = append(origResults, WordResult{
				Text:       expected[p.expFrom],
				Status:     WordMissing,
				Confidence: 0,
			})
		case opInsert:
			extraResults = append(extraResults, WordResult{
				Text:       spoken[p.spkFrom],
				Status:     WordExtra,
				Confidence: 0,
			})
		}
	}

	// An extra word that echoes the ayah is almost always a looping decode
	// repeating what the learner said once — punishing it would mark a clean
	// recitation down for the recogniser's mistake. An extra word that appears
	// nowhere in the ayah is something the learner actually added, and that is
	// a real fault the score has to show.
	// The echo test has to be the same fuzzy test used to accept a word in the
	// first place. An exact-string check would call ٱلرَّحْمَٰنِ repeated back as
	// الرحمن a word the learner invented, and punish a clean recitation for the
	// recogniser's stutter.
	novelExtras := 0
	for _, w := range extraResults {
		norm := NormalizeArabic(w.Text)
		echoed := false
		for _, e := range expNorm {
			if isMatch(e, wordSimilarity(e, norm)) {
				echoed = true
				break
			}
		}
		if !echoed {
			novelExtras++
		}
		// Capped alongside the display cap: a runaway transcript should dent the
		// score, never bury an otherwise complete recitation.
		if novelExtras >= E {
			break
		}
	}
	if len(extraResults) > E {
		extraResults = extraResults[:E]
	}

	// Original words first (Ayah sequence preserved), extras appended —
	// matches the frontend split rendering in RecitationPanel.
	return append(origResults, extraResults...), correctCount, novelExtras
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
	expectedTokens, expectedNorm := tokenize(expectedText)
	spokenTokens, spokenNorm := tokenize(transcript)

	if len(expectedTokens) == 0 {
		return nil, 0
	}

	results, correctCount, novelExtras := alignSequences(expectedTokens, expectedNorm, spokenTokens, spokenNorm)

	// Saying every word of the ayah and then several words that belong to no
	// part of it is not a flawless recitation. One stray word is written off as
	// recogniser noise (longer ayahs get proportionally more rope); each one
	// beyond that dilutes the score as if a word had been missed.
	denominator := len(expectedTokens)
	allowance := 1 + len(expectedTokens)/10
	if beyond := novelExtras - allowance; beyond > 0 {
		denominator += beyond
	}

	score := (correctCount * 100) / denominator
	return results, score
}

// ─────────────────────────────────────────────
// Scoring Helpers
// ─────────────────────────────────────────────

// NoSpeechFeedback is shown when the recogniser heard nothing at all. A silent
// clip scores zero against every word, but the learner almost always recited
// something — the microphone, the permission or the upload failed. Telling them
// to try harder is the wrong diagnosis, so this message names the real fault.
const NoSpeechFeedback = "We couldn't hear your recitation — check your microphone and try again. 🎙️"

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
	// Nothing matched at all — silence, or an unrelated recording. Paying XP
	// for that tells the learner the attempt counted when it did not.
	case score <= 0:
		return 0
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

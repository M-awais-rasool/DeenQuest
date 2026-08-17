package domain

import (
	"strings"
	"testing"
)

// Al-Fatiha 1 — the text arrives from alquran.cloud fully vowelled, while
// Whisper returns bare script, so every case here mixes the two on purpose.
const basmalah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"

func statuses(words []WordResult) []WordStatus {
	out := make([]WordStatus, len(words))
	for i, w := range words {
		out[i] = w.Status
	}
	return out
}

func countStatus(words []WordResult, status WordStatus) int {
	n := 0
	for _, w := range words {
		if w.Status == status {
			n++
		}
	}
	return n
}

func TestCompareRecitation_PerfectMatchIgnoresDiacritics(t *testing.T) {
	words, score := CompareRecitation(basmalah, "بسم الله الرحمن الرحيم")

	if score != 100 {
		t.Errorf("score = %d, want 100 — the same words unvowelled must still be perfect", score)
	}
	for _, w := range words {
		if w.Status != WordCorrect {
			t.Errorf("word %q read %s, want correct", w.Text, w.Status)
		}
	}
}

func TestCompareRecitation_SilenceScoresZero(t *testing.T) {
	words, score := CompareRecitation(basmalah, "")

	if score != 0 {
		t.Fatalf("score = %d, want 0 for an empty transcript", score)
	}
	if got := countStatus(words, WordMissing); got != 4 {
		t.Errorf("missing words = %d, want all 4", got)
	}
}

func TestCompareRecitation_SplitWordIsNotPunishedTwice(t *testing.T) {
	// Whisper very often breaks a word apart. Before boundary repair this cost
	// a wrong word *and* produced a stray extra one.
	words, score := CompareRecitation(basmalah, "بسم الله الرح من الرحيم")

	if score != 100 {
		t.Errorf("score = %d, want 100 — a split word is still the right word: %v",
			score, statuses(words))
	}
	if got := countStatus(words, WordExtra); got != 0 {
		t.Errorf("a split word must not leave %d extra word(s)", got)
	}
}

func TestCompareRecitation_JoinedWordsAreNotPunishedTwice(t *testing.T) {
	// The mirror case: two words come back glued together.
	words, score := CompareRecitation(basmalah, "بسمالله الرحمن الرحيم")

	if score != 100 {
		t.Errorf("score = %d, want 100 — joined words are still both said: %v",
			score, statuses(words))
	}
	if got := countStatus(words, WordMissing); got != 0 {
		t.Errorf("joined words must not read as %d missing", got)
	}
}

func TestCompareRecitation_WrongWordIsReported(t *testing.T) {
	// Boundary repair must not become a licence to pass anything.
	words, score := CompareRecitation(basmalah, "بسم الله الرحمن الكريم")

	if score != 75 {
		t.Errorf("score = %d, want 75 — one of four words is wrong: %v", score, statuses(words))
	}
	if words[3].Status != WordWrong {
		t.Errorf("the last word read %s, want wrong", words[3].Status)
	}
}

func TestCompareRecitation_SomethingElseEntirelyScoresLow(t *testing.T) {
	// The case the Whisper prompt used to hide: a learner says an unrelated
	// ayah and the grader has to notice.
	_, score := CompareRecitation(basmalah, "قل هو الله احد الله الصمد")

	if score > 25 {
		t.Errorf("score = %d — a different ayah must not read as a pass", score)
	}
}

func TestCompareRecitation_HallucinatedRepeatsAreCapped(t *testing.T) {
	// A looping decode used to append every stray word, so the learner saw far
	// more "extra" words than the ayah even has.
	transcript := strings.TrimSpace(strings.Repeat("بسم الله الرحمن الرحيم ", 6))
	words, score := CompareRecitation(basmalah, transcript)

	if score != 100 {
		t.Errorf("score = %d, want 100 — one clean copy is in there", score)
	}
	if got := countStatus(words, WordExtra); got > 4 {
		t.Errorf("extra words = %d, want no more than the ayah's own 4", got)
	}
}

func TestCompareRecitation_AyahWordsKeepTheirOrder(t *testing.T) {
	expected := TokenizeArabic(basmalah)
	words, _ := CompareRecitation(basmalah, "الرحيم بسم شيء الله الرحمن")

	seen := 0
	for _, w := range words {
		if w.Status == WordExtra {
			continue
		}
		if seen >= len(expected) {
			t.Fatalf("more ayah words returned than the ayah has")
		}
		if NormalizeArabic(w.Text) != expected[seen] {
			t.Errorf("position %d = %q, want %q — ayah order must survive alignment",
				seen, w.Text, expected[seen])
		}
		seen++
	}
	if seen != len(expected) {
		t.Errorf("returned %d ayah words, want %d", seen, len(expected))
	}
}

func TestNormalizeArabic_FoldsTheVariantsWhisperProduces(t *testing.T) {
	cases := []struct{ in, want string }{
		{"ٱلرَّحْمَٰنِ", "الرحمان"}, // alef wasla + superscript alef spelled out
		{"أحمد", "احمد"},
		{"إسلام", "اسلام"},
		{"صلاة", "صلاه"},   // taa marbuta → haa
		{"موسى", "موسي"},   // alef maqsura → ya
		{"مُؤْمِن", "مومن"}, // waw with hamza
		{"سـلام", "سلام"},  // tatweel
	}
	for _, tc := range cases {
		if got := NormalizeArabic(tc.in); got != tc.want {
			t.Errorf("NormalizeArabic(%q) = %q, want %q", tc.in, got, tc.want)
		}
	}
}

// ─────────────────────────────────────────────
// Uthmani source text vs. the imla'i script Whisper returns
//
// The ayah text comes from alquran.cloud's ar.alafasy edition, which is fully
// vowelled Uthmani. Whisper transcribes into plain modern spelling. Every case
// below is a difference between those two orthographies that used to be scored
// as a mistake the learner never made.
// ─────────────────────────────────────────────

func TestCompareRecitation_UthmaniSpellingIsNotAMistake(t *testing.T) {
	cases := []struct{ name, expected, spoken string }{
		{
			// alquran.cloud prefixes Al-Fatiha 1 with a byte order mark. It is
			// invisible, it is not whitespace, so it rode along inside the first
			// token and made بِسْمِ wrong on the app's most-recited surah.
			"byte order mark on Al-Fatiha 1",
			"\ufeffبِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
			"بسم الله الرحمن الرحيم",
		},
		{
			// Dagger alef over a waw: the waw is silent scaffolding, the mark is
			// the ā. ٱلصَّلَوٰةَ and الصلاة are the same word.
			"dagger alef over waw — salah",
			"وَيُقِيمُونَ ٱلصَّلَوٰةَ",
			"ويقيمون الصلاة",
		},
		{
			"dagger alef over waw — zakah",
			"وَءَاتُوا۟ ٱلزَّكَوٰةَ",
			"وآتوا الزكاة",
		},
		{
			// Dagger alef over a consonant is simply omitted in modern spelling.
			"dagger alef over consonant",
			"ذَٰلِكَ ٱلْكِتَٰبُ لَا رَيْبَ",
			"ذلك الكتاب لا ريب",
		},
		{
			// U+06E5 ARABIC SMALL WAW is an annotation, not a letter.
			"small waw annotation",
			"دَاوُۥدَ",
			"داوود",
		},
		{
			// Uthmani seats a bare hamza that imla'i writes as a madda.
			"bare hamza",
			"شَىْءٍ قَدِيرٌ",
			"شيء قدير",
		},
		{
			// Waqf marks sit between words as their own tokens.
			"waqf marks between words",
			"لَا رَيْبَ ۛ فِيهِ ۛ هُدًۭى لِّلْمُتَّقِينَ",
			"لا ريب فيه هدى للمتقين",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			words, score := CompareRecitation(tc.expected, tc.spoken)
			if score != 100 {
				t.Errorf("score = %d, want 100 — this is a spelling difference, not a recitation mistake: %v",
					score, statuses(words))
			}
		})
	}
}

func TestNormalizeArabic_DaggerAlefSpellsOutTheLongVowel(t *testing.T) {
	cases := []struct{ in, want, why string }{
		{"ٱلْكِتَٰبُ", "الكتاب", "over a consonant it becomes a written alef"},
		{"ٱلْعَٰلَمِينَ", "العالمين", "same, mid-word"},
		{"ٱلسَّمَٰوَٰتِ", "السماوات", "a vowelled waw is pronounced and kept"},
		{"ٱلصَّلَوٰةَ", "الصلاه", "an unvowelled waw is a silent carrier"},
		{"يَغْشَىٰهَا", "يغشاها", "so is an unvowelled ya"},
		{"مُوسَىٰ", "موسي", "word-final, where plain script writes ى"},
		{"عَلَىٰ", "علي", "likewise"},
	}
	for _, tc := range cases {
		if got := NormalizeArabic(tc.in); got != tc.want {
			t.Errorf("NormalizeArabic(%q) = %q, want %q — %s", tc.in, got, tc.want, tc.why)
		}
	}
	if _, score := CompareRecitation("مُوسَىٰ عَلَىٰ ٱلسَّمَٰوَٰتِ", "موسى على السماوات"); score != 100 {
		t.Errorf("score = %d, want 100", score)
	}
}

func TestNormalizeArabic_GeminationIsNotGraded(t *testing.T) {
	if got, want := NormalizeArabic("ٱلَّيْلِ"), NormalizeArabic("الليل"); got != want {
		t.Errorf("ٱلَّيْلِ → %q but الليل → %q; the two spellings must agree", got, want)
	}
	if _, score := CompareRecitation("وَٱلَّيْلِ إِذَا يَغْشَىٰ", "والليل إذا يغشى"); score != 100 {
		t.Errorf("score = %d, want 100", score)
	}
}

func TestCompareRecitation_ResultsCarryTheMushafSpelling(t *testing.T) {
	// The panel renders WordResult.Text verbatim. Handing back the comparison
	// form showed the learner عَلَىٰ كُلِّ شَىْءٍ as "علي كل شي" — their own
	// scripture spelled back at them wrongly.
	const ayah = "عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ"

	words, _ := CompareRecitation(ayah, "")
	got := make([]string, 0, len(words))
	for _, w := range words {
		got = append(got, w.Text)
	}
	want := strings.Fields(ayah)
	if strings.Join(got, " ") != strings.Join(want, " ") {
		t.Errorf("displayed words = %q, want the source spelling %q", got, want)
	}
}

func TestCompareRecitation_AyahNumbersAreNotWordsToRecite(t *testing.T) {
	// An ayah marker or a stray number in admin-authored lesson text is not
	// something anyone can pronounce, so it must never count against the score.
	words, score := CompareRecitation("قُلْ هُوَ ٱللَّهُ أَحَدٌ ﴿١﴾", "قل هو الله أحد")

	if score != 100 {
		t.Errorf("score = %d, want 100 — the ayah number is not a word: %v", score, statuses(words))
	}
	if len(words) != 4 {
		t.Errorf("returned %d words, want the ayah's 4", len(words))
	}
}

func TestCompareRecitation_WordsTheAyahDoesNotContainCostMarks(t *testing.T) {
	// Reciting the ayah and then carrying on talking is not a perfect
	// recitation, however cleanly the ayah itself came out.
	_, clean := CompareRecitation(basmalah, "بسم الله الرحمن الرحيم")
	_, padded := CompareRecitation(basmalah, "بسم الله الرحمن الرحيم وكذلك نحن نقول اشياء كثيرة")

	if clean != 100 {
		t.Fatalf("clean recitation scored %d, want 100", clean)
	}
	if padded >= clean {
		t.Errorf("padded recitation scored %d, want less than the clean %d", padded, clean)
	}
}

func TestCompareRecitation_OneStrayWordIsForgiven(t *testing.T) {
	// A single spurious token is ordinary recogniser noise — a learner who
	// recited the ayah correctly should not be marked down for it.
	if _, score := CompareRecitation(basmalah, "بسم الله الرحمن الرحيم اه"); score != 100 {
		t.Errorf("score = %d, want 100 — one stray token is recogniser noise", score)
	}
}

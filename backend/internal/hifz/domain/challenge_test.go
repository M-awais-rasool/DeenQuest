package domain

import (
	"fmt"
	"reflect"
	"strings"
	"testing"
)

// Al-Ikhlas, in the form alquran.cloud returns it (ayah 1 carries the basmalah).
var ikhlas = []string{
	"بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ قُلْ هُوَ اللَّهُ أَحَدٌ",
	"اللَّهُ الصَّمَدُ",
	"لَمْ يَلِدْ وَلَمْ يُولَدْ",
	"وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
}

func testParams(seed string, preset DifficultyPreset) GenParams {
	s := DefaultSettings()
	texts := make([]string, len(ikhlas))
	for i, t := range ikhlas {
		texts[i] = StripBasmalah(t, 112, i+1)
	}
	return GenParams{
		Portion:     Portion{ID: "p1", SurahID: 112, AyahStart: 1, AyahEnd: 4},
		AyahNumbers: []int{1, 2, 3, 4},
		AyahTexts:   texts,
		Preset:      preset,
		Settings:    &s,
		Seed:        seed,
	}
}

const uthmaniKafirun = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ قُلْ يَٰٓأَيُّهَا ٱلْكَٰفِرُونَ"

func TestStripBasmalah_UthmaniAlefWasla(t *testing.T) {
	got := StripBasmalah(uthmaniKafirun, 109, 1)
	if strings.Contains(got, "بِسْمِ") || strings.Contains(got, "ٱلرَّحِيمِ") {
		t.Errorf("basmalah with alef wasla must still be stripped, got %q", got)
	}
	if !strings.Contains(got, "قُلْ") {
		t.Errorf("the ayah itself must survive, got %q", got)
	}
	if want := "قُلْ يَٰٓأَيُّهَا ٱلْكَٰفِرُونَ"; got != want {
		t.Errorf("StripBasmalah = %q, want %q", got, want)
	}
}

func TestStripBasmalah_ShortAyahIsNotEmptied(t *testing.T) {
	bare := "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"
	if got := StripBasmalah(bare, 110, 1); got != bare {
		t.Errorf("a bare basmalah must not be stripped to empty, got %q", got)
	}
}

func TestStripBasmalah(t *testing.T) {
	got := StripBasmalah(ikhlas[0], 112, 1)
	if strings.Contains(got, "الرَّحِيمِ") {
		t.Errorf("basmalah should be stripped from ayah 1 of surah 112, got %q", got)
	}
	if !strings.Contains(got, "أَحَدٌ") {
		t.Errorf("the ayah itself must survive, got %q", got)
	}

	// Al-Fatihah: the basmalah *is* ayah 1 and must be left alone.
	fatihah := "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
	if got := StripBasmalah(fatihah, 1, 1); got != fatihah {
		t.Errorf("surah 1 ayah 1 must be untouched, got %q", got)
	}

	// Later ayahs are never touched.
	if got := StripBasmalah(ikhlas[1], 112, 2); got != ikhlas[1] {
		t.Errorf("ayah 2 must be untouched, got %q", got)
	}
}

func TestSplitWords_PreservesDiacritics(t *testing.T) {
	words := SplitWords("اللَّهُ الصَّمَدُ")
	if len(words) != 2 {
		t.Fatalf("expected 2 words, got %d (%v)", len(words), words)
	}
	// Unlike the recitation tokenizer, display words keep their harakat.
	if !strings.ContainsRune(words[0], 'َ') && !strings.ContainsRune(words[0], 'ُ') {
		t.Errorf("diacritics must be preserved for display, got %q", words[0])
	}
}

func TestFirstLetter(t *testing.T) {
	if got := FirstLetter("قُلْ"); got != "ق" {
		t.Errorf("FirstLetter = %q, want ق", got)
	}
	if got := FirstLetter(""); got != "" {
		t.Errorf("empty word should give empty letter, got %q", got)
	}
}

func TestGenerateChallenges_IsDeterministic(t *testing.T) {
	settings := DefaultSettings()
	preset := settings.Preset("intermediate")
	a := GenerateChallenges(testParams("session-abc", preset))
	b := GenerateChallenges(testParams("session-abc", preset))

	if len(a) == 0 {
		t.Fatal("expected challenges to be generated")
	}
	if !reflect.DeepEqual(a, b) {
		t.Error("the same seed must reproduce the identical challenge set — a mid-session reload depends on it")
	}

	c := GenerateChallenges(testParams("session-xyz", preset))
	if reflect.DeepEqual(a, c) {
		t.Error("different seeds should produce different challenge sets")
	}
}

func TestGenerateChallenges_RespectsCountAndEnabledKinds(t *testing.T) {
	preset := DifficultyPreset{
		ChallengeCount:    2,
		EnabledChallenges: []string{ChallengeClozeWord},
		AllowHints:        true,
	}
	got := GenerateChallenges(testParams("seed", preset))
	if len(got) != 2 {
		t.Fatalf("expected exactly 2 challenges, got %d", len(got))
	}
	for _, ch := range got {
		if ch.Kind != ChallengeClozeWord {
			t.Errorf("only cloze_word was enabled, got %s", ch.Kind)
		}
	}
}

func TestGenerateChallenges_SkipsKindsNeedingMultipleAyahs(t *testing.T) {
	p := testParams("seed", DifficultyPreset{
		ChallengeCount:    4,
		EnabledChallenges: []string{ChallengeAyahOrder, ChallengeNextAyah, ChallengeClozeWord},
	})
	// A single-ayah portion cannot support ordering or "what comes next".
	p.AyahTexts = p.AyahTexts[:1]
	p.AyahNumbers = p.AyahNumbers[:1]

	for _, ch := range GenerateChallenges(p) {
		if ch.Kind == ChallengeAyahOrder || ch.Kind == ChallengeNextAyah {
			t.Errorf("%s needs at least 2 ayahs but was generated for a 1-ayah portion", ch.Kind)
		}
	}
}

func TestGenerateChallenges_NoDuplicateWholePortionKinds(t *testing.T) {
	// ayah_order has exactly one form per portion, so generating it twice would
	// ask the identical question twice in one session.
	preset := DifficultyPreset{
		ChallengeCount:    4,
		EnabledChallenges: []string{ChallengeAyahOrder, ChallengeProgressiveFade, ChallengeClozeWord},
	}
	counts := map[string]int{}
	for _, ch := range GenerateChallenges(testParams("dup-kind-seed", preset)) {
		counts[ch.Kind]++
	}
	for _, kind := range []string{ChallengeAyahOrder, ChallengeProgressiveFade} {
		if counts[kind] > 1 {
			t.Errorf("%s appeared %d times; it has one form per portion so it must appear at most once",
				kind, counts[kind])
		}
	}
}

func TestGenerateChallenges_NoTwoIdenticalChallenges(t *testing.T) {
	settings := DefaultSettings()
	preset := settings.Preset("beginner")
	got := GenerateChallenges(testParams("identical-seed", preset))

	seen := map[string]bool{}
	for _, ch := range got {
		key := ch.Kind + "|" + fmt.Sprint(ch.Content)
		if seen[key] {
			t.Errorf("two identical %s challenges in one session", ch.Kind)
		}
		seen[key] = true
	}
}

func TestGenCloze_ShapeMatchesFillBlankContract(t *testing.T) {
	preset := DifficultyPreset{ChallengeCount: 1, EnabledChallenges: []string{ChallengeClozeWord}}
	got := GenerateChallenges(testParams("cloze-seed", preset))
	if len(got) != 1 {
		t.Fatalf("expected 1 challenge, got %d", len(got))
	}
	ch := got[0]

	tokens, ok := ch.Content["sentence"].([]ClozeToken)
	if !ok {
		t.Fatalf("sentence should be []ClozeToken, got %T", ch.Content["sentence"])
	}

	blanks := 0
	for _, tok := range tokens {
		if tok.Blank {
			blanks++
			if tok.Answer == "" {
				t.Error("every blank must carry its answer")
			}
			if tok.Text != "" {
				t.Error("a blank must not also carry visible text")
			}
		}
	}
	if blanks == 0 {
		t.Error("a cloze with no blanks is not a cloze")
	}

	bank, ok := ch.Content["bank"].([]string)
	if !ok {
		t.Fatalf("bank should be []string, got %T", ch.Content["bank"])
	}
	if len(bank) < blanks {
		t.Errorf("bank (%d) must contain at least every answer (%d)", len(bank), blanks)
	}

	// Every answer must actually be tappable.
	for _, tok := range tokens {
		if !tok.Blank {
			continue
		}
		found := false
		for _, b := range bank {
			if b == tok.Answer {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("answer %q is missing from the bank — the challenge would be unsolvable", tok.Answer)
		}
	}
}

func TestGenProgressiveFade_RoundsGetHarder(t *testing.T) {
	preset := DifficultyPreset{ChallengeCount: 1, EnabledChallenges: []string{ChallengeProgressiveFade}}
	got := GenerateChallenges(testParams("fade-seed", preset))
	if len(got) != 1 {
		t.Fatalf("expected 1 challenge, got %d", len(got))
	}

	rounds, ok := got[0].Content["rounds"].([]map[string]any)
	if !ok {
		t.Fatalf("rounds should be []map[string]any, got %T", got[0].Content["rounds"])
	}
	if len(rounds) < 2 {
		t.Fatalf("progressive fade needs multiple rounds, got %d", len(rounds))
	}

	prev := -1
	for i, r := range rounds {
		tokens := r["sentence"].([]ClozeToken)
		blanks := 0
		for _, tok := range tokens {
			if tok.Blank {
				blanks++
			}
		}
		if blanks < prev {
			t.Errorf("round %d hides fewer words (%d) than round %d (%d) — the ramp must not go backwards",
				i, blanks, i-1, prev)
		}
		prev = blanks
	}

	// The last round should hide everything.
	last := rounds[len(rounds)-1]["sentence"].([]ClozeToken)
	for _, tok := range last {
		if !tok.Blank {
			t.Errorf("the final fade round should hide every word, found visible %q", tok.Text)
		}
	}
}

func TestGenFirstLetter_GivesLetterHints(t *testing.T) {
	preset := DifficultyPreset{ChallengeCount: 1, EnabledChallenges: []string{ChallengeFirstLetter}}
	got := GenerateChallenges(testParams("fl-seed", preset))
	if len(got) != 1 {
		t.Fatalf("expected 1 challenge, got %d", len(got))
	}

	tokens := got[0].Content["sentence"].([]ClozeToken)
	for _, tok := range tokens {
		if !tok.Blank {
			t.Error("first_letter hides every word")
			continue
		}
		if tok.Hint == "" {
			t.Errorf("blank for %q is missing its first-letter hint", tok.Answer)
		}
		if !strings.HasPrefix(tok.Answer, tok.Hint) {
			t.Errorf("hint %q is not the first letter of %q", tok.Hint, tok.Answer)
		}
	}
}

func TestGenNextAyah_CorrectIndexPointsAtTheAnswer(t *testing.T) {
	preset := DifficultyPreset{ChallengeCount: 1, EnabledChallenges: []string{ChallengeNextAyah}}
	p := testParams("next-seed", preset)
	got := GenerateChallenges(p)
	if len(got) != 1 {
		t.Fatalf("expected 1 challenge, got %d", len(got))
	}
	ch := got[0]

	options := ch.Content["options"].([]string)
	correct := ch.Content["correct"].(int)
	if correct < 0 || correct >= len(options) {
		t.Fatalf("correct index %d out of range for %d options", correct, len(options))
	}

	// The marked option must genuinely be the ayah after the prompt.
	promptAyah := ch.Content["prompt_ayah"].(int)
	wantIdx := -1
	for i, n := range p.AyahNumbers {
		if n == promptAyah {
			wantIdx = i + 1
			break
		}
	}
	if wantIdx < 0 || wantIdx >= len(p.AyahTexts) {
		t.Fatalf("prompt ayah %d has no successor in the portion", promptAyah)
	}
	if options[correct] != p.AyahTexts[wantIdx] {
		t.Errorf("correct option is %q, want the following ayah %q", options[correct], p.AyahTexts[wantIdx])
	}
}

func TestBuildBank_NoDuplicateNormalisedWords(t *testing.T) {
	preset := DifficultyPreset{ChallengeCount: 3, EnabledChallenges: []string{ChallengeClozeWord}}
	for _, ch := range GenerateChallenges(testParams("dupe-seed", preset)) {
		bank := ch.Content["bank"].([]string)
		seen := map[string]bool{}
		for _, w := range bank {
			key := normalizeForCompare(w)
			if seen[key] {
				t.Errorf("bank contains two spellings of the same word (%q) — the challenge would have two right answers", w)
			}
			seen[key] = true
		}
	}
}

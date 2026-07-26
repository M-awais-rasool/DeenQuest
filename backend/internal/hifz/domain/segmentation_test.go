package domain

import "testing"

var testMeta = map[int]SurahMeta{
	2:   {ID: 2, Name: "البقرة", EnglishName: "Al-Baqarah", AyahCount: 286},
	18:  {ID: 18, Name: "الكهف", EnglishName: "Al-Kahf", AyahCount: 110},
	67:  {ID: 67, Name: "الملك", EnglishName: "Al-Mulk", AyahCount: 30},
	109: {ID: 109, Name: "الكافرون", EnglishName: "Al-Kafirun", AyahCount: 6},
	112: {ID: 112, Name: "الإخلاص", EnglishName: "Al-Ikhlas", AyahCount: 4},
	113: {ID: 113, Name: "الفلق", EnglishName: "Al-Falaq", AyahCount: 5},
	114: {ID: 114, Name: "الناس", EnglishName: "An-Nas", AyahCount: 6},
}

func TestBuildPortions_AutoCoversEveryAyahExactlyOnce(t *testing.T) {
	plan := Plan{
		ID:           "p",
		Scope:        PlanScope{SurahIDs: []int{112, 113, 114}},
		Segmentation: Segmentation{Mode: SegmentAuto, AyahsPerPortion: 3},
	}
	portions, err := BuildPortions(plan, testMeta, 0)
	if err != nil {
		t.Fatalf("BuildPortions: %v", err)
	}

	for _, sid := range []int{112, 113, 114} {
		covered := map[int]int{}
		for _, p := range portions {
			if p.SurahID != sid {
				continue
			}
			for a := p.AyahStart; a <= p.AyahEnd; a++ {
				covered[a]++
			}
		}
		want := testMeta[sid].AyahCount
		if len(covered) != want {
			t.Errorf("surah %d: covered %d ayahs, want %d", sid, len(covered), want)
		}
		for ayah, n := range covered {
			if n != 1 {
				t.Errorf("surah %d ayah %d covered %d times, want exactly 1", sid, ayah, n)
			}
		}
	}
}

func TestBuildPortions_AbsorbsSingleAyahTail(t *testing.T) {
	// Al-Falaq has 5 ayahs; split by 2 would leave a lone ayah 5.
	plan := Plan{
		ID:           "p",
		Scope:        PlanScope{SurahIDs: []int{113}},
		Segmentation: Segmentation{Mode: SegmentAuto, AyahsPerPortion: 2},
	}
	portions, err := BuildPortions(plan, testMeta, 0)
	if err != nil {
		t.Fatalf("BuildPortions: %v", err)
	}

	for _, p := range portions {
		if p.AyahCount() == 1 {
			t.Errorf("a lone-ayah portion (%d:%d) is not a session — it should have been absorbed",
				p.SurahID, p.AyahStart)
		}
	}
	last := portions[len(portions)-1]
	if last.AyahEnd != 5 {
		t.Errorf("the last portion should reach ayah 5, got %d", last.AyahEnd)
	}
}

func TestBuildPortions_ExplicitSizeOverridesPlan(t *testing.T) {
	plan := Plan{
		ID:           "p",
		Scope:        PlanScope{SurahIDs: []int{67}},
		Segmentation: Segmentation{Mode: SegmentAuto, AyahsPerPortion: 5},
	}
	beginner, err := BuildPortions(plan, testMeta, 3)
	if err != nil {
		t.Fatalf("BuildPortions: %v", err)
	}
	hafiz, err := BuildPortions(plan, testMeta, 6)
	if err != nil {
		t.Fatalf("BuildPortions: %v", err)
	}
	if len(beginner) <= len(hafiz) {
		t.Errorf("a beginner should get more, smaller portions: beginner=%d hafiz=%d",
			len(beginner), len(hafiz))
	}
}

func TestBuildPortions_ManualRangesAreNotResized(t *testing.T) {
	plan := Plan{
		ID:    "baqarah",
		Scope: PlanScope{SurahIDs: []int{2}},
		Segmentation: Segmentation{
			Mode: SegmentManual,
			Ranges: []ManualRange{
				{SurahID: 2, AyahStart: 255, AyahEnd: 255, Label: "Ayat al-Kursi"},
				{SurahID: 2, AyahStart: 284, AyahEnd: 286},
			},
		},
	}
	// Manual ranges were authored on meaningful boundaries — an explicit size of 6
	// must not touch them.
	portions, err := BuildPortions(plan, testMeta, 6)
	if err != nil {
		t.Fatalf("BuildPortions: %v", err)
	}
	if len(portions) != 2 {
		t.Fatalf("expected the 2 authored ranges, got %d", len(portions))
	}
	if portions[0].AyahStart != 255 || portions[0].AyahEnd != 255 {
		t.Errorf("Ayat al-Kursi range was altered: %d–%d", portions[0].AyahStart, portions[0].AyahEnd)
	}
	if portions[0].Label != "Ayat al-Kursi" {
		t.Errorf("authored label lost, got %q", portions[0].Label)
	}
	if portions[1].Label == "" {
		t.Error("a range without an authored label should get a generated one")
	}
}

func TestBuildPortions_StableIDs(t *testing.T) {
	plan := Plan{
		ID:           "four-quls",
		Scope:        PlanScope{SurahIDs: []int{112}},
		Segmentation: Segmentation{Mode: SegmentAuto, AyahsPerPortion: 4},
	}
	a, _ := BuildPortions(plan, testMeta, 0)
	b, _ := BuildPortions(plan, testMeta, 0)
	if a[0].ID != b[0].ID {
		t.Error("portion IDs must be deterministic — stored progress is keyed on them")
	}
	if a[0].ID != PortionID("four-quls", 112, 1, 4) {
		t.Errorf("unexpected portion ID %q", a[0].ID)
	}
}

func TestBuildPortions_SkipsSurahsWithoutMetadata(t *testing.T) {
	plan := Plan{
		ID:           "p",
		Scope:        PlanScope{SurahIDs: []int{112, 999}},
		Segmentation: Segmentation{Mode: SegmentAuto, AyahsPerPortion: 4},
	}
	portions, err := BuildPortions(plan, testMeta, 0)
	if err != nil {
		t.Fatalf("BuildPortions: %v", err)
	}
	for _, p := range portions {
		if p.SurahID == 999 {
			t.Error("a surah with no metadata must be skipped, not emitted with a bad range")
		}
	}
}

func TestScopeSurahIDs(t *testing.T) {
	if _, err := ScopeSurahIDs(PlanScope{}); err == nil {
		t.Error("an empty scope must be rejected")
	}

	juz30, err := ScopeSurahIDs(PlanScope{Juz: 30})
	if err != nil {
		t.Fatalf("juz 30: %v", err)
	}
	if len(juz30) != 37 {
		t.Errorf("juz 30 has 37 surahs, got %d", len(juz30))
	}

	if _, err := ScopeSurahIDs(PlanScope{Juz: 12}); err == nil {
		t.Error("an unsupported juz should be rejected rather than silently empty")
	}
}

func TestSeedPlans_AreWellFormed(t *testing.T) {
	seen := map[string]bool{}
	for _, p := range SeedPlans() {
		if p.ID == "" || p.Title == "" {
			t.Errorf("plan %q is missing an id or title", p.ID)
		}
		if seen[p.ID] {
			t.Errorf("duplicate plan id %q", p.ID)
		}
		seen[p.ID] = true

		if _, err := ScopeSurahIDs(p.Scope); err != nil {
			t.Errorf("plan %q has an invalid scope: %v", p.ID, err)
		}
		if p.SeedVersion != PlanSeedVersion {
			t.Errorf("plan %q seed version %d, want %d", p.ID, p.SeedVersion, PlanSeedVersion)
		}
	}
}

func TestDefaultSettings_ChallengeConfigsExistForEnabledKinds(t *testing.T) {
	s := DefaultSettings()
	for _, kind := range s.Session.EnabledChallenges {
		if _, ok := s.Challenges[kind]; !ok {
			t.Errorf("session rules enable %q but there is no challenge config for it", kind)
		}
	}
}

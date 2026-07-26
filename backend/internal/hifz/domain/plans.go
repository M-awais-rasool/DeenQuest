package domain

const PlanSeedVersion = 2 

var juz30Descending = []int{
	114, 113, 112, 111, 110, 109, 108, 107, 106, 105, 104, 103, 102, 101, 100,
	99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81,
	80, 79, 78,
}

// SeedPlans returns the built-in memorization programs.
func SeedPlans() []Plan {
	return []Plan{
		{
			ID:          "four-quls",
			Slug:        "four-quls",
			Title:       "The Four Quls",
			Subtitle:    "Where every hifz journey starts",
			Description: "Al-Kafirun, Al-Ikhlas, Al-Falaq and An-Nas — the four surahs beginning with \"Qul\". Short, endlessly recited, and the perfect first taste of memorizing with intent.",
			Icon:        "✋",
			Accent:      "#5EE0CE",
			Order:       1,
			Published:   true,
			Scope:       PlanScope{SurahIDs: []int{109, 112, 113, 114}},
			Segmentation: Segmentation{
				Mode:            SegmentAuto,
				AyahsPerPortion: 3,
			},
			XPPerPortion: 40,
			SeedVersion:  PlanSeedVersion,
		},
		{
			ID:          "juz-30-progressive",
			Slug:        "juz-30-progressive",
			Title:       "Juz 30, Backwards",
			Subtitle:    "An-Nas → An-Naba, shortest first",
			Description: "The whole last juz, taken in the order it is actually taught: start with the surahs you already half-know and work back toward the long ones. 37 surahs, 564 ayahs.",
			Icon:        "🌙",
			Accent:      "#EFB65A",
			Order:       2,
			Published:   true,
			Scope:       PlanScope{SurahIDs: juz30Descending},
			Segmentation: Segmentation{
				Mode:            SegmentAuto,
				AyahsPerPortion: 4,
			},
			XPPerPortion: 45,
			SeedVersion:  PlanSeedVersion,
		},
		{
			ID:          "al-mulk",
			Slug:        "al-mulk",
			Title:       "Surah Al-Mulk",
			Subtitle:    "The nightly protection",
			Description: "Thirty ayahs recited every night before sleep. Long enough to be a real commitment, short enough to finish — the natural step after Juz 30's short surahs.",
			Icon:        "👑",
			Accent:      "#8B9DF7",
			Order:       3,
			Published:   true,
			Scope:       PlanScope{SurahIDs: []int{67}},
			Segmentation: Segmentation{
				Mode:            SegmentAuto,
				AyahsPerPortion: 5,
			},
			XPPerPortion: 50,
			SeedVersion:  PlanSeedVersion,
		},
		{
			ID:          "baqarah-shield",
			Slug:        "baqarah-shield",
			Title:       "The Baqarah Shield",
			Subtitle:    "Ayat al-Kursi + the closing ayahs",
			Description: "Ayat al-Kursi and the last three ayahs of Al-Baqarah. Four short passages that carry more weight than their length suggests.",
			Icon:        "🛡️",
			Accent:      "#F78B8B",
			Order:       4,
			Published:   true,
			Scope:       PlanScope{SurahIDs: []int{2}},
			// Manual, because these are specific passages inside a 286-ayah surah —
			// auto-splitting Al-Baqarah would be meaningless here.
			Segmentation: Segmentation{
				Mode: SegmentManual,
				Ranges: []ManualRange{
					{SurahID: 2, AyahStart: 255, AyahEnd: 255, Label: "Ayat al-Kursi"},
					{SurahID: 2, AyahStart: 284, AyahEnd: 284, Label: "Al-Baqarah · 284"},
					{SurahID: 2, AyahStart: 285, AyahEnd: 285, Label: "Al-Baqarah · 285"},
					{SurahID: 2, AyahStart: 286, AyahEnd: 286, Label: "Al-Baqarah · 286"},
				},
			},
			XPPerPortion: 60,
			SeedVersion:  PlanSeedVersion,
		},
		{
			ID:          "kahf-first-ten",
			Slug:        "kahf-first-ten",
			Title:       "Al-Kahf: First Ten",
			Subtitle:    "Ten ayahs, recited every Friday",
			Description: "The opening ten ayahs of Surah Al-Kahf — a Friday habit with a natural weekly review built into it.",
			Icon:        "🕯️",
			Accent:      "#7FD1A8",
			Order:       5,
			Published:   true,
			Scope:       PlanScope{SurahIDs: []int{18}},
			Segmentation: Segmentation{
				Mode: SegmentManual,
				Ranges: []ManualRange{
					{SurahID: 18, AyahStart: 1, AyahEnd: 3, Label: "Al-Kahf · 1–3"},
					{SurahID: 18, AyahStart: 4, AyahEnd: 6, Label: "Al-Kahf · 4–6"},
					{SurahID: 18, AyahStart: 7, AyahEnd: 10, Label: "Al-Kahf · 7–10"},
				},
			},
			XPPerPortion: 55,
			SeedVersion:  PlanSeedVersion,
		},
		{
			ID:          "yaseen",
			Slug:        "yaseen",
			Title:       "Surah Yaseen",
			Subtitle:    "The heart of the Qur'an",
			Description: "Eighty-three ayahs. This is a serious commitment — expect months, not weeks, and let the review queue do its work.",
			Icon:        "💚",
			Accent:      "#C9A0F7",
			Order:       6,
			Published:   true,
			Scope:       PlanScope{SurahIDs: []int{36}},
			Segmentation: Segmentation{
				Mode:            SegmentAuto,
				AyahsPerPortion: 5,
			},
			XPPerPortion: 55,
			SeedVersion:  PlanSeedVersion,
		},
	}
}

package domain

import (
	"sort"
	"time"
)

// PortionStrength is one portion's computed memory reading, ready for the UI.
type PortionStrength struct {
	PortionID  string `json:"portion_id"`
	SurahID    int    `json:"surah_id"`
	SurahName  string `json:"surah_name"`
	Label      string `json:"label"`
	AyahStart  int    `json:"ayah_start"`
	AyahEnd    int    `json:"ayah_end"`
	OrderIndex int    `json:"order_index"`

	Stage         Stage         `json:"stage"`
	Started       bool          `json:"started"`
	Sealed        bool          `json:"sealed"`
	Strength      float64       `json:"strength"` // 0–1
	StrengthPct   int           `json:"strength_pct"`
	Rating        StrengthLabel `json:"rating"`
	Due           bool          `json:"due"`
	NextReviewAt  *time.Time    `json:"next_review_at,omitempty"`
	Reps          int           `json:"reps"`
	BlindVerified bool          `json:"blind_verified"`
}

// SurahStrength rolls portions up to the surah level.
type SurahStrength struct {
	SurahID        int               `json:"surah_id"`
	SurahName      string            `json:"surah_name"`
	EnglishName    string            `json:"english_name"`
	TotalPortions  int               `json:"total_portions"`
	SealedPortions int               `json:"sealed_portions"`
	AyahsMemorized int               `json:"ayahs_memorized"`
	TotalAyahs     int               `json:"total_ayahs"`
	Strength       float64           `json:"strength"`
	StrengthPct    int               `json:"strength_pct"`
	Rating         StrengthLabel     `json:"rating"`
	DueCount       int               `json:"due_count"`
	Portions       []PortionStrength `json:"portions,omitempty"`
}

func BuildPortionStrength(p Portion, st *PortionState, cfg SRSConfig, now time.Time) PortionStrength {
	out := PortionStrength{
		PortionID:  p.ID,
		SurahID:    p.SurahID,
		SurahName:  p.SurahName,
		Label:      p.Label,
		AyahStart:  p.AyahStart,
		AyahEnd:    p.AyahEnd,
		OrderIndex: p.OrderIndex,
		Stage:      "",
	}
	if st == nil {
		out.Rating = StrengthWeak
		return out
	}

	s := Strength(st, cfg, now)
	out.Stage = st.Stage
	out.Started = true
	out.Sealed = st.Stage == StageSealed
	out.Strength = s
	out.StrengthPct = int(s*100 + 0.5)
	out.Rating = Label(s, cfg)
	out.Due = IsDue(st, now)
	out.NextReviewAt = st.NextReviewAt
	out.Reps = st.Reps
	out.BlindVerified = st.BlindVerified
	return out
}

func RollUpSurah(surahID int, surahName, englishName string, totalAyahs int, rows []PortionStrength, cfg SRSConfig) SurahStrength {
	out := SurahStrength{
		SurahID:     surahID,
		SurahName:   surahName,
		EnglishName: englishName,
		TotalAyahs:  totalAyahs,
		Portions:    rows,
	}

	weighted, weight := 0.0, 0
	for _, r := range rows {
		ayahs := r.AyahEnd - r.AyahStart + 1
		out.TotalPortions++
		weight += ayahs
		weighted += r.Strength * float64(ayahs)
		if r.Sealed {
			out.SealedPortions++
			out.AyahsMemorized += ayahs
		}
		if r.Due {
			out.DueCount++
		}
	}

	if weight > 0 {
		out.Strength = weighted / float64(weight)
	}
	out.StrengthPct = int(out.Strength*100 + 0.5)
	out.Rating = Label(out.Strength, cfg)
	return out
}

func SortPortionStrength(rows []PortionStrength) {
	sort.SliceStable(rows, func(i, j int) bool {
		a, b := rows[i], rows[j]
		if a.Started != b.Started {
			return a.Started // started portions first
		}
		if !a.Started {
			return a.OrderIndex < b.OrderIndex
		}
		if a.Due != b.Due {
			return a.Due // due before not-due
		}
		if a.Strength != b.Strength {
			return a.Strength < b.Strength // weakest first
		}
		return a.OrderIndex < b.OrderIndex
	})
}

// Overview is the payload behind the Hifz home screen.
type Overview struct {
	Enrolled   bool   `json:"enrolled"`
	PlanID     string `json:"plan_id,omitempty"`
	PlanTitle  string `json:"plan_title,omitempty"`
	PlanAccent string `json:"plan_accent,omitempty"`

	PortionsSealed int `json:"portions_sealed"`
	PortionsTotal  int `json:"portions_total"`
	AyahsMemorized int `json:"ayahs_memorized"`
	AyahsTotal     int `json:"ayahs_total"`

	OverallStrength float64       `json:"overall_strength"`
	OverallPct      int           `json:"overall_pct"`
	Rating          StrengthLabel `json:"rating"`

	SabqiCount  int `json:"sabqi_count"`
	ManzilCount int `json:"manzil_count"`
	SabaqCount  int `json:"sabaq_count"`

	StreakDays    int  `json:"streak_days"`
	LongestStreak int  `json:"longest_streak"`
	ReviewedToday bool `json:"reviewed_today"`

	NextUpLabel string `json:"next_up_label,omitempty"`
	NextUpID    string `json:"next_up_id,omitempty"`

	Weakest      []PortionStrength `json:"weakest"`
	Surahs       []SurahStrength   `json:"surahs"`
	MistakeCount int               `json:"mistake_count"`
}

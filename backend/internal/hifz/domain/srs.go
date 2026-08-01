package domain

import (
	"math"
	"time"
)

const SettingsSeedVersion = 2

func DefaultSettings() Settings {
	return Settings{
		ID: settingsDocID,
		Session: SessionRules{
			ListenRepeats:       2,
			ShadowRequired:      true,
			OpenRecitePass:      60,
			BlindRecitePass:     65,
			BlindRequiredToSeal: true,
			ChallengeCount:      4,
			EnabledChallenges: []string{
				ChallengeClozeWord, ChallengeAyahOrder, ChallengeProgressiveFade,
				ChallengeNextAyah, ChallengeFirstLetter,
			},
			AllowHints:    true,
			LenienceBonus: 6,
		},
		Challenges: map[string]ChallengeConfig{
			ChallengeClozeWord:       {HiddenWordPct: 30, DistractorCount: 3, Rounds: 1, Enabled: true},
			ChallengeAyahOrder:       {DistractorCount: 0, Rounds: 1, Enabled: true},
			ChallengeProgressiveFade: {DistractorCount: 3, FadeSteps: []int{20, 45, 70, 100}, Enabled: true},
			ChallengeNextAyah:        {DistractorCount: 3, Rounds: 2, Enabled: true},
			ChallengeFirstLetter:     {HiddenWordPct: 100, DistractorCount: 3, Rounds: 1, Enabled: true},
			ChallengeWordMeaning:     {DistractorCount: 3, Rounds: 1, Enabled: false}, // needs authored meanings
		},
		SRS: SRSConfig{
			IntervalLadder:    []int{1, 3, 7, 16, 35, 70},
			BaseHalfLifeDays:  14,
			EMAAlpha:          0.3,
			StrongThreshold:   0.75,
			MediumThreshold:   0.45,
			UnverifiedPenalty: 0.7,
			SabqiWindowDays:   7,
			ManzilDailyCap:    5,
			NewPortionsPerDay: 1,
			HintPenalty:       0.15,
		},
		Reciters: []Reciter{
			{ID: "ar.alafasy", Name: "Mishary Al-Afasy", Style: "Murattal"},
			{ID: "ar.abdulbasitmurattal", Name: "Abdul Basit", Style: "Murattal"},
			{ID: "ar.husary", Name: "Mahmoud Al-Husary", Style: "Murattal"},
			{ID: "ar.minshawi", Name: "Al-Minshawi", Style: "Murattal"},
		},
		SeedVersion: SettingsSeedVersion,
	}
}

const settingsDocID = "hifz_settings"

func SettingsDocID() string { return settingsDocID }

func Strength(st *PortionState, cfg SRSConfig, now time.Time) float64 {
	if st == nil || st.LastReviewAt == nil || st.LastReviewAt.IsZero() {
		return 0
	}
	days := now.Sub(*st.LastReviewAt).Hours() / 24
	if days < 0 {
		days = 0
	}

	halfLife := EffectiveHalfLife(st.Reps, cfg)
	s := st.EMAAccuracy * math.Pow(0.5, days/halfLife)

	if !st.BlindVerified {
		s *= cfg.UnverifiedPenalty
	}
	return clamp01(s)
}

func EffectiveHalfLife(reps int, cfg SRSConfig) float64 {
	base := cfg.BaseHalfLifeDays
	if base <= 0 {
		base = 14
	}
	if reps < 1 {
		reps = 1
	}
	return base * (1 + 0.25*math.Log2(float64(reps)))
}

func Label(strength float64, cfg SRSConfig) StrengthLabel {
	switch {
	case strength >= cfg.StrongThreshold:
		return StrengthStrong
	case strength >= cfg.MediumThreshold:
		return StrengthMedium
	default:
		return StrengthWeak
	}
}

func AttemptAccuracy(rawScore, hintsUsed, latencyMS, baselineMS int, cfg SRSConfig) float64 {
	acc := float64(rawScore) / 100
	if acc < 0 {
		acc = 0
	}

	for i := 0; i < hintsUsed; i++ {
		acc *= 1 - cfg.HintPenalty
	}

	// A markedly slow answer is a weaker signal of recall than a fast one, but
	// never let latency alone drag a correct answer below 80% of its value.
	if baselineMS > 0 && latencyMS > 0 {
		ratio := float64(latencyMS) / float64(baselineMS)
		if ratio > 1.8 {
			penalty := math.Min(0.2, (ratio-1.8)*0.05)
			acc *= 1 - penalty
		}
	}
	return clamp01(acc)
}

func Fold(st *PortionState, accuracy float64, passed bool, cfg SRSConfig, now time.Time) {
	accuracy = clamp01(accuracy)

	alpha := cfg.EMAAlpha
	if alpha <= 0 || alpha > 1 {
		alpha = 0.3
	}
	if st.Reps == 0 && st.EMAAccuracy == 0 {
		st.EMAAccuracy = accuracy // seed at the first observation
	} else {
		st.EMAAccuracy = alpha*accuracy + (1-alpha)*st.EMAAccuracy
	}

	ladder := cfg.IntervalLadder
	if len(ladder) == 0 {
		ladder = []int{1, 3, 7, 16, 35, 70}
	}

	if passed {
		st.Reps++
		if InSabqiWindow(st, cfg, now) {
			st.IntervalDays = ladder[0]
		} else {
			st.IntervalDays = advanceLadder(ladder, st.IntervalDays)
		}
	} else {
		st.Lapses++
		st.Reps = 0
		st.IntervalDays = ladder[0]
	}

	// DSR bookkeeping for the future scheduler.
	st.Difficulty = updateDifficulty(st.Difficulty, accuracy)
	st.Stability = float64(st.IntervalDays) * (0.5 + st.EMAAccuracy)

	reviewed := now
	next := now.AddDate(0, 0, st.IntervalDays)
	st.LastReviewAt = &reviewed
	st.NextReviewAt = &next
	st.UpdatedAt = now
}

func advanceLadder(ladder []int, current int) int {
	for _, rung := range ladder {
		if rung > current {
			return rung
		}
	}
	return ladder[len(ladder)-1]
}

func updateDifficulty(current, accuracy float64) float64 {
	if current == 0 {
		current = 5
	}
	target := 10 - 9*accuracy
	d := current + 0.15*(target-current)
	return math.Max(1, math.Min(10, d))
}

func QueueOf(st *PortionState, cfg SRSConfig, now time.Time) Queue {
	if !st.IsSealed() {
		return QueueSabaq
	}
	if InSabqiWindow(st, cfg, now) {
		return QueueSabqi
	}
	return QueueManzil
}

func InSabqiWindow(st *PortionState, cfg SRSConfig, now time.Time) bool {
	if st == nil || st.SealedAt == nil {
		return false
	}
	return now.Sub(*st.SealedAt).Hours() < float64(sabqiWindowDays(cfg)*24)
}

func sabqiWindowDays(cfg SRSConfig) int {
	if cfg.SabqiWindowDays <= 0 {
		return 7
	}
	return cfg.SabqiWindowDays
}

func IsDue(st *PortionState, now time.Time) bool {
	if !st.IsSealed() || st.NextReviewAt == nil {
		return false
	}
	return !st.NextReviewAt.After(now)
}

// IsSabqi reports whether a portion belongs to the recent-revision queue.
func IsSabqi(st *PortionState, cfg SRSConfig, now time.Time) bool {
	return QueueOf(st, cfg, now) == QueueSabqi
}

func IsManzil(st *PortionState, cfg SRSConfig, now time.Time) bool {
	return QueueOf(st, cfg, now) == QueueManzil
}

func SabqiDue(st *PortionState, cfg SRSConfig, now time.Time) bool {
	return IsSabqi(st, cfg, now) && !ReviewedOn(st, now)
}

func ManzilDue(st *PortionState, cfg SRSConfig, now time.Time) bool {
	return IsManzil(st, cfg, now) && IsDue(st, now)
}

func ReviewedOn(st *PortionState, t time.Time) bool {
	return st != nil && st.LastReviewAt != nil && DayKey(*st.LastReviewAt) == DayKey(t)
}

func SealedOn(st *PortionState, t time.Time) bool {
	return st != nil && st.SealedAt != nil && DayKey(*st.SealedAt) == DayKey(t)
}

// DayKey formats a UTC day stamp, matching the coach module's streak keys.
func DayKey(t time.Time) string { return t.UTC().Format("2006-01-02") }

func NextStreak(lastDay string, current, longest int, now time.Time) (day string, streak, best int) {
	today := DayKey(now)
	if lastDay == today {
		return lastDay, current, longest
	}
	if lastDay == DayKey(now.AddDate(0, 0, -1)) {
		streak = current + 1
	} else {
		streak = 1
	}
	best = longest
	if streak > best {
		best = streak
	}
	return today, streak, best
}

func clamp01(v float64) float64 {
	if v < 0 {
		return 0
	}
	if v > 1 {
		return 1
	}
	return v
}

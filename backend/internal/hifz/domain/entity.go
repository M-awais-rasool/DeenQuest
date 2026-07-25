package domain

import (
	"errors"
	"fmt"
	"time"
)

var (
	ErrPlanNotFound      = errors.New("hifz plan not found")
	ErrPortionNotFound   = errors.New("hifz portion not found")
	ErrNotEnrolled       = errors.New("not enrolled in this hifz plan")
	ErrSessionNotFound   = errors.New("hifz session not found")
	ErrSessionFinished   = errors.New("hifz session already finished")
	ErrInvalidScope      = errors.New("plan scope must set surah_ids or juz")
	ErrNoPortions        = errors.New("plan produced no portions")
	ErrStageOutOfOrder   = errors.New("stage submitted out of order")
	ErrChallengeNotFound = errors.New("challenge not found in session")
)

type Stage string

const (
	StageListen      Stage = "listen"       // ① talqeen — hear it, ayah by ayah
	StageShadow      Stage = "shadow"       // ② repeat-after-me, unscored
	StageOpenRecite  Stage = "open_recite"  // ③ mushaf visible + mic
	StageChallenges  Stage = "challenges"   // ④ occlusion mini-games
	StageBlindRecite Stage = "blind_recite" // ⑤ text hidden + mic — the real test
	StageSealed      Stage = "sealed"       // memorized; now on the review schedule
)

// StageOrder is the canonical pipeline order.
var StageOrder = []Stage{
	StageListen, StageShadow, StageOpenRecite, StageChallenges, StageBlindRecite, StageSealed,
}

func (s Stage) Index() int {
	for i, st := range StageOrder {
		if st == s {
			return i
		}
	}
	return -1
}

// Next returns the stage that follows s, honouring the preset's skip flags.
func (s Stage) Next(preset DifficultyPreset) Stage {
	i := s.Index()
	if i < 0 || i >= len(StageOrder)-1 {
		return StageSealed
	}
	for _, cand := range StageOrder[i+1:] {
		if cand == StageShadow && !preset.ShadowRequired {
			continue
		}
		if cand == StageBlindRecite && !preset.BlindRequiredToSeal {
			continue
		}
		return cand
	}
	return StageSealed
}

type Queue string

const (
	QueueSabqi  Queue = "sabqi"  // recent revision — sealed in the last week
	QueueManzil Queue = "manzil" // long-term revision — SRS says it is due
	QueueSabaq  Queue = "sabaq"  // new memorization
)

// QueueOrder is the order a daily session runs in.
var QueueOrder = []Queue{QueueSabqi, QueueManzil, QueueSabaq}

type StrengthLabel string

const (
	StrengthStrong StrengthLabel = "Strong"
	StrengthMedium StrengthLabel = "Medium"
	StrengthWeak   StrengthLabel = "Weak"
)

type PlanScope struct {
	SurahIDs []int `bson:"surah_ids,omitempty" json:"surah_ids,omitempty"`
	Juz      int   `bson:"juz,omitempty"       json:"juz,omitempty"`
}

type SegmentationMode string

const (
	SegmentAuto SegmentationMode = "auto"
	SegmentManual SegmentationMode = "manual"
)

// ManualRange is one admin-authored portion boundary.
type ManualRange struct {
	SurahID   int    `bson:"surah_id"   json:"surah_id"`
	AyahStart int    `bson:"ayah_start" json:"ayah_start"`
	AyahEnd   int    `bson:"ayah_end"   json:"ayah_end"`
	Label     string `bson:"label,omitempty" json:"label,omitempty"`
}

type Segmentation struct {
	Mode            SegmentationMode `bson:"mode"              json:"mode"`
	AyahsPerPortion int              `bson:"ayahs_per_portion" json:"ayahs_per_portion"`
	Ranges          []ManualRange    `bson:"ranges,omitempty"  json:"ranges,omitempty"`
}

// Plan is a curated memorization program — "Juz 30 (Progressive)", "The 4 Quls".
type Plan struct {
	ID           string       `bson:"_id"          json:"id"`
	Slug         string       `bson:"slug"         json:"slug"`
	Title        string       `bson:"title"        json:"title"`
	Subtitle     string       `bson:"subtitle"     json:"subtitle"`
	Description  string       `bson:"description"  json:"description"`
	Icon         string       `bson:"icon"         json:"icon"`
	Accent       string       `bson:"accent"       json:"accent"` // hex, drives the card gradient
	Order        int          `bson:"order"        json:"order"`
	Published    bool         `bson:"published"    json:"published"`
	Scope        PlanScope    `bson:"scope"        json:"scope"`
	Segmentation Segmentation `bson:"segmentation" json:"segmentation"`
	PresetName   string       `bson:"preset_name"  json:"preset_name"` // default difficulty
	XPPerPortion int          `bson:"xp_per_portion" json:"xp_per_portion"`
	SeedVersion  int          `bson:"seed_version" json:"seed_version"`
	CreatedAt    time.Time    `bson:"created_at"   json:"created_at"`
	UpdatedAt    time.Time    `bson:"updated_at"   json:"updated_at"`
}

// ─────────────────────────────────────────────
// Portions (derived — never stored on their own)
// ─────────────────────────────────────────────
type Portion struct {
	ID         string `json:"id"`
	PlanID     string `json:"plan_id"`
	SurahID    int    `json:"surah_id"`
	SurahName  string `json:"surah_name"`
	AyahStart  int    `json:"ayah_start"`
	AyahEnd    int    `json:"ayah_end"`
	OrderIndex int    `json:"order_index"`
	Label      string `json:"label"`
}

func (p Portion) AyahCount() int { return p.AyahEnd - p.AyahStart + 1 }

func PortionID(planID string, surahID, start, end int) string {
	return fmt.Sprintf("%s:%d:%d-%d", planID, surahID, start, end)
}

type Enrollment struct {
	ID         string `bson:"_id"     json:"id"`
	UserID     string `bson:"user_id" json:"user_id"`
	PlanID     string `bson:"plan_id" json:"plan_id"`
	PresetName string `bson:"preset_name" json:"preset_name"`

	DailyNewPortions int    `bson:"daily_new_portions" json:"daily_new_portions"`
	ReciterID        string `bson:"reciter_id"         json:"reciter_id"`

	StreakDays    int       `bson:"streak_days"     json:"streak_days"`
	LongestStreak int       `bson:"longest_streak"  json:"longest_streak"`
	LastStreakDay string    `bson:"last_streak_day" json:"last_streak_day"` // YYYY-MM-DD
	StartedAt     time.Time `bson:"started_at"      json:"started_at"`
	LastSessionAt time.Time `bson:"last_session_at,omitempty" json:"last_session_at,omitempty"`
	Active        bool      `bson:"active"          json:"active"`
}

type PortionState struct {
	ID        string `bson:"_id"        json:"id"` // userID + ":" + portionID
	UserID    string `bson:"user_id"    json:"user_id"`
	PlanID    string `bson:"plan_id"    json:"plan_id"`
	PortionID string `bson:"portion_id" json:"portion_id"`
	SurahID   int    `bson:"surah_id"   json:"surah_id"`
	AyahStart int    `bson:"ayah_start" json:"ayah_start"`
	AyahEnd   int    `bson:"ayah_end"   json:"ayah_end"`

	Stage    Stage      `bson:"stage"     json:"stage"`
	SealedAt *time.Time `bson:"sealed_at,omitempty" json:"sealed_at,omitempty"`

	AyahTexts []string `bson:"ayah_texts,omitempty" json:"-"`

	EMAAccuracy float64 `bson:"ema_accuracy" json:"ema_accuracy"`
	Stability   float64 `bson:"stability"    json:"stability"`
	Difficulty  float64 `bson:"difficulty"   json:"difficulty"`

	IntervalDays int        `bson:"interval_days" json:"interval_days"`
	Reps         int        `bson:"reps"          json:"reps"`
	Lapses       int        `bson:"lapses"        json:"lapses"`
	LastReviewAt *time.Time `bson:"last_review_at,omitempty" json:"last_review_at,omitempty"`
	NextReviewAt *time.Time `bson:"next_review_at,omitempty" json:"next_review_at,omitempty"`

	BlindVerified  bool `bson:"blind_verified"   json:"blind_verified"`
	BestBlindScore int  `bson:"best_blind_score" json:"best_blind_score"`

	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}

func PortionStateID(userID, portionID string) string { return userID + ":" + portionID }

type WordResult struct {
	Text       string  `bson:"text"       json:"text"`
	Status     string  `bson:"status"     json:"status"` // correct | wrong | missing | extra
	Confidence float64 `bson:"confidence" json:"confidence"`
}

type Attempt struct {
	ID        string `bson:"_id"        json:"id"`
	UserID    string `bson:"user_id"    json:"user_id"`
	PortionID string `bson:"portion_id" json:"portion_id"`
	SessionID string `bson:"session_id" json:"session_id"`
	Queue     Queue  `bson:"queue"      json:"queue"`

	Stage         Stage  `bson:"stage"          json:"stage"`
	ChallengeType string `bson:"challenge_type,omitempty" json:"challenge_type,omitempty"`
	AyahNumber    int    `bson:"ayah_number,omitempty"    json:"ayah_number,omitempty"`

	Accuracy  float64 `bson:"accuracy"   json:"accuracy"` // 0–1, hint/latency adjusted
	RawScore  int     `bson:"raw_score"  json:"raw_score"`
	LatencyMS int     `bson:"latency_ms" json:"latency_ms"`
	HintsUsed int     `bson:"hints_used" json:"hints_used"`

	WordResults []WordResult `bson:"word_results,omitempty" json:"word_results,omitempty"`
	Transcript  string       `bson:"transcript,omitempty"   json:"transcript,omitempty"`
	Overridden  bool         `bson:"overridden,omitempty"   json:"overridden,omitempty"`

	CreatedAt time.Time `bson:"created_at" json:"created_at"`
}

type Mistake struct {
	ID           string     `bson:"_id"        json:"id"`
	UserID       string     `bson:"user_id"    json:"user_id"`
	SurahID      int        `bson:"surah_id"   json:"surah_id"`
	AyahNumber   int        `bson:"ayah_number" json:"ayah_number"`
	WordIndex    int        `bson:"word_index" json:"word_index"`
	Word         string     `bson:"word"       json:"word"`
	MissCount    int        `bson:"miss_count" json:"miss_count"`
	LastMissedAt time.Time  `bson:"last_missed_at" json:"last_missed_at"`
	ResolvedAt   *time.Time `bson:"resolved_at,omitempty" json:"resolved_at,omitempty"`
}

func MistakeID(userID string, surahID, ayah, wordIdx int) string {
	return fmt.Sprintf("%s:%d:%d:%d", userID, surahID, ayah, wordIdx)
}

type Session struct {
	ID        string `bson:"_id"        json:"id"`
	UserID    string `bson:"user_id"    json:"user_id"`
	PlanID    string `bson:"plan_id"    json:"plan_id"`
	PortionID string `bson:"portion_id" json:"portion_id"`
	Queue     Queue  `bson:"queue"      json:"queue"`

	Portion    Portion  `bson:"portion"     json:"portion"`
	AyahTexts  []string `bson:"ayah_texts"  json:"ayah_texts"`
	PresetName string   `bson:"preset_name" json:"preset_name"`

	Stage        Stage       `bson:"stage"       json:"stage"`
	Challenges   []Challenge `bson:"challenges"  json:"challenges"`
	ChallengeIdx int         `bson:"challenge_idx" json:"challenge_idx"`

	Accuracies []float64 `bson:"accuracies" json:"-"` // folded into strength on completion
	XPAwarded  int       `bson:"xp_awarded" json:"xp_awarded"`

	Finished  bool      `bson:"finished"   json:"finished"`
	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}

type DifficultyPreset struct {
	Name                string         `bson:"name"  json:"name"`
	Label               string         `bson:"label" json:"label"`
	ListenRepeats       int            `bson:"listen_repeats"        json:"listen_repeats"`
	ShadowRequired      bool           `bson:"shadow_required"       json:"shadow_required"`
	AyahsPerPortion     int            `bson:"ayahs_per_portion"     json:"ayahs_per_portion"`
	OpenRecitePass      int            `bson:"open_recite_pass"      json:"open_recite_pass"`
	BlindRecitePass     int            `bson:"blind_recite_pass"     json:"blind_recite_pass"`
	BlindRequiredToSeal bool           `bson:"blind_required_to_seal" json:"blind_required_to_seal"`
	ChallengeCount      int            `bson:"challenge_count"       json:"challenge_count"`
	EnabledChallenges   []string       `bson:"enabled_challenges"    json:"enabled_challenges"`
	ChallengeWeights    map[string]int `bson:"challenge_weights,omitempty" json:"challenge_weights,omitempty"`
	AllowHints          bool           `bson:"allow_hints"      json:"allow_hints"`
	ShowTranslation     bool           `bson:"show_translation" json:"show_translation"`
	LenienceBonus       int            `bson:"lenience_bonus"   json:"lenience_bonus"` // points added to recitation scores
}

// ChallengeConfig holds the per-type generation parameters.
type ChallengeConfig struct {
	HiddenWordPct   int   `bson:"hidden_word_pct"  json:"hidden_word_pct"`
	DistractorCount int   `bson:"distractor_count" json:"distractor_count"`
	Rounds          int   `bson:"rounds"           json:"rounds"`
	FadeSteps       []int `bson:"fade_steps"       json:"fade_steps"` // progressive_fade percentages
	TimeLimitS      int   `bson:"time_limit_s"     json:"time_limit_s"`
	Enabled         bool  `bson:"enabled"          json:"enabled"`
}

// SRSConfig exposes the memory model's constants so they can be tuned without
// a deploy.
type SRSConfig struct {
	IntervalLadder    []int   `bson:"interval_ladder"    json:"interval_ladder"`
	BaseHalfLifeDays  float64 `bson:"base_half_life_days" json:"base_half_life_days"`
	EMAAlpha          float64 `bson:"ema_alpha"          json:"ema_alpha"`
	StrongThreshold   float64 `bson:"strong_threshold"   json:"strong_threshold"`
	MediumThreshold   float64 `bson:"medium_threshold"   json:"medium_threshold"`
	UnverifiedPenalty float64 `bson:"unverified_penalty" json:"unverified_penalty"`
	SabqiWindowDays   int     `bson:"sabqi_window_days"  json:"sabqi_window_days"`
	ManzilDailyCap    int     `bson:"manzil_daily_cap"   json:"manzil_daily_cap"`
	HintPenalty       float64 `bson:"hint_penalty"       json:"hint_penalty"`
}

// Reciter is one selectable voice for the Listen stage.
type Reciter struct {
	ID    string `bson:"id"    json:"id"` // alquran.cloud edition identifier
	Name  string `bson:"name"  json:"name"`
	Style string `bson:"style" json:"style"`
}

// Settings is the single tunable document for the whole module.
type Settings struct {
	ID          string                     `bson:"_id"      json:"-"`
	Presets     []DifficultyPreset         `bson:"presets"  json:"presets"`
	Challenges  map[string]ChallengeConfig `bson:"challenges" json:"challenges"`
	SRS         SRSConfig                  `bson:"srs"      json:"srs"`
	Reciters    []Reciter                  `bson:"reciters" json:"reciters"`
	SeedVersion int                        `bson:"seed_version" json:"-"`
	UpdatedAt   time.Time                  `bson:"updated_at"   json:"updated_at"`
}

// Preset returns the named preset, falling back to the first one.
func (s *Settings) Preset(name string) DifficultyPreset {
	for _, p := range s.Presets {
		if p.Name == name {
			return p
		}
	}
	if len(s.Presets) > 0 {
		return s.Presets[0]
	}
	return DefaultSettings().Presets[0]
}

// ChallengeCfg returns the config for a challenge type, or a sane default.
func (s *Settings) ChallengeCfg(kind string) ChallengeConfig {
	if cfg, ok := s.Challenges[kind]; ok {
		return cfg
	}
	if cfg, ok := DefaultSettings().Challenges[kind]; ok {
		return cfg
	}
	return ChallengeConfig{HiddenWordPct: 30, DistractorCount: 3, Rounds: 1, Enabled: true}
}

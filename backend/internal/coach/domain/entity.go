package domain

import "time"

// Telemetry event types — the contract with the Expo client (§3.3 of the plan).
const (
	EventLessonStarted    = "lesson_started"
	EventQuestionAnswered = "question_answered"
	EventLessonCompleted  = "lesson_completed"
	EventRecitationScored = "recitation_scored"
	EventSessionEnd       = "session_end"
	EventCoachCardShown   = "coach_card_shown"
	EventCoachCTATapped   = "coach_cta_tapped"
)

// MaxBatchEvents bounds one ingest call; the client flushes at 20 events, so
// this only guards against pathological payloads.
const MaxBatchEvents = 200

// MaxEventAge — events older than this are silently dropped on ingest.
const MaxEventAge = 7 * 24 * time.Hour

// TelemetryEvent is one client-side learning event. `ts` is epoch millis.
type TelemetryEvent struct {
	Type        string   `json:"type" bson:"type"`
	TS          int64    `json:"ts" bson:"ts"`
	LevelID     int      `json:"level_id,omitempty" bson:"level_id,omitempty"`
	LessonIndex int      `json:"lesson_index,omitempty" bson:"lesson_index,omitempty"`
	Interaction string   `json:"interaction,omitempty" bson:"interaction,omitempty"`
	SkillTags   []string `json:"skill_tags,omitempty" bson:"skill_tags,omitempty"`
	Correct     *bool    `json:"correct,omitempty" bson:"correct,omitempty"`
	Expected    string   `json:"expected,omitempty" bson:"expected,omitempty"`
	Chosen      string   `json:"chosen,omitempty" bson:"chosen,omitempty"`
	Attempt     int      `json:"attempt,omitempty" bson:"attempt,omitempty"`
	LatencyMS   int      `json:"latency_ms,omitempty" bson:"latency_ms,omitempty"`
}

// Time returns the event timestamp as time.Time.
func (e TelemetryEvent) Time() time.Time { return time.UnixMilli(e.TS) }

// StoredEvent is a telemetry event persisted for Phase-2 replay and analytics.
type StoredEvent struct {
	ID        string         `bson:"_id"`
	UserID    string         `bson:"user_id"`
	Event     TelemetryEvent `bson:"event"`
	CreatedAt time.Time      `bson:"created_at"`
}

// SkillStat is the per-skill-tag aggregate inside UserSkillState.
type SkillStat struct {
	Attempts     int       `bson:"attempts" json:"attempts"`
	Correct      int       `bson:"correct" json:"correct"`
	EMAAccuracy  float64   `bson:"ema_accuracy" json:"ema_accuracy"`
	LastSeen     time.Time `bson:"last_seen" json:"last_seen"`
	AvgLatencyMS float64   `bson:"avg_latency_ms" json:"avg_latency_ms"`
}

// DayStat aggregates one calendar day (UTC, "2006-01-02" keys) for the weekly
// accuracy chart and the "lessons analyzed" counter.
type DayStat struct {
	Attempts int `bson:"attempts" json:"attempts"`
	Correct  int `bson:"correct" json:"correct"`
	Lessons  int `bson:"lessons" json:"lessons"`
}

// UserSkillState is the one-doc-per-user deterministic skill model.
//
// Confusions is keyed "expected→chosen" then by day ("2006-01-02"), giving a
// true 7-day rolling window with a single document read; old day buckets are
// pruned on every write.
type UserSkillState struct {
	UserID         string                    `bson:"_id" json:"user_id"`
	Skills         map[string]*SkillStat     `bson:"skills" json:"skills"`
	Confusions     map[string]map[string]int `bson:"confusions" json:"confusions"`
	Days           map[string]*DayStat       `bson:"days" json:"days"`
	PaceBaselineMS float64                   `bson:"pace_baseline_ms" json:"pace_baseline_ms"`
	UpdatedAt      time.Time                 `bson:"updated_at" json:"updated_at"`
}

// Insight rule identifiers.
const (
	RuleConfusionPair = "confusion_pair"
	RuleSlowSkill     = "slow_skill"
	RuleDecay         = "decay"
	RuleWin           = "win"
)

// Insight severities, ranked HIGH > MED > LOW; WIN renders as a banner.
const (
	SeverityHigh = "high"
	SeverityMed  = "med"
	SeverityLow  = "low"
	SeverityWin  = "win"
)

// Insight statuses.
const (
	InsightActive  = "active"
	InsightDone    = "done"    // practice completed
	InsightExpired = "expired" // aged out or superseded
)

// InsightTTL — active insights expire after this long (plan §3.5).
const InsightTTL = 7 * 24 * time.Hour

// MaxActiveInsights caps what the UI shows (plan §3.5).
const MaxActiveInsights = 3

// Insight is one coach finding, stored in coach_insights. Its ID is
// deterministic (userID:rule:skills) so re-evaluating rules is idempotent:
// the same finding updates in place instead of duplicating.
type Insight struct {
	ID              string    `bson:"_id" json:"id"`
	UserID          string    `bson:"user_id" json:"-"`
	Rule            string    `bson:"rule" json:"rule"`
	Severity        string    `bson:"severity" json:"severity"`
	Skills          []string  `bson:"skills" json:"skills"` // Arabic skill tags, e.g. ["ث","ت"]
	Count           int       `bson:"count" json:"count"`   // rule-specific magnitude (mistakes, days unseen…)
	Title           string    `bson:"title" json:"title"`
	Detail          string    `bson:"detail" json:"detail"`
	Why             string    `bson:"why" json:"why"`
	PracticeLevelID int       `bson:"practice_level_id,omitempty" json:"practice_level_id,omitempty"`
	PracticeMinutes int       `bson:"practice_minutes,omitempty" json:"practice_minutes,omitempty"`
	Status          string    `bson:"status" json:"status"`
	CreatedAt       time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt       time.Time `bson:"updated_at" json:"updated_at"`
	ExpiresAt       time.Time `bson:"expires_at" json:"expires_at"`
}

// --- UI contract -----------------------------------------------------------
// CoachStateDTO mirrors CoachState in DeenQuestExpo/app/services/coach.ts so
// GET /coach/insights can replace getMockCoachState() with zero UI changes.

type MessageParts struct {
	Before    string `json:"before"`
	ArabicA   string `json:"arabicA"`
	Middle    string `json:"middle"`
	ArabicB   string `json:"arabicB"`
	After     string `json:"after"`
	Highlight string `json:"highlight"`
	Tail      string `json:"tail"`
}

type SuggestedMission struct {
	Title    string `json:"title"`
	Subtitle string `json:"subtitle"`
	XP       int    `json:"xp"`
	LevelID  int    `json:"levelId"`
}

type WinParts struct {
	Bold       string `json:"bold"`
	Middle     string `json:"middle"`
	BoldAccent string `json:"boldAccent"`
	Tail       string `json:"tail"`
}

type InsightDTO struct {
	ID              string `json:"id"`
	Glyph           string `json:"glyph"`
	GlyphIsArabic   bool   `json:"glyphIsArabic"`
	TileBg          string `json:"tileBg"`
	TileFg          string `json:"tileFg"`
	Title           string `json:"title"`
	Detail          string `json:"detail"`
	Severity        string `json:"severity"` // high | med | low
	PracticeMinutes int    `json:"practiceMinutes,omitempty"`
	PracticeLevelID int    `json:"practiceLevelId,omitempty"`
	Why             string `json:"why,omitempty"`
}

type CoachStateDTO struct {
	Subtitle         string           `json:"subtitle"`
	Message          MessageParts     `json:"message"`
	FixMinutes       int              `json:"fixMinutes"`
	InsightID        string           `json:"insightId,omitempty"`
	PracticeLevelID  int              `json:"practiceLevelId"`
	SuggestedMission SuggestedMission `json:"suggestedMission"`
	WeekAccuracy     []float64        `json:"weekAccuracy"` // Mon..Sun; <0 = no data
	WeekDeltaPct     int              `json:"weekDeltaPct"`
	LessonsAnalyzed  int              `json:"lessonsAnalyzed"`
	Insights         []InsightDTO     `json:"insights"`
	Win              WinParts         `json:"win"`
}

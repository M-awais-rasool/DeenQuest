package application

import "time"

const (
	SegmentImproving = "improving"
	SegmentActive    = "active"
	SegmentWeak      = "weak"
	SegmentInactive  = "inactive"
)

const (
	// weakMastery — mean mastery below this marks a struggling learner.
	weakMastery = 0.5
	// inactiveDays — no attempts for this long and we stop counting them active.
	inactiveDays = 10
	// engagementWindow — days looked at for the engagement ratio.
	engagementWindow = 7
	// dropoutHorizon — days of silence that reads as a fully lapsed learner.
	dropoutHorizon = 14.0
	// weakSkillMastery — per-skill floor for "this learner is weak at this tag".
	weakSkillMastery = 0.6
	// adminTopN — how many rows each curriculum list returns.
	adminTopN = 8
	// adminCacheTTL — the panel polls every 30s; serve a cached snapshot so a
	// left-open dashboard cannot drive repeated full-collection scans.
	adminCacheTTL = 30 * time.Second
)

type AgentStats struct {
	TotalLearners         int            `json:"total_learners"`
	Segments              map[string]int `json:"segments"`
	ActiveRecommendations int            `json:"active_recommendations"`
	DueRevisions          int            `json:"due_revisions"`
	AvgEngagement         float64        `json:"avg_engagement"`
	AvgDropoutRisk        float64        `json:"avg_dropout_risk"`
	TotalEvents           int64          `json:"total_events"`
}

type SkillStruggle struct {
	Tag          string  `json:"tag"`
	Learners     int     `json:"learners"`
	WeakLearners int     `json:"weak_learners"`
	AvgMastery   float64 `json:"avg_mastery"`
}

type LessonStruggle struct {
	LevelID     int `json:"level_id"`
	LessonIndex int `json:"lesson_index"`
	Mistakes    int `json:"mistakes"`
	Learners    int `json:"learners"`
}

type Curriculum struct {
	TopWeakSkills    []SkillStruggle  `json:"top_weak_skills"`
	TopMissedLessons []LessonStruggle `json:"top_missed_lessons"`
}

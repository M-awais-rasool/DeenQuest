package learning

import (
	"sort"
	"strconv"
	"time"

	domain "github.com/chawais/talent-flow/backend/internal/domain/learning"
)

// engine_state.go holds the pure, deterministic state-evolution logic. No I/O,
// no clock of its own — callers pass `now`. This keeps the learning core fully
// rule-based and unit-testable; the StateService only does persistence around it.

const (
	masteryAlpha    = 0.4 // EWMA weight for new evidence
	masteryNeutral  = 0.5 // seed mastery for a brand-new skill
	weakThreshold   = 0.5 // mastery below this => weak area
	strongThreshold = 0.8 // mastery at/above this => strong area

	defaultEase = 2.5
	minEase     = 1.3
	maxEase     = 3.0
	maxInterval = 60.0 // days

	engagementAlpha = 0.3
	recentItemsMax  = 10

	inactiveDays = 3.0  // no events for this long => inactive segment
	dropoutDays  = 14.0 // recency saturates dropout risk here
)

// NewState builds a fresh LearnerState for a user's first event.
func NewState(id, userID, courseType string, now time.Time) *domain.LearnerState {
	if courseType == "" {
		courseType = "qaida"
	}
	return &domain.LearnerState{
		ID:         id,
		UserID:     userID,
		CourseType: courseType,
		Skills:     map[string]domain.SkillStat{},
		Engagement: masteryNeutral,
		Segment:    domain.SegmentActive,
		CreatedAt:  now,
		UpdatedAt:  now,
	}
}

// ApplyEvent mutates state in place to reflect a single behavior event, then
// recomputes all derived fields (weak/strong areas, speed, engagement, dropout
// risk, segment). Deterministic for a given (state, event, now).
func ApplyEvent(state *domain.LearnerState, ev *domain.BehaviorEvent, now time.Time) {
	if state.Skills == nil {
		state.Skills = map[string]domain.SkillStat{}
	}
	state.TotalEvents++

	switch ev.Type {
	case domain.EventAnswerCorrect:
		applyToSkills(state, effectiveTags(ev), true, now)
		bumpEngagement(state, 1.0)
	case domain.EventAnswerWrong:
		applyToSkills(state, effectiveTags(ev), false, now)
		bumpEngagement(state, 0.6)
	case domain.EventRecitationScored:
		applyRecitation(state, ev, now)
		bumpEngagement(state, boolTo(ev.Correct, 1.0, 0.5))
	case domain.EventLessonCompleted, domain.EventLevelCompleted, domain.EventTaskCompleted:
		// A completion is an engagement/exposure signal only — NOT a correctness
		// signal. Real per-skill mastery comes from answer_* and recitation_scored
		// events, so that finishing a level (after some wrong tries) doesn't
		// falsely inflate mastery and hide weak areas.
		bumpEngagement(state, 1.0)
	case domain.EventTimeSpent, domain.EventTaskStarted:
		// no correctness signal; engagement nudge only
		bumpEngagement(state, 0.8)
	case domain.EventHintUsed:
		// hints are a mild negative mastery signal for the touched skills
		applyToSkills(state, effectiveTags(ev), false, now)
	case domain.EventTaskAbandoned:
		bumpEngagement(state, 0.2)
	case domain.EventSessionStart:
		bumpEngagement(state, 0.7)
	}

	if ev.DurationMs > 0 {
		updateAvgTaskMs(state, float64(ev.DurationMs))
	}
	if key := ev.ItemKey(); key != "" {
		pushRecentItem(state, key)
	}

	state.LastEventAt = now
	state.UpdatedAt = now
	recompute(state, now)
}

// LevelTag is the synthetic skill key used when content has no fine-grained
// skill tags — it lets every wrong answer still affect *something* the
// recommender can map back to a revisable level.
func LevelTag(levelID int) string { return "level:" + strconv.Itoa(levelID) }

// effectiveTags returns the event's skill tags, or a single level-level fallback
// tag when the content wasn't tagged, so weak-area detection works on every
// level (not only the seed-tagged ones).
func effectiveTags(ev *domain.BehaviorEvent) []string {
	if len(ev.SkillTags) > 0 {
		return ev.SkillTags
	}
	if ev.LevelID != 0 {
		return []string{LevelTag(ev.LevelID)}
	}
	return nil
}

// applyRecitation attributes correctness per skill: a tag mispronounced (present
// in WrongTokens) counts as wrong, the rest count as correct. With no per-token
// detail it falls back to the overall pass/fail (and to the level when untagged).
func applyRecitation(state *domain.LearnerState, ev *domain.BehaviorEvent, now time.Time) {
	tags := effectiveTags(ev)
	if len(tags) == 0 {
		return
	}
	wrong := make(map[string]struct{}, len(ev.WrongTokens))
	for _, w := range ev.WrongTokens {
		wrong[w] = struct{}{}
	}
	for _, tag := range tags {
		isWrong := !ev.Correct
		if len(ev.WrongTokens) > 0 {
			_, isWrong = wrong[tag]
		}
		updateSkill(state, tag, !isWrong, now)
	}
}

func applyToSkills(state *domain.LearnerState, tags []string, correct bool, now time.Time) {
	for _, tag := range tags {
		if tag == "" {
			continue
		}
		updateSkill(state, tag, correct, now)
	}
}

// updateSkill applies one correct/incorrect observation to a skill: EWMA mastery
// plus an SM-2-lite revision schedule (ease, interval, due date).
func updateSkill(state *domain.LearnerState, tag string, correct bool, now time.Time) {
	st, ok := state.Skills[tag]
	if !ok {
		st = domain.SkillStat{Mastery: masteryNeutral, Ease: defaultEase}
	}
	if st.Ease == 0 {
		st.Ease = defaultEase
	}

	st.Attempts++
	target := 0.0
	if correct {
		target = 1.0
		st.Correct++
		st.Streak++
	} else {
		st.Streak = 0
	}
	st.Mastery = masteryAlpha*target + (1-masteryAlpha)*st.Mastery

	// SM-2-lite scheduling.
	if correct {
		switch {
		case st.Streak <= 1:
			st.IntervalDays = 1
		default:
			st.IntervalDays *= st.Ease
		}
		if st.IntervalDays > maxInterval {
			st.IntervalDays = maxInterval
		}
		st.Ease += 0.1
		if st.Ease > maxEase {
			st.Ease = maxEase
		}
		st.DueAt = now.Add(time.Duration(st.IntervalDays * float64(24*time.Hour)))
	} else {
		st.IntervalDays = 0
		st.Ease -= 0.2
		if st.Ease < minEase {
			st.Ease = minEase
		}
		st.DueAt = now // overdue immediately => eligible for revision
	}
	st.LastSeenAt = now
	state.Skills[tag] = st
}

func bumpEngagement(state *domain.LearnerState, target float64) {
	if state.Engagement == 0 {
		state.Engagement = masteryNeutral
	}
	state.Engagement = engagementAlpha*target + (1-engagementAlpha)*state.Engagement
	state.Engagement = clamp01(state.Engagement)
}

func updateAvgTaskMs(state *domain.LearnerState, ms float64) {
	if state.AvgTaskMs == 0 {
		state.AvgTaskMs = ms
		return
	}
	state.AvgTaskMs = engagementAlpha*ms + (1-engagementAlpha)*state.AvgTaskMs
}

func pushRecentItem(state *domain.LearnerState, key string) {
	// drop existing occurrence, append to tail, cap length
	out := state.RecentItems[:0]
	for _, k := range state.RecentItems {
		if k != key {
			out = append(out, k)
		}
	}
	out = append(out, key)
	if len(out) > recentItemsMax {
		out = out[len(out)-recentItemsMax:]
	}
	state.RecentItems = out
}

// recompute derives weak/strong areas, learning speed, dropout risk and segment
// from the current skill stats. Called after every event and reused by the sweep.
func recompute(state *domain.LearnerState, now time.Time) {
	type ms struct {
		tag     string
		mastery float64
	}
	skills := make([]ms, 0, len(state.Skills))
	var totalAttempts, totalCorrect int
	var nextDue time.Time
	for tag, st := range state.Skills {
		skills = append(skills, ms{tag, st.Mastery})
		totalAttempts += st.Attempts
		totalCorrect += st.Correct
		// Track the earliest due-date among skills still being learned, so the
		// sweep can target only users with revisions coming due.
		if st.Mastery < strongThreshold && !st.DueAt.IsZero() {
			if nextDue.IsZero() || st.DueAt.Before(nextDue) {
				nextDue = st.DueAt
			}
		}
	}
	state.NextDueAt = nextDue

	sort.Slice(skills, func(i, j int) bool { return skills[i].mastery < skills[j].mastery })
	weak := make([]string, 0)
	strong := make([]string, 0)
	for _, s := range skills {
		if s.mastery < weakThreshold {
			weak = append(weak, s.tag)
		}
	}
	for i := len(skills) - 1; i >= 0; i-- {
		if skills[i].mastery >= strongThreshold {
			strong = append(strong, skills[i].tag)
		}
	}
	state.WeakAreas = weak
	state.StrongAreas = strong

	accuracy := 0.5
	if totalAttempts > 0 {
		accuracy = float64(totalCorrect) / float64(totalAttempts)
	}
	state.LearningSpeed = computeSpeed(accuracy, state.AvgTaskMs)
	state.DropoutRisk = RecomputeRisk(state, now)
	state.Segment = deriveSegment(state, accuracy, now)
}

// computeSpeed blends accuracy with pace (faster average task time => higher),
// normalized to 0..1. Reference pace is 20s per task.
func computeSpeed(accuracy, avgMs float64) float64 {
	if avgMs <= 0 {
		return clamp01(accuracy)
	}
	pace := clamp01(20000.0 / avgMs)
	return clamp01(0.6*accuracy + 0.4*pace)
}

// RecomputeRisk derives dropout risk from disengagement and recency. Recency is
// near-zero right after an event, so risk is engagement-driven during live use
// and recency-driven when the pattern sweep evaluates idle learners.
func RecomputeRisk(state *domain.LearnerState, now time.Time) float64 {
	days := daysSince(state.LastEventAt, now)
	recency := clamp01(days / dropoutDays)
	disengage := clamp01(1 - state.Engagement)
	return clamp01(0.5*disengage + 0.5*recency)
}

func deriveSegment(state *domain.LearnerState, accuracy float64, now time.Time) domain.Segment {
	if !state.LastEventAt.IsZero() && daysSince(state.LastEventAt, now) >= inactiveDays {
		return domain.SegmentInactive
	}
	if accuracy < weakThreshold || len(state.WeakAreas) > len(state.StrongAreas) {
		return domain.SegmentWeak
	}
	if accuracy >= strongThreshold && state.Engagement >= 0.6 {
		return domain.SegmentImproving
	}
	return domain.SegmentActive
}

func daysSince(t, now time.Time) float64 {
	if t.IsZero() {
		return 0
	}
	d := now.Sub(t).Hours() / 24
	if d < 0 {
		return 0
	}
	return d
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

func boolTo(b bool, t, f float64) float64 {
	if b {
		return t
	}
	return f
}

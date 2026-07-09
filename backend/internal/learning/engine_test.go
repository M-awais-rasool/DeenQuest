package learning

import (
	"testing"
	"time"

	"github.com/chawais/deenquest/backend/internal/learning/model"
)

// Tests for the deterministic core. No Kafka/Mongo needed — pure functions.

func TestApplyEvent_WrongAnswersCreateWeakArea(t *testing.T) {
	now := time.Date(2026, 6, 20, 12, 0, 0, 0, time.UTC)
	st := NewState("id1", "user1", "qaida", now)

	// Three wrong answers on ت should drag its mastery below the weak threshold.
	for i := 0; i < 3; i++ {
		ApplyEvent(st, &model.BehaviorEvent{
			UserID:    "user1",
			Type:      model.EventAnswerWrong,
			SkillTags: []string{"ت"},
		}, now)
	}

	skill, ok := st.Skills["ت"]
	if !ok {
		t.Fatalf("expected skill ت to be tracked")
	}
	if skill.Mastery >= weakThreshold {
		t.Fatalf("expected mastery < %.2f, got %.2f", weakThreshold, skill.Mastery)
	}
	if !contains(st.WeakAreas, "ت") {
		t.Fatalf("expected ت in weak areas, got %v", st.WeakAreas)
	}
	// A wrong answer marks the skill due immediately for revision.
	if skill.DueAt.After(now) {
		t.Fatalf("expected ت to be due (<= now), got DueAt=%v", skill.DueAt)
	}
	if st.Segment != model.SegmentWeak {
		t.Fatalf("expected weak segment, got %s", st.Segment)
	}
}

func TestApplyEvent_CorrectAnswersBuildMasteryAndSchedule(t *testing.T) {
	now := time.Date(2026, 6, 20, 12, 0, 0, 0, time.UTC)
	st := NewState("id1", "user1", "qaida", now)

	for i := 0; i < 4; i++ {
		ApplyEvent(st, &model.BehaviorEvent{
			UserID:    "user1",
			Type:      model.EventAnswerCorrect,
			SkillTags: []string{"ا"},
		}, now)
	}

	skill := st.Skills["ا"]
	if skill.Mastery <= masteryNeutral {
		t.Fatalf("expected mastery to rise above neutral, got %.2f", skill.Mastery)
	}
	// After consecutive correct answers the next revision is scheduled in the future.
	if !skill.DueAt.After(now) {
		t.Fatalf("expected future DueAt after correct streak, got %v", skill.DueAt)
	}
	if contains(st.WeakAreas, "ا") {
		t.Fatalf("did not expect ا in weak areas: %v", st.WeakAreas)
	}
}

func TestRecommend_WeakDueSkillProducesRevision(t *testing.T) {
	now := time.Date(2026, 6, 20, 12, 0, 0, 0, time.UTC)
	st := NewState("id1", "user1", "qaida", now)
	for i := 0; i < 3; i++ {
		ApplyEvent(st, &model.BehaviorEvent{
			UserID:    "user1",
			Type:      model.EventAnswerWrong,
			SkillTags: []string{"ت"},
		}, now)
	}

	levels := []LevelInfo{
		{ID: 1, CourseLevel: 1, Title: "The First Letters", Difficulty: "easy", SkillTags: []string{"ا", "ب", "ت"}, Unlocked: true},
		{ID: 2, CourseLevel: 2, Title: "More Letters!", Difficulty: "easy", SkillTags: []string{"ح", "خ"}, Unlocked: true},
	}

	recs := Recommend(st, levels, now)
	if len(recs) == 0 {
		t.Fatalf("expected at least one recommendation")
	}

	var revision *model.Recommendation
	for i := range recs {
		if recs[i].Kind == model.RecRevision {
			revision = &recs[i]
			break
		}
	}
	if revision == nil {
		t.Fatalf("expected a revision recommendation, got %+v", recs)
	}
	if revision.LevelID != 1 {
		t.Fatalf("expected revision to target level 1 (teaches ت), got %d", revision.LevelID)
	}
	if !contains(revision.SkillTags, "ت") {
		t.Fatalf("expected revision skill tag ت, got %v", revision.SkillTags)
	}
}

func TestApplyEvent_CompletionDoesNotInflateMastery(t *testing.T) {
	now := time.Date(2026, 6, 20, 12, 0, 0, 0, time.UTC)
	st := NewState("id1", "user1", "qaida", now)

	// Finishing a level must NOT create per-skill mastery — otherwise wrong
	// answers during the level would be hidden by a "completed = all correct" bump.
	ApplyEvent(st, &model.BehaviorEvent{
		UserID:    "user1",
		Type:      model.EventLevelCompleted,
		LevelID:   1,
		SkillTags: []string{"ا", "ب", "ت"},
	}, now)

	if len(st.Skills) != 0 {
		t.Fatalf("completion must not create skill mastery, got %v", st.Skills)
	}
	if len(st.WeakAreas) != 0 || len(st.StrongAreas) != 0 {
		t.Fatalf("completion must not produce weak/strong areas")
	}
}

func TestApplyEvent_UntaggedWrongFallsBackToLevel(t *testing.T) {
	now := time.Date(2026, 6, 20, 12, 0, 0, 0, time.UTC)
	st := NewState("id1", "user1", "qaida", now)

	// Wrong answers on an untagged level (no skill_tags) still register against
	// the level itself, so weak-area detection works beyond the seed-tagged levels.
	for i := 0; i < 3; i++ {
		ApplyEvent(st, &model.BehaviorEvent{
			UserID:  "user1",
			Type:    model.EventAnswerWrong,
			LevelID: 6,
		}, now)
	}

	tag := LevelTag(6) // "level:6"
	if _, ok := st.Skills[tag]; !ok {
		t.Fatalf("expected fallback skill %q to be tracked, skills=%v", tag, st.Skills)
	}
	if !contains(st.WeakAreas, tag) {
		t.Fatalf("expected %q in weak areas, got %v", tag, st.WeakAreas)
	}

	levels := []LevelInfo{
		{ID: 6, CourseLevel: 6, Title: "Zabar Power!", Difficulty: "medium", Unlocked: true},
	}
	recs := Recommend(st, levels, now)
	var revision *model.Recommendation
	for i := range recs {
		if recs[i].Kind == model.RecRevision {
			revision = &recs[i]
			break
		}
	}
	if revision == nil {
		t.Fatalf("expected a revision recommendation for the weak level, got %+v", recs)
	}
	if revision.LevelID != 6 {
		t.Fatalf("expected revision to target level 6, got %d", revision.LevelID)
	}
	if revision.Title != "Revise: Zabar Power!" {
		t.Fatalf("expected level-title revision, got %q", revision.Title)
	}
}

func TestRecommend_DueNotStrongSkillProducesRevision(t *testing.T) {
	now := time.Date(2026, 6, 20, 12, 0, 0, 0, time.UTC)
	st := NewState("id1", "user1", "qaida", now)
	// A skill at moderate mastery (not weak, not mastered) that is due NOW —
	// e.g. just answered wrong, or a scheduled review came due — must still be
	// recommended for revision.
	st.Skills = map[string]model.SkillStat{
		"ج": {Attempts: 3, Correct: 2, Mastery: 0.65, Ease: 2.5, DueAt: now.Add(-time.Hour)},
	}

	levels := []LevelInfo{
		{ID: 1, CourseLevel: 1, Title: "The First Letters", Difficulty: "easy", SkillTags: []string{"ج"}, Unlocked: true},
	}
	recs := Recommend(st, levels, now)

	var revision *model.Recommendation
	for i := range recs {
		if recs[i].Kind == model.RecRevision {
			revision = &recs[i]
			break
		}
	}
	if revision == nil {
		t.Fatalf("expected a revision for a due, not-yet-mastered skill, got %+v", recs)
	}
	if revision.LevelID != 1 || !contains(revision.SkillTags, "ج") {
		t.Fatalf("expected revision of level 1 for ج, got %+v", revision)
	}
}

func TestRecommend_MasteredOrNotDueSkillSkipsRevision(t *testing.T) {
	now := time.Date(2026, 6, 20, 12, 0, 0, 0, time.UTC)
	st := NewState("id1", "user1", "qaida", now)
	st.Skills = map[string]model.SkillStat{
		"ا": {Mastery: 0.9, DueAt: now.Add(-time.Hour)},     // mastered → skip
		"ب": {Mastery: 0.6, DueAt: now.Add(24 * time.Hour)}, // not due → skip
	}
	levels := []LevelInfo{
		{ID: 1, CourseLevel: 1, Title: "The First Letters", SkillTags: []string{"ا", "ب"}, Unlocked: true},
		{ID: 2, CourseLevel: 2, Title: "More Letters!", Unlocked: true},
	}
	recs := Recommend(st, levels, now)
	for _, r := range recs {
		if r.Kind == model.RecRevision {
			t.Fatalf("did not expect a revision (mastered or not-due), got %+v", r)
		}
	}
}

func contains(xs []string, v string) bool {
	for _, x := range xs {
		if x == v {
			return true
		}
	}
	return false
}

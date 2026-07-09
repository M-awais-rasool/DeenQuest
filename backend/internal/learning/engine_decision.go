package learning

import (
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/chawais/deenquest/backend/internal/learning/model"
)

// engine_decision.go is the deterministic Recommender. Given a LearnerState and
// the user's level landscape it produces an ordered next-best-action set. Pure
// function, no I/O — the RecommenderService gathers inputs and persists outputs.

const (
	maxRevisions   = 2 // cap so revision never dominates (≤ ~40% of a 3-item set)
	prioRevision   = 100
	prioReengage   = 90
	prioNewContent = 50
)

// LevelInfo is the slice of level data the recommender needs, assembled by the
// service from the progress repository.
type LevelInfo struct {
	ID          int
	CourseLevel int
	Title       string
	Difficulty  string
	SkillTags   []string
	Completed   bool
	Unlocked    bool // completed, in-progress, or the next available level
}

// Recommend returns the deterministic recommendation set for a learner. Order:
// overdue-weak-skill revisions first, then a re-engagement nudge for inactive
// learners, then the next new-content step. Revisions are capped and the most
// recently-seen item is skipped (anti-repetition).
func Recommend(state *model.LearnerState, levels []LevelInfo, now time.Time) []model.Recommendation {
	recent := make(map[string]bool, len(state.RecentItems))
	for _, k := range state.RecentItems {
		recent[k] = true
	}

	// Map each skill to the best level that teaches it (prefer unlocked, earliest).
	skillLevel := make(map[string]LevelInfo)
	for _, lv := range levels {
		for _, tag := range lv.SkillTags {
			if cur, ok := skillLevel[tag]; !ok || betterLevel(lv, cur) {
				skillLevel[tag] = lv
			}
		}
	}
	// Fallback: a level is always revisable by its own "level:<id>" key, so weak
	// areas attributed to untagged content still map back to a real level.
	for _, lv := range levels {
		key := "level:" + strconv.Itoa(lv.ID)
		if _, ok := skillLevel[key]; !ok {
			skillLevel[key] = lv
		}
	}

	var recs []model.Recommendation
	usedLevels := make(map[int]bool)

	// 1. Revision candidates: skills that are DUE and not yet mastered. A wrong
	//    answer makes a skill due immediately; the spaced-repetition schedule
	//    makes well-known skills due again over time. Mastered skills (>= strong)
	//    are not nagged. Worst mastery first, capped so revision never dominates.
	type revCand struct {
		tag     string
		mastery float64
	}
	cands := make([]revCand, 0, len(state.Skills))
	for tag, st := range state.Skills {
		if st.Mastery >= strongThreshold {
			continue // already mastered
		}
		if !st.DueAt.IsZero() && st.DueAt.After(now) {
			continue // scheduled for later — not due yet
		}
		cands = append(cands, revCand{tag, st.Mastery})
	}
	sort.Slice(cands, func(i, j int) bool { return cands[i].mastery < cands[j].mastery })

	count := 0
	for _, c := range cands {
		if count >= maxRevisions {
			break
		}
		st := state.Skills[c.tag]
		lv, ok := skillLevel[c.tag]
		if !ok || usedLevels[lv.ID] {
			continue
		}
		usedLevels[lv.ID] = true
		count++
		// A "level:<id>" fallback tag is shown as the level title; a real skill
		// tag (e.g. an Arabic letter) is shown as-is.
		displayTag := c.tag
		recSkillTags := []string{c.tag}
		if strings.HasPrefix(c.tag, "level:") {
			displayTag = lv.Title
			recSkillTags = nil
		}
		recs = append(recs, model.Recommendation{
			Kind:       model.RecRevision,
			LevelID:    lv.ID,
			SkillTags:  recSkillTags,
			Title:      "Revise: " + lv.Title,
			Reason:     fmt.Sprintf("Mastery of %s is %.0f%% and revision is due", displayTag, st.Mastery*100),
			Difficulty: "easy",
			Priority:   prioRevision - count,
		})
	}

	// 2. Re-engagement nudge for inactive learners.
	if state.Segment == model.SegmentInactive {
		if lv, ok := nextUnlockedIncomplete(levels); ok {
			recs = append(recs, model.Recommendation{
				Kind:       model.RecReengage,
				LevelID:    lv.ID,
				Title:      "Welcome back — pick up at " + lv.Title,
				Reason:     "No recent activity; nudging the learner to resume",
				Difficulty: lv.Difficulty,
				Priority:   prioReengage,
			})
		}
	}

	// 3. New content: the next unlocked, incomplete level (skip if just done).
	if lv, ok := nextUnlockedIncomplete(levels); ok && !usedLevels[lv.ID] && !recent["level:"+strconv.Itoa(lv.ID)] {
		recs = append(recs, model.Recommendation{
			Kind:       model.RecNewContent,
			LevelID:    lv.ID,
			Title:      "Continue: " + lv.Title,
			Reason:     reasonForNewContent(state),
			Difficulty: lv.Difficulty,
			Priority:   prioNewContent,
		})
	}

	for i := range recs {
		recs[i].ID = uuid.NewString()
		recs[i].UserID = state.UserID
		recs[i].CourseType = state.CourseType
		recs[i].Status = model.RecStatusActive
		recs[i].CreatedAt = now
		recs[i].UpdatedAt = now
	}
	return recs
}

func reasonForNewContent(state *model.LearnerState) string {
	switch state.Segment {
	case model.SegmentImproving:
		return "Strong recent accuracy — ready for the next step"
	case model.SegmentWeak:
		return "Steady progress on fundamentals before advancing"
	default:
		return "Next step on the learning path"
	}
}

// nextUnlockedIncomplete returns the unlocked, not-yet-completed level with the
// lowest course level — the natural "next thing to do".
func nextUnlockedIncomplete(levels []LevelInfo) (LevelInfo, bool) {
	var best LevelInfo
	found := false
	for _, lv := range levels {
		if !lv.Unlocked || lv.Completed {
			continue
		}
		if !found || lv.CourseLevel < best.CourseLevel {
			best = lv
			found = true
		}
	}
	return best, found
}

// betterLevel reports whether a is a better revision target than b: unlocked
// wins, then the earlier course level.
func betterLevel(a, b LevelInfo) bool {
	if a.Unlocked != b.Unlocked {
		return a.Unlocked
	}
	return a.CourseLevel < b.CourseLevel
}

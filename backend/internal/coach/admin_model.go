package coach

import (
	"sort"
	"time"
)

func MeanMastery(state *UserSkillState, now time.Time) float64 {
	if state == nil || len(state.Skills) == 0 {
		return 0
	}
	sum := 0.0
	for _, s := range state.Skills {
		sum += Mastery(s, now)
	}
	return sum / float64(len(state.Skills))
}

func LastActive(state *UserSkillState) time.Time {
	var last time.Time
	if state == nil {
		return last
	}
	for _, s := range state.Skills {
		if s.LastSeen.After(last) {
			last = s.LastSeen
		}
	}
	return last
}

func DaysSinceActive(state *UserSkillState, now time.Time) float64 {
	last := LastActive(state)
	if last.IsZero() {
		return dropoutHorizon
	}
	d := now.Sub(last).Hours() / 24
	if d < 0 {
		return 0
	}
	return d
}

func EngagementScore(state *UserSkillState, now time.Time) float64 {
	if state == nil || len(state.Days) == 0 {
		return 0
	}
	active := 0
	for i := 0; i < engagementWindow; i++ {
		key := dayKey(now.AddDate(0, 0, -i))
		if d := state.Days[key]; d != nil && d.Attempts > 0 {
			active++
		}
	}
	return float64(active) / float64(engagementWindow)
}

// DropoutRisk grows linearly with silence and saturates at the two-week mark.
func DropoutRisk(state *UserSkillState, now time.Time) float64 {
	risk := DaysSinceActive(state, now) / dropoutHorizon
	if risk > 1 {
		return 1
	}
	if risk < 0 {
		return 0
	}
	return risk
}

// SegmentOf buckets a learner. See the ordering note in admin_entity.go.
func SegmentOf(state *UserSkillState, now time.Time) string {
	if DaysSinceActive(state, now) >= inactiveDays {
		return SegmentInactive
	}
	if MeanMastery(state, now) < weakMastery {
		return SegmentWeak
	}
	if _, delta := WeekAccuracy(state, now); delta > 0 {
		return SegmentImproving
	}
	return SegmentActive
}

type statsFold struct {
	learners      int
	segments      map[string]int
	engagementSum float64
	riskSum       float64

	// skill tag → running totals for the "hardest skills" list
	skills map[string]*SkillStruggle
}

func newStatsFold() *statsFold {
	return &statsFold{
		segments: map[string]int{
			SegmentImproving: 0,
			SegmentActive:    0,
			SegmentWeak:      0,
			SegmentInactive:  0,
		},
		skills: map[string]*SkillStruggle{},
	}
}

func (f *statsFold) add(state *UserSkillState, now time.Time) {
	if state == nil {
		return
	}
	f.learners++
	f.segments[SegmentOf(state, now)]++
	f.engagementSum += EngagementScore(state, now)
	f.riskSum += DropoutRisk(state, now)

	for tag, s := range state.Skills {
		row := f.skills[tag]
		if row == nil {
			row = &SkillStruggle{Tag: tag}
			f.skills[tag] = row
		}
		m := Mastery(s, now)
		row.Learners++
		row.AvgMastery += m // summed here, divided in weakestSkills
		if m < weakSkillMastery {
			row.WeakLearners++
		}
	}
}

func (f *statsFold) avgEngagement() float64 {
	if f.learners == 0 {
		return 0
	}
	return f.engagementSum / float64(f.learners)
}

func (f *statsFold) avgDropoutRisk() float64 {
	if f.learners == 0 {
		return 0
	}
	return f.riskSum / float64(f.learners)
}

func (f *statsFold) weakestSkills(limit int) []SkillStruggle {
	out := make([]SkillStruggle, 0, len(f.skills))
	for _, row := range f.skills {
		r := *row
		if r.Learners > 0 {
			r.AvgMastery /= float64(r.Learners) // was a running sum
		}
		out = append(out, r)
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].WeakLearners != out[j].WeakLearners {
			return out[i].WeakLearners > out[j].WeakLearners
		}
		if out[i].AvgMastery != out[j].AvgMastery {
			return out[i].AvgMastery < out[j].AvgMastery
		}
		return out[i].Tag < out[j].Tag
	})
	if len(out) > limit {
		out = out[:limit]
	}
	return out
}

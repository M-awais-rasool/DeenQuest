package coach

import (
	"fmt"
	"sort"
	"strings"
	"time"
)

func EvaluateRules(state *UserSkillState, now time.Time) []Insight {
	var out []Insight
	out = append(out, ruleConfusionPairs(state, now)...)
	out = append(out, ruleSlowSkills(state, now)...)
	out = append(out, ruleDecay(state, now)...)
	out = append(out, ruleWin(state, now)...)

	// Rank HIGH > MED > LOW; WIN is a banner, not a tile — sorted last and
	// always kept.
	rank := map[string]int{SeverityHigh: 0, SeverityMed: 1, SeverityLow: 2, SeverityWin: 3}
	sort.SliceStable(out, func(i, j int) bool {
		ri, rj := rank[out[i].Severity], rank[out[j].Severity]
		if ri != rj {
			return ri < rj
		}
		return out[i].Count > out[j].Count
	})

	kept := make([]Insight, 0, MaxActiveInsights+1)
	tiles := 0
	for _, ins := range out {
		if ins.Severity == SeverityWin {
			kept = append(kept, ins)
			continue
		}
		if tiles < MaxActiveInsights {
			kept = append(kept, ins)
			tiles++
		}
	}
	return kept
}

// InsightID builds the deterministic id that makes rule evaluation idempotent.
func InsightID(userID, rule string, skills []string) string {
	return userID + ":" + rule + ":" + strings.Join(skills, "")
}

func newInsight(state *UserSkillState, rule, severity string, skills []string, count int, now time.Time) Insight {
	return Insight{
		ID:        InsightID(state.UserID, rule, skills),
		UserID:    state.UserID,
		Rule:      rule,
		Severity:  severity,
		Skills:    skills,
		Count:     count,
		Status:    InsightActive,
		CreatedAt: now,
		UpdatedAt: now,
		ExpiresAt: now.Add(InsightTTL),
	}
}

// confusion_pair: confusions[A→B] ≥ 3 in 7 days ⇒ HIGH + practice CTA.
func ruleConfusionPairs(state *UserSkillState, now time.Time) []Insight {
	var out []Insight
	for _, p := range TopConfusions(state, now) {
		if p.Count < confusionMinCount {
			continue
		}
		// Practice drills both directions; skills ordered [expected, chosen].
		skills := []string{p.Expected, p.Chosen}
		ins := newInsight(state, RuleConfusionPair, SeverityHigh, skills, p.Count, now)
		ins.Title = fmt.Sprintf("Mixing up %s & %s", LatinName(p.Expected), LatinName(p.Chosen))
		ins.Detail = fmt.Sprintf("%d mistakes this week", p.Count)
		ins.Why = confusionWhy(p.Expected, p.Chosen)
		ins.PracticeLevelID = PairPracticeID(p.Expected, p.Chosen)
		ins.PracticeMinutes = 2
		out = append(out, ins)
	}
	return out
}

// slow_skill: avg_latency(skill) > 1.8 × pace_baseline ⇒ MED.
func ruleSlowSkills(state *UserSkillState, now time.Time) []Insight {
	if state.PaceBaselineMS <= 0 {
		return nil
	}
	var out []Insight
	for tag, s := range state.Skills {
		if s.Attempts < slowSkillMinTries || s.AvgLatencyMS <= 0 {
			continue
		}
		if s.AvgLatencyMS <= slowSkillFactor*state.PaceBaselineMS {
			continue
		}
		ins := newInsight(state, RuleSlowSkill, SeverityMed, []string{tag}, int(s.AvgLatencyMS), now)
		ins.Title = fmt.Sprintf("Slow on %s", LatinName(tag))
		ins.Detail = fmt.Sprintf("Takes %.1f× your usual pace", s.AvgLatencyMS/state.PaceBaselineMS)
		ins.Why = fmt.Sprintf(
			"You answer %s questions in about %.1f s versus your usual %.1f s. That usually means the shape isn't automatic yet — a short focused drill builds speed.",
			LatinName(tag), s.AvgLatencyMS/1000, state.PaceBaselineMS/1000)
		out = append(out, ins)
	}
	sortBySkill(out)
	return out
}

// decay: mastery dropped below 0.6 and skill unseen 10+ days ⇒ MED review.
func ruleDecay(state *UserSkillState, now time.Time) []Insight {
	var out []Insight
	for tag, s := range state.Skills {
		if s.LastSeen.IsZero() || s.Attempts < slowSkillMinTries {
			continue
		}
		daysUnseen := int(now.Sub(s.LastSeen).Hours() / 24)
		if daysUnseen < decayUnseenDays {
			continue
		}
		if Mastery(s, now) >= decayMastery || s.EMAAccuracy < decayMastery {
			continue // either still fresh, or it was never learned well enough to "fade"
		}
		ins := newInsight(state, RuleDecay, SeverityMed, []string{tag}, daysUnseen, now)
		ins.Title = fmt.Sprintf("%s is fading", LatinName(tag))
		ins.Detail = fmt.Sprintf("Not practiced in %d days — quick review?", daysUnseen)
		ins.Why = fmt.Sprintf(
			"You knew %s well, but memory fades without practice — it's been %d days. A 2-minute review brings it right back.",
			LatinName(tag), daysUnseen)
		ins.PracticeMinutes = 2
		out = append(out, ins)
	}
	sortBySkill(out)
	return out
}

// win: mastery ≥ 0.95 with ≥ 10 attempts ⇒ WIN banner.
func ruleWin(state *UserSkillState, now time.Time) []Insight {
	best := ""
	bestMastery := 0.0
	for tag, s := range state.Skills {
		if s.Attempts < winMinAttempts {
			continue
		}
		if m := Mastery(s, now); m >= winMastery && m > bestMastery {
			best, bestMastery = tag, m
		}
	}
	if best == "" {
		return nil
	}
	ins := newInsight(state, RuleWin, SeverityWin, []string{best}, int(bestMastery*100), now)
	ins.Title = fmt.Sprintf("%s mastered!", LatinName(best))
	ins.Detail = fmt.Sprintf("%d%% accurate", int(bestMastery*100))
	return []Insight{ins}
}

func sortBySkill(ins []Insight) {
	sort.SliceStable(ins, func(i, j int) bool {
		return strings.Join(ins[i].Skills, "") < strings.Join(ins[j].Skills, "")
	})
}

func confusionWhy(a, b string) string {
	dots := map[string]int{
		"ب": 1, "ت": 2, "ث": 3, "ن": 1, "ي": 2,
		"ج": 1, "خ": 1, "د": 0, "ذ": 1, "ر": 0, "ز": 1,
		"س": 0, "ش": 3, "ص": 0, "ض": 1, "ط": 0, "ظ": 1,
		"ع": 0, "غ": 1, "ف": 1, "ق": 2, "ح": 0, "ا": 0,
		"ك": 0, "ل": 0, "م": 0, "ه": 0, "و": 0,
	}
	da, okA := dots[a]
	db, okB := dots[b]
	la, lb := LatinName(a), LatinName(b)
	if okA && okB && da != db {
		return fmt.Sprintf(
			"%s (%s) has %s, %s (%s) has %s. In fast rounds it's easy to tap the wrong one — slowing down to count the dots fixes it.",
			la, a, dotPhrase(da), lb, b, dotPhrase(db))
	}
	return fmt.Sprintf(
		"%s (%s) and %s (%s) look similar at a glance. Compare their shapes side by side before tapping — the difference becomes obvious with a little practice.",
		la, a, lb, b)
}

func dotPhrase(n int) string {
	switch n {
	case 0:
		return "no dots"
	case 1:
		return "one dot"
	case 2:
		return "two dots"
	default:
		return fmt.Sprintf("%d dots", n)
	}
}

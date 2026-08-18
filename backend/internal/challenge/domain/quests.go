package domain

import "math/rand"

const WeeklyQuestCount = 3

func QuestCatalog() []QuestTemplate {
	return []QuestTemplate{
		{ID: "quest-xp-200", Title: "Earn 200 XP this week", Metric: MetricXP, Target: 200, RewardXP: 60, Glyph: "⚡", Accent: "gold"},
		{ID: "quest-xp-500", Title: "Earn 500 XP this week", Metric: MetricXP, Target: 500, RewardXP: 120, Glyph: "✦", Accent: "gold"},
		{ID: "quest-lessons-5", Title: "Complete 5 lessons", Metric: MetricLessons, Target: 5, RewardXP: 80, Glyph: "◆", Accent: "violet"},
		{ID: "quest-lessons-10", Title: "Complete 10 lessons", Metric: MetricLessons, Target: 10, RewardXP: 150, Glyph: "◆", Accent: "violet"},
		{ID: "quest-tasks-7", Title: "Finish 7 daily missions", Metric: MetricTasks, Target: 7, RewardXP: 90, Glyph: "✓", Accent: "teal"},
		{ID: "quest-tasks-15", Title: "Finish 15 daily missions", Metric: MetricTasks, Target: 15, RewardXP: 160, Glyph: "✓", Accent: "teal"},
		{ID: "quest-hifz-3", Title: "Revise 3 Hifz portions", Metric: MetricHifz, Target: 3, RewardXP: 100, Glyph: "☾", Accent: "blue"},
		{ID: "quest-recite-5", Title: "Recite 5 times out loud", Metric: MetricRecitations, Target: 5, RewardXP: 90, Glyph: "◍", Accent: "blue"},
		{ID: "quest-encourage-3", Title: "Send 3 encouragements", Metric: MetricEncouragements, Target: 3, RewardXP: 50, Glyph: "♥", Accent: "pink"},
		{ID: "quest-encourage-5", Title: "Send 5 encouragements", Metric: MetricEncouragements, Target: 5, RewardXP: 80, Glyph: "♥", Accent: "pink"},
	}
}

func PickWeeklyQuests(catalog []QuestTemplate, userID, weekKey string, n int) []QuestTemplate {
	if n <= 0 || len(catalog) == 0 {
		return nil
	}

	pool := make([]QuestTemplate, len(catalog))
	copy(pool, catalog)
	rng := rand.New(rand.NewSource(int64(hashString(userID + "|" + weekKey))))
	rng.Shuffle(len(pool), func(i, j int) { pool[i], pool[j] = pool[j], pool[i] })

	seen := make(map[Metric]bool, n)
	out := make([]QuestTemplate, 0, n)
	for _, t := range pool {
		if seen[t.Metric] {
			continue
		}
		seen[t.Metric] = true
		out = append(out, t)
		if len(out) == n {
			break
		}
	}
	for i := 0; len(out) < n && i < len(pool); i++ {
		if !containsTemplate(out, pool[i].ID) {
			out = append(out, pool[i])
		}
	}
	return out
}

func containsTemplate(list []QuestTemplate, id string) bool {
	for i := range list {
		if list[i].ID == id {
			return true
		}
	}
	return false
}

func hashString(s string) uint32 {
	var h uint32
	for _, c := range s {
		h = h*31 + uint32(c)
	}
	return h
}

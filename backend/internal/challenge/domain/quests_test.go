package domain

import "testing"

func TestPickWeeklyQuestsIsDeterministicPerUserWeek(t *testing.T) {
	cat := QuestCatalog()
	a := PickWeeklyQuests(cat, "user-1", "2026-W34", WeeklyQuestCount)
	b := PickWeeklyQuests(cat, "user-1", "2026-W34", WeeklyQuestCount)
	if len(a) != WeeklyQuestCount {
		t.Fatalf("got %d quests, want %d", len(a), WeeklyQuestCount)
	}
	for i := range a {
		if a[i].ID != b[i].ID {
			t.Fatalf("same user+week drew different quests: %v vs %v", ids(a), ids(b))
		}
	}
	// A different week must reshuffle, otherwise the board never changes.
	if next := PickWeeklyQuests(cat, "user-1", "2026-W35", WeeklyQuestCount); sameIDs(a, next) {
		t.Errorf("week 35 drew the identical board %v", ids(a))
	}
}

func TestPickWeeklyQuestsAvoidsDuplicateMetrics(t *testing.T) {
	cat := QuestCatalog()
	for _, user := range []string{"a", "b", "c", "d", "e", "f", "g", "h"} {
		got := PickWeeklyQuests(cat, user, "2026-W34", WeeklyQuestCount)
		seen := map[Metric]bool{}
		for _, q := range got {
			if seen[q.Metric] {
				t.Errorf("user %s drew two %s quests: %v", user, q.Metric, ids(got))
			}
			seen[q.Metric] = true
		}
	}
}

func TestQuestCatalogEntriesAreWellFormed(t *testing.T) {
	seen := map[string]bool{}
	for _, q := range QuestCatalog() {
		if seen[q.ID] {
			t.Errorf("duplicate quest id %q", q.ID)
		}
		seen[q.ID] = true
		if !q.Metric.Valid() {
			t.Errorf("quest %q has unknown metric %q", q.ID, q.Metric)
		}
		if q.Target <= 0 || q.RewardXP <= 0 {
			t.Errorf("quest %q has non-positive target/reward (%d/%d)", q.ID, q.Target, q.RewardXP)
		}
	}
}

func ids(list []QuestTemplate) []string {
	out := make([]string, len(list))
	for i := range list {
		out[i] = list[i].ID
	}
	return out
}

func sameIDs(a, b []QuestTemplate) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i].ID != b[i].ID {
			return false
		}
	}
	return true
}

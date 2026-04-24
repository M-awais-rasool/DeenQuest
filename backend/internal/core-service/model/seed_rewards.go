package model

// SeedRewards returns the master reward definitions that are upserted on every
// service startup. To add or change a reward, edit this list and redeploy.
func SeedRewards() []Reward {
	return []Reward{
		{
			ID:          "path-beginner-3",
			Title:       "Path Beginner",
			Description: "Complete 3 levels and earn your first achievement.",
			Icon:        "trophy",
			Rarity:      "rare",
			Trigger:     TriggerLevelsCompleted,
			Required:    3,
			XPBonus:     100,
			SortOrder:   1,
		},
		{
			ID:          "consistency-5",
			Title:       "Consistency Flame",
			Description: "Maintain a 5-day streak to prove your dedication.",
			Icon:        "flame",
			Rarity:      "rare",
			Trigger:     TriggerStreakDays,
			Required:    5,
			XPBonus:     120,
			SortOrder:   2,
		},
		{
			ID:          "explorer-10",
			Title:       "Path Explorer",
			Description: "Complete 10 levels and unlock the Explorer title.",
			Icon:        "crown",
			Rarity:      "epic",
			Trigger:     TriggerLevelsCompleted,
			Required:    10,
			XPBonus:     250,
			SortOrder:   3,
		},
		{
			ID:          "xp-collector-1500",
			Title:       "XP Collector",
			Description: "Reach 1,500 total XP and level up your prestige.",
			Icon:        "zap",
			Rarity:      "epic",
			Trigger:     TriggerXP,
			Required:    1500,
			XPBonus:     300,
			SortOrder:   4,
		},
		{
			ID:          "path-master-20",
			Title:       "Path Master",
			Description: "Complete all 20 levels to claim your legendary badge.",
			Icon:        "gem",
			Rarity:      "legendary",
			Trigger:     TriggerLevelsCompleted,
			Required:    20,
			XPBonus:     600,
			SortOrder:   5,
		},
	}
}

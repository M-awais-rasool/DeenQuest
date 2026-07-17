package dailytask

// SeedTasks returns the master daily-task catalog installed on boot.
func SeedTasks() []DailyTask {
	return []DailyTask{
		{
			ID:          "1",
			Title:       "Pray Fajr",
			Category:    CategorySalah,
			Description: "Start your day with Fajr prayer",
			Blocks: []Block{
				{
					Type: BlockChecklist,
					Content: map[string]any{
						"items": []string{"Make Wudu", "Pray 2 Rakat Sunnah", "Pray 2 Rakat Fard"},
					},
				},
			},
			CompletionType: CompletionAuto,
			RewardXP:       20,
			Difficulty:     DifficultyEasy,
			IsFixed:        true,
		},
		{
			ID:          "2",
			Title:       "Read 3 Ayahs",
			Category:    CategoryQuran,
			Description: "Read and understand Quran",
			Blocks: []Block{
				{
					Type: BlockAyah,
					Content: map[string]any{
						"surah":    "Ar-Rahman",
						"surah_id": 55,
						"ayahs":    []int{1, 2, 3},
					},
				},
				{
					Type:    BlockText,
					Content: map[string]any{"content": "Read the ayahs above and reflect on their meaning."},
				},
			},
			CompletionType: CompletionButton,
			RewardXP:       15,
			Difficulty:     DifficultyEasy,
		},
		{
			ID:          "3",
			Title:       "Say Astaghfirullah 33 Times",
			Category:    CategoryDhikr,
			Description: "Seek forgiveness",
			Blocks: []Block{
				{
					Type: BlockCounter,
					Content: map[string]any{
						"target": 33,
						"phrase": "Astaghfirullah",
					},
				},
			},
			CompletionType: CompletionAuto,
			RewardXP:       10,
			Difficulty:     DifficultyEasy,
		},
		{
			ID:          "4",
			Title:       "Learn a Hadith",
			Category:    CategoryLearning,
			Description: "Read and reflect on Hadith",
			Blocks: []Block{
				{
					Type: BlockHadith,
					Content: map[string]any{
						"text":      "Actions are judged by intentions.",
						"reference": "Bukhari & Muslim",
					},
				},
			},
			CompletionType: CompletionButton,
			RewardXP:       15,
			Difficulty:     DifficultyEasy,
		},
		{
			ID:          "5",
			Title:       "Quick Quiz",
			Category:    CategoryLearning,
			Description: "Test your knowledge",
			Blocks: []Block{
				{
					Type: BlockQuiz,
					Content: map[string]any{
						"question": "What is the first pillar of Islam?",
						"options":  []string{"Salah", "Zakat", "Shahada"},
						"correct":  2, // 0-based index → "Shahada"
					},
				},
			},
			CompletionType: CompletionQuiz,
			RewardXP:       15,
			Difficulty:     DifficultyEasy,
		},
		{
			ID:          "6",
			Title:       "Listen to Quran",
			Category:    CategoryQuran,
			Description: "Listen for 5 minutes",
			Blocks: []Block{
				{
					Type: BlockAudio,
					Content: map[string]any{
						"surah":    "Al-Mulk",
						"surah_id": 67,
						"duration": 300,
					},
				},
				{
					Type:    BlockText,
					Content: map[string]any{"content": "Play the audio and listen attentively."},
				},
			},
			CompletionType: CompletionButton,
			RewardXP:       15,
			Difficulty:     DifficultyEasy,
		},
		{
			ID:          "7",
			Title:       "Reflect on Your Day",
			Category:    CategoryReflection,
			Description: "Think about your actions",
			Blocks: []Block{
				{
					// No "correct" key → reflection mode; any selection is valid.
					Type: BlockQuiz,
					Content: map[string]any{
						"question": "Did you help someone today?",
						"options":  []string{"Yes", "No", "Will try tomorrow"},
					},
				},
			},
			CompletionType: CompletionQuiz,
			RewardXP:       10,
			Difficulty:     DifficultyEasy,
		},
		{
			ID:          "8",
			Title:       "Follow a Sunnah",
			Category:    CategoryCharacter,
			Description: "Practice a Sunnah today",
			Blocks: []Block{
				{
					Type: BlockText,
					Content: map[string]any{
						"content": "Pick one of these Sunnah acts to practice today:",
						"items":   []string{"Smile at someone", "Say Bismillah before eating", "Use your right hand"},
						"style":   "numbered",
					},
				},
			},
			CompletionType: CompletionButton,
			RewardXP:       20,
			Difficulty:     DifficultyEasy,
		},
		{
			ID:          "9",
			Title:       "Say Alhamdulillah 20 Times",
			Category:    CategoryDhikr,
			Description: "Show gratitude to Allah",
			Blocks: []Block{
				{
					Type: BlockCounter,
					Content: map[string]any{
						"target": 20,
						"phrase": "Alhamdulillah",
					},
				},
			},
			CompletionType: CompletionAuto,
			RewardXP:       10,
			Difficulty:     DifficultyEasy,
		},
		{
			ID:          "10",
			Title:       "Help Someone",
			Category:    CategorySocial,
			Description: "Do one act of kindness",
			Blocks: []Block{
				{
					Type:    BlockText,
					Content: map[string]any{"content": "Help your parents or a friend today with something they need."},
				},
			},
			CompletionType: CompletionButton,
			RewardXP:       20,
			Difficulty:     DifficultyEasy,
		},
		{
			ID:          "11",
			Title:       "Read Surah Al-Fatiha",
			Category:    CategoryQuran,
			Description: "Open the Quran reader and complete Surah Al-Fatiha",
			Blocks: []Block{
				{
					Type: BlockAyah,
					Content: map[string]any{
						"surah":    "Al-Fatiha",
						"surah_id": 1,
						"ayahs":    []int{1, 2, 3, 4, 5, 6, 7},
					},
				},
				{
					Type:    BlockText,
					Content: map[string]any{"content": "Read slowly and reflect on the opening Surah."},
				},
			},
			CompletionType: CompletionButton,
			RewardXP:       15,
			Difficulty:     DifficultyEasy,
		},
	}
}

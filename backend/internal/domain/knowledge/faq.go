// Package knowledge holds the curated, vetted FAQ for the Q&A Agent. Answers are
// retrieved from this list — never invented by AI. Entries are intentionally
// general/factual or app-help; nothing here is a religious ruling.
package knowledge

// Entry is one vetted question/answer with its source and matching keywords.
type Entry struct {
	Question string
	Answer   string
	Source   string
	Keywords []string
}

// Entries returns the curated FAQ. Keep additions general, well-known, and
// scholar-safe (no fatwa/ruling content).
func Entries() []Entry { return entries }

var entries = []Entry{
	{
		Question: "What does Bismillah mean?",
		Answer:   "بِسْمِ اللَّه means \"In the name of Allah.\" It is said before starting good actions like eating or studying.",
		Source:   "Common knowledge",
		Keywords: []string{"bismillah", "name of allah"},
	},
	{
		Question: "What does Alhamdulillah mean?",
		Answer:   "اَلْحَمْدُ لِلّٰه means \"All praise is for Allah.\" It is said to thank Allah.",
		Source:   "Common knowledge",
		Keywords: []string{"alhamdulillah", "all praise"},
	},
	{
		Question: "What does InshaAllah mean?",
		Answer:   "إِنْ شَاءَ اللّٰه means \"If Allah wills.\" It is said when talking about the future.",
		Source:   "Common knowledge",
		Keywords: []string{"inshaallah", "insha allah", "if allah wills"},
	},
	{
		Question: "How many letters are in the Arabic alphabet?",
		Answer:   "The Arabic alphabet has 28 letters.",
		Source:   "Common knowledge",
		Keywords: []string{"how many letters", "arabic alphabet", "alphabet letters"},
	},
	{
		Question: "How many surahs are in the Qur'an?",
		Answer:   "The Qur'an has 114 surahs (chapters).",
		Source:   "Common knowledge",
		Keywords: []string{"how many surah", "surahs in the quran", "chapters in the quran"},
	},
	{
		Question: "What is Noorani Qaida?",
		Answer:   "Noorani Qaida is a beginner's book for learning to read the Qur'an — the letters, their sounds, and basic reading rules.",
		Source:   "DeenQuest",
		Keywords: []string{"qaida", "noorani", "what is qaida"},
	},
	{
		Question: "What is Tajweed?",
		Answer:   "Tajweed is the set of rules for pronouncing the Qur'an correctly and beautifully.",
		Source:   "Common knowledge",
		Keywords: []string{"tajweed", "tajwid", "pronounce the quran"},
	},
	{
		Question: "How do I earn XP and keep my streak?",
		Answer:   "You earn XP by completing daily missions and levels. Your streak grows each day you complete at least one task.",
		Source:   "DeenQuest help",
		Keywords: []string{"earn xp", "what is xp", "keep my streak", "how streak"},
	},
	{
		Question: "What is a streak freeze?",
		Answer:   "A streak freeze protects your streak if you miss a day. You earn one for every 7 days of practice.",
		Source:   "DeenQuest help",
		Keywords: []string{"streak freeze", "freeze", "miss a day"},
	},
	{
		Question: "What is the Daily Review?",
		Answer:   "Daily Review shows the skills you're due to practice again, using spaced repetition so you remember them long-term.",
		Source:   "DeenQuest help",
		Keywords: []string{"daily review", "what is review", "spaced repetition"},
	},
}

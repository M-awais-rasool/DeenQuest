package reflection

import "strings"

// curated is a small set of short, widely-known, authentic Quranic verses with
// references. Kept intentionally minimal and verifiable; expand only with
// scholar-reviewed entries. The AI layer never adds to or alters these.
var curated = []Verse{
	{
		Arabic:      "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
		Translation: "For indeed, with hardship comes ease.",
		Reference:   "Qur'an 94:6",
		Source:      "Quran",
		Moods:       []string{"hard", "difficult", "tired", "exhausted", "struggle", "tough", "busy", "stress", "stressed"},
	},
	{
		Arabic:      "وَمَنْ يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
		Translation: "And whoever relies upon Allah — then He is sufficient for him.",
		Reference:   "Qur'an 65:3",
		Source:      "Quran",
		Moods:       []string{"anxious", "worried", "worry", "afraid", "fear", "scared", "uncertain", "nervous"},
	},
	{
		Arabic:      "لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ",
		Translation: "Do not despair of the mercy of Allah.",
		Reference:   "Qur'an 39:53",
		Source:      "Quran",
		Moods:       []string{"sad", "down", "hopeless", "despair", "lonely", "guilt", "mistake", "sin", "regret"},
	},
	{
		Arabic:      "لَئِنْ شَكَرْتُمْ لَأَزِيدَنَّكُمْ",
		Translation: "If you are grateful, I will surely increase you.",
		Reference:   "Qur'an 14:7",
		Source:      "Quran",
		Moods:       []string{"grateful", "thankful", "blessed", "happy", "alhamdulillah", "good", "great", "joy"},
	},
	{
		Arabic:      "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
		Translation: "Indeed, Allah is with the patient.",
		Reference:   "Qur'an 2:153",
		Source:      "Quran",
		Moods:       []string{"patience", "waiting", "pain", "sick", "loss", "grief"},
	},
	{
		Arabic:      "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
		Translation: "Surely in the remembrance of Allah do hearts find rest.",
		Reference:   "Qur'an 13:28",
		Source:      "Quran",
		Moods:       []string{"restless", "overwhelmed", "peace", "calm", "heart", "empty"},
	},
}

// CuratedVerses exposes the list (read-only) for admin/reference.
func CuratedVerses() []Verse { return curated }

// PickVerse deterministically chooses a verse: first by a mood keyword match in
// the text, otherwise a stable hash so the same reflection always maps to the
// same verse.
func PickVerse(text string) Verse {
	t := strings.ToLower(text)
	for _, v := range curated {
		for _, m := range v.Moods {
			if m != "" && strings.Contains(t, m) {
				return v
			}
		}
	}
	return curated[hashString(t)%len(curated)]
}

func hashString(s string) int {
	h := 0
	for _, c := range s {
		h = h*31 + int(c)
	}
	if h < 0 {
		h = -h
	}
	return h
}

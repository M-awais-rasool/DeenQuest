package progress

// content_schema.go is the single source of truth describing every renderable
// piece of content the mobile app can show: lesson components, mini-games, and
// daily-task blocks. Each entry carries a human label, the data fields it
// accepts, and a ready-to-use example payload.
//
// The admin panel fetches this (GET /admin/registry) to render config forms and
// "insert example" buttons, so an admin always knows what a component is and
// what data it needs. Adding a new frontend component = add one entry here
// (and register it in the app's LESSON_COMPONENT_MAP / mini-game router).

// SchemaFieldType is the editor hint the admin panel uses to render a field.
type SchemaFieldType string

const (
	FieldText       SchemaFieldType = "text"        // short string
	FieldTextarea   SchemaFieldType = "textarea"    // long string
	FieldArabic     SchemaFieldType = "arabic"      // RTL Arabic string
	FieldNumber     SchemaFieldType = "number"      // integer
	FieldBoolean    SchemaFieldType = "boolean"     // true/false
	FieldStringList SchemaFieldType = "string_list" // []string
	FieldArabicList SchemaFieldType = "arabic_list" // []string rendered RTL
	FieldOptions    SchemaFieldType = "options"     // []string answers + a "correct" index
	FieldPairs      SchemaFieldType = "pairs"       // [{left,right}]
	FieldJSON       SchemaFieldType = "json"        // complex nested shape; edited as JSON
)

// SchemaField describes one key inside a component's data/content map.
type SchemaField struct {
	Key      string          `json:"key"`
	Label    string          `json:"label"`
	Type     SchemaFieldType `json:"type"`
	Required bool            `json:"required"`
	Help     string          `json:"help,omitempty"`
}

// ContentSchema describes one component / mini-game / block.
type ContentSchema struct {
	Kind        string         `json:"kind"` // "lesson_component" | "mini_game" | "block"
	Name        string         `json:"name"` // component string / mini-game type / block type
	Label       string         `json:"label"`
	Description string         `json:"description"`
	Icon        string         `json:"icon"`
	LessonTypes []string       `json:"lesson_types,omitempty"` // suggested lesson `type` values
	ScreenType  string         `json:"screen_type,omitempty"`  // suggested lesson `screen_type`
	Fields      []SchemaField  `json:"fields"`
	Example     map[string]any `json:"example"`
}

// EnumOption is a selectable value for a dropdown (difficulty, category, …).
type EnumOption struct {
	Value string `json:"value"`
	Label string `json:"label"`
	Icon  string `json:"icon,omitempty"`
	Color string `json:"color,omitempty"`
}

// ContentRegistry is the full payload served to the admin panel.
type ContentRegistry struct {
	LessonComponents []ContentSchema         `json:"lesson_components"`
	MiniGames        []ContentSchema         `json:"mini_games"`
	Blocks           []ContentSchema         `json:"blocks"`
	Enums            map[string][]EnumOption `json:"enums"`
}

func field(key, label string, t SchemaFieldType, required bool, help string) SchemaField {
	return SchemaField{Key: key, Label: label, Type: t, Required: required, Help: help}
}

// BuildContentRegistry returns the complete registry. Pure — safe to cache.
func BuildContentRegistry() ContentRegistry {
	return ContentRegistry{
		LessonComponents: lessonComponentSchemas(),
		MiniGames:        miniGameSchemas(),
		Blocks:           blockSchemas(),
		Enums:            registryEnums(),
	}
}

func lessonComponentSchemas() []ContentSchema {
	return []ContentSchema{
		{
			Kind: "lesson_component", Name: "LetterIntroComponent", Label: "Letter / Concept Intro",
			Description: "Introduce one or more Arabic letters (or a concept) with name and an optional note.",
			Icon:        "🔤", LessonTypes: []string{"qaida", "pronunciation"}, ScreenType: "ACTION",
			Fields: []SchemaField{
				field("letters", "Letters", FieldJSON, false, `Array of {"letter","name","note"} — or use the single letter/name/note fields below.`),
				field("letter", "Single letter", FieldArabic, false, "Use for a one-item intro."),
				field("name", "Name", FieldText, false, "Arabic/Latin name of the letter or concept."),
				field("note", "Note", FieldArabic, false, "Optional Arabic explanation."),
			},
			Example: map[string]any{"letters": []map[string]any{
				{"letter": "ا", "name": "أَلِف"}, {"letter": "ب", "name": "بَاء"}, {"letter": "ت", "name": "تَاء"},
			}},
		},
		{
			Kind: "lesson_component", Name: "LetterFormsComponent", Label: "Letter Forms",
			Description: "Show one letter in its isolated/initial/medial/final forms.",
			Icon:        "✍️", LessonTypes: []string{"qaida"}, ScreenType: "ACTION",
			Fields: []SchemaField{
				field("letter", "Letter", FieldArabic, true, ""),
				field("forms", "Forms", FieldJSON, true, `{"isolated","initial","medial","final"}`),
			},
			Example: map[string]any{"letter": "ب", "forms": map[string]any{"isolated": "ب", "initial": "بـ", "medial": "ـبـ", "final": "ـب"}},
		},
		{
			Kind: "lesson_component", Name: "PronunciationComponent", Label: "Pronunciation",
			Description: "Tap each Arabic item to hear it (TTS).",
			Icon:        "🗣️", LessonTypes: []string{"pronunciation", "qaida"}, ScreenType: "ACTION",
			Fields: []SchemaField{
				field("items", "Items", FieldJSON, true, `Array of {"arabic"} objects.`),
			},
			Example: map[string]any{"items": []map[string]any{{"arabic": "بَ"}, {"arabic": "تَ"}, {"arabic": "ثَ"}}},
		},
		{
			Kind: "lesson_component", Name: "DuaCardComponent", Label: "Dua Card",
			Description: "A dua/recitation: Arabic, meaning, and when to say it. Supports mic recitation.",
			Icon:        "🤲", LessonTypes: []string{"dua"}, ScreenType: "HADITH_CARD",
			Fields: []SchemaField{
				field("arabic", "Arabic", FieldArabic, true, ""),
				field("meaning", "Meaning", FieldTextarea, true, ""),
				field("context", "Context", FieldText, false, "When/why to say it."),
			},
			Example: map[string]any{"arabic": "سُبْحَانَ رَبِّيَ الْأَعْلَى", "meaning": "Glory be to my Lord, the Most High", "context": "Say 3 times in sujood"},
		},
		{
			Kind: "lesson_component", Name: "HadithComponent", Label: "Hadith Card",
			Description: "A hadith with its source reference.",
			Icon:        "📜", LessonTypes: []string{"hadith"}, ScreenType: "HADITH_CARD",
			Fields: []SchemaField{
				field("hadith", "Hadith text", FieldTextarea, true, ""),
				field("reference", "Reference", FieldText, true, "e.g. Bukhari & Muslim"),
			},
			Example: map[string]any{"hadith": "Actions are judged by intentions.", "reference": "Bukhari & Muslim"},
		},
		{
			Kind: "lesson_component", Name: "TipsComponent", Label: "Tips",
			Description: "A list of short tips / manners.",
			Icon:        "💡", LessonTypes: []string{"manners"}, ScreenType: "TIPS",
			Fields: []SchemaField{
				field("tips", "Tips", FieldStringList, true, "One tip per line."),
			},
			Example: map[string]any{"tips": []string{"Say السَّلَامُ عَلَيْكُم when you meet someone", "It means: Peace be upon you"}},
		},
		{
			Kind: "lesson_component", Name: "MCQComponent", Label: "Multiple Choice",
			Description: "A single question with options and one correct answer. Optional hint.",
			Icon:        "❓", LessonTypes: []string{"quiz", "revision"}, ScreenType: "QUIZ",
			Fields: []SchemaField{
				field("question", "Question", FieldTextarea, true, ""),
				field("options", "Options", FieldStringList, true, ""),
				field("correct", "Correct index", FieldNumber, true, "0-based index of the right option."),
				field("hint", "Hint", FieldText, false, "Shown before answering."),
				field("hintArabic", "Hint (Arabic example)", FieldArabic, false, "An Arabic example shown with the hint."),
			},
			Example: map[string]any{"question": "Which word has Tanween Fathah (ـً)?", "hint": "Two slanted strokes above the last letter:", "hintArabic": "ـً", "options": []string{"نُورًا", "نُورٍ", "نُورٌ"}, "correct": 0},
		},
		{
			Kind: "lesson_component", Name: "FillBlankComponent", Label: "Fill in the Blank",
			Description: "Complete a word/phrase by choosing the missing part from a bank.",
			Icon:        "⬜", LessonTypes: []string{"quiz", "qaida"}, ScreenType: "QUIZ",
			Fields: []SchemaField{
				field("instruction", "Instruction", FieldText, true, ""),
				field("sentence", "Sentence", FieldJSON, true, `Array of {"text"} or {"blank":true,"answer"} tokens.`),
				field("bank", "Answer bank", FieldArabicList, true, ""),
				field("meaning", "Meaning", FieldText, false, ""),
			},
			Example: map[string]any{"instruction": "Complete the word", "sentence": []map[string]any{{"text": "جَ"}, {"blank": true, "answer": "لَ"}, {"text": "سَ"}}, "bank": []string{"لَ", "لِ", "لُ"}, "meaning": "He sat"},
		},
		{
			Kind: "lesson_component", Name: "AyahBuilderComponent", Label: "Build the Word/Ayah",
			Description: "Arrange shuffled Arabic parts into order. Optional decoy tiles + meaning hint.",
			Icon:        "🧩", LessonTypes: []string{"qaida", "revision"}, ScreenType: "ACTION",
			Fields: []SchemaField{
				field("instruction", "Instruction", FieldText, true, ""),
				field("parts", "Parts (in order)", FieldArabicList, true, "Correct order; they get shuffled."),
				field("distractors", "Decoys", FieldArabicList, false, "Extra wrong tiles."),
				field("meaning", "Meaning", FieldText, false, "Shown as a hint and on success."),
			},
			Example: map[string]any{"instruction": "Build the word — one tile is a decoy", "parts": []string{"كَ", "تَ", "بَ"}, "distractors": []string{"كِ"}, "meaning": "He wrote"},
		},
		{
			Kind: "lesson_component", Name: "MatchPairsComponent", Label: "Match Pairs",
			Description: "Match each left item to its right item.",
			Icon:        "🔗", LessonTypes: []string{"qaida", "revision"}, ScreenType: "ACTION",
			Fields: []SchemaField{
				field("instruction", "Instruction", FieldText, true, ""),
				field("pairs", "Pairs", FieldPairs, true, ""),
			},
			Example: map[string]any{"instruction": "Match each letter to its name", "pairs": []map[string]any{{"left": "ا", "right": "أَلِف"}, {"left": "ب", "right": "بَاء"}}},
		},
		{
			Kind: "lesson_component", Name: "ListenChooseComponent", Label: "Listen & Choose",
			Description: "Play the audio (TTS of `audio`) and pick the matching option.",
			Icon:        "👂", LessonTypes: []string{"pronunciation"}, ScreenType: "ACTION",
			Fields: []SchemaField{
				field("audio", "Audio (Arabic)", FieldArabic, true, "Spoken via TTS."),
				field("options", "Options", FieldStringList, true, ""),
				field("correct", "Correct index", FieldNumber, true, ""),
			},
			Example: map[string]any{"audio": "ج", "options": []string{"ج", "ت", "ب"}, "correct": 0},
		},
		{
			Kind: "lesson_component", Name: "TrueFalseComponent", Label: "True / False",
			Description: "A series of true/false rounds, each showing an Arabic token.",
			Icon:        "✅", LessonTypes: []string{"quiz"}, ScreenType: "QUIZ",
			Fields: []SchemaField{
				field("rounds", "Rounds", FieldJSON, true, `Array of {"prompt","arabic","answer":bool}.`),
			},
			Example: map[string]any{"rounds": []map[string]any{{"prompt": "This letter has a Fathah", "arabic": "بَ", "answer": true}, {"prompt": "This letter has a Fathah", "arabic": "بِ", "answer": false}}},
		},
		{
			Kind: "lesson_component", Name: "LetterHuntComponent", Label: "Letter Hunt",
			Description: "Tap every occurrence of a target letter in a grid.",
			Icon:        "🔍", LessonTypes: []string{"qaida"}, ScreenType: "ACTION",
			Fields: []SchemaField{
				field("instruction", "Instruction", FieldText, true, ""),
				field("target", "Target", FieldArabic, true, ""),
				field("grid", "Grid", FieldArabicList, true, "All cells (target + lookalikes)."),
			},
			Example: map[string]any{"instruction": "Tap every ت — watch out for lookalikes!", "target": "ت", "grid": []string{"ب", "ت", "ث", "ت", "ج", "ت"}},
		},
		{
			Kind: "lesson_component", Name: "SortBucketsComponent", Label: "Sort into Buckets",
			Description: "Drop each Arabic item into its correct bucket. Optional hint + per-bucket example.",
			Icon:        "🗂️", LessonTypes: []string{"qaida"}, ScreenType: "ACTION",
			Fields: []SchemaField{
				field("instruction", "Instruction", FieldText, true, ""),
				field("buckets", "Buckets", FieldStringList, true, "2 labels."),
				field("items", "Items", FieldJSON, true, `Array of {"text","bucket":index}.`),
				field("hint", "Hint", FieldText, false, ""),
				field("hintArabic", "Hint (Arabic example)", FieldArabic, false, ""),
				field("bucketHints", "Bucket examples", FieldArabicList, false, "One example per bucket."),
			},
			Example: map[string]any{"instruction": "Sort each word by its tanween", "hint": "Check the sign on the last letter.", "bucketHints": []string{"ـً", "ـٌ"}, "buckets": []string{"تَنْوِين فَتْح", "تَنْوِين ضَم"}, "items": []map[string]any{{"text": "كِتَابًا", "bucket": 0}, {"text": "كِتَابٌ", "bucket": 1}}},
		},
		{
			Kind: "lesson_component", Name: "LightningRoundComponent", Label: "Lightning Round",
			Description: "Timed multiple-choice questions — beat the clock.",
			Icon:        "⚡", LessonTypes: []string{"revision"}, ScreenType: "QUIZ",
			Fields: []SchemaField{
				field("seconds", "Seconds per question", FieldNumber, true, ""),
				field("questions", "Questions", FieldJSON, true, `Array of {"question","options","correct"}.`),
			},
			Example: map[string]any{"seconds": 7, "questions": []map[string]any{{"question": "Tap the letter نُون", "options": []string{"ن", "ب", "ت"}, "correct": 0}, {"question": "Tap the letter وَاو", "options": []string{"ز", "و", "ر"}, "correct": 1}}},
		},
		{
			Kind: "lesson_component", Name: "QuranReaderComponent", Label: "Quran Reader",
			Description: "Display an ayah/surah with meaning. Supports mic recitation scoring.",
			Icon:        "📖", LessonTypes: []string{"qaida"}, ScreenType: "QURAN_READER",
			Fields: []SchemaField{
				field("surah", "Surah label", FieldText, false, "e.g. Al-Fatihah (1)"),
				field("text", "Arabic text", FieldTextarea, true, ""),
				field("meaning", "Meaning", FieldTextarea, false, ""),
			},
			Example: map[string]any{"surah": "Al-Fatihah", "text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "meaning": "In the name of Allah, the Most Gracious, the Most Merciful"},
		},
		{
			Kind: "lesson_component", Name: "ReflectionComponent", Label: "Reflection",
			Description: "A reflective question with selectable options (no wrong answer).",
			Icon:        "💭", LessonTypes: []string{"revision", "manners"}, ScreenType: "REFLECTION",
			Fields: []SchemaField{
				field("question", "Question", FieldTextarea, true, ""),
				field("options", "Options", FieldStringList, true, ""),
			},
			Example: map[string]any{"question": "When do you find it hardest to be patient?", "options": []string{"When someone is rude to me", "When things don't go my way", "When I have to wait"}},
		},
		{
			Kind: "lesson_component", Name: "PrayerChecklistComponent", Label: "Checklist",
			Description: "An ordered list of steps the learner ticks off.",
			Icon:        "📋", LessonTypes: []string{"revision", "qaida"}, ScreenType: "CHECKLIST",
			Fields: []SchemaField{
				field("steps", "Steps", FieldStringList, true, "One step per line."),
			},
			Example: map[string]any{"steps": []string{"Make the intention in your heart", "Say بِسْمِ اللَّه", "Wash both hands 3 times"}},
		},
		{
			Kind: "lesson_component", Name: "CertificateComponent", Label: "Certificate",
			Description: "Graduation certificate shown at the end of a section.",
			Icon:        "🏆", LessonTypes: []string{"revision"}, ScreenType: "ACTION",
			Fields: []SchemaField{
				field("title", "Title", FieldText, true, ""),
				field("message", "Message", FieldTextarea, true, ""),
				field("next_phase", "Next phase", FieldText, false, ""),
			},
			Example: map[string]any{"title": "Qaida Graduate", "message": "MashaAllah! You can now read with harakat and tanween.", "next_phase": "Phase 3: Learn to Pray"},
		},
	}
}

func miniGameSchemas() []ContentSchema {
	return []ContentSchema{
		{
			Kind: "mini_game", Name: "mcq", Label: "MCQ", Icon: "📋",
			Description: "Multiple-choice questions. Supports per-question hints.",
			Fields: []SchemaField{
				field("questions", "Questions", FieldJSON, true, `Array of {"question","options","correct","hint?","hintArabic?"}.`),
			},
			Example: map[string]any{"questions": []map[string]any{{"question": "Which word has Tanween Dammah (ـٌ)?", "hint": "Looks like a small doubled و above:", "hintArabic": "ـٌ", "options": []string{"عِلْمًا", "عِلْمٍ", "عِلْمٌ"}, "correct": 2}}},
		},
		{
			Kind: "mini_game", Name: "tap_match", Label: "Tap Match", Icon: "👆",
			Description: "Match each left item to its right item by tapping.",
			Fields:      []SchemaField{field("pairs", "Pairs", FieldPairs, true, "")},
			Example:     map[string]any{"pairs": []map[string]any{{"left": "ا", "right": "أَلِف"}, {"left": "ب", "right": "بَاء"}}},
		},
		{
			Kind: "mini_game", Name: "memory_cards", Label: "Memory Cards", Icon: "🃏",
			Description: "Flip and match card pairs.",
			Fields:      []SchemaField{field("pairs", "Pairs", FieldPairs, true, "")},
			Example:     map[string]any{"pairs": []map[string]any{{"left": "ح", "right": "حَاء"}, {"left": "خ", "right": "خَاء"}}},
		},
		{
			Kind: "mini_game", Name: "drag_drop", Label: "Build Word", Icon: "🔀",
			Description: "Arrange tiles to build a word. Shows the target `word` + meaning as a goal.",
			Fields: []SchemaField{
				field("rounds", "Rounds", FieldJSON, true, `Array of {"parts":[...], "word", "meaning"}.`),
			},
			Example: map[string]any{"rounds": []map[string]any{{"parts": []string{"ك", "ت", "ب"}, "word": "كَتَب", "meaning": "He wrote"}}},
		},
		{
			Kind: "mini_game", Name: "listen_choose", Label: "Listen & Choose", Icon: "👂",
			Description: "Listen to each item and pick the right answer.",
			Fields: []SchemaField{
				field("questions", "Questions", FieldJSON, true, `Array of {"audio","options","correct"}.`),
			},
			Example: map[string]any{"questions": []map[string]any{{"audio": "ط", "options": []string{"ط", "ت", "ظ"}, "correct": 0}}},
		},
	}
}

func blockSchemas() []ContentSchema {
	return []ContentSchema{
		{
			Kind: "block", Name: "TextBlock", Label: "Text", Icon: "📝",
			Description: "Plain text paragraph, optionally a list.",
			Fields: []SchemaField{
				field("content", "Content", FieldTextarea, true, ""),
				field("items", "List items", FieldStringList, false, "Optional bullet/numbered list."),
				field("style", "List style", FieldText, false, `"list" or "numbered"`),
			},
			Example: map[string]any{"content": "Begin your day with the morning adhkar."},
		},
		{
			Kind: "block", Name: "AyahBlock", Label: "Ayah", Icon: "📖",
			Description: "Quran ayah(s) with Arabic + translation.",
			Fields: []SchemaField{
				field("surah", "Surah", FieldText, true, ""),
				field("ayahs", "Ayah numbers", FieldJSON, true, "Array of ints, e.g. [1,2,3]."),
				field("surah_id", "Surah id", FieldNumber, false, "Opens the Quran reader."),
			},
			Example: map[string]any{"surah": "Al-Fatihah", "ayahs": []int{1, 2, 3}, "surah_id": 1},
		},
		{
			Kind: "block", Name: "HadithBlock", Label: "Hadith", Icon: "📜",
			Description: "Hadith with source attribution.",
			Fields: []SchemaField{
				field("text", "Text", FieldTextarea, true, ""),
				field("reference", "Reference", FieldText, true, ""),
			},
			Example: map[string]any{"text": "Cleanliness is half of faith.", "reference": "Sahih Muslim"},
		},
		{
			Kind: "block", Name: "CounterBlock", Label: "Counter", Icon: "🔢",
			Description: "Tap counter with a target.",
			Fields: []SchemaField{
				field("target", "Target", FieldNumber, true, ""),
				field("phrase", "Phrase", FieldArabic, true, ""),
			},
			Example: map[string]any{"target": 33, "phrase": "سُبْحَانَ اللَّه"},
		},
		{
			Kind: "block", Name: "QuizBlock", Label: "Quiz", Icon: "❓",
			Description: "Question with options. Add `correct` for quiz mode; omit for reflection.",
			Fields: []SchemaField{
				field("question", "Question", FieldTextarea, true, ""),
				field("options", "Options", FieldStringList, true, ""),
				field("correct", "Correct index", FieldNumber, false, "Omit for a reflection (any answer ok)."),
			},
			Example: map[string]any{"question": "What do you say before eating?", "options": []string{"بِسْمِ اللَّه", "الْحَمْدُ لِلَّه"}, "correct": 0},
		},
		{
			Kind: "block", Name: "AudioBlock", Label: "Audio", Icon: "🔊",
			Description: "Audio playback for a surah.",
			Fields: []SchemaField{
				field("surah", "Surah", FieldText, true, ""),
				field("duration", "Duration (sec)", FieldNumber, false, ""),
				field("surah_id", "Surah id", FieldNumber, false, ""),
			},
			Example: map[string]any{"surah": "Al-Ikhlas", "duration": 30, "surah_id": 112},
		},
		{
			Kind: "block", Name: "ChecklistBlock", Label: "Checklist", Icon: "✅",
			Description: "Interactive checklist items.",
			Fields:      []SchemaField{field("items", "Items", FieldStringList, true, "")},
			Example:     map[string]any{"items": []string{"Pray Fajr on time", "Read the morning adhkar"}},
		},
	}
}

func registryEnums() map[string][]EnumOption {
	return map[string][]EnumOption{
		"level_difficulties": {
			{Value: "easy", Label: "Easy", Color: "#88D982"},
			{Value: "medium", Label: "Medium", Color: "#FFDB3C"},
			{Value: "hard", Label: "Hard", Color: "#FF8A65"},
		},
		"task_difficulties": {
			{Value: "easy", Label: "Easy", Color: "#88D982"},
			{Value: "medium", Label: "Medium", Color: "#FFDB3C"},
		},
		"lesson_types": {
			{Value: "qaida", Label: "Qaida", Icon: "📖"},
			{Value: "hadith", Label: "Hadith", Icon: "🕌"},
			{Value: "dua", Label: "Dua", Icon: "🤲"},
			{Value: "quiz", Label: "Quiz", Icon: "❓"},
			{Value: "pronunciation", Label: "Pronunciation", Icon: "🗣️"},
			{Value: "manners", Label: "Manners", Icon: "🌟"},
			{Value: "revision", Label: "Revision", Icon: "📝"},
		},
		"screen_types": {
			{Value: "ACTION", Label: "Action", Icon: "⚡"},
			{Value: "QUIZ", Label: "Quiz", Icon: "❓"},
			{Value: "HADITH_CARD", Label: "Hadith Card", Icon: "📜"},
			{Value: "TIPS", Label: "Tips", Icon: "💡"},
			{Value: "REFLECTION", Label: "Reflection", Icon: "💭"},
			{Value: "CHECKLIST", Label: "Checklist", Icon: "✅"},
			{Value: "QURAN_READER", Label: "Quran Reader", Icon: "📖"},
		},
		"mini_game_types": {
			{Value: "mcq", Label: "MCQ", Icon: "📋"},
			{Value: "tap_match", Label: "Tap Match", Icon: "👆"},
			{Value: "memory_cards", Label: "Memory Cards", Icon: "🃏"},
			{Value: "drag_drop", Label: "Build Word", Icon: "🔀"},
			{Value: "listen_choose", Label: "Listen & Choose", Icon: "👂"},
		},
		"task_categories": {
			{Value: "salah", Label: "Salah", Icon: "🕌"},
			{Value: "quran", Label: "Quran", Icon: "📖"},
			{Value: "dhikr", Label: "Dhikr", Icon: "📿"},
			{Value: "learning", Label: "Learning", Icon: "🎓"},
			{Value: "character", Label: "Character", Icon: "⭐"},
			{Value: "social", Label: "Social", Icon: "🤝"},
			{Value: "reflection", Label: "Reflection", Icon: "💭"},
		},
		"completion_types": {
			{Value: "button", Label: "Button"},
			{Value: "auto", Label: "Auto"},
			{Value: "quiz", Label: "Quiz"},
		},
		"courses": {
			{Value: "qaida", Label: "Qaida"},
		},
	}
}

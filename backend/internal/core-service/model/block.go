package model

// BlockType identifies what a block renders on the client.
// Naming matches the admin panel's BlockBuilder so new block types
// added in the admin panel automatically work end-to-end.
type BlockType string

const (
	BlockText          BlockType = "TextBlock"
	BlockAyah          BlockType = "AyahBlock"
	BlockHadith        BlockType = "HadithBlock"
	BlockCounter       BlockType = "CounterBlock"
	BlockQuiz          BlockType = "QuizBlock"
	BlockAudio         BlockType = "AudioBlock"
	BlockChecklist     BlockType = "ChecklistBlock"
	BlockFlashCard     BlockType = "FlashCardBlock"
	BlockDragDrop      BlockType = "DragDropBlock"
	BlockMatch         BlockType = "MatchBlock"
	BlockReward        BlockType = "RewardBlock"
	BlockImage         BlockType = "ImageBlock"
	BlockVideo         BlockType = "VideoBlock"
	BlockVoicePractice BlockType = "VoicePracticeBlock"
)

// Block is a single renderable unit within a task.
// Content holds block-specific data; its keys vary by Type.
//
// Content schema by block type:
//
//	TextBlock:      { "content": string }
//	                Optional: "items": []string, "style": "list"|"numbered"
//	AyahBlock:      { "surah": string, "ayahs": []int }
//	HadithBlock:    { "text": string, "reference": string }
//	CounterBlock:   { "target": int, "phrase": string }
//	QuizBlock:      { "question": string, "options": []string }
//	                Quiz mode:       add "correct": int (0-based index)
//	                Reflection mode: omit "correct" (any selection is valid)
//	AudioBlock:     { "surah": string, "duration": int (seconds) }
//	ChecklistBlock: { "items": []string }
type Block struct {
	Type    BlockType      `bson:"type" json:"type"`
	Content map[string]any `bson:"content" json:"content"`
}

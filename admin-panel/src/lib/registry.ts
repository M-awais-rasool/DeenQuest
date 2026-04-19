/**
 * Central registry of all available options for the admin CMS.
 * These values mirror the backend Go model constants exactly.
 */

// ─── Screen Types (core-service/model/daily_task.go) ───

export const SCREEN_TYPES = [
  { value: 'CHECKLIST', label: 'Checklist', description: 'Step-by-step prayer/action checklist', icon: '✅' },
  { value: 'QURAN_READER', label: 'Quran Reader', description: 'Ayah-by-ayah Quran reading screen', icon: '📖' },
  { value: 'COUNTER', label: 'Counter', description: 'Tap-to-count dhikr screen', icon: '🔢' },
  { value: 'HADITH_CARD', label: 'Hadith Card', description: 'Hadith display with source', icon: '📜' },
  { value: 'QUIZ', label: 'Quiz', description: 'Multiple-choice quiz screen', icon: '❓' },
  { value: 'AUDIO_PLAYER', label: 'Audio Player', description: 'Audio playback screen', icon: '🔊' },
  { value: 'REFLECTION', label: 'Reflection', description: 'Journaling / reflection prompt', icon: '💭' },
  { value: 'TIPS', label: 'Tips', description: 'Informational tips card', icon: '💡' },
  { value: 'ACTION', label: 'Action', description: 'Simple action completion screen', icon: '⚡' },
] as const

// ─── Task Categories (core-service/model/daily_task.go) ───

export const TASK_CATEGORIES = [
  { value: 'salah', label: 'Salah', icon: '🕌' },
  { value: 'quran', label: 'Quran', icon: '📖' },
  { value: 'dhikr', label: 'Dhikr', icon: '📿' },
  { value: 'learning', label: 'Learning', icon: '🎓' },
  { value: 'character', label: 'Character', icon: '⭐' },
  { value: 'social', label: 'Social', icon: '🤝' },
  { value: 'reflection', label: 'Reflection', icon: '💭' },
] as const

// ─── Task Completion Types (core-service/model/daily_task.go) ───

export const COMPLETION_TYPES = [
  { value: 'button', label: 'Button', description: 'Manual button press' },
  { value: 'auto', label: 'Auto', description: 'Auto-complete on interaction' },
  { value: 'counter', label: 'Counter', description: 'Complete after reaching target count' },
  { value: 'quiz', label: 'Quiz', description: 'Complete after answering correctly' },
] as const

// ─── Task Difficulties ───

export const TASK_DIFFICULTIES = [
  { value: 'easy', label: 'Easy', color: '#88D982' },
  { value: 'medium', label: 'Medium', color: '#FFDB3C' },
] as const

// ─── Level Difficulties (core-service/model/level.go) ───

export const LEVEL_DIFFICULTIES = [
  { value: 'easy', label: 'Easy', color: '#88D982' },
  { value: 'medium', label: 'Medium', color: '#FFDB3C' },
  { value: 'hard', label: 'Hard', color: '#FF8A65' },
] as const

// ─── Lesson Types (core-service/model/level.go) ───

export const LESSON_TYPES = [
  { value: 'qaida', label: 'Qaida', description: 'Arabic alphabet / Qaida lessons', icon: '📖' },
  { value: 'hadith', label: 'Hadith', description: 'Hadith learning', icon: '🕌' },
  { value: 'dua', label: 'Dua', description: 'Dua memorization', icon: '🤲' },
  { value: 'quiz', label: 'Quiz', description: 'Quiz-based lesson', icon: '❓' },
  { value: 'pronunciation', label: 'Pronunciation', description: 'Arabic pronunciation practice', icon: '🗣️' },
  { value: 'manners', label: 'Manners', description: 'Islamic manners & etiquette', icon: '🌟' },
  { value: 'revision', label: 'Revision', description: 'Review previous lessons', icon: '📝' },
] as const

// ─── Mini Game Types (core-service/model/level.go) ───

export const MINI_GAME_TYPES = [
  { value: 'tap_match', label: 'Tap Match', description: 'Match Arabic to meaning by tapping', icon: '👆' },
  { value: 'listen_choose', label: 'Listen & Choose', description: 'Listen to audio and pick correct answer', icon: '👂' },
  { value: 'drag_drop', label: 'Drag & Drop', description: 'Drag items to correct positions', icon: '🔀' },
  { value: 'repeat_voice', label: 'Repeat Voice', description: 'Listen and repeat pronunciation', icon: '🎤' },
  { value: 'mcq', label: 'MCQ', description: 'Multiple-choice questions', icon: '📋' },
  { value: 'memory_cards', label: 'Memory Cards', description: 'Flip and match card pairs', icon: '🃏' },
] as const

// ─── Block Types (core-service/model/block.go) ───

export const BLOCK_TYPES = [
  { value: 'TextBlock', label: 'Text', description: 'Plain text paragraph', icon: '📝' },
  { value: 'AyahBlock', label: 'Ayah', description: 'Quran ayah with Arabic + translation', icon: '📖' },
  { value: 'HadithBlock', label: 'Hadith', description: 'Hadith with source attribution', icon: '📜' },
  { value: 'CounterBlock', label: 'Counter', description: 'Tap counter with target', icon: '🔢' },
  { value: 'QuizBlock', label: 'Quiz', description: 'Question with multiple-choice answers', icon: '❓' },
  { value: 'AudioBlock', label: 'Audio', description: 'Audio file player', icon: '🔊' },
  { value: 'ChecklistBlock', label: 'Checklist', description: 'Interactive checklist items', icon: '✅' },
  { value: 'FlashCardBlock', label: 'Flash Card', description: 'Front/back flip card', icon: '🃏' },
  { value: 'DragDropBlock', label: 'Drag & Drop', description: 'Drag items to correct positions', icon: '🔀' },
  { value: 'MatchBlock', label: 'Match', description: 'Match pairs together', icon: '🔗' },
  { value: 'RewardBlock', label: 'Reward', description: 'XP reward display', icon: '🏆' },
  { value: 'ImageBlock', label: 'Image', description: 'Image with optional caption', icon: '🖼️' },
  { value: 'VideoBlock', label: 'Video', description: 'External video link', icon: '🎬' },
  { value: 'VoicePracticeBlock', label: 'Voice Practice', description: 'Record and compare pronunciation', icon: '🎤' },
] as const

// ─── Component Types (from seed data / existing components) ───

export const TASK_COMPONENTS = [
  { value: 'PrayerChecklistComponent', label: 'Prayer Checklist', description: 'Step-by-step prayer checklist', screen: 'CHECKLIST' },
  { value: 'QuranReaderComponent', label: 'Quran Reader', description: 'Quran ayah reader with audio', screen: 'QURAN_READER' },
  { value: 'CounterComponent', label: 'Counter', description: 'Dhikr tap counter', screen: 'COUNTER' },
  { value: 'HadithComponent', label: 'Hadith', description: 'Hadith card display', screen: 'HADITH_CARD' },
  { value: 'QuizComponent', label: 'Quiz', description: 'Multiple-choice quiz', screen: 'QUIZ' },
  { value: 'AudioPlayerComponent', label: 'Audio Player', description: 'Audio playback', screen: 'AUDIO_PLAYER' },
  { value: 'ReflectionComponent', label: 'Reflection', description: 'Reflection journaling prompt', screen: 'REFLECTION' },
  { value: 'TipsComponent', label: 'Tips', description: 'Info / tips card', screen: 'TIPS' },
  { value: 'ActionComponent', label: 'Action', description: 'Simple action task', screen: 'ACTION' },
] as const

export const LESSON_COMPONENTS = [
  { value: 'LetterIntroComponent', label: 'Letter Intro', description: 'Arabic letter introduction', types: ['qaida'] },
  { value: 'LetterFormsComponent', label: 'Letter Forms', description: 'Arabic letter forms display', types: ['qaida'] },
  { value: 'PronunciationComponent', label: 'Pronunciation', description: 'Pronunciation practice', types: ['pronunciation', 'qaida'] },
  { value: 'DuaCardComponent', label: 'Dua Card', description: 'Dua with Arabic + transliteration', types: ['dua'] },
  { value: 'HadithComponent', label: 'Hadith', description: 'Hadith card display', types: ['hadith'] },
  { value: 'QuizComponent', label: 'Quiz', description: 'Multiple-choice quiz', types: ['quiz', 'revision'] },
  { value: 'TipsComponent', label: 'Tips', description: 'Manners / tips', types: ['manners'] },
  { value: 'QuranReaderComponent', label: 'Quran Reader', description: 'Quran reading', types: ['qaida'] },
  { value: 'ReflectionComponent', label: 'Reflection', description: 'Reflection prompt', types: ['revision'] },
  { value: 'PrayerChecklistComponent', label: 'Prayer Checklist', description: 'Prayer steps checklist', types: ['revision'] },
  { value: 'CertificateComponent', label: 'Certificate', description: 'Level completion certificate', types: ['revision'] },
] as const

// ─── Themes (common visual themes used in levels) ───

export const LEVEL_THEMES = [
  { value: 'arabic_alphabet', label: 'Arabic Alphabet', icon: '🔤' },
  { value: 'letter_forms', label: 'Letter Forms', icon: '✍️' },
  { value: 'connecting_letters', label: 'Connecting Letters', icon: '🔗' },
  { value: 'short_vowels', label: 'Short Vowels', icon: '📝' },
  { value: 'long_vowels', label: 'Long Vowels', icon: '📖' },
  { value: 'tanween', label: 'Tanween', icon: '🌙' },
  { value: 'shaddah', label: 'Shaddah & Sukoon', icon: '⚡' },
  { value: 'quran_reading', label: 'Quran Reading', icon: '📖' },
  { value: 'daily_duas', label: 'Daily Duas', icon: '🤲' },
  { value: 'prophetic_manners', label: 'Prophetic Manners', icon: '🌟' },
  { value: 'salah_focus', label: 'Salah Focus', icon: '🕌' },
  { value: 'dhikr_mastery', label: 'Dhikr Mastery', icon: '📿' },
  { value: 'islamic_history', label: 'Islamic History', icon: '🏛️' },
  { value: 'ramadan_special', label: 'Ramadan Special', icon: '🌙' },
] as const

// ─── Layouts ───

export const LAYOUTS = [
  { value: 'single-column', label: 'Single Column', description: 'Blocks stacked vertically' },
  { value: 'grid', label: 'Grid', description: 'Two-column grid layout' },
  { value: 'card-stack', label: 'Card Stack', description: 'Swipeable card stack' },
  { value: 'scroll-snap', label: 'Scroll Snap', description: 'Snap scrolling between sections' },
] as const

// ─── Animations ───

export const ANIMATIONS = [
  { value: 'fade-in', label: 'Fade In', description: 'Smooth opacity transition' },
  { value: 'slide-up', label: 'Slide Up', description: 'Slide from bottom' },
  { value: 'slide-left', label: 'Slide Left', description: 'Slide from right' },
  { value: 'scale-in', label: 'Scale In', description: 'Scale up from center' },
  { value: 'bounce', label: 'Bounce', description: 'Bouncy entrance' },
  { value: 'none', label: 'None', description: 'No animation' },
] as const

// ─── Font Families ───

export const FONT_FAMILIES = [
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Amiri', label: 'Amiri (Arabic)' },
  { value: 'System', label: 'System Default' },
] as const

// ─── Content Types ───

export type ContentType = "task" | "level";
export type ContentStatus = "draft" | "published" | "archived";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type BlockType =
  | "TextBlock"
  | "AyahBlock"
  | "HadithBlock"
  | "CounterBlock"
  | "QuizBlock"
  | "AudioBlock"
  | "ChecklistBlock"
  | "FlashCardBlock"
  | "DragDropBlock"
  | "MatchBlock"
  | "RewardBlock"
  | "ImageBlock"
  | "VideoBlock"
  | "VoicePracticeBlock";

export interface Block {
  type: BlockType;
  content: Record<string, unknown>;
}

export interface Style {
  background?: string;
  card_color?: string;
  text_color?: string;
  accent_color?: string;
  border_radius?: number;
  font_family?: string;
  padding?: number;
}

export interface Content {
  id: string;
  title: string;
  slug: string;
  type: ContentType;
  category: string;
  status: ContentStatus;
  screen_type: string;
  component_type: string;
  theme: string;
  layout: string;
  animation: string;
  xp_reward: number;
  difficulty: DifficultyLevel;
  order: number;
  estimated_time: number;
  thumbnail: string;
  tags: string[];
  blocks: Block[];
  style?: Style;
  metadata?: Record<string, unknown>;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface ContentListResponse {
  items: Content[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ─── Theme ───

export interface Theme {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Emoji shown beside the theme (sent when creating one). */
  icon?: string;
  style: Style;
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ─── Reward ───

export interface Reward {
  id: string;
  title: string;
  description: string;
  icon: string; // trophy | crown | flame | gem | zap
  rarity: string; // rare | epic | legendary
  trigger: string; // levels_completed | xp | streak_days
  required: number;
  xp_bonus: number;
  sort_order: number;
}

// ─── Event ───

export interface Event {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  content_ids: string[];
  style?: Style;
  rewards: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ─── Analytics ───

export interface AnalyticsSnapshot {
  id: string;
  date: string;
  total_users: number;
  dau: number;
  mau: number;
  avg_session_time: number;
  retention_rate: number;
  tasks_completed: number;
  levels_completed: number;
  top_completed_tasks: string[];
  most_failed_levels: string[];
  avg_streak: number;
}

// ─── Audit Log ───

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  resource: string;
  resource_id: string;
  changes?: unknown;
  ip: string;
  user_agent: string;
  created_at: string;
}

// ─── Real app models (what the mobile app reads) ───

export interface Lesson {
  type: string;
  title: string;
  description: string;
  screen_type: string;
  component: string;
  data: Record<string, any>;
}

export interface MiniGame {
  type: string;
  description: string;
  data: Record<string, any>;
}

export interface Level {
  id: number;
  course_type: string;
  course_level: number;
  title: string;
  theme: string;
  goal: string;
  lessons: Lesson[];
  mini_game: MiniGame;
  xp_reward: number;
  unlock_reward: string;
  difficulty: string;
}

export interface DailyTask {
  id: string;
  title: string;
  category: string;
  description: string;
  blocks: Block[];
  completion_type: string;
  reward_xp: number;
  difficulty: string;
  is_fixed: boolean;
}

// ─── Content schema registry (served by GET /admin/registry) ───

export type SchemaFieldType =
  | "text"
  | "textarea"
  | "arabic"
  | "number"
  | "boolean"
  | "select"
  | "string_list"
  | "arabic_list"
  | "options"
  | "pairs"
  | "json";

export interface SchemaField {
  key: string;
  label: string;
  type: SchemaFieldType;
  required: boolean;
  help?: string;
}

export interface ContentSchema {
  kind: "lesson_component" | "mini_game" | "block";
  name: string;
  label: string;
  description: string;
  icon: string;
  lesson_types?: string[];
  screen_type?: string;
  fields: SchemaField[];
  example: Record<string, any>;
}

export interface EnumOption {
  value: string;
  label: string;
  icon?: string;
  color?: string;
}

export interface ContentRegistry {
  lesson_components: ContentSchema[];
  mini_games: ContentSchema[];
  blocks: ContentSchema[];
  enums: Record<string, EnumOption[]>;
}

// ─── Analytics (GET /admin/analytics) ───

export interface AnalyticsTimePoint {
  date: string;
  level_completions: number;
  task_completions: number;
}

export interface AnalyticsLabelCount {
  label: string;
  count: number;
}

export interface AdminAnalytics {
  total_users: number;
  active_today: number;
  active_week: number;
  total_xp: number;
  avg_streak: number;
  longest_streak: number;
  levels_completed: number;
  tasks_completed: number;
  total_levels: number;
  total_tasks: number;
  recitation_attempts: number;
  series: AnalyticsTimePoint[];
  levels_by_difficulty: AnalyticsLabelCount[];
  top_levels: AnalyticsLabelCount[];
}

// ─── API Response ───

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

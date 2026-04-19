// ─── Content Types ───

export type ContentType = 'task' | 'level'
export type ContentStatus = 'draft' | 'published' | 'archived'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'
export type BlockType =
  | 'TextBlock'
  | 'AyahBlock'
  | 'HadithBlock'
  | 'CounterBlock'
  | 'QuizBlock'
  | 'AudioBlock'
  | 'ChecklistBlock'
  | 'FlashCardBlock'
  | 'DragDropBlock'
  | 'MatchBlock'
  | 'RewardBlock'
  | 'ImageBlock'
  | 'VideoBlock'
  | 'VoicePracticeBlock'

export interface Block {
  type: BlockType
  content: Record<string, unknown>
}

export interface Style {
  background?: string
  card_color?: string
  text_color?: string
  accent_color?: string
  border_radius?: number
  font_family?: string
  padding?: number
}

export interface Content {
  id: string
  title: string
  slug: string
  type: ContentType
  category: string
  status: ContentStatus
  screen_type: string
  component_type: string
  theme: string
  layout: string
  animation: string
  xp_reward: number
  difficulty: DifficultyLevel
  order: number
  estimated_time: number
  thumbnail: string
  tags: string[]
  blocks: Block[]
  style?: Style
  metadata?: Record<string, unknown>
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

export interface ContentListResponse {
  items: Content[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// ─── Theme ───

export interface Theme {
  id: string
  name: string
  slug: string
  description: string
  style: Style
  is_default: boolean
  created_by: string
  created_at: string
  updated_at: string
}

// ─── Reward ───

export interface Reward {
  id: string
  name: string
  type: string
  description: string
  xp_value: number
  icon: string
  rarity: string
  created_by: string
  created_at: string
  updated_at: string
}

// ─── Event ───

export interface Event {
  id: string
  name: string
  slug: string
  type: string
  description: string
  start_date: string
  end_date: string
  is_active: boolean
  content_ids: string[]
  style?: Style
  rewards: string[]
  created_by: string
  created_at: string
  updated_at: string
}

// ─── Analytics ───

export interface AnalyticsSnapshot {
  id: string
  date: string
  total_users: number
  dau: number
  mau: number
  avg_session_time: number
  retention_rate: number
  tasks_completed: number
  levels_completed: number
  top_completed_tasks: string[]
  most_failed_levels: string[]
  avg_streak: number
}

// ─── Audit Log ───

export interface AuditLog {
  id: string
  admin_id: string
  action: string
  resource: string
  resource_id: string
  changes?: unknown
  ip: string
  user_agent: string
  created_at: string
}

// ─── API Response ───

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  error?: string
}

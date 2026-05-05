import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../storage/authStorage";

// Base query with auth handling
const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: "http://172.16.26.179:8080",
  prepareHeaders: async (headers) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.accessToken);
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    } catch (error) {
      console.warn("Failed to get token from AsyncStorage", error);
    }
    return headers;
  },
});

// Auth DTOs
export interface SignupRequest {
  email: string;
  password: string;
  role?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  title: string;
  is_verified: boolean;
}

export interface UpdateProfileRequest {
  email?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  title?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface PublicProfileData {
  id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  title?: string;
}

export interface PublicProgressData {
  xp: number;
  level: number;
  barakah_score: number;
  current_streak: number;
}

export interface AuthResponse {
  user: AuthUser;
  access_token: string;
}

export interface APIResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// ─── Daily Task / Block Types ───

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
  | "ImageBlock"
  | "VideoBlock"
  | "VoicePracticeBlock";

export interface Block {
  type: BlockType;
  content: Record<string, any>;
}

/** "auto"   → block auto-completes on interaction (counter, checklist)
 *  "button" → show a complete button immediately
 *  "quiz"   → show complete button after user selects an option */
export type CompletionType = "button" | "auto" | "quiz";
export type TaskDifficulty = "easy" | "medium";
export type TaskCategory =
  | "salah"
  | "quran"
  | "dhikr"
  | "learning"
  | "character"
  | "social"
  | "reflection";

export interface DailyTask {
  id: string;
  title: string;
  category: TaskCategory;
  description: string;
  blocks: Block[];
  completion_type: CompletionType;
  reward_xp: number;
  difficulty: TaskDifficulty;
  is_fixed: boolean;
  completed: boolean;
  completed_at?: string;
}

// API Service
export interface UserProgress {
  xp: number;
  level: number;
  barakah_score: number;
  current_streak: number;
  longest_streak: number;
  /** 7 booleans: index 0 = 6 days ago, index 6 = today */
  weekly_completions: boolean[];
}

export interface LeaderboardUser {
  rank: number;
  user_id: string;
  display_name?: string;
  level: number;
  xp: number;
}

// ─── Level Journey Types ───

export type MiniGameType =
  | "tap_match"
  | "listen_choose"
  | "drag_drop"
  | "repeat_voice"
  | "mcq"
  | "memory_cards";

export type LessonType =
  | "qaida"
  | "hadith"
  | "dua"
  | "quiz"
  | "pronunciation"
  | "manners"
  | "revision";

export type LevelDifficulty = "easy" | "medium" | "hard";

export type LevelStatus = "locked" | "available" | "in_progress" | "completed";

// ScreenType is used by the Level/Lesson system (not by daily tasks).
export type ScreenType =
  | "CHECKLIST"
  | "QURAN_READER"
  | "COUNTER"
  | "HADITH_CARD"
  | "QUIZ"
  | "AUDIO_PLAYER"
  | "REFLECTION"
  | "TIPS"
  | "ACTION";

export interface Lesson {
  type: LessonType;
  title: string;
  description: string;
  screen_type: ScreenType;
  component: string;
  data: Record<string, any>;
}

export interface MiniGame {
  type: MiniGameType;
  description: string;
  data: Record<string, any>;
}

export interface Level {
  id: number;
  title: string;
  theme: string;
  goal: string;
  lessons: Lesson[];
  mini_game: MiniGame;
  xp_reward: number;
  unlock_reward: string;
  difficulty: LevelDifficulty;
}

export interface LevelWithStatus extends Level {
  status: LevelStatus;
  stars: number;
  lessons_complete: number;
}

export interface UserLevel {
  id: string;
  user_id: string;
  level_id: number;
  stars: number;
  lessons_complete: number;
  mini_game_done: boolean;
  completed: boolean;
  completed_at?: string;
}

export interface LevelCompletionResult {
  xp_earned: number;
  stars: number;
  unlock_reward: string;
  treasure_open: boolean;
  next_level_id: number;
  new_rewards: NewlyGrantedReward[];
}

// ─── Recitation Types ───

export type WordStatus = "correct" | "wrong" | "missing" | "extra";

export interface RecitationWordResult {
  text: string;
  status: WordStatus;
  confidence: number;
}

export interface RecitationCheckResult {
  score: number; // 0–100
  stars: number; // 1–3
  words: RecitationWordResult[];
  message: string;
  xp_earned: number;
  transcript: string;
  attempt_num: number;
}

export interface CheckRecitationRequest {
  levelId: number;
  lessonIndex: number;
  audioUri: string;
  audioMimeType?: string;
}

// ─── Reward Types ───

export type RewardTrigger = "levels_completed" | "xp" | "streak_days";
export type RewardRarity = "rare" | "epic" | "legendary";
export type RewardIcon = "crown" | "flame" | "gem" | "trophy" | "zap";

/** A reward as returned by GET /api/v1/rewards — includes the user's live status. */
export interface RewardWithStatus {
  id: string;
  title: string;
  description: string;
  icon: RewardIcon;
  rarity: RewardRarity;
  trigger: RewardTrigger;
  required: number;
  xp_bonus: number;
  sort_order: number;
  unlocked: boolean;
  unlocked_at?: string;
  current: number; // user's current metric value
  progress: number; // 0.0–1.0
}

/** Minimal reward snapshot returned inside LevelCompletionResult.new_rewards. */
export interface NewlyGrantedReward {
  id: string;
  title: string;
  description: string;
  icon: RewardIcon;
  rarity: RewardRarity;
  xp_bonus: number;
}

// API Service
export const API = createApi({
  reducerPath: "API",
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    "User",
    "Auth",
    "DailyTasks",
    "Progress",
    "Levels",
    "Leaderboard",
    "Rewards",
    "Recitation",
  ],
  endpoints: (builder) => ({
    signup: builder.mutation<APIResponse<null>, SignupRequest>({
      query: (credentials) => ({
        url: "/api/v1/auth/signup",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),
    login: builder.mutation<APIResponse<AuthResponse>, LoginRequest>({
      query: (credentials) => ({
        url: "/api/v1/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),
    getProfile: builder.query<APIResponse<AuthUser>, void>({
      query: () => ({
        url: "/api/v1/users/me",
        method: "GET",
      }),
      providesTags: ["User"],
    }),
    getPublicProfile: builder.query<APIResponse<PublicProfileData>, string>({
      query: (userId) => ({
        url: `/api/v1/users/${userId}/public`,
        method: "GET",
      }),
    }),
    getPublicProgress: builder.query<APIResponse<PublicProgressData>, string>({
      query: (userId) => ({
        url: `/api/v1/progress/user/${userId}`,
        method: "GET",
      }),
    }),
    updateProfile: builder.mutation<
      APIResponse<AuthUser>,
      UpdateProfileRequest
    >({
      query: (data) => ({
        url: "/api/v1/users/me",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    changePassword: builder.mutation<APIResponse<null>, ChangePasswordRequest>({
      query: (data) => ({
        url: "/api/v1/users/me/password",
        method: "PUT",
        body: data,
      }),
    }),
    deleteAccount: builder.mutation<APIResponse<null>, void>({
      query: () => ({
        url: "/api/v1/users/me",
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
    getDailyTasks: builder.query<APIResponse<DailyTask[]>, void>({
      query: () => ({
        url: "/api/v1/daily-tasks",
        method: "GET",
      }),
      providesTags: ["DailyTasks"],
    }),
    completeDailyTask: builder.mutation<APIResponse<null>, string>({
      query: (taskId) => ({
        url: `/api/v1/daily-tasks/${taskId}/complete`,
        method: "POST",
      }),
      invalidatesTags: ["DailyTasks", "Progress", "Leaderboard"],
    }),
    getProgress: builder.query<APIResponse<UserProgress>, void>({
      query: () => ({
        url: "/api/v1/progress/me",
        method: "GET",
      }),
      providesTags: ["Progress"],
    }),
    getLeaderboard: builder.query<
      APIResponse<LeaderboardUser[]>,
      { limit?: number } | undefined
    >({
      query: (params) => ({
        url: "/api/v1/leaderboard",
        method: "GET",
        params: params?.limit ? { limit: params.limit } : undefined,
      }),
      providesTags: ["Leaderboard"],
      keepUnusedDataFor: 60,
    }),

    // ─── Level Journey Endpoints ───
    getLevels: builder.query<APIResponse<LevelWithStatus[]>, void>({
      query: () => ({
        url: "/api/v1/levels",
        method: "GET",
      }),
      providesTags: ["Levels"],
    }),
    getLevelDetail: builder.query<APIResponse<LevelWithStatus>, number>({
      query: (levelId) => ({
        url: `/api/v1/levels/${levelId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, levelId) => [
        { type: "Levels", id: levelId },
      ],
    }),
    completeLesson: builder.mutation<
      APIResponse<UserLevel>,
      { levelId: number; lessonIndex: number }
    >({
      query: ({ levelId, lessonIndex }) => ({
        url: `/api/v1/levels/${levelId}/lessons/complete`,
        method: "POST",
        body: { lesson_index: lessonIndex },
      }),
      invalidatesTags: ["Levels", "Progress"],
    }),
    completeLevel: builder.mutation<
      APIResponse<LevelCompletionResult>,
      { levelId: number; stars: number }
    >({
      query: ({ levelId, stars }) => ({
        url: `/api/v1/levels/${levelId}/complete`,
        method: "POST",
        body: { stars },
      }),
      invalidatesTags: ["Levels", "Progress", "Leaderboard", "Rewards"],
    }),

    // ─── Recitation ───
    checkRecitation: builder.mutation<
      APIResponse<RecitationCheckResult>,
      CheckRecitationRequest
    >({
      queryFn: async (
        { levelId, lessonIndex, audioUri, audioMimeType = "audio/m4a" },
        _api,
        _extraOptions,
        baseQuery,
      ) => {
        const formData = new FormData();
        formData.append("level_id", String(levelId));
        formData.append("lesson_index", String(lessonIndex));
        (formData as any).append("audio", {
          uri: audioUri,
          type: audioMimeType,
          name: `recitation_${Date.now()}.m4a`,
        });
        return baseQuery({
          url: "/api/v1/recitation/check",
          method: "POST",
          body: formData,
        }) as any;
      },
      invalidatesTags: ["Progress"],
    }),

    // ─── Rewards ───
    getRewards: builder.query<APIResponse<RewardWithStatus[]>, void>({
      query: () => ({ url: "/api/v1/rewards", method: "GET" }),
      providesTags: ["Rewards"],
    }),
  }),
});

// Export hooks
export const {
  useSignupMutation,
  useLoginMutation,
  useGetProfileQuery,
  useGetPublicProfileQuery,
  useGetPublicProgressQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useDeleteAccountMutation,
  useGetDailyTasksQuery,
  useCompleteDailyTaskMutation,
  useGetProgressQuery,
  useGetLeaderboardQuery,
  useGetLevelsQuery,
  useGetLevelDetailQuery,
  useCompleteLessonMutation,
  useCompleteLevelMutation,
  useGetRewardsQuery,
  useCheckRecitationMutation,
} = API;

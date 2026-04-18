import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../storage/authStorage";

// Base query with auth handling
const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: "http://192.168.200.24:8080",
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
  is_verified: boolean;
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

// Daily Task Types
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

export type CompletionType = "button" | "auto" | "counter" | "quiz";
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
  screen_type: ScreenType;
  component: string;
  data: Record<string, any>;
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
}

// API Service
export const API = createApi({
  reducerPath: "API",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["User", "Auth", "DailyTasks", "Progress", "Levels"],
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
    updateProfile: builder.mutation<APIResponse<AuthUser>, Partial<AuthUser>>({
      query: (data) => ({
        url: "/api/v1/users/me",
        method: "PUT",
        body: data,
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
      invalidatesTags: ["DailyTasks", "Progress"],
    }),
    getProgress: builder.query<APIResponse<UserProgress>, void>({
      query: () => ({
        url: "/api/v1/progress/me",
        method: "GET",
      }),
      providesTags: ["Progress"],
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
      invalidatesTags: ["Levels", "Progress"],
    }),
  }),
});

// Export hooks
export const {
  useSignupMutation,
  useLoginMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetDailyTasksQuery,
  useCompleteDailyTaskMutation,
  useGetProgressQuery,
  useGetLevelsQuery,
  useGetLevelDetailQuery,
  useCompleteLessonMutation,
  useCompleteLevelMutation,
} = API;

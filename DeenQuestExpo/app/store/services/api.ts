import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../storage/authStorage";
import type { AyahTimingInput } from "../../types/quranSync";

// Base query with auth handling
const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: "http://192.168.18.16:8080",
  prepareHeaders: async (headers, { getState }) => {
    try {
      const stateToken = (getState() as any)?.main?.accessToken;
      const token =
        stateToken || (await AsyncStorage.getItem(STORAGE_KEYS.accessToken));
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

// ─── Notifications ───

export type NotificationPlatform = "ios" | "android" | "web";

export interface RegisterNotificationTokenRequest {
  expo_push_token: string;
  platform: NotificationPlatform;
  device_id?: string;
  app_version?: string;
  timezone?: string;
}

export interface NotificationUserInfo {
  id: string;
  email: string;
  role?: string;
}

export interface NotificationTokenResponse {
  user: NotificationUserInfo;
  expo_push_token: string;
  platform: NotificationPlatform;
  updated_at: string;
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
export type CourseType = "qaida";

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
  course_type: CourseType;
  course_level: number;
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
  lessons_complete: number;
  lesson_count: number;
}

export interface UserLevel {
  id: string;
  user_id: string;
  level_id: number;
  course_type: CourseType;
  lessons_complete: number;
  mini_game_done: boolean;
  completed: boolean;
  completed_at?: string;
}

export interface LevelCompletionResult {
  xp_earned: number;
  unlock_reward: string;
  treasure_open: boolean;
  next_level_id: number;
  course_type: CourseType;
  new_rewards: NewlyGrantedReward[];
}

export interface CourseScopedRequest {
  courseType?: CourseType;
}

export interface LevelScopedRequest extends CourseScopedRequest {
  levelId: number;
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

// ─── Onboarding Types ───

export interface OnboardingRequest {
  quran_level: string;
  weak_areas: string[];
  daily_time: string;
  motivations: string[];
}

export interface OnboardingResponse {
  path_id: string;
  course_type: CourseType;
  message: string;
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

// ─── Quran Types ───

export interface QuranSurahSummary {
  id: number;
  number: number;
  name: string;
  english_name: string;
  english_name_translation: string;
  number_of_ayahs: number;
  revelation_type: string;
}

export interface QuranAyah {
  number: number;
  number_in_surah: number;
  juz: number;
  page: number;
  text: string;
  translation?: string;
  timing?: AyahTimingInput | null;
  audio_start?: number;
  audio_end?: number;
}

export interface QuranSurahDetail extends QuranSurahSummary {
  translation_edition?: string;
  ayahs: QuranAyah[];
  ayah_timings?: AyahTimingInput[];
  timings?: AyahTimingInput[];
}

export interface QuranSurahAudio {
  surah_id: number;
  reciter: string;
  bitrate: number;
  url: string;
  source: string;
}

export interface QuranSurahRequest {
  id: number;
  translation?: string;
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
    "Notifications",
    "Quran",
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
    registerNotificationToken: builder.mutation<
      APIResponse<NotificationTokenResponse>,
      RegisterNotificationTokenRequest
    >({
      query: (data) => ({
        url: "/api/v1/notifications/register",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Notifications"],
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
    getLevels: builder.query<
      APIResponse<LevelWithStatus[]>,
      CourseScopedRequest | undefined
    >({
      query: (params) => ({
        url: "/api/v1/levels",
        method: "GET",
        params: params?.courseType
          ? { course_type: params.courseType }
          : undefined,
      }),
      providesTags: (_result, _error, params) => [
        { type: "Levels", id: params?.courseType ?? "qaida" },
      ],
    }),
    getLevelDetail: builder.query<
      APIResponse<LevelWithStatus>,
      LevelScopedRequest
    >({
      query: ({ levelId, courseType }) => ({
        url: `/api/v1/levels/${levelId}`,
        method: "GET",
        params: courseType ? { course_type: courseType } : undefined,
      }),
      providesTags: (_result, _error, { levelId, courseType }) => [
        { type: "Levels", id: `${courseType ?? "qaida"}:${levelId}` },
      ],
    }),
    completeLesson: builder.mutation<
      APIResponse<UserLevel>,
      { levelId: number; lessonIndex: number; courseType?: CourseType }
    >({
      query: ({ levelId, lessonIndex, courseType }) => ({
        url: `/api/v1/levels/${levelId}/lessons/complete`,
        method: "POST",
        params: courseType ? { course_type: courseType } : undefined,
        body: { lesson_index: lessonIndex, course_type: courseType },
      }),
      invalidatesTags: ["Levels", "Progress"],
    }),
    completeLevel: builder.mutation<
      APIResponse<LevelCompletionResult>,
      { levelId: number; courseType?: CourseType }
    >({
      query: ({ levelId, courseType }) => ({
        url: `/api/v1/levels/${levelId}/complete`,
        method: "POST",
        params: courseType ? { course_type: courseType } : undefined,
        body: { course_type: courseType },
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

    // ─── Onboarding ───
    generateLearningPath: builder.mutation<
      APIResponse<OnboardingResponse>,
      OnboardingRequest
    >({
      query: (data) => ({
        url: "/api/v1/onboarding/generate-path",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User", "Progress", "Levels"],
    }),

    // ─── Rewards ───
    getRewards: builder.query<APIResponse<RewardWithStatus[]>, void>({
      query: () => ({ url: "/api/v1/rewards", method: "GET" }),
      providesTags: ["Rewards"],
    }),

    // ─── Quran ───
    getSurahs: builder.query<APIResponse<QuranSurahSummary[]>, void>({
      query: () => ({
        url: "/api/v1/quran/surahs",
        method: "GET",
      }),
      providesTags: ["Quran"],
      keepUnusedDataFor: 3600,
    }),
    getSurahById: builder.query<
      APIResponse<QuranSurahDetail>,
      QuranSurahRequest
    >({
      query: ({ id, translation }) => ({
        url: `/api/v1/quran/surah/${id}`,
        method: "GET",
        params: translation ? { translation } : undefined,
      }),
      providesTags: (_result, _error, { id, translation }) => [
        { type: "Quran", id: `surah:${id}:${translation ?? "none"}` },
      ],
      keepUnusedDataFor: 604800,
    }),
    getSurahAudio: builder.query<APIResponse<QuranSurahAudio>, number>({
      query: (id) => ({
        url: `/api/v1/quran/surah/${id}/audio`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "Quran", id: `surah:${id}:audio` },
      ],
      keepUnusedDataFor: 604800,
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
  useRegisterNotificationTokenMutation,
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
  useGenerateLearningPathMutation,
  useGetSurahsQuery,
  useGetSurahByIdQuery,
  useGetSurahAudioQuery,
} = API;

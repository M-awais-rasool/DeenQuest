import type { Progress } from "react-native-track-player";

export interface AyahTimingInput {
  ayah?: number;
  ayahNumber?: number;
  ayah_number?: number;
  numberInSurah?: number;
  number_in_surah?: number;
  start?: number;
  startSeconds?: number;
  start_seconds?: number;
  startTime?: number;
  start_time?: number;
  timestamp_from?: number;
  end?: number;
  endSeconds?: number;
  end_seconds?: number;
  endTime?: number;
  end_time?: number;
  timestamp_to?: number;
  duration?: number;
  durationSeconds?: number;
  duration_seconds?: number;
}

export interface AyahSyncAyah {
  number_in_surah: number;
  text?: string;
  timing?: AyahTimingInput | null;
  audio_start?: number;
  audio_end?: number;
}

export interface AyahSyncResult {
  highlightedAyahNumber: number | null;
  activeAyahNumber: number | null;
  currentTrackPositionSeconds: number;
  currentTrackDurationSeconds: number;
}

export interface AyahSyncDebugSnapshot extends AyahSyncResult {
  queueId: string;
  activeTrackId?: string | number;
  isCurrentQueue: boolean;
  ayahCount: number;
}

export interface UseAyahSyncOptions<TAyah extends AyahSyncAyah = AyahSyncAyah> {
  ayahs: readonly TAyah[];
  surahId: number;
  queueId: string;
  enabled?: boolean;
  progressUpdateIntervalMs?: number;
  debug?: boolean;
  debugLogIntervalMs?: number;
  onHighlightChange?: (result: AyahSyncResult) => void;
}

export interface UseAyahSyncReturn {
  highlightedAyahNumber: number | null;
  progress: Progress;
  isCurrentQueue: boolean;
  debugSnapshot: AyahSyncDebugSnapshot;
  recalculate: () => AyahSyncResult;
}

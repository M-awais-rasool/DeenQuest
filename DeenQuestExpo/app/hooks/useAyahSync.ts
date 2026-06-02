import { useCallback, useEffect, useMemo, useRef } from "react";
import { useActiveTrack } from "react-native-track-player";
import {
  getAyahNumberFromTrack,
  isQuranQueueTrack,
} from "../components/quran/quranTrack";
import type {
  AyahSyncDebugSnapshot,
  AyahSyncResult,
  UseAyahSyncOptions,
  UseAyahSyncReturn,
} from "../types/quranSync";
import {
  TRACK_PLAYER_PROGRESS_UPDATE_INTERVAL_MS,
  useTrackPlayerProgress,
} from "./useTrackPlayerProgress";

const DEFAULT_DEBUG_LOG_INTERVAL_MS = 1000;

export const useAyahSync = ({
  ayahs,
  surahId,
  queueId,
  enabled = true,
  progressUpdateIntervalMs = TRACK_PLAYER_PROGRESS_UPDATE_INTERVAL_MS,
  debug = false,
  debugLogIntervalMs = DEFAULT_DEBUG_LOG_INTERVAL_MS,
  onHighlightChange,
}: UseAyahSyncOptions): UseAyahSyncReturn => {
  const activeTrack = useActiveTrack();
  const progress = useTrackPlayerProgress(progressUpdateIntervalMs);
  const lastHighlightRef = useRef<number | null>(null);
  const lastDebugLogRef = useRef({
    ayahNumber: null as number | null,
    loggedAt: 0,
  });

  const isCurrentQueue = enabled && isQuranQueueTrack(activeTrack, queueId);
  const activeAyahNumber = isCurrentQueue
    ? getAyahNumberFromTrack(activeTrack, surahId)
    : null;
  const highlightedAyahNumber = activeAyahNumber;

  const result: AyahSyncResult = useMemo(
    () => ({
      highlightedAyahNumber,
      activeAyahNumber,
      currentTrackPositionSeconds: progress.position,
      currentTrackDurationSeconds: progress.duration,
    }),
    [activeAyahNumber, highlightedAyahNumber, progress.duration, progress.position],
  );

  const debugSnapshot: AyahSyncDebugSnapshot = useMemo(
    () => ({
      ...result,
      queueId,
      activeTrackId: activeTrack?.id,
      isCurrentQueue,
      ayahCount: ayahs.length,
    }),
    [activeTrack?.id, ayahs.length, isCurrentQueue, queueId, result],
  );

  const logDebugSnapshot = useCallback(
    (reason: string, snapshot: AyahSyncDebugSnapshot) => {
      if (!debug) return;

      const now = Date.now();
      const ayahChanged =
        lastDebugLogRef.current.ayahNumber !==
        snapshot.highlightedAyahNumber;
      const shouldLog =
        ayahChanged ||
        now - lastDebugLogRef.current.loggedAt >= debugLogIntervalMs;

      if (!shouldLog) return;

      lastDebugLogRef.current = {
        ayahNumber: snapshot.highlightedAyahNumber,
        loggedAt: now,
      };

      console.log("[AyahSync]", {
        reason,
        queueId: snapshot.queueId,
        activeTrackId: snapshot.activeTrackId,
        isCurrentQueue: snapshot.isCurrentQueue,
        highlightedAyah: snapshot.highlightedAyahNumber,
        currentTrackPositionSeconds: Number(
          snapshot.currentTrackPositionSeconds.toFixed(3),
        ),
        currentTrackDurationSeconds: Number(
          snapshot.currentTrackDurationSeconds.toFixed(3),
        ),
        ayahCount: snapshot.ayahCount,
      });
    },
    [debug, debugLogIntervalMs],
  );

  useEffect(() => {
    if (lastHighlightRef.current === highlightedAyahNumber) return;

    lastHighlightRef.current = highlightedAyahNumber;
    onHighlightChange?.(result);
    logDebugSnapshot("active-track", debugSnapshot);
  }, [
    debugSnapshot,
    highlightedAyahNumber,
    logDebugSnapshot,
    onHighlightChange,
    result,
  ]);

  useEffect(() => {
    logDebugSnapshot("progress", debugSnapshot);
  }, [debugSnapshot, logDebugSnapshot]);

  const recalculate = useCallback(() => result, [result]);

  return {
    highlightedAyahNumber,
    progress,
    isCurrentQueue,
    debugSnapshot,
    recalculate,
  };
};

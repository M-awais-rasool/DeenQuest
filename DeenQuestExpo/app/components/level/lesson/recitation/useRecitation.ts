import { useState, useRef, useCallback, useEffect } from "react";
import { Animated, Platform, Alert } from "react-native";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import {
  API,
  useCheckRecitationMutation,
  useLazyGetRecitationJobQuery,
} from "../../../../store/services/api";
import type {
  RecitationCheckResult,
  RecitationJobState,
} from "../../../../store/services/api";
import { useAppDispatch } from "../../../../store/hooks";
import { RECITATION_RECORDING } from "../../../../utils/recitationRecording";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecordingState = "idle" | "recording" | "processing" | "result";

export interface RecitationQueueInfo {
  position: number;
  estimatedWaitSeconds: number;
}

export interface UseRecitationReturn {
  result: RecitationCheckResult | null;
  isPlaying: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  hasResult: boolean;
  queueInfo: RecitationQueueInfo | null;
  resultAnim: Animated.Value;
  handlePlay: () => Promise<void>;
  handleRecord: () => Promise<void>;
  handleRetry: () => void;
}

const MIN_POLL_MS = 600;
const MAX_POLL_MS = 5000;
const MAX_WAIT_MS = 3 * 60 * 1000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Encapsulates all state and logic for the recitation feature.
 * Use this hook in any component that needs TTS playback + audio recording + scoring.
 */
export function useRecitation(
  arabicText: string,
  levelId: number | undefined,
  lessonIndex: number | undefined,
): UseRecitationReturn {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [result, setResult] = useState<RecitationCheckResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queueInfo, setQueueInfo] = useState<RecitationQueueInfo | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const resultAnim = useRef(new Animated.Value(0)).current;

  const pollAbort = useRef(false);

  const dispatch = useAppDispatch();
  const [checkRecitation] = useCheckRecitationMutation();
  const [fetchJob] = useLazyGetRecitationJobQuery();

  // Animate result section in/out
  useEffect(() => {
    if (result) {
      Animated.spring(resultAnim, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }).start();
    } else {
      resultAnim.setValue(0);
    }
  }, [result, resultAnim]);

  // Cleanup speech + recording on unmount
  useEffect(() => {
    return () => {
      pollAbort.current = true;
      Speech.stop();
      if (recordingRef.current) {
        try {
          recordingRef.current.stopAndUnloadAsync();
        } catch {}
      }
    };
  }, []);

  // ── TTS playback ────────────────────────────────────────────────────────────
  const handlePlay = useCallback(async () => {
    if (isPlaying) {
      Speech.stop();
      setIsPlaying(false);
      return;
    }
    if (!arabicText) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    } catch {
      // Non-fatal — proceed with speech even if session reset fails.
    }

    setIsPlaying(true);
    Speech.speak(arabicText, {
      language: "ar",
      rate: 0.75,
      pitch: 1,
      onDone: () => setIsPlaying(false),
      onStopped: () => setIsPlaying(false),
      onError: () => {
        setIsPlaying(false);
        Alert.alert(
          "Audio Unavailable",
          "No Arabic voice found. Go to Settings → Accessibility → Spoken Content → Voices and download an Arabic voice.",
        );
      },
    });
  }, [isPlaying, arabicText]);

  const awaitJob = useCallback(
    async (jobId: string, firstDelayMs: number): Promise<RecitationJobState> => {
      const giveUpAt = Date.now() + MAX_WAIT_MS;
      let delay = firstDelayMs;

      while (!pollAbort.current) {
        await sleep(Math.min(Math.max(delay, MIN_POLL_MS), MAX_POLL_MS));
        if (pollAbort.current) break;

        const state = (await fetchJob(jobId).unwrap()).data;
        if (!state) throw new Error("Recitation status was empty.");

        if (state.status === "done" || state.status === "failed") return state;

        setQueueInfo(
          state.status === "queued"
            ? {
                position: state.position ?? 0,
                estimatedWaitSeconds: state.estimated_wait_seconds ?? 0,
              }
            : null,
        );

        if (Date.now() > giveUpAt) {
          throw new Error(
            "Your recitation is taking longer than usual. Please try again.",
          );
        }
        delay = state.poll_after_ms ?? delay;
      }

      throw new Error("cancelled");
    },
    [fetchJob],
  );

  // ── Stop recording + submit to API ──────────────────────────────────────────
  const handleStopAndSubmit = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;
    try {
      pollAbort.current = false;
      setQueueInfo(null);
      setRecordingState("processing");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      if (!uri) {
        setRecordingState("idle");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      // The POST only parks the clip; the score arrives through the polls.
      const accepted = (
        await checkRecitation({
          levelId: levelId!,
          lessonIndex: lessonIndex!,
          audioUri: uri,
          audioMimeType: Platform.OS === "ios" ? "audio/m4a" : "audio/3gp",
        }).unwrap()
      ).data;

      if (!accepted?.job_id) {
        setRecordingState("idle");
        return;
      }

      setQueueInfo({
        position: accepted.position,
        estimatedWaitSeconds: accepted.estimated_wait_seconds,
      });

      const finished = await awaitJob(accepted.job_id, accepted.poll_after_ms);
      if (pollAbort.current) return;

      setQueueInfo(null);

      if (finished.status === "failed" || !finished.result) {
        setRecordingState("idle");
        Alert.alert(
          "Try again",
          finished.error ?? "We could not check that recitation.",
        );
        return;
      }

      dispatch(API.util.invalidateTags(["Progress", "Leaderboard"]));

      setResult(finished.result);
      setRecordingState("result");
      if (finished.result.score >= 90) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (err: any) {
      if (pollAbort.current) return;
      setQueueInfo(null);
      setRecordingState("idle");
      Alert.alert(
        "Error",
        err?.data?.error ?? err?.message ?? "Failed to check recitation.",
      );
    }
  }, [awaitJob, checkRecitation, dispatch, levelId, lessonIndex]);

  // ── Start / stop recording toggle ───────────────────────────────────────────
  const handleRecord = useCallback(async () => {
    if (recordingState === "recording") {
      await handleStopAndSubmit();
      return;
    }
    if (recordingState !== "idle") return;
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Microphone Permission",
          "Please enable microphone access in Settings.",
        );
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(RECITATION_RECORDING);
      recordingRef.current = recording;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setRecordingState("recording");
    } catch (err: any) {
      Alert.alert(
        "Recording Error",
        err?.message ?? "Could not start recording.",
      );
    }
  }, [recordingState, handleStopAndSubmit]);

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    pollAbort.current = true;
    setResult(null);
    setQueueInfo(null);
    setRecordingState("idle");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return {
    result,
    isPlaying,
    isRecording: recordingState === "recording",
    isProcessing: recordingState === "processing",
    hasResult: recordingState === "result" && result !== null,
    queueInfo,
    resultAnim,
    handlePlay,
    handleRecord,
    handleRetry,
  };
}

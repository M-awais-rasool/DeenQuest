import { useState, useRef, useCallback, useEffect } from "react";
import { Animated, Platform, Alert } from "react-native";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { useCheckRecitationMutation } from "../../../../store/services/api";
import type { RecitationCheckResult } from "../../../../store/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecordingState = "idle" | "recording" | "processing" | "result";

export interface UseRecitationReturn {
  result: RecitationCheckResult | null;
  isPlaying: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  hasResult: boolean;
  resultAnim: Animated.Value;
  handlePlay: () => Promise<void>;
  handleRecord: () => Promise<void>;
  handleRetry: () => void;
}

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
  const recordingRef = useRef<Audio.Recording | null>(null);
  const resultAnim = useRef(new Animated.Value(0)).current;

  const [checkRecitation] = useCheckRecitationMutation();

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

  // ── Stop recording + submit to API ──────────────────────────────────────────
  const handleStopAndSubmit = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;
    try {
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

      const res = await checkRecitation({
        levelId: levelId!,
        lessonIndex: lessonIndex!,
        audioUri: uri,
        audioMimeType: Platform.OS === "ios" ? "audio/m4a" : "audio/3gp",
      }).unwrap();

      if (res.data) {
        setResult(res.data);
        setRecordingState("result");
        if (res.data.score >= 90) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      } else {
        setRecordingState("idle");
      }
    } catch (err: any) {
      setRecordingState("idle");
      Alert.alert(
        "Error",
        err?.data?.error ?? err?.message ?? "Failed to check recitation.",
      );
    }
  }, [checkRecitation, levelId, lessonIndex]);

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
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
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
    setResult(null);
    setRecordingState("idle");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return {
    result,
    isPlaying,
    isRecording: recordingState === "recording",
    isProcessing: recordingState === "processing",
    hasResult: recordingState === "result" && result !== null,
    resultAnim,
    handlePlay,
    handleRecord,
    handleRetry,
  };
}

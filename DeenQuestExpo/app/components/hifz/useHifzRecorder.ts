import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import { Audio } from "expo-av";
import { haptics } from "../../utils/haptics";
import { RECITATION_RECORDING } from "../../utils/recitationRecording";
import {
  useSubmitHifzRecitationMutation,
  type HifzReciteResult,
} from "../../store/services/api";

export type RecorderState = "idle" | "recording" | "processing" | "result";

export function useHifzRecorder(sessionId: string) {
  const [state, setState] = useState<RecorderState>("idle");
  const [result, setResult] = useState<HifzReciteResult | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const busyRef = useRef(false);

  const [submit] = useSubmitHifzRecitationMutation();

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      const rec = recordingRef.current;
      recordingRef.current = null;
      if (rec) {
        rec.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [clearTimer]);

  const start = useCallback(async () => {
    if (state !== "idle" || busyRef.current) return;
    busyRef.current = true;
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Microphone needed",
          "Reciting aloud is how this stage works — enable microphone access in Settings.",
        );
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(RECITATION_RECORDING);
      recordingRef.current = recording;
      haptics.medium();
      setElapsed(0);
      setState("recording");
      timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    } catch (err: any) {
      Alert.alert("Recording failed", err?.message ?? "Could not start recording.");
    } finally {
      busyRef.current = false;
    }
  }, [state]);

  const stopAndSubmit = useCallback(
    async (ayahNumber: number, lastAyah: boolean) => {
      const recording = recordingRef.current;
      // Taking the recording out of the ref up front makes this idempotent: a
      // second tap finds nothing and returns instead of submitting twice.
      if (!recording || busyRef.current) return;
      busyRef.current = true;

      clearTimer();
      recordingRef.current = null;
      setState("processing");

      try {
        haptics.light();
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        if (!uri) {
          setState("idle");
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });

        const res = await submit({
          sessionId,
          ayahNumber,
          lastAyah,
          audioUri: uri,
          audioMimeType: Platform.OS === "ios" ? "audio/m4a" : "audio/3gp",
        }).unwrap();

        if (!res.data) {
          setState("idle");
          return;
        }

        setResult(res.data);
        setState("result");
        if (res.data.passed) {
          haptics.success();
        } else {
          haptics.warning();
        }
      } catch (err: any) {
        setState("idle");
        Alert.alert(
          "Couldn't check that",
          err?.data?.error ??
            err?.message ??
            "The recitation service didn't respond. Try again.",
        );
      } finally {
        busyRef.current = false;
      }
    },
    [sessionId, submit, clearTimer],
  );

  const reset = useCallback(() => {
    busyRef.current = false;
    setResult(null);
    setElapsed(0);
    setState("idle");
  }, []);

  return {
    state,
    result,
    elapsed,
    isRecording: state === "recording",
    isProcessing: state === "processing",
    hasResult: state === "result" && result !== null,
    start,
    stopAndSubmit,
    reset,
  };
}

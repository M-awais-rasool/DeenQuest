import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Audio } from "expo-av";
import {
  useGetSurahAudioQuery,
  useGetSurahByIdQuery,
} from "../../store/services/api";
import { getQuranAyahAudioUrl } from "../quran/quranTrack";

export interface AyahAudioOptions {
  surahId: number;
  ayahStart: number;
  ayahEnd: number;
  reciterId?: string;
  /** Called when the last ayah of a pass finishes. */
  onPassComplete?: () => void;
  /** Called after each ayah finishes, with its number in the surah. */
  onAyahComplete?: (ayahNumber: number) => void;
  /** Stop after each ayah instead of running straight into the next one. */
  stepMode?: boolean;
}

type Phase = "idle" | "loading" | "playing" | "paused";

interface AudioState {
  ayah: number;
  phase: Phase;
  error: string | null;
}

async function disposeSound(sound: Audio.Sound) {
  try {
    sound.setOnPlaybackStatusUpdate(null);
  } catch {
  }
  try {
    await sound.stopAsync();
  } catch {
  }
  try {
    await sound.unloadAsync();
  } catch {
  }
}

export function useAyahAudio({
  surahId,
  ayahStart,
  ayahEnd,
  reciterId,
  onPassComplete,
  onAyahComplete,
  stepMode = false,
}: AyahAudioOptions) {
  const { data: surahRes } = useGetSurahByIdQuery({ id: surahId });
  const { data: audioRes } = useGetSurahAudioQuery({ id: surahId, reciter: reciterId });

  const soundRef = useRef<Audio.Sound | null>(null);
  // The next ayah, loaded while the current one plays, so moving on does not
  // wait for the network again.
  const preloadRef = useRef<{ ayah: number; sound: Audio.Sound } | null>(null);
  const tokenRef = useRef(0);
  const mountedRef = useRef(true);

  const [state, setState] = useState<AudioState>({
    ayah: ayahStart,
    phase: "idle",
    error: null,
  });
  const [rate, setRate] = useState(1);

  const urls = useMemo(() => {
    const surah = surahRes?.data;
    const audio = audioRes?.data;
    if (!surah || !audio) return null;

    const map = new Map<number, string>();
    for (const ayah of surah.ayahs) {
      if (ayah.number_in_surah < ayahStart || ayah.number_in_surah > ayahEnd) {
        continue;
      }
      const url = getQuranAyahAudioUrl(audio, ayah);
      if (url) map.set(ayah.number_in_surah, url);
    }
    return map;
  }, [surahRes, audioRes, ayahStart, ayahEnd]);

  const ready = !!urls && urls.size > 0;

  const envRef = useRef({
    urls,
    rate,
    ayahStart,
    ayahEnd,
    stepMode,
    onPassComplete,
    onAyahComplete,
    ayah: state.ayah,
    phase: state.phase,
  });
  envRef.current = {
    urls,
    rate,
    ayahStart,
    ayahEnd,
    stepMode,
    onPassComplete,
    onAyahComplete,
    ayah: state.ayah,
    phase: state.phase,
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      tokenRef.current++;
      const sound = soundRef.current;
      const preloaded = preloadRef.current;
      soundRef.current = null;
      preloadRef.current = null;
      if (sound) void disposeSound(sound);
      if (preloaded) void disposeSound(preloaded.sound);
    };
  }, []);

  const preload = useCallback(async (ayahNumber: number) => {
    const { urls, ayahEnd, rate } = envRef.current;
    if (!urls || ayahNumber > ayahEnd) return;
    if (preloadRef.current?.ayah === ayahNumber) return;
    const url = urls.get(ayahNumber);
    if (!url) return;

    const stale = preloadRef.current;
    preloadRef.current = null;
    if (stale) void disposeSound(stale.sound);

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: false, rate, shouldCorrectPitch: true },
      );
      if (!mountedRef.current || preloadRef.current) {
        await disposeSound(sound);
        return;
      }
      preloadRef.current = { ayah: ayahNumber, sound };
    } catch {
      // The ayah will simply load on demand instead.
    }
  }, []);

  /** Take the warmed-up sound if it is the one we want, else load it now. */
  const openSound = useCallback(async (ayahNumber: number, url: string) => {
    const preloaded = preloadRef.current;
    if (preloaded?.ayah === ayahNumber) {
      preloadRef.current = null;
      await preloaded.sound.setStatusAsync({
        positionMillis: 0,
        rate: envRef.current.rate,
        shouldCorrectPitch: true,
        shouldPlay: true,
      });
      return preloaded.sound;
    }
    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true, rate: envRef.current.rate, shouldCorrectPitch: true },
    );
    return sound;
  }, []);

  const playRef = useRef<((ayahNumber: number) => Promise<void>) | null>(null);

  const playAyah = useCallback(
    async (ayahNumber: number) => {
      const url = envRef.current.urls?.get(ayahNumber);
      if (!url) {
        if (envRef.current.urls) {
          setState((s) => ({
            ...s,
            phase: "idle",
            error: "No audio is available for this portion.",
          }));
        }
        return;
      }

      const token = ++tokenRef.current;
      const isCurrent = () => tokenRef.current === token && mountedRef.current;

      setState({ ayah: ayahNumber, phase: "loading", error: null });

      const previous = soundRef.current;
      soundRef.current = null;
      if (previous) await disposeSound(previous);
      if (!isCurrent()) return;

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
        if (!isCurrent()) return;

        const sound = await openSound(ayahNumber, url);

        // A newer tap landed while this was loading. Throw this sound away
        // rather than let it play underneath the newer one.
        if (!isCurrent()) {
          await disposeSound(sound);
          return;
        }

        soundRef.current = sound;
        setState({ ayah: ayahNumber, phase: "playing", error: null });
        void preload(ayahNumber + 1);

        sound.setOnPlaybackStatusUpdate((status) => {
          if (!isCurrent() || !status.isLoaded) return;

          if (!status.didJustFinish) {
            if (status.shouldPlay) {
              setState((s) => (s.phase === "playing" ? s : { ...s, phase: "playing" }));
            } else {
              setState((s) => (s.phase === "playing" ? { ...s, phase: "paused" } : s));
            }
            return;
          }

          envRef.current.onAyahComplete?.(ayahNumber);

          const last = ayahNumber >= envRef.current.ayahEnd;
          if (!last && !envRef.current.stepMode) {
            void playRef.current?.(ayahNumber + 1);
            return;
          }
          setState((s) => ({ ...s, phase: "idle" }));
          if (last) envRef.current.onPassComplete?.();
        });
      } catch {
        if (isCurrent()) {
          setState({
            ayah: ayahNumber,
            phase: "idle",
            error: "This recitation couldn't be loaded. Try another reciter.",
          });
        }
      }
    },
    [openSound, preload],
  );

  playRef.current = playAyah;

  const pause = useCallback(async () => {
    const sound = soundRef.current;
    setState((s) => (s.phase === "playing" ? { ...s, phase: "paused" } : s));
    if (!sound) return;
    try {
      await sound.pauseAsync();
    } catch {
      // Nothing loaded yet.
    }
  }, []);

  const resume = useCallback(async () => {
    const sound = soundRef.current;
    if (!sound) {
      void playAyah(envRef.current.ayah);
      return;
    }
    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        // A sound parked at its end ignores playAsync, so rewind it first.
        if (
          status.durationMillis != null &&
          status.positionMillis >= status.durationMillis - 50
        ) {
          await sound.setPositionAsync(0);
        }
        await sound.playAsync();
        setState((s) => ({ ...s, phase: "playing" }));
        return;
      }
    } catch {
      // Fall through to a reload.
    }
    void playAyah(envRef.current.ayah);
  }, [playAyah]);

  const play = useCallback(() => {
    void resume();
  }, [resume]);

  const toggle = useCallback(() => {
    if (envRef.current.phase === "playing") {
      void pause();
    } else {
      void resume();
    }
  }, [pause, resume]);

  const stop = useCallback(async () => {
    tokenRef.current++; // cancel anything mid-load
    const sound = soundRef.current;
    soundRef.current = null;
    setState((s) => ({ ...s, phase: "idle" }));
    if (sound) await disposeSound(sound);
  }, []);

  const restart = useCallback(() => {
    void playAyah(envRef.current.ayahStart);
  }, [playAyah]);

  const next = useCallback(() => {
    const { ayah, ayahEnd } = envRef.current;
    if (ayah >= ayahEnd) return;
    void playAyah(ayah + 1);
  }, [playAyah]);

  const previous = useCallback(() => {
    const { ayah, ayahStart } = envRef.current;
    if (ayah <= ayahStart) return;
    void playAyah(ayah - 1);
  }, [playAyah]);

  const setPlaybackRate = useCallback((value: number) => {
    setRate(value);
    const sound = soundRef.current;
    if (sound) {
      void sound.setRateAsync(value, true).catch(() => {});
    }
  }, []);

  const cycleRate = useCallback(() => {
    setPlaybackRate(rate === 1 ? 0.75 : rate === 0.75 ? 0.5 : 1);
  }, [rate, setPlaybackRate]);

  const isLoading = state.phase === "loading";
  const isPlaying = state.phase === "playing";

  return {
    ready,
    currentAyah: state.ayah,
    isPlaying,
    isLoading,
    error: state.error,
    /** Loading *or* playing — the state a "continue" button should wait out. */
    isBusy: isLoading || isPlaying,
    canGoNext: state.ayah < ayahEnd,
    canGoPrevious: state.ayah > ayahStart,
    rate,
    play,
    playAyah,
    pause,
    toggle,
    restart,
    next,
    previous,
    stop,
    cycleRate,
    setPlaybackRate,
  };
}

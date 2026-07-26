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
  const tokenRef = useRef(0);
  const mountedRef = useRef(true);

  const [currentAyah, setCurrentAyah] = useState(ayahStart);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const cbRef = useRef({ onPassComplete, onAyahComplete, stepMode, ayahEnd });
  cbRef.current = { onPassComplete, onAyahComplete, stepMode, ayahEnd };

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

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      tokenRef.current++;
      const sound = soundRef.current;
      soundRef.current = null;
      if (sound) void disposeSound(sound);
    };
  }, []);

  const playRef = useRef<((ayahNumber: number) => Promise<void>) | null>(null);

  const playAyah = useCallback(
    async (ayahNumber: number) => {
      const url = urls?.get(ayahNumber);
      if (!url) {
        if (urls) setError("No audio is available for this portion.");
        return;
      }

      const token = ++tokenRef.current;
      const isCurrent = () => tokenRef.current === token && mountedRef.current;

      setIsLoading(true);
      setIsPlaying(false);
      setError(null);
      setCurrentAyah(ayahNumber);

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

        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true, rate, shouldCorrectPitch: true },
        );

        // A newer tap landed while this was loading. Throw this sound away
        // rather than let it play underneath the newer one.
        if (!isCurrent()) {
          await disposeSound(sound);
          return;
        }

        soundRef.current = sound;
        setIsLoading(false);
        setIsPlaying(true);

        sound.setOnPlaybackStatusUpdate((status) => {
          if (!isCurrent()) return;
          if (!status.isLoaded) return;

          if (!status.didJustFinish) {
            setIsPlaying(status.isPlaying);
            return;
          }

          setIsPlaying(false);
          cbRef.current.onAyahComplete?.(ayahNumber);

          if (ayahNumber >= cbRef.current.ayahEnd) {
            cbRef.current.onPassComplete?.();
            return;
          }
          if (!cbRef.current.stepMode) {
            void playRef.current?.(ayahNumber + 1);
          }
        });
      } catch {
        if (isCurrent()) {
          setIsLoading(false);
          setIsPlaying(false);
          setError("This recitation couldn't be loaded. Try another reciter.");
        }
      }
    },
    [urls, rate],
  );

  playRef.current = playAyah;

  const pause = useCallback(async () => {
    const sound = soundRef.current;
    setIsPlaying(false);
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
      void playAyah(currentAyah);
      return;
    }
    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        await sound.playAsync();
        setIsPlaying(true);
        return;
      }
    } catch {
      // Fall through to a reload.
    }
    void playAyah(currentAyah);
  }, [playAyah, currentAyah]);

  const play = useCallback(() => {
    void resume();
  }, [resume]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      void pause();
    } else {
      void resume();
    }
  }, [isPlaying, pause, resume]);

  const stop = useCallback(async () => {
    tokenRef.current++; // cancel anything mid-load
    const sound = soundRef.current;
    soundRef.current = null;
    setIsPlaying(false);
    setIsLoading(false);
    if (sound) await disposeSound(sound);
  }, []);

  const restart = useCallback(() => {
    void playAyah(ayahStart);
  }, [playAyah, ayahStart]);

  const next = useCallback(() => {
    if (currentAyah >= ayahEnd) return;
    void playAyah(currentAyah + 1);
  }, [playAyah, currentAyah, ayahEnd]);

  const previous = useCallback(() => {
    if (currentAyah <= ayahStart) return;
    void playAyah(currentAyah - 1);
  }, [playAyah, currentAyah, ayahStart]);

  const setPlaybackRate = useCallback((next: number) => {
    setRate(next);
    const sound = soundRef.current;
    if (sound) {
      void sound.setRateAsync(next, true).catch(() => {});
    }
  }, []);

  const cycleRate = useCallback(() => {
    setPlaybackRate(rate === 1 ? 0.75 : rate === 0.75 ? 0.5 : 1);
  }, [rate, setPlaybackRate]);

  return {
    ready,
    currentAyah,
    isPlaying,
    isLoading,
    error,
    /** Loading *or* playing — the state a "continue" button should wait out. */
    isBusy: isLoading || isPlaying,
    canGoNext: currentAyah < ayahEnd,
    canGoPrevious: currentAyah > ayahStart,
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

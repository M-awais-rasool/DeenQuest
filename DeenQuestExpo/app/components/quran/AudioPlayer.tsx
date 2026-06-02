import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react-native";
import TrackPlayer, {
  State,
  usePlaybackState,
  type Progress,
} from "react-native-track-player";
import { theme } from "../../theme/themes";
import type {
  QuranAyah,
  QuranSurahAudio,
  QuranSurahDetail,
} from "../../store/services/api";
import { setupQuranPlayer } from "../../services/trackPlayer";
import { haptics } from "../../utils/haptics";
import { buildQuranAyahTracks } from "./quranTrack";

interface Props {
  surah: QuranSurahDetail;
  ayahs: readonly QuranAyah[];
  audio?: QuranSurahAudio | null;
  loadingAudio?: boolean;
  queueId: string;
  progress: Progress;
  isCurrentQueue: boolean;
  activeAyahNumber: number | null;
}

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const getPlaybackStateValue = (state: unknown) => {
  if (state && typeof state === "object" && "state" in state) {
    return (state as { state?: State }).state;
  }
  return state as State | undefined;
};

export const AudioPlayer = ({
  surah,
  ayahs,
  audio,
  loadingAudio,
  queueId,
  progress,
  isCurrentQueue,
  activeAyahNumber,
}: Props) => {
  const [error, setError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [progressTrackWidth, setProgressTrackWidth] = useState(0);
  const playbackState = getPlaybackStateValue(usePlaybackState());
  const isCurrentRef = useRef(false);
  const prevQueueIdRef = useRef(queueId);

  if (prevQueueIdRef.current !== queueId) {
    prevQueueIdRef.current = queueId;
    isCurrentRef.current = false;
  }

  if (isCurrentQueue) {
    isCurrentRef.current = true;
  }

  const stableIsCurrent = isCurrentQueue || isCurrentRef.current;
  const ayahTracks = useMemo(
    () => buildQuranAyahTracks(surah, ayahs, audio),
    [audio, ayahs, surah],
  );

  const isPlaying = stableIsCurrent &&
    (playbackState === State.Playing ||
      playbackState === State.Buffering ||
      playbackState === State.Loading);
  const isBusy = isPreparing;
  const isTransitioning = stableIsCurrent &&
    (playbackState === State.Buffering || playbackState === State.Loading);
  const canPlay = ayahTracks.length > 0 && !loadingAudio;

  const progressFraction =
    stableIsCurrent && progress.duration > 0
      ? Math.min(progress.position / progress.duration, 1)
      : 0;

  const canSeek =
    stableIsCurrent && progress.duration > 0 && progressTrackWidth > 0;

  const activeAyahLabel = activeAyahNumber
    ? `Ayah ${activeAyahNumber}/${surah.number_of_ayahs}`
    : `${ayahTracks.length} ayahs`;

  const playSurah = useCallback(async () => {
    if (ayahTracks.length === 0) return;
    try {
      setError(null);
      setIsPreparing(true);
      await setupQuranPlayer();
      if (!stableIsCurrent || playbackState === State.Ended) {
        await TrackPlayer.reset();
        await TrackPlayer.add(ayahTracks);
      }
      await TrackPlayer.play();
    } catch {
      setError("Audio could not start.");
    } finally {
      setIsPreparing(false);
    }
  }, [ayahTracks, stableIsCurrent, playbackState]);

  const handleProgressLayout = useCallback((event: LayoutChangeEvent) => {
    setProgressTrackWidth(event.nativeEvent.layout.width);
  }, []);

  const handleSeek = useCallback(
    async (event: GestureResponderEvent) => {
      if (!canSeek) return;

      const ratio = Math.min(
        Math.max(event.nativeEvent.locationX / progressTrackWidth, 0),
        1,
      );
      const nextPosition = ratio * progress.duration;

      try {
        setError(null);
        await TrackPlayer.seekTo(nextPosition);
      } catch {
        setError("Audio could not seek.");
      }
    },
    [canSeek, progress.duration, progressTrackWidth],
  );

  const handleSkipPrevious = useCallback(async () => {
    if (!stableIsCurrent) return;

    haptics.light();
    try {
      setError(null);
      if (progress.position > 2) {
        await TrackPlayer.seekTo(0);
        return;
      }
      await TrackPlayer.skipToPrevious(0);
    } catch {
      await TrackPlayer.seekTo(0);
    }
  }, [stableIsCurrent, progress.position]);

  const handleSkipNext = useCallback(async () => {
    if (!stableIsCurrent) return;

    haptics.light();
    try {
      setError(null);
      await TrackPlayer.skipToNext(0);
    } catch {
      await TrackPlayer.seekTo(0);
    }
  }, [stableIsCurrent]);

  const handlePlayPause = useCallback(async () => {
    haptics.light();
    if (isPlaying) {
      await TrackPlayer.pause();
      return;
    }
    await playSurah();
  }, [isPlaying, playSurah]);

  if (!audio?.url && !loadingAudio) return null;

  return (
    <View style={s.container}>
      <Pressable
        style={s.progressTrack}
        onLayout={handleProgressLayout}
        onPress={handleSeek}
        disabled={!canSeek}
        hitSlop={{ top: 10, bottom: 10 }}
      >
        <View
          style={[
            s.progressFill,
            { width: `${progressFraction * 100}%` as unknown as number },
          ]}
        />
      </Pressable>
      <View style={s.content}>
        <View style={s.info}>
          <Text style={s.timeText}>
            {stableIsCurrent ? formatTime(progress.position) : "0:00"}
          </Text>
          <View style={s.meta}>
            <Text style={s.surahName} numberOfLines={1}>
              {surah.english_name}
            </Text>
            <Text style={s.reciterName} numberOfLines={1}>
              {activeAyahLabel} · {audio?.reciter ?? "ar.alafasy"}
            </Text>
          </View>
          <Text style={s.timeText}>
            {stableIsCurrent ? formatTime(progress.duration) : "0:00"}
          </Text>
        </View>
        <View style={s.controls}>
          {isPreparing ? (
            <View style={s.playBtn}>
              <ActivityIndicator color="#fff" size="small" />
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  s.skipBtn,
                  !stableIsCurrent && s.skipBtnDisabled,
                ]}
                onPress={handleSkipPrevious}
                disabled={!stableIsCurrent}
                activeOpacity={0.8}
              >
                <SkipBack size={18} color={theme.colors.text} fill={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.playBtn, !canPlay && s.playBtnDisabled]}
                onPress={handlePlayPause}
                disabled={!canPlay || isBusy || isTransitioning}
                activeOpacity={0.8}
              >
                {isPlaying ? (
                  <Pause size={20} color="#fff" fill="#fff" />
                ) : (
                  <Play size={20} color="#fff" fill="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  s.skipBtn,
                  !stableIsCurrent && s.skipBtnDisabled,
                ]}
                onPress={handleSkipNext}
                disabled={!stableIsCurrent}
                activeOpacity={0.8}
              >
                <SkipForward size={18} color={theme.colors.text} fill={theme.colors.text} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 16,
  },
  progressTrack: {
    height: 3,
    backgroundColor: theme.colors.outline10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  info: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  meta: {
    flex: 1,
  },
  surahName: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  reciterName: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  timeText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  controls: {
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  playBtnDisabled: {
    opacity: 0.5,
  },
  skipBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.outline25,
  },
  skipBtnDisabled: {
    opacity: 0.35,
  },
  errorText: {
    color: theme.colors.error,
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 16,
  },
});

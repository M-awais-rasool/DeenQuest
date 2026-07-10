import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AnimatedPressable, TactilePressable } from "../ui";
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

    try {
      setError(null);
      await TrackPlayer.skipToNext(0);
    } catch {
      await TrackPlayer.seekTo(0);
    }
  }, [stableIsCurrent]);

  const handlePlayPause = useCallback(async () => {
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
              <ActivityIndicator color="#0E2A3A" size="small" />
            </View>
          ) : (
            <>
              <AnimatedPressable
                style={[
                  s.skipBtn,
                  !stableIsCurrent && s.skipBtnDisabled,
                ]}
                onPress={handleSkipPrevious}
                disabled={!stableIsCurrent}
                activeOpacity={0.8}
              >
                <SkipBack size={18} color={theme.colors.text} fill={theme.colors.text} />
              </AnimatedPressable>
              <TactilePressable
                edgeColor="#3E8AB3"
                depth={3}
                radius={23}
                haptic="light"
                dimWhenDisabled={false}
                faceStyle={[s.playBtn, !canPlay && s.playBtnDisabled]}
                onPress={handlePlayPause}
                disabled={!canPlay || isBusy || isTransitioning}
              >
                {isPlaying ? (
                  <Pause size={20} color="#0E2A3A" fill="#0E2A3A" />
                ) : (
                  <Play size={20} color="#0E2A3A" fill="#0E2A3A" />
                )}
              </TactilePressable>
              <AnimatedPressable
                style={[
                  s.skipBtn,
                  !stableIsCurrent && s.skipBtnDisabled,
                ]}
                onPress={handleSkipNext}
                disabled={!stableIsCurrent}
                activeOpacity={0.8}
              >
                <SkipForward size={18} color={theme.colors.text} fill={theme.colors.text} />
              </AnimatedPressable>
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
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#24505F",
    backgroundColor: "rgba(16,29,32,0.97)",
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 34,
    elevation: 16,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.background,
    overflow: "hidden",
    marginHorizontal: 18,
    marginTop: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6EC1E8",
    borderRadius: 4,
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
    fontSize: 12.5,
    fontFamily: "Nunito_800ExtraBold",
    letterSpacing: 0.2,
  },
  reciterName: {
    color: "#5F7E7C",
    fontSize: 11.5,
    fontFamily: "Nunito_700Bold",
    marginTop: 1,
  },
  timeText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontFamily: "Nunito_600SemiBold",
    fontVariant: ["tabular-nums"],
  },
  controls: {
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  playBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#6EC1E8",
    alignItems: "center",
    justifyContent: "center",
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
    fontFamily: "Nunito_600SemiBold",
    textAlign: "center",
    paddingHorizontal: 16,
  },
});

import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Pause, Play } from "lucide-react-native";
import TrackPlayer, {
  State,
  useActiveTrack,
  usePlaybackState,
  useProgress,
} from "react-native-track-player";
import { theme } from "../../theme/themes";
import type {
  QuranSurahAudio,
  QuranSurahDetail,
} from "../../store/services/api";
import { setupQuranPlayer } from "../../services/trackPlayer";
import { haptics } from "../../utils/haptics";

interface Props {
  surah: QuranSurahDetail;
  audio?: QuranSurahAudio | null;
  loadingAudio?: boolean;
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

export const AudioPlayer = ({ surah, audio, loadingAudio }: Props) => {
  const [error, setError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const playbackState = getPlaybackStateValue(usePlaybackState());
  const activeTrack = useActiveTrack();
  const progress = useProgress(1000);

  const trackId = useMemo(() => `quran-surah-${surah.id}`, [surah.id]);
  const isCurrentTrack = activeTrack?.id === trackId;
  const isPlaying = isCurrentTrack && playbackState === State.Playing;
  const isBusy =
    isPreparing ||
    (isCurrentTrack &&
      (playbackState === State.Buffering || playbackState === State.Loading));
  const canPlay = Boolean(audio?.url) && !loadingAudio;

  const progressFraction =
    isCurrentTrack && progress.duration > 0
      ? Math.min(progress.position / progress.duration, 1)
      : 0;

  const playSurah = useCallback(async () => {
    if (!audio?.url) return;
    try {
      setError(null);
      setIsPreparing(true);
      await setupQuranPlayer();
      if (!isCurrentTrack) {
        await TrackPlayer.reset();
        await TrackPlayer.add({
          id: trackId,
          url: audio.url,
          title: `Surah ${surah.english_name}`,
          artist: audio.reciter,
          album: "Quran",
          description: surah.english_name_translation,
        });
      }
      await TrackPlayer.play();
    } catch {
      setError("Audio could not start.");
    } finally {
      setIsPreparing(false);
    }
  }, [audio, isCurrentTrack, surah, trackId]);

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
      <View style={s.progressTrack}>
        <View
          style={[
            s.progressFill,
            { width: `${progressFraction * 100}%` as unknown as number },
          ]}
        />
      </View>
      <View style={s.content}>
        <View style={s.info}>
          <Text style={s.timeText}>
            {isCurrentTrack ? formatTime(progress.position) : "0:00"}
          </Text>
          <View style={s.meta}>
            <Text style={s.surahName} numberOfLines={1}>
              {surah.english_name}
            </Text>
            <Text style={s.reciterName} numberOfLines={1}>
              {audio?.reciter ?? "Mishary Alafasy"}
            </Text>
          </View>
          <Text style={s.timeText}>
            {isCurrentTrack ? formatTime(progress.duration) : "0:00"}
          </Text>
        </View>
        <View style={s.controls}>
          {isBusy || loadingAudio ? (
            <View style={s.playBtn}>
              <ActivityIndicator color="#fff" size="small" />
            </View>
          ) : (
            <TouchableOpacity
              style={[s.playBtn, !canPlay && s.playBtnDisabled]}
              onPress={handlePlayPause}
              disabled={!canPlay || isBusy}
              activeOpacity={0.8}
            >
              {isPlaying ? (
                <Pause size={20} color="#fff" fill="#fff" />
              ) : (
                <Play size={20} color="#fff" fill="#fff" />
              )}
            </TouchableOpacity>
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
  errorText: {
    color: theme.colors.error,
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 16,
  },
});

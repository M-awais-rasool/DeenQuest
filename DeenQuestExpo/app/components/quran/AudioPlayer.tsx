import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Pause, Play, Square, Headphones } from "lucide-react-native";
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
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }
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
  const progressWidth =
    isCurrentTrack && progress.duration > 0
      ? `${Math.min((progress.position / progress.duration) * 100, 100)}%`
      : "0%";

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

  const handleStop = useCallback(async () => {
    haptics.light();
    await TrackPlayer.stop();
  }, []);

  return (
    <View style={s.container}>
      <View style={s.topRow}>
        <View style={s.reciterInfo}>
          <Headphones size={16} color={theme.colors.textMuted} />
          <Text style={s.reciterName} numberOfLines={1}>
            {audio?.reciter ?? "Mishary Alafasy"}
          </Text>
        </View>
        <View style={s.controls}>
          <TouchableOpacity
            style={[s.controlBtn, !canPlay && s.controlBtnDisabled]}
            onPress={handlePlayPause}
            disabled={!canPlay || isBusy}
            activeOpacity={0.8}
          >
            {isBusy || loadingAudio ? (
              <ActivityIndicator color={theme.colors.text} size="small" />
            ) : isPlaying ? (
              <Pause size={18} color={theme.colors.text} fill={theme.colors.text} />
            ) : (
              <Play size={18} color={theme.colors.text} fill={theme.colors.text} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.controlBtn, !isCurrentTrack && s.controlBtnDisabled]}
            onPress={handleStop}
            disabled={!isCurrentTrack}
            activeOpacity={0.8}
          >
            <Square size={16} color={theme.colors.textMuted} fill={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: progressWidth }]} />
      </View>
      <View style={s.timeRow}>
        <Text style={s.timeText}>
          {isCurrentTrack ? formatTime(progress.position) : "0:00"}
        </Text>
        <Text style={s.timeText}>
          {isCurrentTrack ? formatTime(progress.duration) : "0:00"}
        </Text>
      </View>

      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reciterInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reciterName: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  controlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  controlBtnDisabled: {
    opacity: 0.4,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.surfaceHigh,
    overflow: "hidden",
    marginTop: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.textMuted,
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  timeText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: "600",
  },
  errorText: {
    color: theme.colors.error,
    marginTop: 8,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
});

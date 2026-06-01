import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Pause,
  Play,
  Square,
  Headphones,
} from "lucide-react-native";
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
      <View style={s.metaRow}>
        <View style={s.iconBox}>
          <Headphones size={22} color={theme.colors.secondary} />
        </View>
        <View style={s.metaText}>
          <Text style={s.title}>Surah Audio</Text>
          <Text style={s.subtitle} numberOfLines={1}>
            {audio?.reciter ?? "Mishary Alafasy"}
            {audio?.bitrate ? ` • ${audio.bitrate} kbps` : ""}
          </Text>
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

      <View style={s.controls}>
        <TouchableOpacity
          style={[s.controlButton, !canPlay && s.controlButtonDisabled]}
          onPress={handlePlayPause}
          disabled={!canPlay || isBusy}
          activeOpacity={0.8}
        >
          {isBusy || loadingAudio ? (
            <ActivityIndicator color={theme.colors.onPrimary} />
          ) : isPlaying ? (
            <Pause size={22} color={theme.colors.onPrimary} fill={theme.colors.onPrimary} />
          ) : (
            <Play size={22} color={theme.colors.onPrimary} fill={theme.colors.onPrimary} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.stopButton, !isCurrentTrack && s.controlButtonDisabled]}
          onPress={handleStop}
          disabled={!isCurrentTrack}
          activeOpacity={0.8}
        >
          <Square size={18} color={theme.colors.text} fill={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline25,
    marginTop: 16,
    marginBottom: 18,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.secondary12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.secondary25,
  },
  metaText: {
    flex: 1,
  },
  title: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.surfaceHigh,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.secondary,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  timeText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
  },
  controlButton: {
    width: 52,
    height: 44,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.primaryContainer,
  },
  stopButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.outline25,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    color: theme.colors.error,
    marginTop: 10,
    fontSize: 12,
    fontWeight: "700",
  },
});

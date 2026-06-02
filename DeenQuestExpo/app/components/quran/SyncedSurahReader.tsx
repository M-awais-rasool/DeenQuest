import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useAyahSync } from "../../hooks/useAyahSync";
import type {
  QuranAyah,
  QuranSurahAudio,
  QuranSurahDetail,
} from "../../store/services/api";
import { AudioPlayer } from "./AudioPlayer";
import { QURAN_PLAYER_HEIGHT } from "./constants";
import { getQuranQueueId } from "./quranTrack";
import { SurahAyahList } from "./SurahAyahList";

interface Props {
  surah: QuranSurahDetail;
  ayahs: readonly QuranAyah[];
  syncAyahs: readonly QuranAyah[];
  audio?: QuranSurahAudio | null;
  loadingAudio?: boolean;
  showBasmalah: boolean;
  showTranslation: boolean;
  fontFamily?: string;
  revelationLabel: string;
}

export const SyncedSurahReader = memo(function SyncedSurahReader({
  surah,
  ayahs,
  syncAyahs,
  audio,
  loadingAudio,
  showBasmalah,
  showTranslation,
  fontFamily,
  revelationLabel,
}: Props) {
  const queueId = useMemo(() => getQuranQueueId(surah.id), [surah.id]);
  const ayahSync = useAyahSync({
    ayahs: syncAyahs,
    surahId: surah.id,
    queueId,
    debug: __DEV__,
  });

  return (
    <>
      <SurahAyahList
        surah={surah}
        ayahs={ayahs}
        showBasmalah={showBasmalah}
        showTranslation={showTranslation}
        fontFamily={fontFamily}
        highlightedAyahNumber={ayahSync.highlightedAyahNumber}
        bottomInset={QURAN_PLAYER_HEIGHT + 8}
        revelationLabel={revelationLabel}
      />

      <View style={s.bottomPlayer}>
        <AudioPlayer
          surah={surah}
          ayahs={syncAyahs}
          audio={audio}
          loadingAudio={loadingAudio}
          queueId={queueId}
          progress={ayahSync.progress}
          isCurrentQueue={ayahSync.isCurrentQueue}
          activeAyahNumber={ayahSync.highlightedAyahNumber}
        />
      </View>
    </>
  );
});

const s = StyleSheet.create({
  bottomPlayer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});

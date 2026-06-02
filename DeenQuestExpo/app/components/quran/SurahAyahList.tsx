import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import type {
  QuranAyah,
  QuranSurahDetail,
} from "../../store/services/api";
import { theme } from "../../theme/themes";
import { AyahRow } from "./AyahRow";
import { BASMALAH } from "./constants";

interface Props {
  surah: QuranSurahDetail;
  ayahs: readonly QuranAyah[];
  showBasmalah: boolean;
  showTranslation: boolean;
  fontFamily?: string;
  highlightedAyahNumber: number | null;
  bottomInset: number;
  revelationLabel: string;
}

export const SurahAyahList = memo(
  function SurahAyahList({
    surah,
    ayahs,
    showBasmalah,
    showTranslation,
    fontFamily,
    highlightedAyahNumber,
    bottomInset,
    revelationLabel,
  }: Props) {
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
      if (highlightedAyahNumber == null) return;

      const index = ayahs.findIndex(
        (a) => a.number_in_surah === highlightedAyahNumber,
      );
      if (index < 0) return;

      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.35,
      });
    }, [ayahs, highlightedAyahNumber]);

    const fontStyle = useMemo(
      () => (fontFamily ? { fontFamily } : undefined),
      [fontFamily],
    );

    const renderAyah = useCallback(
      ({ item }: { item: QuranAyah }) => (
        <AyahRow
          ayah={item}
          fontFamily={fontFamily}
          showTranslation={showTranslation}
          isHighlighted={item.number_in_surah === highlightedAyahNumber}
        />
      ),
      [fontFamily, highlightedAyahNumber, showTranslation],
    );

    const header = useMemo(
      () => (
        <View>
          <View style={s.surahHeader}>
            <Text style={[s.surahNameArabic, fontStyle]}>{surah.name}</Text>
            <Text style={s.surahNameEnglish}>{surah.english_name}</Text>
            <Text style={s.surahMeta}>
              {revelationLabel} · {surah.number_of_ayahs} verses
            </Text>
          </View>

          {showBasmalah ? (
            <View style={s.bismillahContainer}>
              <Text style={[s.bismillahText, fontStyle]}>{BASMALAH}</Text>
            </View>
          ) : null}
        </View>
      ),
      [
        fontStyle,
        revelationLabel,
        showBasmalah,
        surah.english_name,
        surah.name,
        surah.number_of_ayahs,
      ],
    );

    return (
      <FlatList
        ref={flatListRef}
        data={ayahs}
        keyExtractor={(item) => String(item.number)}
        renderItem={renderAyah}
        extraData={highlightedAyahNumber}
        style={s.list}
        contentContainerStyle={[
          s.listContent,
          { paddingBottom: bottomInset },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={9}
        removeClippedSubviews
      />
    );
  },
  (previous, next) =>
    previous.surah.id === next.surah.id &&
    previous.ayahs === next.ayahs &&
    previous.showBasmalah === next.showBasmalah &&
    previous.showTranslation === next.showTranslation &&
    previous.fontFamily === next.fontFamily &&
    previous.highlightedAyahNumber === next.highlightedAyahNumber &&
    previous.bottomInset === next.bottomInset &&
    previous.revelationLabel === next.revelationLabel,
);

const s = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  surahHeader: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline25,
  },
  surahNameArabic: {
    fontSize: 32,
    lineHeight: 56,
    color: theme.colors.text,
    writingDirection: "rtl",
    textAlign: "center",
    marginBottom: 8,
  },
  surahNameEnglish: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.white,
    letterSpacing: 0.3,
  },
  surahMeta: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textMuted,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  bismillahContainer: {
    alignItems: "center",
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline10,
  },
  bismillahText: {
    fontSize: 32,
    lineHeight: 60,
    writingDirection: "rtl",
    textAlign: "center",
    color: theme.colors.text,
  },
});

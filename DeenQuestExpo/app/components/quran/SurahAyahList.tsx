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
      () =>
        showBasmalah ? (
          <View style={s.bismillahContainer}>
            <View style={s.bismillahLine} />
            <Text style={[s.bismillahText, fontStyle]}>{BASMALAH}</Text>
            <View style={s.bismillahLine} />
          </View>
        ) : (
          <View style={s.headerSpacer} />
        ),
      [fontStyle, showBasmalah],
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
  headerSpacer: {
    height: 14,
  },
  bismillahContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 22,
    paddingHorizontal: 6,
  },
  bismillahLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.outline,
  },
  bismillahText: {
    fontSize: 26,
    lineHeight: 52,
    writingDirection: "rtl",
    textAlign: "center",
    color: theme.colors.secondary,
  },
});

import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { QuranAyah } from "../../store/services/api";
import { theme } from "../../theme/themes";
import { toArabicNumber } from "../../utils/arabicNumbers";

interface Props {
  ayah: QuranAyah;
  fontFamily?: string;
  showTranslation: boolean;
  isHighlighted: boolean;
}

export const AyahRow = memo(
  function AyahRow({
    ayah,
    fontFamily,
    showTranslation,
    isHighlighted,
  }: Props) {
    const fontStyle = useMemo(
      () => (fontFamily ? { fontFamily } : undefined),
      [fontFamily],
    );

    return (
      <View style={[s.container, isHighlighted && s.containerHighlighted]}>
        <View style={s.row}>
          <Text
            style={[
              s.ayahText,
              fontStyle,
              isHighlighted && s.ayahTextHighlighted,
            ]}
          >
            {ayah.text}
          </Text>
          <View style={[s.numBadge, isHighlighted && s.numBadgeHighlighted]}>
            <Text
              style={[s.numText, isHighlighted && s.numTextHighlighted]}
            >
              {toArabicNumber(ayah.number_in_surah)}
            </Text>
          </View>
        </View>

        {showTranslation && ayah.translation ? (
          <Text
            style={[
              s.translationText,
              isHighlighted && s.translationTextHighlighted,
            ]}
          >
            {ayah.translation}
          </Text>
        ) : null}

        {isHighlighted && (
          <View style={s.nowPlayingRow}>
            <View style={s.nowPlayingDot} />
            <Text style={s.nowPlayingText}>NOW PLAYING</Text>
          </View>
        )}
      </View>
    );
  },
  (previous, next) =>
    previous.ayah.number === next.ayah.number &&
    previous.ayah.text === next.ayah.text &&
    previous.ayah.translation === next.ayah.translation &&
    previous.fontFamily === next.fontFamily &&
    previous.showTranslation === next.showTranslation &&
    previous.isHighlighted === next.isHighlighted,
);

const s = StyleSheet.create({
  container: {
    paddingVertical: 18,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
    borderRadius: 0,
  },
  containerHighlighted: {
    paddingHorizontal: 8,
    marginVertical: 10,
    backgroundColor: "rgba(18, 48, 58, 0.4)",
    borderWidth: 1,
    borderColor: "#24505F",
    borderBottomColor: "#24505F",
    borderRadius: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  numBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#12303A",
    borderWidth: 1,
    borderColor: "#24505F",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    transform: [{ rotate: "45deg" }],
  },
  numBadgeHighlighted: {
    backgroundColor: "#6EC1E8",
    borderColor: "#6EC1E8",
  },
  numText: {
    fontSize: 11,
    fontFamily: "Nunito_800ExtraBold",
    color: "#6EC1E8",
    transform: [{ rotate: "-45deg" }],
  },
  numTextHighlighted: {
    color: "#0E2A3A",
  },
  ayahText: {
    flex: 1,
    fontSize: 27,
    lineHeight: 54,
    writingDirection: "rtl",
    textAlign: "right",
    color: theme.colors.text,
  },
  ayahTextHighlighted: {
    color: "#D9F0FC",
  },
  translationText: {
    color: theme.colors.textMuted,
    fontSize: 13.5,
    lineHeight: 22,
    fontFamily: "Nunito_600SemiBold",
    marginTop: 8,
    paddingRight: 44,
  },
  translationTextHighlighted: {
    color: "#9AD5F2",
  },
  nowPlayingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 10,
  },
  nowPlayingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6EC1E8",
  },
  nowPlayingText: {
    fontSize: 10.5,
    fontFamily: "Nunito_800ExtraBold",
    color: "#6EC1E8",
    letterSpacing: 1,
  },
});

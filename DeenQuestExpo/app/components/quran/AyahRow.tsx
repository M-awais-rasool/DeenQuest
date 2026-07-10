import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { QuranAyah } from "../../store/services/api";
import { theme } from "../../theme/themes";
import { toArabicNumber } from "../../utils/arabicNumbers";
import { AYAH_MARKER_PREFIX } from "./constants";

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
        <View style={s.ayahBlock}>
          <Text style={[s.ayahText, isHighlighted && s.ayahTextHighlighted]}>
            <Text style={[s.ayahTextContent, fontStyle]}>{ayah.text}</Text>
            <Text
              style={[
                s.ayahMarker,
                isHighlighted && s.ayahMarkerHighlighted,
              ]}
            >
              {" "}
              {AYAH_MARKER_PREFIX}
              {toArabicNumber(ayah.number_in_surah)}
            </Text>
          </Text>
        </View>
        {showTranslation && ayah.translation ? (
          <View style={s.translationBlock}>
            <Text
              style={[
                s.translationText,
                isHighlighted && s.translationTextHighlighted,
              ]}
            >
              {ayah.translation}
            </Text>
          </View>
        ) : null}
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
    marginBottom: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "transparent",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  containerHighlighted: {
    borderColor: "#24505F",
    backgroundColor: "rgba(18, 48, 58, 0.4)",
  },
  ayahBlock: {
    marginBottom: 4,
  },
  ayahText: {
    fontSize: 38,
    lineHeight: 82,
    writingDirection: "rtl",
    textAlign: "center",
    color: theme.colors.text,
  },
  ayahTextHighlighted: {
    color: "#D9F0FC",
  },
  ayahTextContent: {
    fontSize: 38,
    lineHeight: 82,
  },
  ayahMarker: {
    fontSize: 28,
    lineHeight: 82,
    color: theme.colors.textMuted,
  },
  ayahMarkerHighlighted: {
    color: "#6EC1E8",
  },
  translationBlock: {
    marginBottom: 18,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline10,
  },
  translationText: {
    color: theme.colors.textMuted,
    fontSize: 13.5,
    lineHeight: 22,
    fontFamily: "Nunito_600SemiBold",
    textAlign: "center",
  },
  translationTextHighlighted: {
    color: "#9AD5F2",
  },
});

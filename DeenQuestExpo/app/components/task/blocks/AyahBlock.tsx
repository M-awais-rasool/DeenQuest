import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { BlockComponentProps } from "./types";
import { theme } from "../../../theme/themes";

export const AyahBlock = ({ content }: BlockComponentProps) => {
  const surah = (content.surah as string) ?? "";
  const ayahs = (content.ayahs as number[]) ?? [];

  return (
    <View style={s.card}>
      <Text style={s.surah}>{surah}</Text>
      <Text style={s.ayahs}>Ayahs: {ayahs.join(", ")}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceLow,
    padding: 24,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    marginBottom: 12,
  },
  surah: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 4,
  },
  ayahs: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: "600",
  },
});

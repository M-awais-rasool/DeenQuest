import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { BlockComponentProps } from "./types";
import { theme } from "../../../theme/themes";

export const AudioBlock = ({ content }: BlockComponentProps) => {
  const surah = (content.surah as string) ?? "";
  const duration = (content.duration as number) ?? 300;

  return (
    <View style={s.card}>
      <Text style={s.label}>🔊</Text>
      <Text style={s.surah}>{surah}</Text>
      <Text style={s.duration}>{Math.floor(duration / 60)} min listening</Text>
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceLow,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    gap: 4,
  },
  label: { fontSize: 32, marginBottom: 4 },
  surah: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.text,
  },
  duration: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: "600",
  },
});

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { BlockComponentProps } from "./types";
import { theme } from "../../../theme/themes";

export const HadithBlock = ({ content }: BlockComponentProps) => {
  const text = (content.text as string) ?? "";
  const reference = (content.reference as string) ?? "";

  return (
    <View style={s.card}>
      <Text style={s.quote}>"{text}"</Text>
      <Text style={s.ref}>— {reference}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceLow,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.secondary20,
    marginBottom: 12,
  },
  quote: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    fontStyle: "italic",
    lineHeight: 28,
    marginBottom: 12,
  },
  ref: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: "600",
  },
});

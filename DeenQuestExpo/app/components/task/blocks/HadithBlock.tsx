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
    backgroundColor: theme.colors.surface,
    padding: 22,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    marginBottom: 12,
    alignItems: "center",
  },
  quote: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: theme.colors.text,
    lineHeight: 26,
    marginBottom: 12,
    textAlign: "center",
  },
  ref: {
    fontSize: 11.5,
    color: theme.colors.secondary,
    fontFamily: "Nunito_800ExtraBold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});

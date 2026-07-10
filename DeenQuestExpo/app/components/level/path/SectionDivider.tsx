import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../../theme/themes";
import { hexToRgba } from "../map";
import type { PathSection } from "./types";

interface SectionDividerProps {
  section: PathSection;
}

export const SectionDivider = memo(function SectionDivider({
  section,
}: SectionDividerProps) {
  const { status, number, colors } = section;
  const isLocked = status === "locked";
  const isComplete = status === "completed";

  const lineColor = isLocked
    ? theme.colors.outline
    : hexToRgba(colors.accent, 0.4);
  const textColor = isLocked ? theme.colors.textMuted : colors.accent;

  const label = isComplete
    ? `SECTION ${number} COMPLETE`
    : `END OF SECTION ${number}`;

  return (
    <View style={s.wrap}>
      <View style={[s.line, { backgroundColor: lineColor }]} />
      <Text style={[s.text, { color: textColor }]}>{label}</Text>
      <View style={[s.line, { backgroundColor: lineColor }]} />
    </View>
  );
});

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 26,
    paddingTop: 24,
    paddingBottom: 6,
  },
  line: {
    flex: 1,
    height: 1.5,
    borderRadius: 1,
  },
  text: {
    fontSize: 11,
    fontFamily: "Nunito_900Black",
    letterSpacing: 1.5,
  },
});

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Lightbulb, ChevronRight } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";

export function TipsComponent({ lesson, onComplete }: LessonComponentProps) {
  const data = lesson.data as Record<string, any>;
  const tips: string[] = data.tips ?? [];

  return (
    <View>
      {tips.map((tip, idx) => (
        <View key={idx} style={s.tipCard}>
          <Lightbulb size={16} color={theme.colors.secondary} />
          <Text style={s.tipText}>{tip}</Text>
        </View>
      ))}

      <TouchableOpacity style={s.continueBtn} onPress={onComplete}>
        <Text style={s.continueBtnText}>CONTINUE</Text>
        <ChevronRight size={18} color={theme.colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  tipText: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 22,
    flex: 1,
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 24,
    gap: 6,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.primaryContainer,
  },
  continueBtnText: {
    color: theme.colors.onPrimary,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },
});

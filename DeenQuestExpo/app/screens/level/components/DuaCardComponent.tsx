import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";

export function DuaCardComponent({ lesson, onComplete }: LessonComponentProps) {
  const data = lesson.data as Record<string, any>;

  return (
    <View>
      <View style={s.card}>
        <Text style={s.arabic}>{data.arabic}</Text>
        <View style={s.divider} />
        <Text style={s.transliteration}>{data.transliteration}</Text>
        <Text style={s.meaning}>{data.meaning}</Text>
        {data.context && (
          <View style={s.contextBox}>
            <Text style={s.contextText}>{data.context}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={s.continueBtn} onPress={onComplete}>
        <Text style={s.continueBtnText}>I'VE LEARNED THIS</Text>
        <ChevronRight size={18} color={theme.colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,219,60,0.2)",
  },
  arabic: {
    fontSize: 32,
    color: theme.colors.secondary,
    textAlign: "center",
    lineHeight: 48,
    marginBottom: 16,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: theme.colors.outline,
    marginBottom: 16,
  },
  transliteration: {
    fontSize: 16,
    color: theme.colors.text,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 8,
  },
  meaning: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  contextBox: {
    marginTop: 16,
    backgroundColor: "rgba(255,219,60,0.08)",
    borderRadius: 10,
    padding: 12,
    width: "100%",
  },
  contextText: {
    fontSize: 13,
    color: theme.colors.secondary,
    textAlign: "center",
    fontWeight: "600",
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

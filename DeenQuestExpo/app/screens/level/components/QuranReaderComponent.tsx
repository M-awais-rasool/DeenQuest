import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { BookOpen, ChevronRight } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";

export function QuranReaderComponent({
  lesson,
  onComplete,
}: LessonComponentProps) {
  const data = lesson.data as Record<string, any>;

  return (
    <View>
      <View style={s.surahBadge}>
        <BookOpen size={14} color={theme.colors.primary} />
        <Text style={s.surahName}>{data.surah}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.arabic}>{data.text}</Text>
        <View style={s.divider} />
        {data.transliteration && (
          <Text style={s.transliteration}>{data.transliteration}</Text>
        )}
        {data.meaning && <Text style={s.meaning}>{data.meaning}</Text>}
      </View>

      <TouchableOpacity style={s.continueBtn} onPress={onComplete}>
        <Text style={s.continueBtnText}>CONTINUE</Text>
        <ChevronRight size={18} color={theme.colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  surahBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    backgroundColor: "rgba(136,217,130,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 16,
  },
  surahName: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: "800",
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  arabic: {
    fontSize: 28,
    color: theme.colors.text,
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
    fontSize: 15,
    color: theme.colors.primary,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 22,
  },
  meaning: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
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

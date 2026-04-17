import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";

export function HadithComponent({ lesson, onComplete }: LessonComponentProps) {
  const data = lesson.data as Record<string, any>;

  return (
    <View>
      <View style={s.card}>
        <Text style={s.quoteOpen}>"</Text>
        <Text style={s.hadithText}>{data.hadith}</Text>
        <Text style={s.quoteClose}>"</Text>
        <Text style={s.reference}>— {data.reference}</Text>
      </View>

      <TouchableOpacity style={s.continueBtn} onPress={onComplete}>
        <Text style={s.continueBtnText}>CONTINUE</Text>
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
    borderColor: theme.colors.outline,
  },
  quoteOpen: {
    fontSize: 48,
    color: theme.colors.primary,
    fontWeight: "700",
    lineHeight: 48,
    marginBottom: -8,
  },
  hadithText: {
    fontSize: 18,
    color: theme.colors.text,
    textAlign: "center",
    lineHeight: 28,
    fontStyle: "italic",
  },
  quoteClose: {
    fontSize: 48,
    color: theme.colors.primary,
    fontWeight: "700",
    lineHeight: 48,
    marginTop: -4,
    alignSelf: "flex-end",
  },
  reference: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 12,
    fontWeight: "700",
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

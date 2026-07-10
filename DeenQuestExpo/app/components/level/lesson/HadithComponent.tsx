import React from "react";
import { Text, StyleSheet } from "react-native";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";
import { FadeInView, ContinueButton } from "./shared";

export function HadithComponent({ lesson, onComplete }: LessonComponentProps) {
  const data = lesson.data as Record<string, any>;

  return (
    <FadeInView>
      <FadeInView style={s.card} delay={60}>
        <Text style={s.quoteOpen}>"</Text>
        <Text style={s.hadithText}>{data.hadith}</Text>
        <Text style={s.quoteClose}>"</Text>
        <Text style={s.reference}>— {data.reference}</Text>
      </FadeInView>

      <ContinueButton onPress={onComplete} style={{ marginTop: 24 }} />
    </FadeInView>
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
    fontFamily: "Nunito_700Bold",
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
    fontFamily: "Nunito_700Bold",
    lineHeight: 48,
    marginTop: -4,
    alignSelf: "flex-end",
  },
  reference: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 12,
    fontFamily: "Nunito_700Bold",
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
    fontFamily: "Nunito_900Black",
    fontSize: 16,
    letterSpacing: 1,
  },
});

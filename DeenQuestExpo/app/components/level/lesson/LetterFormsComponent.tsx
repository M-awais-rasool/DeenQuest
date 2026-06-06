import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";
import { useQuranFont } from "../../../hooks/useQuranFont";
import { FadeInView, ContinueButton } from "./shared";

export function LetterFormsComponent({
  lesson,
  onComplete,
}: LessonComponentProps) {
  const { fontFamily } = useQuranFont();
  const data = lesson.data as Record<string, any>;
  const letter: string = data.letter ?? "";
  const forms: Record<string, string> = data.forms ?? {};

  const formLabels = [
    { key: "isolated", label: "Isolated" },
    { key: "initial", label: "Initial" },
    { key: "medial", label: "Medial" },
    { key: "final", label: "Final" },
  ];

  return (
    <View>
      <FadeInView style={s.headerCard}>
        <Text style={[s.mainLetter, { fontFamily }]}>{letter}</Text>
        <Text style={s.subtitle}>Letter Forms</Text>
      </FadeInView>

      <View style={s.formsGrid}>
        {formLabels.map(({ key, label }, idx) =>
          forms[key] ? (
            <FadeInView key={key} delay={120 + idx * 80} style={s.formCard}>
              <Text style={s.formLabel}>{label}</Text>
              <Text style={[s.formArabic, { fontFamily }]}>{forms[key]}</Text>
            </FadeInView>
          ) : null,
        )}
      </View>

      <ContinueButton onPress={onComplete} style={{ marginTop: 24 }} />
    </View>
  );
}

const s = StyleSheet.create({
  headerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  mainLetter: {
    fontSize: 72,
    color: theme.colors.primary,
    marginBottom: 8,
    writingDirection: "rtl",
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: "700",
  },
  formsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  formCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  formLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  formArabic: {
    fontSize: 40,
    color: theme.colors.text,
    writingDirection: "rtl",
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

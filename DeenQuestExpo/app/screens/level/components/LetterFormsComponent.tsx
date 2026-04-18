import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";

export function LetterFormsComponent({
  lesson,
  onComplete,
}: LessonComponentProps) {
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
      <View style={s.headerCard}>
        <Text style={s.mainLetter}>{letter}</Text>
        <Text style={s.subtitle}>Letter Forms</Text>
      </View>

      <View style={s.formsGrid}>
        {formLabels.map(({ key, label }) =>
          forms[key] ? (
            <View key={key} style={s.formCard}>
              <Text style={s.formLabel}>{label}</Text>
              <Text style={s.formArabic}>{forms[key]}</Text>
            </View>
          ) : null,
        )}
      </View>

      <TouchableOpacity style={s.continueBtn} onPress={onComplete}>
        <Text style={s.continueBtnText}>CONTINUE</Text>
        <ChevronRight size={18} color={theme.colors.onPrimary} />
      </TouchableOpacity>
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

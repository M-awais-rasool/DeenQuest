import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";
import { useRecitation, RecitationPanel } from "./recitation";
import { useQuranFont } from "../../../hooks/useQuranFont";
import { FadeInView, ContinueButton } from "./shared";

export function DuaCardComponent({
  lesson,
  onComplete,
  levelId,
  lessonIndex,
}: LessonComponentProps) {
  const { fontFamily } = useQuranFont();
  const data = lesson.data as Record<string, any>;
  const arabicText = (data.arabic as string) ?? "";

  // Recitation available when levelId/lessonIndex are present and there is Arabic text
  const hasRecitation = levelId != null && lessonIndex != null && !!arabicText;

  const rec = useRecitation(arabicText, levelId, lessonIndex);

  return (
    <View style={s.root}>
      {/* ── Dua card ─────────────────────────────────────────────────────── */}
      <FadeInView style={s.card}>
        <Text style={[s.arabic, { fontFamily }]}>{arabicText}</Text>
        <View style={s.divider} />
        {data.meaning ? <Text style={s.meaning}>{data.meaning}</Text> : null}
        {data.context ? (
          <View style={s.contextBox}>
            <Text style={s.contextText}>{data.context}</Text>
          </View>
        ) : null}
      </FadeInView>

      {/* ── Recitation panel (secondary / gold variant) ───────────────────── */}
      {hasRecitation && <RecitationPanel {...rec} variant="secondary" />}

      {/* CONTINUE — unlocked only after recitation is done */}
      {(!hasRecitation || rec.hasResult) && (
        <ContinueButton label="I'VE LEARNED THIS" onPress={onComplete} />
      )}

      {/* Locked hint while recitation is pending */}
      {hasRecitation && !rec.hasResult && (
        <View style={s.lockedHint}>
          <Text style={s.lockedHintText}>
            Complete your recitation to continue
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { gap: 16 },

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.secondary20,
  },
  arabic: {
    fontSize: 32,
    color: theme.colors.secondary,
    textAlign: "center",
    lineHeight: 48,
    marginBottom: 16,
    writingDirection: "rtl",
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
    backgroundColor: theme.colors.secondary08,
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
    gap: 6,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.primaryContainer,
    shadowColor: theme.colors.shadowGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  continueBtnText: {
    color: theme.colors.onPrimary,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },

  lockedHint: { alignItems: "center", paddingVertical: 8 },
  lockedHintText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontStyle: "italic",
  },
});

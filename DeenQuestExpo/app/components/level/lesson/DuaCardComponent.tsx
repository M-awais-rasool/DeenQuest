import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { haptics } from "../../../utils/haptics";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";
import { useRecitation, RecitationPanel } from "./recitation";

export function DuaCardComponent({
  lesson,
  onComplete,
  levelId,
  lessonIndex,
}: LessonComponentProps) {
  const data = lesson.data as Record<string, any>;
  const arabicText = (data.arabic as string) ?? "";

  // Recitation available when levelId/lessonIndex are present and there is Arabic text
  const hasRecitation = levelId != null && lessonIndex != null && !!arabicText;

  const rec = useRecitation(arabicText, levelId, lessonIndex);

  return (
    <View style={s.root}>
      {/* ── Dua card ─────────────────────────────────────────────────────── */}
      <View style={s.card}>
        <Text style={s.arabic}>{arabicText}</Text>
        <View style={s.divider} />
        {data.transliteration ? (
          <Text style={s.transliteration}>{data.transliteration}</Text>
        ) : null}
        {data.meaning ? <Text style={s.meaning}>{data.meaning}</Text> : null}
        {data.context ? (
          <View style={s.contextBox}>
            <Text style={s.contextText}>{data.context}</Text>
          </View>
        ) : null}
      </View>

      {/* ── Recitation panel (secondary / gold variant) ───────────────────── */}
      {hasRecitation && <RecitationPanel {...rec} variant="secondary" />}

      {/* CONTINUE — unlocked only after recitation is done */}
      {(!hasRecitation || rec.hasResult) && (
        <TouchableOpacity
          style={s.continueBtn}
          onPress={() => {
            haptics.medium();
            onComplete();
          }}
          activeOpacity={0.8}
        >
          <Text style={s.continueBtnText}>I'VE LEARNED THIS</Text>
          <ChevronRight size={18} color={theme.colors.onPrimary} />
        </TouchableOpacity>
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

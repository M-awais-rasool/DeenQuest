import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { BookOpen, ChevronRight } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";
import { useRecitation, RecitationPanel } from "./recitation";

export function QuranReaderComponent({
  lesson,
  onComplete,
  levelId,
  lessonIndex,
}: LessonComponentProps) {
  const data = lesson.data as Record<string, any>;
  const arabicText = (data.text as string) ?? "";
  const transliteration = data.transliteration as string | undefined;
  const meaning = data.meaning as string | undefined;
  const surahName = data.surah as string | undefined;

  // Recitation available when levelId/lessonIndex are present and there is Arabic text
  const hasRecitation = levelId != null && lessonIndex != null && !!arabicText;

  const rec = useRecitation(arabicText, levelId, lessonIndex);

  return (
    <View style={s.root}>
      {/* ── Surah badge ──────────────────────────────────────────────────── */}
      {surahName ? (
        <View style={s.surahBadge}>
          <BookOpen size={14} color={theme.colors.primary} />
          <Text style={s.surahName}>{surahName}</Text>
        </View>
      ) : null}

      {/* ── Ayah card ────────────────────────────────────────────────────── */}
      <View style={s.ayahCard}>
        <View style={s.cardGlow} />
        <View style={s.ayahCardInner}>
          <Text style={s.arabic}>{arabicText}</Text>
          {transliteration || meaning ? <View style={s.divider} /> : null}
          {transliteration ? (
            <Text style={s.transliteration}>{transliteration}</Text>
          ) : null}
          {meaning ? <Text style={s.meaning}>{meaning}</Text> : null}
        </View>
      </View>

      {/* ── Recitation panel ─────────────────────────────────────────────── */}
      {hasRecitation && <RecitationPanel {...rec} variant="primary" />}

      {/* CONTINUE — unlocked only after recitation is done */}
      {(!hasRecitation || rec.hasResult) && (
        <TouchableOpacity
          style={s.continueBtn}
          onPress={onComplete}
          activeOpacity={0.8}
        >
          <Text style={s.continueBtnText}>CONTINUE</Text>
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

  surahBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    backgroundColor: theme.colors.primary10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  surahName: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: "800",
  },

  ayahCard: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.primary20,
    backgroundColor: theme.colors.surface,
  },
  cardGlow: {
    height: 3,
    backgroundColor: theme.colors.primary50,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  ayahCardInner: {
    padding: 28,
    alignItems: "center",
  },
  arabic: {
    fontSize: 30,
    color: theme.colors.text,
    textAlign: "center",
    lineHeight: 52,
    writingDirection: "rtl",
    marginBottom: 4,
  },
  divider: {
    width: 48,
    height: 2,
    backgroundColor: theme.colors.primary20,
    borderRadius: 2,
    marginVertical: 14,
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

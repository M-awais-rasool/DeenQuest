import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
      <FadeInView>
        <LinearGradient
          colors={["#241E10", "#16272B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.4, y: 1 }}
          style={s.card}
        >
          <Text style={[s.cornerStar, s.cornerLeft]}>✦</Text>
          <Text style={[s.cornerStar, s.cornerRight]}>✦</Text>
          <Text style={[s.arabic, { fontFamily }]}>{arabicText}</Text>
          {data.meaning ? <Text style={s.meaning}>"{data.meaning}"</Text> : null}
        </LinearGradient>
      </FadeInView>

      {data.context ? (
        <View style={s.contextBox}>
          <Text style={s.contextStar}>✦</Text>
          <Text style={s.contextText}>{data.context}</Text>
        </View>
      ) : null}

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
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4A3E28",
  },
  cornerStar: {
    position: "absolute",
    top: 14,
    fontSize: 13,
    color: theme.colors.secondary,
    opacity: 0.6,
  },
  cornerLeft: { left: 16 },
  cornerRight: { right: 16 },
  arabic: {
    fontSize: 27,
    color: "#F5CE8A",
    textAlign: "center",
    lineHeight: 54,
    writingDirection: "rtl",
  },
  meaning: {
    fontSize: 13.5,
    fontFamily: "Nunito_600SemiBold",
    color: theme.colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 12,
  },
  contextBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  contextStar: {
    fontSize: 15,
    color: theme.colors.secondary,
  },
  contextText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 19,
    color: theme.colors.textMuted,
    fontFamily: "Nunito_700Bold",
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
    fontFamily: "Nunito_900Black",
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

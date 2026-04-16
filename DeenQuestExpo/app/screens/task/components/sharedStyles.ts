import { StyleSheet } from "react-native";
import { theme } from "../../../theme/themes";

/** Styles shared across all task component files. */
export const shared = StyleSheet.create({
  container: {
    marginTop: 8,
  },

  // ── Complete Button ────────────────────────────────────────────────
  completeBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 24,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.primaryContainer,
  },
  completeBtnDisabled: {
    opacity: 0.5,
  },
  completeBtnText: {
    color: theme.colors.onPrimary,
    fontWeight: "900",
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // ── Checklist ─────────────────────────────────────────────────────
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceLow,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    gap: 14,
  },
  checklistItemDone: { opacity: 0.6 },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.outline,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkMark: { color: theme.colors.onPrimary, fontWeight: "900", fontSize: 14 },
  checklistText: { color: theme.colors.text, fontSize: 16, fontWeight: "600" },
  checklistTextDone: { textDecorationLine: "line-through", opacity: 0.7 },

  // ── Quran Reader ──────────────────────────────────────────────────
  quranCard: {
    backgroundColor: theme.colors.surfaceLow,
    padding: 24,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    marginBottom: 12,
  },
  quranSurah: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 4,
  },
  quranAyahs: { fontSize: 14, color: theme.colors.textMuted, fontWeight: "600" },
  quranHint: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontStyle: "italic",
    textAlign: "center",
  },

  // ── Counter ───────────────────────────────────────────────────────
  counterPhrase: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: 16,
  },
  counterCount: {
    fontSize: 48,
    fontWeight: "900",
    color: theme.colors.primary,
    textAlign: "center",
  },
  counterProgress: {
    height: 8,
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 4,
    marginVertical: 16,
    overflow: "hidden",
  },
  counterBar: {
    height: "100%" as any,
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  counterTapBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(136, 217, 130, 0.15)",
    borderWidth: 3,
    borderColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 8,
  },
  counterCountDone: {
    color: theme.colors.secondary,
  },
  counterBarDone: {
    backgroundColor: theme.colors.secondary,
  },
  counterTapBtnDone: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    opacity: 0.6,
  },
  counterTapText: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: "900",
  },
  counterTapTextDone: {
    color: theme.colors.onPrimary,
    fontSize: 28,
  },
  checklistItemLocked: {
    opacity: 0.65,
  },

  // ── Hadith ────────────────────────────────────────────────────────
  hadithCard: {
    backgroundColor: theme.colors.surfaceLow,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 219, 60, 0.2)",
  },
  hadithQuote: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    fontStyle: "italic",
    lineHeight: 28,
    marginBottom: 12,
  },
  hadithRef: { fontSize: 13, color: theme.colors.textMuted, fontWeight: "600" },

  // ── Quiz ──────────────────────────────────────────────────────────
  quizQuestion: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 20,
  },
  quizOption: {
    backgroundColor: theme.colors.surfaceLow,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  quizOptionCorrect: {
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(136, 217, 130, 0.1)",
  },
  quizOptionWrong: {
    borderColor: "#FF6B6B",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
  },
  quizOptionText: { color: theme.colors.text, fontSize: 16, fontWeight: "600" },
  quizOptionTextSelected: { fontWeight: "800" },
  quizFeedbackCorrect: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
  quizFeedbackWrong: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },

  // ── Audio ─────────────────────────────────────────────────────────
  audioCard: {
    backgroundColor: theme.colors.surfaceLow,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  audioSurah: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 4,
  },
  audioDuration: { fontSize: 14, color: theme.colors.textMuted, fontWeight: "600" },
  audioHint: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: "center",
    fontStyle: "italic",
  },

  // ── Reflection ────────────────────────────────────────────────────
  reflectionQuestion: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 20,
    lineHeight: 28,
  },
  reflectionOption: {
    backgroundColor: theme.colors.surfaceLow,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  reflectionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(136, 217, 130, 0.1)",
  },
  reflectionOptionText: { color: theme.colors.text, fontSize: 16, fontWeight: "600" },
  reflectionSelectedText: { color: theme.colors.primary, fontWeight: "800" },

  // ── Tips ──────────────────────────────────────────────────────────
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceLow,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    gap: 14,
  },
  tipBullet: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(136, 217, 130, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  tipBulletText: { color: theme.colors.primary, fontWeight: "900", fontSize: 14 },
  tipText: { color: theme.colors.text, fontSize: 16, fontWeight: "600", flex: 1 },

  // ── Action ────────────────────────────────────────────────────────
  actionCard: {
    backgroundColor: theme.colors.surfaceLow,
    padding: 24,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
  },
  actionInstruction: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
    lineHeight: 26,
  },
});

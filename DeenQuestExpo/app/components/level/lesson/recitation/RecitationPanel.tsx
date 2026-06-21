import React, { useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from "react-native";
import { AnimatedPressable, TactilePressable } from "../../../ui";
import {
  Volume2,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
} from "lucide-react-native";
import { theme } from "../../../../theme/themes";
import type { RecitationWordResult } from "../../../../store/services/api";
import type { UseRecitationReturn } from "./useRecitation";
import { QURAN_FONT } from "../../../../hooks/useQuranFont";

// ─── Variant colours ──────────────────────────────────────────────────────────

export type RecitationVariant = "primary" | "secondary";

function getAccent(variant: RecitationVariant) {
  if (variant === "secondary") {
    return {
      color: theme.colors.secondary,
      bg08: theme.colors.secondary08,
      bg15: theme.colors.secondary15,
      border20: theme.colors.secondary20,
    };
  }
  return {
    color: theme.colors.primary,
    bg08: theme.colors.primary08,
    bg15: theme.colors.primary15,
    border20: theme.colors.primary20,
  };
}

// ─── Word status colour maps ──────────────────────────────────────────────────

const WORD_COLOR: Record<string, string> = {
  correct: theme.colors.primary,
  wrong: theme.colors.errorBright,
  missing: theme.colors.warning,
  extra: theme.colors.textMuted,
};
const WORD_BG: Record<string, string> = {
  correct: "rgba(136,217,130,0.15)",
  wrong: "rgba(255,133,133,0.15)",
  missing: "rgba(255,138,101,0.15)",
  extra: "rgba(191,202,186,0.08)",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

export const ScoreBadge = React.memo(function ScoreBadge({
  score,
}: {
  score: number;
}) {
  const color =
    score >= 90
      ? theme.colors.primary
      : score >= 65
        ? theme.colors.secondary
        : theme.colors.warning;
  return (
    <View style={[s.scoreBadge, { borderColor: color }]}>
      <Text style={[s.scoreNum, { color }]}>{score}</Text>
      <Text style={[s.scorePct, { color }]}>%</Text>
    </View>
  );
});

export const WordChip = React.memo(function WordChip({
  word,
}: {
  word: RecitationWordResult;
}) {
  const color = WORD_COLOR[word.status] ?? theme.colors.textMuted;
  const bg = WORD_BG[word.status] ?? "transparent";
  return (
    <View style={[s.wordChip, { backgroundColor: bg, borderColor: color }]}>
      <Text
        style={[s.wordChipText, { color, writingDirection: "rtl", fontFamily: QURAN_FONT }]}
        numberOfLines={1}
      >
        {word.text}
      </Text>
    </View>
  );
});

export const WordLegend = React.memo(function WordLegend({
  showExtra = true,
}: {
  showExtra?: boolean;
}) {
  const items = [
    { label: "Correct", color: theme.colors.primary },
    { label: "Wrong", color: theme.colors.errorBright },
    { label: "Missing", color: theme.colors.warning },
    ...(showExtra ? [{ label: "Extra", color: theme.colors.textMuted }] : []),
  ];
  return (
    <View style={s.legendRow}>
      {items.map((i) => (
        <View key={i.label} style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: i.color }]} />
          <Text style={s.legendText}>{i.label}</Text>
        </View>
      ))}
    </View>
  );
});

export const PulsingRing = React.memo(function PulsingRing({
  active,
}: {
  active: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1.6,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.4,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    scale.setValue(1);
    opacity.setValue(0);
    return undefined;
  }, [active, scale, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[s.pulseRing, { transform: [{ scale }], opacity }]}
    />
  );
});

const WordBreakdown = React.memo(function WordBreakdown({
  words,
}: {
  words: RecitationWordResult[];
}) {
  const originalWords = words.filter((w) => w.status !== "extra");
  const extraWords = words.filter((w) => w.status === "extra");
  return (
    <>
      <WordLegend showExtra={extraWords.length > 0} />
      <View style={s.wordGrid}>
        {originalWords.map((w, i) => (
          <WordChip key={`orig-${i}`} word={w} />
        ))}
      </View>
      {extraWords.length > 0 && (
        <View style={s.extraSection}>
          <Text style={s.extraLabel}>Extra words spoken</Text>
          <View style={s.wordRow}>
            {extraWords.map((w, i) => (
              <WordChip key={`extra-${i}`} word={w} />
            ))}
          </View>
        </View>
      )}
    </>
  );
});

// ─── RecitationPanel ──────────────────────────────────────────────────────────

export interface RecitationPanelProps extends UseRecitationReturn {
  variant?: RecitationVariant;
}

/**
 * Drop-in recitation panel.  Pass the return value of useRecitation() as props.
 * Use variant="primary" (default) for Quran text, "secondary" for Dua text.
 */
export const RecitationPanel = React.memo(function RecitationPanel({
  result,
  isPlaying,
  isRecording,
  isProcessing,
  hasResult,
  resultAnim,
  handlePlay,
  handleRecord,
  handleRetry,
  variant = "primary",
}: RecitationPanelProps) {
  const accent = useMemo(() => getAccent(variant), [variant]);

  return (
    <View style={[s.recitationSection, { borderColor: accent.border20 }]}>
      {/* ── Section header ──────────────────────────────────────────────── */}
      <View style={s.sectionHeader}>
        <Mic size={15} color={accent.color} />
        <Text style={s.sectionTitle}>Recitation Practice</Text>
        <View style={[s.requiredBadge, { backgroundColor: accent.bg15 }]}>
          <Text style={[s.requiredText, { color: accent.color }]}>
            Required
          </Text>
        </View>
      </View>

      {/* ── Controls (hidden once result shown) ─────────────────────────── */}
      {!hasResult && (
        <>
          {/* Instruction */}
          <View style={s.instructionBox}>
            <Text style={s.instructionText}>
              {isRecording
                ? "🎙 Reciting… tap mic to stop"
                : isProcessing
                  ? "⏳ Analysing your recitation…"
                  : "👂 Listen first, then tap 🎤 to recite"}
            </Text>
          </View>

          {/* Speaker + Record row */}
          <View style={s.controls}>
            {/* Speaker */}
            <View style={s.speakerWrap}>
              <TactilePressable
                onPress={handlePlay}
                disabled={isRecording || isProcessing}
                edgeColor={theme.colors.outline}
                depth={3}
                radius={32}
                haptic="light"
                faceStyle={[
                  s.controlBtn,
                  isPlaying && {
                    borderColor: accent.color,
                    backgroundColor: accent.bg08,
                  },
                ]}
              >
                <Volume2
                  size={24}
                  color={isPlaying ? accent.color : theme.colors.text}
                />
              </TactilePressable>
              <Text
                style={[s.controlLabel, isPlaying && { color: accent.color }]}
              >
                {isPlaying ? "Stop" : "Listen"}
              </Text>
            </View>

            {/* Record (large, pulsing) */}
            <View style={s.recordWrap}>
              <PulsingRing active={isRecording} />
              <TactilePressable
                onPress={handleRecord}
                disabled={isProcessing}
                edgeColor={theme.colors.black35}
                depth={3}
                radius={32}
                haptic="medium"
                faceStyle={[
                  s.recordBtn,
                  {
                    backgroundColor: isRecording
                      ? theme.colors.errorBright
                      : accent.color,
                    shadowColor: isRecording
                      ? theme.colors.errorBright
                      : accent.color,
                  },
                ]}
              >
                {isProcessing ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.background}
                  />
                ) : isRecording ? (
                  <MicOff size={24} color={theme.colors.background} />
                ) : (
                  <Mic size={24} color={theme.colors.background} />
                )}
              </TactilePressable>
              <Text style={s.recordLabel}>
                {isProcessing
                  ? "Checking…"
                  : isRecording
                    ? "Tap to stop"
                    : "Recite"}
              </Text>
            </View>
          </View>
        </>
      )}

      {/* ── Result section ────────────────────────────────────────────────── */}
      {hasResult && result && (
        <Animated.View
          style={[
            s.resultSection,
            {
              opacity: resultAnim,
              transform: [
                {
                  translateY: resultAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Score + XP */}
          <View style={s.scoreRow}>
            <ScoreBadge score={result.score} />
            <View style={s.scoreMeta}>
              <View style={s.xpEarnedRow}>
                <Sparkles size={13} color={theme.colors.secondary} />
                <Text style={s.xpEarnedText}>
                  +{result.xp_earned} XP earned
                </Text>
              </View>
            </View>
          </View>

          {/* Feedback message */}
          <View
            style={[
              s.messageBox,
              { backgroundColor: accent.bg08, borderColor: accent.border20 },
            ]}
          >
            <Text style={s.messageText}>{result.message}</Text>
          </View>

          {/* Word breakdown — original Ayah words in fixed sequence */}
          <WordBreakdown words={result.words} />

          {/* Pronunciation coach */}
          {result.coaching && (result.coaching.tip || result.coaching.explanation) ? (
            <View style={s.coachBox}>
              <Text style={s.coachLabel}>PRONUNCIATION COACH</Text>
              <Text style={s.coachTip}>{result.coaching.tip}</Text>
              {result.coaching.focus_words?.length ? (
                <View style={s.coachChips}>
                  {result.coaching.focus_words.map((w, i) => (
                    <View key={i} style={s.coachChip}>
                      <Text style={s.coachChipText}>{w}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {result.coaching.explanation ? (
                <Text style={s.coachExplain}>{result.coaching.explanation}</Text>
              ) : null}
            </View>
          ) : null}

          {/* Transcript */}
          {result.transcript ? (
            <View style={s.transcriptBox}>
              <Text style={s.transcriptLabel}>What we heard:</Text>
              <Text style={s.transcriptText} numberOfLines={2}>
                {result.transcript}
              </Text>
            </View>
          ) : null}

          {/* Try Again */}
          <TactilePressable
            onPress={handleRetry}
            edgeColor={theme.colors.outline}
            depth={3}
            radius={12}
            haptic="light"
            faceStyle={s.retryBtn}
          >
            <RotateCcw size={16} color={theme.colors.text} />
            <Text style={s.retryBtnText}>Try Again</Text>
          </TactilePressable>
        </Animated.View>
      )}
    </View>
  );
});

// ─── Shared styles ────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  coachBox: {
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.secondary + "33",
  },
  coachLabel: {
    color: theme.colors.secondary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 6,
  },
  coachTip: { color: theme.colors.text, fontSize: 14, fontWeight: "700", lineHeight: 20 },
  coachChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  coachChip: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  coachChipText: { color: theme.colors.text, fontSize: 19, fontFamily: QURAN_FONT },
  coachExplain: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    fontStyle: "italic",
  },
  // ── Panel wrapper ────────────────────────────────────────────────────────
  recitationSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  sectionTitle: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  requiredBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── Instruction ──────────────────────────────────────────────────────────
  instructionBox: {
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  instructionText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },

  // ── Controls ─────────────────────────────────────────────────────────────
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 36,
    paddingVertical: 8,
  },
  speakerWrap: {
    alignItems: "center",
    gap: 6,
  },
  controlBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    justifyContent: "center",
    alignItems: "center",
  },
  controlLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },

  // ── Record button ─────────────────────────────────────────────────────────
  recordWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  recordBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  pulseRing: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.errorBright,
  },
  recordLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 8,
  },

  // ── Result ────────────────────────────────────────────────────────────────
  resultSection: { gap: 12 },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 16,
    padding: 16,
  },
  scoreBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    alignSelf: "flex-start",
  },
  scoreNum: { fontSize: 24, fontWeight: "900" },
  scorePct: { fontSize: 13, fontWeight: "700", marginTop: 6 },
  scoreMeta: { flex: 1, gap: 8 },
  xpEarnedRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  xpEarnedText: {
    color: theme.colors.secondary,
    fontSize: 13,
    fontWeight: "700",
  },

  messageBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  messageText: {
    color: theme.colors.text,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "600",
  },

  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },

  wordGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    justifyContent: "flex-end", // RTL: start from right
    direction: "rtl" as any,
  },
  wordRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    justifyContent: "center",
  },
  extraSection: {
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  extraLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  wordChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
  },
  wordChipText: { fontSize: 17, fontWeight: "700", lineHeight: 26 },

  transcriptBox: {
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 10,
    padding: 10,
    gap: 3,
  },
  transcriptLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  transcriptText: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 19,
    writingDirection: "rtl",
  },

  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceHigh,
  },
  retryBtnText: { color: theme.colors.text, fontSize: 14, fontWeight: "700" },
});

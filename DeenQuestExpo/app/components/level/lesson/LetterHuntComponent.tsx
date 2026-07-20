import React, { useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import { theme } from "../../../theme/themes";
import { useQuranFont } from "../../../hooks/useQuranFont";
import { trackAnswer } from "../../../services/telemetry";
import type { LessonComponentProps } from "./types";
import {
  ArabicChip,
  FeedbackBanner,
  type FeedbackStatus,
} from "./shared";


export function LetterHuntComponent({
  lesson,
  onComplete,
  levelId,
  lessonIndex,
}: LessonComponentProps) {
  const { fontFamily } = useQuranFont();
  const data = lesson.data as Record<string, any>;
  const target: string = data.target ?? "";
  const grid: string[] = useMemo(() => data.grid ?? [], [data]);
  const instruction: string = data.instruction ?? "Tap every matching letter";

  const total = useMemo(
    () => grid.filter((g) => g === target).length,
    [grid, target],
  );

  const [found, setFound] = useState<Set<number>>(() => new Set());
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapAtRef = useRef(Date.now());

  const solved = found.size === total && total > 0;

  const handleTap = (idx: number) => {
    if (solved || found.has(idx)) return;
    trackAnswer({
      interaction: "hunt",
      skillTags: lesson.skill_tags,
      correct: grid[idx] === target,
      expected: target,
      chosen: grid[idx],
      latencyMs: Date.now() - lastTapAtRef.current,
      levelId,
      lessonIndex,
    });
    lastTapAtRef.current = Date.now();
    if (grid[idx] === target) {
      const next = new Set(found);
      next.add(idx);
      setFound(next);
      if (next.size === total) {
        haptics.success();
        sfx.correct();
      } else {
        haptics.light();
        sfx.pick();
      }
    } else {
      haptics.error();
      sfx.wrong();
      setWrongIdx(idx);
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setWrongIdx(null), 600);
    }
  };

  const status: FeedbackStatus = solved ? "correct" : null;

  return (
    <View>
      <Text style={s.instruction}>{instruction}</Text>

      <View style={s.targetRow}>
        <View style={s.targetCard}>
          <Text style={[s.targetText, { fontFamily }]}>{target}</Text>
        </View>
      </View>

      <View style={s.grid}>
        {grid.map((letter, idx) => (
          <View key={idx} style={s.cell}>
            <ArabicChip
              label={letter}
              size="sm"
              fullWidth
              state={
                found.has(idx)
                  ? "correct"
                  : wrongIdx === idx
                    ? "wrong"
                    : "idle"
              }
              onPress={
                solved || found.has(idx) ? undefined : () => handleTap(idx)
              }
            />
          </View>
        ))}
      </View>

      {/* PROGRESS strip (C9 mock) */}
      <View style={s.progressCard}>
        <Text style={s.progressLabel}>PROGRESS</Text>
        <View style={s.progressTrack}>
          <View
            style={[
              s.progressFill,
              {
                width: `${total > 0 ? Math.round((found.size / total) * 100) : 0}%`,
              },
            ]}
          />
        </View>
        <Text style={s.progressPct}>
          {total > 0 ? Math.round((found.size / total) * 100) : 0}%
        </Text>
      </View>

      <FeedbackBanner
        status={status}
        correctText={`MashaAllah! You found all ${total} 🎉`}
        onContinue={onComplete}
      />
    </View>
  );
}

const s = StyleSheet.create({
  instruction: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontFamily: "Nunito_700Bold",
    marginBottom: 14,
  },
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginBottom: 18,
  },
  targetCard: {
    backgroundColor: theme.colors.primary12,
    borderColor: theme.colors.primary30,
    borderWidth: 2,
    borderRadius: 18,
    paddingHorizontal: 26,
    paddingVertical: 10,
  },
  targetText: {
    fontSize: 44,
    color: theme.colors.primary,
    writingDirection: "rtl",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  cell: {
    width: "22%",
  },
  progressCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 22,
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: "Nunito_800ExtraBold",
    color: theme.colors.textMuted,
    letterSpacing: 0.9,
  },
  progressTrack: {
    flex: 1,
    height: 9,
    borderRadius: 5,
    backgroundColor: theme.colors.background,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  progressPct: {
    fontSize: 13,
    fontFamily: "Nunito_900Black",
    color: "#5EE0CE",
  },
});

export default LetterHuntComponent;

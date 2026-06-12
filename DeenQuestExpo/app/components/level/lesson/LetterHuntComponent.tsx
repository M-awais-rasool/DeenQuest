import React, { useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import { theme } from "../../../theme/themes";
import { useQuranFont } from "../../../hooks/useQuranFont";
import type { LessonComponentProps } from "./types";
import {
  ArabicChip,
  FeedbackBanner,
  type FeedbackStatus,
} from "./shared";

/**
 * "Find every …" scanning game: a target letter/word is shown at the top
 * and the learner taps every occurrence inside a grid of lookalikes.
 * Correct cells lock in green; wrong taps flash red and shake. Trains
 * visual discrimination between similar Arabic letterforms.
 */
export function LetterHuntComponent({ lesson, onComplete }: LessonComponentProps) {
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

  const solved = found.size === total && total > 0;

  const handleTap = (idx: number) => {
    if (solved || found.has(idx)) return;
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
        <View style={s.progressPill}>
          <Text style={s.progressText}>
            {found.size} / {total}
          </Text>
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
    fontWeight: "700",
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
  progressPill: {
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  progressText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  cell: {
    width: "22%",
  },
});

export default LetterHuntComponent;

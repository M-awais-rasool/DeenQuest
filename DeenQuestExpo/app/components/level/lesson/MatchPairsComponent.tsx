import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";
import {
  ArabicChip,
  type ChipState,
  FeedbackBanner,
  shuffle,
} from "./shared";

type Pair = { left: string; right: string };
type Cell = { id: number; text: string };

/**
 * Tap-to-match two Arabic columns (e.g. a letter and its Arabic name, or a
 * word and its pair). Select a tile on the left, then tap its match on the
 * right: a correct pair pops green, a wrong pair shakes.
 */
export function MatchPairsComponent({ lesson, onComplete }: LessonComponentProps) {
  const data = lesson.data as Record<string, any>;
  const pairs: Pair[] = data.pairs ?? [];
  const instruction: string = data.instruction ?? "Match each pair";

  const leftCells = useMemo<Cell[]>(
    () => pairs.map((p, id) => ({ id, text: p.left })),
    [pairs],
  );
  const rightCells = useMemo<Cell[]>(
    () => shuffle(pairs.map((p, id) => ({ id, text: p.right }))),
    [pairs],
  );

  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [wrong, setWrong] = useState<{ left: number; right: number } | null>(
    null,
  );

  const solved = matched.size === pairs.length && pairs.length > 0;

  const tapLeft = (id: number) => {
    if (matched.has(id) || solved) return;
    haptics.light();
    setSelectedLeft(id);
  };

  const tapRight = (id: number) => {
    if (matched.has(id) || solved || selectedLeft === null) return;
    if (id === selectedLeft) {
      const next = new Set(matched).add(id);
      setMatched(next);
      setSelectedLeft(null);
      haptics.success();
      sfx.correct();
    } else {
      setWrong({ left: selectedLeft, right: id });
      haptics.error();
      sfx.wrong();
      setSelectedLeft(null);
      setTimeout(() => setWrong(null), 600);
    }
  };

  const leftState = (id: number): ChipState => {
    if (matched.has(id)) return "correct";
    if (wrong?.left === id) return "wrong";
    if (selectedLeft === id) return "selected";
    return "idle";
  };
  const rightState = (id: number): ChipState => {
    if (matched.has(id)) return "correct";
    if (wrong?.right === id) return "wrong";
    return "idle";
  };

  return (
    <View>
      <Text style={s.instruction}>{instruction}</Text>

      <View style={s.grid}>
        <View style={s.col}>
          {leftCells.map((c) => (
            <ArabicChip
              key={`l-${c.id}`}
              label={c.text}
              size="sm"
              fullWidth
              state={leftState(c.id)}
              onPress={matched.has(c.id) ? undefined : () => tapLeft(c.id)}
            />
          ))}
        </View>
        <View style={s.col}>
          {rightCells.map((c) => (
            <ArabicChip
              key={`r-${c.id}`}
              label={c.text}
              size="sm"
              fullWidth
              state={rightState(c.id)}
              onPress={matched.has(c.id) ? undefined : () => tapRight(c.id)}
            />
          ))}
        </View>
      </View>

      <FeedbackBanner
        status={solved ? "correct" : null}
        correctText="MashaAllah! All matched 🎉"
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
    marginBottom: 16,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    gap: 12,
  },
  col: {
    flex: 1,
    gap: 10,
  },
});

export default MatchPairsComponent;

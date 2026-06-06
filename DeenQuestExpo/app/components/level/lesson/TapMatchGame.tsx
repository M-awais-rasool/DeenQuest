import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import { theme } from "../../../theme/themes";
import type { MiniGame } from "../../../store/services/api";
import { ArabicChip, type ChipState, shuffle } from "./shared";

type Pair = { left: string; right: string };
type Cell = { id: number; text: string };

export function TapMatchGame({
  game,
  onFinish,
}: {
  game: MiniGame;
  onFinish: (stats: { accuracy: number }) => void;
}) {
  const data = game.data as Record<string, any>;
  const pairs = useMemo<Pair[]>(
    () =>
      (data.pairs ?? []).map((p: Record<string, string>) => ({
        left: p.left ?? p.arabic ?? "",
        right: p.right ?? p.answer ?? p.english ?? "",
      })),
    [data.pairs],
  );

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
  const [wrong, setWrong] = useState<{ left: number; right: number } | null>(null);
  const [attempts, setAttempts] = useState(0);

  const tapLeft = (id: number) => {
    if (matched.has(id)) return;
    haptics.light();
    setSelectedLeft(id);
  };

  const tapRight = (id: number) => {
    if (matched.has(id) || selectedLeft === null) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (id === selectedLeft) {
      const next = new Set(matched).add(id);
      setMatched(next);
      setSelectedLeft(null);
      haptics.success();
      sfx.correct();
      if (next.size >= pairs.length) {
        const accuracy =
          nextAttempts > 0
            ? Math.round((pairs.length / nextAttempts) * 100)
            : 100;
        sfx.complete();
        setTimeout(() => onFinish({ accuracy }), 450);
      }
    } else {
      setWrong({ left: selectedLeft, right: id });
      setSelectedLeft(null);
      haptics.error();
      sfx.wrong();
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
      <Text style={s.instruction}>Tap a tile, then tap its match</Text>
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
  grid: { flexDirection: "row", gap: 12 },
  col: { flex: 1, gap: 10 },
});

export default TapMatchGame;

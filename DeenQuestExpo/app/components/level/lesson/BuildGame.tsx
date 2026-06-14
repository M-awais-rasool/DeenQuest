import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import { theme } from "../../../theme/themes";
import { useQuranFont } from "../../../hooks/useQuranFont";
import type { MiniGame } from "../../../store/services/api";
import { ArabicChip, ContinueButton, useShake, shuffle } from "./shared";

type Round = { parts: string[]; word?: string; meaning?: string };
type Item = { id: number; text: string };

export function BuildGame({
  game,
  onFinish,
}: {
  game: MiniGame;
  onFinish: (stats: { accuracy: number }) => void;
}) {
  const { fontFamily } = useQuranFont();
  const data = game.data as Record<string, any>;
  const rounds = useMemo<Round[]>(() => {
    if (Array.isArray(data.rounds) && data.rounds.length > 0) {
      return data.rounds.map((r: any) => ({
        parts: r.parts ?? [],
        word: r.word,
        meaning: r.meaning,
      }));
    }
    if (Array.isArray(data.parts))
      return [{ parts: data.parts, word: data.word, meaning: data.meaning }];
    return [];
  }, [data]);

  const [roundIdx, setRoundIdx] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { shake, style: shakeStyle } = useShake();

  const round = rounds[roundIdx] ?? { parts: [] };
  const target = round.word ?? round.parts.join("");
  const items = useMemo<Item[]>(
    () => round.parts.map((text, id) => ({ id, text })),
    [round.parts],
  );
  const shuffledIds = useMemo(() => shuffle(items.map((i) => i.id)), [items]);

  const byId = (id: number) => items[id];
  const bankIds = shuffledIds.filter((id) => !order.includes(id));
  const isFull = order.length === items.length && items.length > 0;
  const isLastRound = roundIdx >= rounds.length - 1;

  const add = (id: number) => {
    if (solved) return;
    haptics.selection();
    sfx.pick();
    setOrder((p) => [...p, id]);
  };
  const remove = (id: number) => {
    if (solved) return;
    haptics.light();
    setOrder((p) => p.filter((x) => x !== id));
  };

  const check = () => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    const correct = order.every((id, idx) => byId(id).text === round.parts[idx]);
    if (correct) {
      setSolved(true);
      haptics.success();
      sfx.correct();
    } else {
      haptics.error();
      sfx.wrong();
      shake();
      setTimeout(() => setOrder([]), 700);
    }
  };

  const next = () => {
    if (isLastRound) {
      const accuracy =
        attempts > 0 ? Math.round((rounds.length / attempts) * 100) : 100;
      sfx.complete();
      onFinish({ accuracy });
      return;
    }
    setRoundIdx((i) => i + 1);
    setOrder([]);
    setSolved(false);
  };

  return (
    <View>
      <Text style={s.instruction}>
        {rounds.length > 1 ? `Round ${roundIdx + 1} of ${rounds.length} — ` : ""}
        Arrange the tiles to build this word
      </Text>

      {target ? (
        <View style={s.goalCard}>
          <Text style={s.goalLabel}>YOUR GOAL</Text>
          <Text style={[s.goalWord, { fontFamily }]}>{target}</Text>
          {round.meaning ? (
            <Text style={s.goalMeaning}>{round.meaning}</Text>
          ) : null}
        </View>
      ) : null}

      <Animated.View style={[s.answerBox, shakeStyle]}>
        {order.length === 0 ? (
          <Text style={s.placeholder}>…</Text>
        ) : (
          <View style={s.rowRtl}>
            {order.map((id) => (
              <ArabicChip
                key={id}
                label={byId(id).text}
                size="md"
                state={solved ? "correct" : "selected"}
                onPress={solved ? undefined : () => remove(id)}
              />
            ))}
          </View>
        )}
      </Animated.View>

      <View style={s.bank}>
        <View style={s.rowRtl}>
          {bankIds.map((id) => (
            <ArabicChip
              key={id}
              label={byId(id).text}
              size="md"
              state="idle"
              onPress={() => add(id)}
            />
          ))}
        </View>
      </View>

      {!solved ? (
        <ContinueButton
          label="CHECK"
          haptic="none"
          showChevron={false}
          disabled={!isFull}
          onPress={check}
          style={{ marginTop: 16 }}
        />
      ) : (
        <View style={s.solvedBox}>
          <Text style={s.meaning}>
            MashaAllah! You built {target}
          </Text>
          <ContinueButton
            label={isLastRound ? "FINISH" : "NEXT"}
            variant="success"
            onPress={next}
          />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  instruction: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: "700",
    marginBottom: 16,
  },
  goalCard: {
    alignItems: "center",
    backgroundColor: theme.colors.primary08,
    borderColor: theme.colors.primary25,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  goalLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: theme.colors.primary,
    marginBottom: 6,
  },
  goalWord: {
    fontSize: 46,
    color: theme.colors.text,
    writingDirection: "rtl",
    textAlign: "center",
  },
  goalMeaning: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },
  answerBox: {
    minHeight: 88,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surfaceLow,
    padding: 12,
    justifyContent: "center",
    marginBottom: 18,
  },
  rowRtl: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-start",
  },
  placeholder: {
    color: theme.colors.textMuted,
    fontSize: 22,
    textAlign: "center",
    opacity: 0.5,
  },
  bank: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    minHeight: 66,
    justifyContent: "center",
  },
  solvedBox: {
    marginTop: 16,
    gap: 12,
  },
  meaning: {
    fontSize: 15,
    color: theme.colors.primary,
    textAlign: "center",
    fontWeight: "700",
    lineHeight: 22,
  },
});

export default BuildGame;

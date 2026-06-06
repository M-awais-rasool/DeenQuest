import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { HelpCircle } from "lucide-react-native";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import { theme } from "../../../theme/themes";
import { useQuranFont } from "../../../hooks/useQuranFont";
import type { MiniGame } from "../../../store/services/api";
import { usePop, shuffle } from "./shared";

type Card = { cardId: number; pairId: number; text: string };

function MemoryCard({
  card,
  faceUp,
  matched,
  onPress,
}: {
  card: Card;
  faceUp: boolean;
  matched: boolean;
  onPress: () => void;
}) {
  const { fontFamily } = useQuranFont();
  const { pop, style: popStyle } = usePop();
  const open = faceUp || matched;

  useEffect(() => {
    if (open) pop();
  }, [open, pop]);

  return (
    <Animated.View style={[s.cardWrap, popStyle]}>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={matched || faceUp}
        onPress={onPress}
        style={[
          s.card,
          open && s.cardOpen,
          matched && s.cardMatched,
        ]}
      >
        {open ? (
          <Text style={[s.cardText, { fontFamily }]} numberOfLines={1}>
            {card.text}
          </Text>
        ) : (
          <HelpCircle size={26} color={theme.colors.primary50} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function MemoryGame({
  game,
  onFinish,
}: {
  game: MiniGame;
  onFinish: (stats: { accuracy: number }) => void;
}) {
  const data = game.data as Record<string, any>;
  const pairs = useMemo<Array<{ left: string; right: string }>>(
    () =>
      (data.pairs ?? []).map((p: Record<string, string>) => ({
        left: p.left ?? p.arabic ?? "",
        right: p.right ?? p.answer ?? p.english ?? "",
      })),
    [data.pairs],
  );

  const deck = useMemo<Card[]>(() => {
    const cards: Card[] = [];
    pairs.forEach((p, pairId) => {
      cards.push({ cardId: pairId * 2, pairId, text: p.left });
      cards.push({ cardId: pairId * 2 + 1, pairId, text: p.right });
    });
    return shuffle(cards);
  }, [pairs]);

  const [flipped, setFlipped] = useState<number[]>([]); // cardIds face up
  const [matched, setMatched] = useState<Set<number>>(new Set()); // pairIds
  const [moves, setMoves] = useState(0);
  const [busy, setBusy] = useState(false);

  const cardById = (id: number) => deck.find((c) => c.cardId === id)!;

  const tap = (cardId: number) => {
    if (busy || flipped.includes(cardId)) return;
    const card = cardById(cardId);
    if (matched.has(card.pairId)) return;

    haptics.light();
    const next = [...flipped, cardId];
    setFlipped(next);

    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next.map(cardById);
      if (a.pairId === b.pairId) {
        const matchedNext = new Set(matched).add(a.pairId);
        setMatched(matchedNext);
        setFlipped([]);
        haptics.success();
        sfx.correct();
        if (matchedNext.size >= pairs.length) {
          const accuracy =
            moves + 1 > 0
              ? Math.round((pairs.length / (moves + 1)) * 100)
              : 100;
          sfx.complete();
          setTimeout(() => onFinish({ accuracy }), 500);
        }
      } else {
        setBusy(true);
        haptics.error();
        sfx.wrong();
        setTimeout(() => {
          setFlipped([]);
          setBusy(false);
        }, 800);
      }
    }
  };

  return (
    <View>
      <Text style={s.instruction}>Flip two tiles to find the matching pair</Text>
      <View style={s.grid}>
        {deck.map((card) => (
          <MemoryCard
            key={card.cardId}
            card={card}
            faceUp={flipped.includes(card.cardId)}
            matched={matched.has(card.pairId)}
            onPress={() => tap(card.cardId)}
          />
        ))}
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  cardWrap: {
    width: "30%",
    aspectRatio: 1,
  },
  card: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceHigh,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: theme.colors.outline,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  cardOpen: {
    backgroundColor: theme.colors.primary08,
    borderColor: theme.colors.primary,
  },
  cardMatched: {
    backgroundColor: theme.colors.primary12,
    borderColor: theme.colors.primary,
    opacity: 0.85,
  },
  cardText: {
    fontSize: 24,
    color: theme.colors.primary,
    writingDirection: "rtl",
    textAlign: "center",
  },
});

export default MemoryGame;

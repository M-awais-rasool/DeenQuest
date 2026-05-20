import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { haptics } from "../../../utils/haptics";
import { theme } from "../../../theme/themes";
import type { MiniGame } from "../../../store/services/api";

export function TapMatchGame({
  game,
  onFinish,
}: {
  game: MiniGame;
  onFinish: (stats: { accuracy: number }) => void;
}) {
  const data = game.data as Record<string, any>;
  const pairs = useMemo<Array<{ arabic: string; answer: string }>>(
    () =>
      (data.pairs ?? []).map((p: Record<string, string>) => ({
        arabic: p.arabic,
        answer: p.answer ?? p.english ?? "",
      })),
    [],
  );
  const [matchedCount, setMatchedCount] = useState(0);
  const [selectedArabic, setSelectedArabic] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState(0);

  const shuffledAnswers = useMemo(
    () => [...pairs].sort(() => Math.random() - 0.5),
    [pairs],
  );

  const handleArabicTap = (arabic: string) => {
    if (matched.has(arabic)) return;
    haptics.light();
    setSelectedArabic(arabic);
  };

  const handleAnswerTap = (answer: string) => {
    if (!selectedArabic) return;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    const pair = pairs.find((p) => p.arabic === selectedArabic);
    if (pair?.answer === answer) {
      haptics.success();
      setMatched((prev) => new Set(prev).add(selectedArabic));
      const newMatchedCount = matchedCount + 1;
      setMatchedCount(newMatchedCount);
      if (newMatchedCount >= pairs.length) {
        const accuracy = newAttempts > 0 ? Math.round((pairs.length / newAttempts) * 100) : 100;
        onFinish({ accuracy });
      }
    } else {
      haptics.error();
    }
    setSelectedArabic(null);
  };

  return (
    <View>
      <Text style={s.gameInstruction}>Match the Arabic to its meaning</Text>
      <View style={s.matchGrid}>
        <View style={s.matchColumn}>
          {pairs.map((p, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                s.matchCard,
                matched.has(p.arabic) && s.matchCardDone,
                selectedArabic === p.arabic && s.matchCardSelected,
              ]}
              onPress={() => handleArabicTap(p.arabic)}
              disabled={matched.has(p.arabic)}
            >
              <Text style={s.matchArabic}>{p.arabic}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.matchColumn}>
          {shuffledAnswers.map((p, idx) => (
            <TouchableOpacity
              key={idx}
              style={[s.matchCard, matched.has(p.arabic) && s.matchCardDone]}
              onPress={() => handleAnswerTap(p.answer)}
              disabled={matched.has(p.arabic)}
            >
              <Text style={s.matchAnswer}>{p.arabic}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  gameInstruction: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  matchGrid: { flexDirection: "row", gap: 12 },
  matchColumn: { flex: 1, gap: 8 },
  matchCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.outline,
  },
  matchCardSelected: { borderColor: theme.colors.primary },
  matchCardDone: { opacity: 0.4, borderColor: theme.colors.primary },
  matchArabic: { fontSize: 22, color: theme.colors.text },
  matchAnswer: { fontSize: 14, color: theme.colors.text, fontWeight: "700" },
});

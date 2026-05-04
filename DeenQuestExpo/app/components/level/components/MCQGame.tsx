import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { theme } from "../../../theme/themes";
import type { MiniGame } from "../../../store/services/api";

export function MCQGame({
  game,
  onFinish,
}: {
  game: MiniGame;
  onFinish: (stars: number) => void;
}) {
  const data = game.data as Record<string, any>;
  const questions: Array<{
    question: string;
    options: string[];
    correct: number;
  }> = data.questions ?? [
    {
      question: data.question ?? "Complete the challenge",
      options: data.options ?? [],
      correct: data.correct ?? 0,
    },
  ];

  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const q = questions[currentQ];
  const hasAnswered = selected !== null;
  const isCorrect = selected === q?.correct;

  const handleSelect = (idx: number) => {
    if (hasAnswered) return;
    setSelected(idx);
    if (idx === q.correct) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((c) => c + 1);
      setSelected(null);
    } else {
      const pct = score / questions.length;
      const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
      onFinish(stars);
    }
  };

  if (!q) return null;

  return (
    <View>
      <Text style={s.gameQuestion}>{q.question}</Text>
      {q.options?.map((opt, idx) => (
        <TouchableOpacity
          key={idx}
          style={[
            s.gameOption,
            hasAnswered && idx === q.correct && s.gameOptionCorrect,
            hasAnswered && idx === selected && !isCorrect && s.gameOptionWrong,
          ]}
          onPress={() => handleSelect(idx)}
          disabled={hasAnswered}
        >
          <Text style={s.gameOptionText}>{opt}</Text>
        </TouchableOpacity>
      ))}
      {hasAnswered && (
        <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
          <Text style={s.nextBtnText}>
            {currentQ < questions.length - 1 ? "NEXT" : "FINISH"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  gameQuestion: {
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: "800",
    marginBottom: 16,
    lineHeight: 26,
  },
  gameOption: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: theme.colors.outline,
  },
  gameOptionCorrect: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary10,
  },
  gameOptionWrong: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.errorSoft10,
  },
  gameOptionText: { fontSize: 16, color: theme.colors.text, fontWeight: "600" },
  nextBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.primaryContainer,
  },
  nextBtnText: {
    color: theme.colors.onPrimary,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },
});

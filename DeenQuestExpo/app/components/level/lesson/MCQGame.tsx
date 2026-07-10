import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { haptics } from "../../../utils/haptics";
import { sfx } from "../../../utils/sfx";
import { theme } from "../../../theme/themes";
import type { MiniGame } from "../../../store/services/api";
import {
  FeedbackBanner,
  type FeedbackStatus,
  OptionRow,
  type OptionState,
} from "./shared";

type Question = { question: string; options: string[]; correct: number };

export function MCQGame({
  game,
  onFinish,
}: {
  game: MiniGame;
  onFinish: (stats: { accuracy: number }) => void;
}) {
  const data = game.data as Record<string, any>;
  const questions = useMemo<Question[]>(() => {
    if (Array.isArray(data.questions) && data.questions.length > 0) {
      return data.questions.map((q: any) => ({
        question: q.question ?? "",
        options: q.options ?? [],
        correct: q.correct ?? 0,
      }));
    }
    return [
      {
        question: data.question ?? "Complete the challenge",
        options: data.options ?? [],
        correct: data.correct ?? 0,
      },
    ];
  }, [data]);

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const q = questions[qIndex];
  const answered = selected !== null;
  const isCorrect = answered && selected === q.correct;
  const isLast = qIndex >= questions.length - 1;

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    if (idx === q.correct) {
      setScore((sc) => sc + 1);
      haptics.success();
      sfx.correct();
    } else {
      haptics.error();
      sfx.wrong();
    }
  };

  const handleContinue = () => {
    if (isLast) {
      const accuracy = Math.round((score / questions.length) * 100);
      sfx.complete();
      onFinish({ accuracy });
      return;
    }
    setQIndex((i) => i + 1);
    setSelected(null);
  };

  const optState = (idx: number): OptionState => {
    if (!answered) return "idle";
    if (idx === q.correct) return idx === selected ? "correct" : "reveal";
    if (idx === selected) return "wrong";
    return "idle";
  };

  const status: FeedbackStatus = answered ? (isCorrect ? "correct" : "wrong") : null;

  return (
    <View>
      {questions.length > 1 && (
        <Text style={s.counter}>
          {qIndex + 1} / {questions.length}
        </Text>
      )}
      <Text style={s.question}>{q.question}</Text>

      {q.options.map((opt, idx) => (
        <OptionRow
          key={`${qIndex}-${idx}`}
          text={opt}
          state={optState(idx)}
          disabled={answered}
          onPress={() => handleSelect(idx)}
        />
      ))}

      <FeedbackBanner
        status={status}
        wrongText="The correct answer is highlighted above."
        continueLabel={isLast ? "FINISH" : "NEXT"}
        onContinue={handleContinue}
      />
    </View>
  );
}

const s = StyleSheet.create({
  counter: {
    fontSize: 12,
    fontFamily: "Nunito_800ExtraBold",
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  question: {
    fontSize: 18,
    color: theme.colors.text,
    fontFamily: "Nunito_800ExtraBold",
    marginBottom: 16,
    lineHeight: 26,
  },
});

export default MCQGame;

import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CheckCircle2, XCircle, ChevronRight } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";

export function QuizComponent({ lesson, onComplete }: LessonComponentProps) {
  const data = lesson.data as Record<string, any>;
  const question: string = data.question ?? "";
  const options: string[] = data.options ?? [];
  const correctIndex: number = data.correct ?? 0;

  const [selected, setSelected] = useState<number | null>(null);
  const isCorrect = selected === correctIndex;
  const hasAnswered = selected !== null;

  const handleSelect = (idx: number) => {
    if (hasAnswered) return;
    setSelected(idx);
  };

  return (
    <View>
      <Text style={s.question}>{question}</Text>

      {options.map((option, idx) => {
        const isThis = selected === idx;
        const isRight = idx === correctIndex;

        let cardStyle = s.option;
        if (hasAnswered && isThis && isCorrect)
          cardStyle = { ...s.option, ...s.optionCorrect };
        else if (hasAnswered && isThis && !isCorrect)
          cardStyle = { ...s.option, ...s.optionWrong };
        else if (hasAnswered && isRight)
          cardStyle = { ...s.option, ...s.optionReveal };

        return (
          <TouchableOpacity
            key={idx}
            style={[
              s.option,
              hasAnswered && isThis && isCorrect && s.optionCorrect,
              hasAnswered && isThis && !isCorrect && s.optionWrong,
              hasAnswered && !isThis && isRight && s.optionReveal,
            ]}
            onPress={() => handleSelect(idx)}
            activeOpacity={0.7}
            disabled={hasAnswered}
          >
            <Text
              style={[
                s.optionText,
                hasAnswered && isThis && isCorrect && s.optionTextCorrect,
                hasAnswered && isThis && !isCorrect && s.optionTextWrong,
              ]}
            >
              {option}
            </Text>
            {hasAnswered && isThis && isCorrect && (
              <CheckCircle2 size={20} color={theme.colors.primary} />
            )}
            {hasAnswered && isThis && !isCorrect && (
              <XCircle size={20} color={theme.colors.error} />
            )}
          </TouchableOpacity>
        );
      })}

      {hasAnswered && (
        <View
          style={[s.feedback, isCorrect ? s.feedbackCorrect : s.feedbackWrong]}
        >
          <Text style={s.feedbackText}>
            {isCorrect
              ? "MashaAllah! Correct! 🎉"
              : `The correct answer is: ${options[correctIndex]}`}
          </Text>
        </View>
      )}

      {hasAnswered && (
        <TouchableOpacity style={s.continueBtn} onPress={onComplete}>
          <Text style={s.continueBtnText}>CONTINUE</Text>
          <ChevronRight size={18} color={theme.colors.onPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  question: {
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: "800",
    marginBottom: 20,
    lineHeight: 26,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: theme.colors.outline,
  },
  optionCorrect: {
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(136,217,130,0.1)",
  },
  optionWrong: {
    borderColor: theme.colors.error,
    backgroundColor: "rgba(255,180,171,0.1)",
  },
  optionReveal: {
    borderColor: "rgba(136,217,130,0.3)",
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: "600",
    flex: 1,
  },
  optionTextCorrect: { color: theme.colors.primary },
  optionTextWrong: { color: theme.colors.error },
  feedback: {
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  feedbackCorrect: {
    backgroundColor: "rgba(136,217,130,0.1)",
  },
  feedbackWrong: {
    backgroundColor: "rgba(255,180,171,0.1)",
  },
  feedbackText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: "700",
    textAlign: "center",
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 16,
    gap: 6,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.primaryContainer,
  },
  continueBtnText: {
    color: theme.colors.onPrimary,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },
});

import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { BlockComponentProps } from "./types";
import { haptics } from "../../../utils/haptics";
import { theme } from "../../../theme/themes";

export const QuizBlock = ({
  content,
  completed,
  onReady,
}: BlockComponentProps) => {
  const question = (content.question as string) ?? "";
  const options = (content.options as string[]) ?? [];
  const isQuizMode = "correct" in content;
  const correct = content.correct as number | undefined;

  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (i: number) => {
    if (selected !== null || completed) return;
    setSelected(i);
    onReady(true);
    if (isQuizMode && i === correct) {
      haptics.success();
    } else if (isQuizMode) {
      haptics.error();
    } else {
      haptics.selection();
    }
  };

  const getOptionStyle = (i: number) => {
    if (selected !== i) return s.option;
    if (!isQuizMode) return [s.option, s.optionSelected];
    return [s.option, i === correct ? s.optionCorrect : s.optionWrong];
  };

  const getTextStyle = (i: number) =>
    selected === i ? [s.optionText, s.optionTextSelected] : s.optionText;

  return (
    <View style={s.wrapper}>
      <Text style={s.question}>{question}</Text>
      {options.map((opt, i) => (
        <TouchableOpacity
          key={i}
          style={getOptionStyle(i)}
          onPress={() => handleSelect(i)}
          disabled={selected !== null || completed}
          activeOpacity={0.7}
        >
          <Text style={getTextStyle(i)}>{opt}</Text>
        </TouchableOpacity>
      ))}
      {selected !== null && isQuizMode && (
        <Text
          style={selected === correct ? s.feedbackCorrect : s.feedbackWrong}
        >
          {selected === correct
            ? "Correct! MashaAllah 🌟"
            : "Not quite — keep learning!"}
        </Text>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  wrapper: { marginBottom: 8 },
  question: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 20,
  },
  option: {
    backgroundColor: theme.colors.surfaceLow,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary10,
  },
  // optionCorrect reuses the same appearance as optionSelected intentionally
  optionCorrect: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary10,
  },
  optionWrong: {
    borderColor: theme.colors.errorAccent,
    backgroundColor: theme.colors.errorAccent10,
  },
  optionText: { color: theme.colors.text, fontSize: 16, fontWeight: "600" },
  optionTextSelected: { fontWeight: "800" },
  feedbackCorrect: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
  feedbackWrong: {
    color: theme.colors.errorAccent,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
});

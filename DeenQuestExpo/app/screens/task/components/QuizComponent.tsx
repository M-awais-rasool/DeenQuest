import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import type { ComponentProps } from "./types";
import { CompleteButton } from "./CompleteButton";
import { shared } from "./sharedStyles";

export const QuizComponent = ({
  task,
  onComplete,
  loading,
}: ComponentProps) => {
  const question = (task.data?.question as string) ?? "";
  const options = (task.data?.options as string[]) ?? [];
  const correct = (task.data?.correct as number) ?? 0;
  const [selected, setSelected] = useState<number | null>(null);

  const isCorrect = selected === correct;

  return (
    <View style={shared.container}>
      <Text style={shared.quizQuestion}>{question}</Text>
      {options.map((opt, i) => (
        <TouchableOpacity
          key={i}
          style={[
            shared.quizOption,
            selected === i &&
              (isCorrect ? shared.quizOptionCorrect : shared.quizOptionWrong),
          ]}
          onPress={() => setSelected(i)}
          disabled={selected !== null}
          activeOpacity={0.7}
        >
          <Text
            style={[
              shared.quizOptionText,
              selected === i && shared.quizOptionTextSelected,
            ]}
          >
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
      {selected !== null && (
        <Text
          style={
            isCorrect ? shared.quizFeedbackCorrect : shared.quizFeedbackWrong
          }
        >
          {isCorrect ? "Correct! MashaAllah 🌟" : "Not quite — keep learning!"}
        </Text>
      )}
      <CompleteButton
        onPress={onComplete}
        loading={loading}
        disabled={task.completed || selected === null}
      />
    </View>
  );
};

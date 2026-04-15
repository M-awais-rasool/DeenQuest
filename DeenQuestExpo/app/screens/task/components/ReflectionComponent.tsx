import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import type { ComponentProps } from "./types";
import { CompleteButton } from "./CompleteButton";
import { shared } from "./sharedStyles";

export const ReflectionComponent = ({
  task,
  onComplete,
  loading,
}: ComponentProps) => {
  const question = (task.data?.question as string) ?? "";
  const options = (task.data?.options as string[]) ?? [];
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <View style={shared.container}>
      <Text style={shared.reflectionQuestion}>{question}</Text>
      {options.map((opt, i) => (
        <TouchableOpacity
          key={i}
          style={[
            shared.reflectionOption,
            selected === i && shared.reflectionSelected,
          ]}
          onPress={() => setSelected(i)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              shared.reflectionOptionText,
              selected === i && shared.reflectionSelectedText,
            ]}
          >
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
      <CompleteButton
        onPress={onComplete}
        loading={loading}
        disabled={task.completed || selected === null}
      />
    </View>
  );
};

import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import type { ComponentProps } from "./types";
import { CompleteButton } from "./CompleteButton";
import { shared } from "./sharedStyles";

export const CounterComponent = ({
  task,
  onComplete,
  loading,
}: ComponentProps) => {
  const target = (task.data?.target as number) ?? 33;
  const text = (task.data?.text as string) ?? "";
  const [count, setCount] = useState(0);

  const done = count >= target;

  return (
    <View style={shared.container}>
      <Text style={shared.counterPhrase}>{text}</Text>
      <Text style={shared.counterCount}>
        {count} / {target}
      </Text>
      <View style={shared.counterProgress}>
        <View
          style={[shared.counterBar, { width: `${(count / target) * 100}%` }]}
        />
      </View>
      <TouchableOpacity
        style={shared.counterTapBtn}
        onPress={() => !done && setCount((c) => c + 1)}
        disabled={done}
        activeOpacity={0.6}
      >
        <Text style={shared.counterTapText}>{done ? "Done!" : "Tap"}</Text>
      </TouchableOpacity>
      <CompleteButton
        onPress={onComplete}
        loading={loading}
        disabled={task.completed || !done}
      />
    </View>
  );
};

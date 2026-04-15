import React from "react";
import { View, Text } from "react-native";
import type { ComponentProps } from "./types";
import { CompleteButton } from "./CompleteButton";
import { shared } from "./sharedStyles";

export const ActionComponent = ({
  task,
  onComplete,
  loading,
}: ComponentProps) => {
  const instruction = (task.data?.instruction as string) ?? "";

  return (
    <View style={shared.container}>
      <View style={shared.actionCard}>
        <Text style={shared.actionInstruction}>{instruction}</Text>
      </View>
      <CompleteButton
        onPress={onComplete}
        loading={loading}
        disabled={task.completed}
        label="Done!"
      />
    </View>
  );
};

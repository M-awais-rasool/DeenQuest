import React from "react";
import { View, Text } from "react-native";
import type { ComponentProps } from "./types";
import { CompleteButton } from "./CompleteButton";
import { shared } from "./sharedStyles";

export const TipsComponent = ({
  task,
  onComplete,
  loading,
}: ComponentProps) => {
  const tips = (task.data?.tips as string[]) ?? [];

  return (
    <View style={shared.container}>
      {tips.map((tip, i) => (
        <View key={i} style={shared.tipItem}>
          <View style={shared.tipBullet}>
            <Text style={shared.tipBulletText}>{i + 1}</Text>
          </View>
          <Text style={shared.tipText}>{tip}</Text>
        </View>
      ))}
      <CompleteButton
        onPress={onComplete}
        loading={loading}
        disabled={task.completed}
        label="I'll Practice These"
      />
    </View>
  );
};

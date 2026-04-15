import React from "react";
import { View, Text } from "react-native";
import type { ComponentProps } from "./types";
import { CompleteButton } from "./CompleteButton";
import { shared } from "./sharedStyles";

export const HadithComponent = ({
  task,
  onComplete,
  loading,
}: ComponentProps) => {
  const hadith = (task.data?.hadith as string) ?? "";
  const reference = (task.data?.reference as string) ?? "";

  return (
    <View style={shared.container}>
      <View style={shared.hadithCard}>
        <Text style={shared.hadithQuote}>"{hadith}"</Text>
        <Text style={shared.hadithRef}>— {reference}</Text>
      </View>
      <CompleteButton
        onPress={onComplete}
        loading={loading}
        disabled={task.completed}
        label="I've Reflected"
      />
    </View>
  );
};

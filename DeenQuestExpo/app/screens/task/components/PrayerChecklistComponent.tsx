import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import type { ComponentProps } from "./types";
import { CompleteButton } from "./CompleteButton";
import { shared } from "./sharedStyles";

export const PrayerChecklistComponent = ({
  task,
  onComplete,
  loading,
}: ComponentProps) => {
  const steps: string[] = (task.data?.steps as string[]) ?? [];
  const [checked, setChecked] = useState<boolean[]>(
    new Array(steps.length).fill(false),
  );

  const toggle = (i: number) => {
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
  };

  const allChecked = steps.length > 0 && checked.every(Boolean);

  return (
    <View style={shared.container}>
      {steps.map((step, i) => (
        <TouchableOpacity
          key={i}
          style={[shared.checklistItem, checked[i] && shared.checklistItemDone]}
          onPress={() => toggle(i)}
          activeOpacity={0.7}
        >
          <View style={[shared.checkbox, checked[i] && shared.checkboxChecked]}>
            {checked[i] && <Text style={shared.checkMark}>✓</Text>}
          </View>
          <Text
            style={[
              shared.checklistText,
              checked[i] && shared.checklistTextDone,
            ]}
          >
            {step}
          </Text>
        </TouchableOpacity>
      ))}
      <CompleteButton
        onPress={onComplete}
        loading={loading}
        disabled={task.completed || !allChecked}
      />
    </View>
  );
};

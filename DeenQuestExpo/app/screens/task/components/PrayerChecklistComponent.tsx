import React, { useState, useEffect, useRef } from "react";
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
    new Array(steps.length).fill(task.completed),
  );
  const hasAutoCompleted = useRef(false);

  const allChecked = steps.length > 0 && checked.every(Boolean);
  const isLocked = task.completed || loading;

  useEffect(() => {
    if (allChecked && !task.completed && !hasAutoCompleted.current) {
      hasAutoCompleted.current = true;
      onComplete();
    }
  }, [allChecked, task.completed, onComplete]);

  const toggle = (i: number) => {
    if (isLocked) return;
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
  };

  return (
    <View style={shared.container}>
      {steps.map((step, i) => (
        <TouchableOpacity
          key={i}
          style={[
            shared.checklistItem,
            checked[i] && shared.checklistItemDone,
            isLocked && shared.checklistItemLocked,
          ]}
          onPress={() => toggle(i)}
          disabled={isLocked || checked[i]}
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
      {/* Show spinner while the API call is in-flight after auto-complete. */}
      {(allChecked || loading) && (
        <CompleteButton
          onPress={onComplete}
          loading={loading}
          disabled={task.completed || !allChecked}
        />
      )}
    </View>
  );
};

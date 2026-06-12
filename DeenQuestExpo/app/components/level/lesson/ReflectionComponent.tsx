import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { TactilePressable } from "../../ui";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";
import { ContinueButton } from "./shared";

export function ReflectionComponent({
  lesson,
  onComplete,
}: LessonComponentProps) {
  const data = lesson.data as Record<string, any>;
  const question: string = data.question ?? "";
  const options: string[] = data.options ?? [];
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <View>
      <Text style={s.question}>{question}</Text>

      {options.map((option, idx) => (
        <TactilePressable
          key={idx}
          edgeColor={
            selected === idx ? theme.colors.primary : theme.colors.outline
          }
          radius={14}
          haptic="selection"
          style={s.optionWrap}
          faceStyle={[s.option, selected === idx && s.optionSelected]}
          onPress={() => setSelected(idx)}
        >
          <Text
            style={[s.optionText, selected === idx && s.optionTextSelected]}
          >
            {option}
          </Text>
        </TactilePressable>
      ))}

      {selected !== null && (
        <View style={s.reflectionBox}>
          <Text style={s.reflectionText}>
            JazakAllah Khair for reflecting! Self-awareness is a sign of a
            strong believer. 💚
          </Text>
        </View>
      )}

      {selected !== null && (
        <ContinueButton onPress={onComplete} style={{ marginTop: 16 }} />
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
  optionWrap: {
    marginBottom: 10,
  },
  option: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: theme.colors.outline,
  },
  optionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary10,
  },
  optionText: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: "600",
  },
  optionTextSelected: {
    color: theme.colors.primary,
  },
  reflectionBox: {
    backgroundColor: theme.colors.primary08,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  reflectionText: {
    fontSize: 14,
    color: theme.colors.primary,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 20,
  },
});

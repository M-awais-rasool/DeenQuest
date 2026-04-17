import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";

export function ReflectionComponent({ lesson, onComplete }: LessonComponentProps) {
  const data = lesson.data as Record<string, any>;
  const question: string = data.question ?? "";
  const options: string[] = data.options ?? [];
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <View>
      <Text style={s.question}>{question}</Text>

      {options.map((option, idx) => (
        <TouchableOpacity
          key={idx}
          style={[s.option, selected === idx && s.optionSelected]}
          onPress={() => setSelected(idx)}
          activeOpacity={0.7}
        >
          <Text
            style={[s.optionText, selected === idx && s.optionTextSelected]}
          >
            {option}
          </Text>
        </TouchableOpacity>
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
        <TouchableOpacity style={s.continueBtn} onPress={onComplete}>
          <Text style={s.continueBtnText}>CONTINUE</Text>
          <ChevronRight size={18} color={theme.colors.onPrimary} />
        </TouchableOpacity>
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
  option: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: theme.colors.outline,
  },
  optionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(136,217,130,0.1)",
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
    backgroundColor: "rgba(136,217,130,0.08)",
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
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 16,
    gap: 6,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.primaryContainer,
  },
  continueBtnText: {
    color: theme.colors.onPrimary,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },
});

import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { TactilePressable } from "../../ui";
import { CheckCircle, Circle } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";
import { FadeInView, ContinueButton } from "./shared";

export function PrayerChecklistComponent({
  lesson,
  onComplete,
}: LessonComponentProps) {
  const data = lesson.data as Record<string, any>;
  const steps: string[] = data.steps ?? [];
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (idx: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const allChecked = checked.size >= steps.length;

  return (
    <View>
      {steps.map((step, idx) => {
        const done = checked.has(idx);
        return (
          <FadeInView key={idx} delay={idx * 60}>
            <TactilePressable
              edgeColor={
                done ? theme.colors.primary30 : theme.colors.outline
              }
              depth={3}
              radius={14}
              haptic="selection"
              style={s.itemWrap}
              faceStyle={[s.item, done && s.itemDone]}
              onPress={() => toggle(idx)}
            >
              {done ? (
                <CheckCircle size={20} color={theme.colors.primary} />
              ) : (
                <Circle size={20} color={theme.colors.textMuted} />
              )}
              <Text style={[s.itemText, done && s.itemTextDone]}>{step}</Text>
            </TactilePressable>
          </FadeInView>
        );
      })}

      {allChecked && (
        <ContinueButton onPress={onComplete} style={{ marginTop: 16 }} />
      )}

      {!allChecked && <Text style={s.hint}>Tap each item to check it off</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  itemWrap: {
    marginBottom: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  itemDone: {
      borderColor: theme.colors.primary30,
      backgroundColor: theme.colors.primary05,
  },
  itemText: {
    fontSize: 15,
    color: theme.colors.text,
    flex: 1,
  },
  itemTextDone: {
    color: theme.colors.primary,
  },
  hint: {
    textAlign: "center",
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 16,
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
    fontFamily: "Nunito_900Black",
    fontSize: 16,
    letterSpacing: 1,
  },
});

import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CheckCircle, Circle, ChevronRight } from "lucide-react-native";
import { theme } from "../../../theme/themes";
import type { LessonComponentProps } from "./types";

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
          <TouchableOpacity
            key={idx}
            style={[s.item, done && s.itemDone]}
            onPress={() => toggle(idx)}
            activeOpacity={0.7}
          >
            {done ? (
              <CheckCircle size={20} color={theme.colors.primary} />
            ) : (
              <Circle size={20} color={theme.colors.textMuted} />
            )}
            <Text style={[s.itemText, done && s.itemTextDone]}>{step}</Text>
          </TouchableOpacity>
        );
      })}

      {allChecked && (
        <TouchableOpacity style={s.continueBtn} onPress={onComplete}>
          <Text style={s.continueBtnText}>ALL DONE!</Text>
          <ChevronRight size={18} color={theme.colors.onPrimary} />
        </TouchableOpacity>
      )}

      {!allChecked && <Text style={s.hint}>Tap each item to check it off</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  itemDone: {
    borderColor: "rgba(136,217,130,0.3)",
    backgroundColor: "rgba(136,217,130,0.05)",
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
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },
});

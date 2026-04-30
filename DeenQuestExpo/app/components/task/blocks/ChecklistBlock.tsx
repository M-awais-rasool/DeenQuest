import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { BlockComponentProps } from "./types";
import { theme } from "../../../theme/themes";

export const ChecklistBlock = ({
  content,
  completed,
  loading,
  onAutoComplete,
}: BlockComponentProps) => {
  const items = (content.items as string[]) ?? [];
  const [checked, setChecked] = useState<boolean[]>(
    new Array(items.length).fill(completed),
  );

  const allChecked = items.length > 0 && checked.every(Boolean);
  const isLocked = completed || loading;

  useEffect(() => {
    if (allChecked && !completed) {
      onAutoComplete();
    }
  }, [allChecked, completed, onAutoComplete]);

  const toggle = (i: number) => {
    if (isLocked || checked[i]) return;
    setChecked((prev) => {
      const next = [...prev];
      next[i] = true;
      return next;
    });
  };

  return (
    <View style={s.wrapper}>
      {items.map((item, i) => (
        <TouchableOpacity
          key={i}
          style={[s.row, checked[i] && s.rowDone, isLocked && s.rowLocked]}
          onPress={() => toggle(i)}
          disabled={isLocked || checked[i]}
          activeOpacity={0.7}
        >
          <View style={[s.box, checked[i] && s.boxChecked]}>
            {checked[i] && <Text style={s.check}>✓</Text>}
          </View>
          <Text style={[s.label, checked[i] && s.labelDone]}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const s = StyleSheet.create({
  wrapper: { marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceLow,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    gap: 14,
  },
  rowDone: { opacity: 0.6 },
  rowLocked: { opacity: 0.65 },
  box: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.outline,
    justifyContent: "center",
    alignItems: "center",
  },
  boxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  check: { color: theme.colors.onPrimary, fontWeight: "900", fontSize: 14 },
  label: { color: theme.colors.text, fontSize: 16, fontWeight: "600" },
  labelDone: { textDecorationLine: "line-through", opacity: 0.7 },
});

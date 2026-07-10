import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { TactilePressable } from "../../ui";
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
        <TactilePressable
          key={i}
          edgeColor={theme.colors.outline}
          depth={3}
          radius={12}
          haptic="selection"
          dimWhenDisabled={false}
          style={s.rowWrap}
          faceStyle={[s.row, checked[i] && s.rowDone, isLocked && s.rowLocked]}
          onPress={() => toggle(i)}
          disabled={isLocked || checked[i]}
        >
          <View style={[s.box, checked[i] && s.boxChecked]}>
            {checked[i] && <Text style={s.check}>✓</Text>}
          </View>
          <Text style={[s.label, checked[i] && s.labelDone]}>{item}</Text>
        </TactilePressable>
      ))}
    </View>
  );
};

const s = StyleSheet.create({
  wrapper: { marginBottom: 8 },
  rowWrap: {
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    padding: 16,
    borderRadius: 16,
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
  check: { color: theme.colors.onPrimary, fontFamily: "Nunito_900Black", fontSize: 14 },
  label: { color: theme.colors.text, fontSize: 16, fontFamily: "Nunito_600SemiBold" },
  labelDone: { textDecorationLine: "line-through", opacity: 0.7 },
});

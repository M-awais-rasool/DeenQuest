import React from "react";
import { Text, ActivityIndicator, StyleSheet } from "react-native";
import { TactilePressable } from "../ui";
import { theme } from "../../theme/themes";

interface Props {
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
  label?: string;
}

export const CompleteButton = ({
  onPress,
  loading,
  disabled,
  label = "Mark Complete",
}: Props) => (
  <TactilePressable
    style={s.wrap}
    faceStyle={s.btn}
    edgeColor={theme.colors.primaryContainer}
    radius={16}
    haptic="medium"
    onPress={onPress}
    disabled={disabled || loading}
  >
    {loading ? (
      <ActivityIndicator color={theme.colors.onPrimary} size="small" />
    ) : (
      <Text style={s.text}>{disabled ? "Completed ✓" : label}</Text>
    )}
  </TactilePressable>
);

const s = StyleSheet.create({
  wrap: {
    marginTop: 24,
  },
  btn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  text: {
    color: theme.colors.onPrimary,
    fontWeight: "900",
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});

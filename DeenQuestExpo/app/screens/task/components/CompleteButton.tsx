import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { theme } from "../../../theme/themes";

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
  <TouchableOpacity
    style={[s.btn, disabled && s.btnDisabled]}
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.8}
  >
    {loading ? (
      <ActivityIndicator color={theme.colors.onPrimary} size="small" />
    ) : (
      <Text style={s.text}>{disabled ? "Completed ✓" : label}</Text>
    )}
  </TouchableOpacity>
);

const s = StyleSheet.create({
  btn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 24,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.primaryContainer,
  },
  btnDisabled: { opacity: 0.5 },
  text: {
    color: theme.colors.onPrimary,
    fontWeight: "900",
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});

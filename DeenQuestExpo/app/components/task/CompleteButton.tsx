import React from "react";
import { Text, ActivityIndicator, StyleSheet, View } from "react-native";
import { TactilePressable } from "../ui";
import { theme } from "../../theme/themes";

interface Props {
  onPress: () => void;
  loading: boolean;
  /** Task already completed — shows the done state. */
  completed: boolean;
  /** Completion requirements not met yet — muted, non-pressable (B2 mock). */
  locked?: boolean;
  /** Helper line under the button, e.g. "Unlocks at 33 — 12 to go". */
  helper?: string;
  label?: string;
}

export const CompleteButton = ({
  onPress,
  loading,
  completed,
  locked = false,
  helper,
  label = "COMPLETE",
}: Props) => {
  const inactive = completed || locked;

  return (
    <View style={s.wrap}>
      <TactilePressable
        faceStyle={[s.btn, inactive && s.btnInactive]}
        edgeColor={inactive ? theme.colors.surfaceHigh : theme.colors.shadowGreen}
        radius={18}
        haptic="medium"
        dimWhenDisabled={false}
        onPress={onPress}
        disabled={inactive || loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.onPrimary} size="small" />
        ) : (
          <Text style={[s.text, inactive && s.textInactive]}>
            {completed ? "COMPLETED ✓" : label}
          </Text>
        )}
      </TactilePressable>
      {!!helper && !completed && <Text style={s.helper}>{helper}</Text>}
    </View>
  );
};

const s = StyleSheet.create({
  wrap: {
    marginTop: 24,
    gap: 9,
  },
  btn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 17,
    borderRadius: 18,
    alignItems: "center",
  },
  btnInactive: {
    backgroundColor: theme.colors.surfaceHigh,
  },
  text: {
    color: theme.colors.onPrimary,
    fontFamily: "Nunito_900Black",
    fontSize: 15,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  textInactive: {
    color: "#5F7E7C",
  },
  helper: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: "#5F7E7C",
    textAlign: "center",
  },
});

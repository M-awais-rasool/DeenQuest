import React, { useEffect } from "react";
import {
  Text,
  StyleSheet,
  Animated,
  StyleProp,
  ViewStyle,
} from "react-native";
import { theme } from "../../../../theme/themes";
import { useQuranFont } from "../../../../hooks/useQuranFont";
import { TactilePressable } from "../../../ui";
import { useFeedbackAnim } from "./animations";

export type ChipState = "idle" | "selected" | "correct" | "wrong" | "disabled";
export type ChipSize = "sm" | "md" | "lg";

const FONT_SIZE: Record<ChipSize, number> = { sm: 22, md: 30, lg: 42 };
const PAD_V: Record<ChipSize, number> = { sm: 8, md: 12, lg: 16 };
const PAD_H: Record<ChipSize, number> = { sm: 14, md: 18, lg: 22 };

/**
 * Pressable Arabic token used by the build / fill-blank / match tasks.
 * Renders in the Quran font with the shared tactile press effect, and
 * animates declaratively from its `state`: a pop on tap/correct and a
 * shake on a wrong answer.
 */
export function ArabicChip({
  label,
  onPress,
  state = "idle",
  size = "md",
  style,
  fullWidth = false,
}: {
  label: string;
  onPress?: () => void;
  state?: ChipState;
  size?: ChipSize;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}) {
  const { fontFamily } = useQuranFont();
  const { shake, pop, style: animStyle } = useFeedbackAnim();

  useEffect(() => {
    if (state === "wrong") shake();
    else if (state === "correct" || state === "selected") pop();
  }, [state, shake, pop]);

  const palette = STATE_PALETTE[state];
  const disabled = state === "disabled" || !onPress;

  return (
    <Animated.View style={[fullWidth && { alignSelf: "stretch" }, animStyle]}>
      <TactilePressable
        disabled={disabled}
        dimWhenDisabled={false}
        onPress={onPress}
        edgeColor={palette.border}
        depth={3}
        radius={14}
        haptic="none"
        style={[state === "disabled" && s.chipDisabled, style]}
        faceStyle={[
          s.chip,
          {
            backgroundColor: palette.bg,
            borderColor: palette.border,
            paddingVertical: PAD_V[size],
            paddingHorizontal: PAD_H[size],
          },
          fullWidth && s.chipFull,
        ]}
      >
        <Text
          style={[
            s.text,
            { color: palette.fg, fontFamily, fontSize: FONT_SIZE[size] },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </TactilePressable>
    </Animated.View>
  );
}

const STATE_PALETTE: Record<
  ChipState,
  { bg: string; fg: string; border: string }
> = {
  idle: {
    bg: theme.colors.surface,
    fg: theme.colors.text,
    border: theme.colors.outline,
  },
  selected: {
    bg: theme.colors.primaryContainer,
    fg: "#5EE0CE",
    border: theme.colors.primary,
  },
  correct: {
    bg: theme.colors.primaryContainer,
    fg: "#5EE0CE",
    border: theme.colors.primary,
  },
  wrong: {
    bg: "#3A1E24",
    fg: theme.colors.error,
    border: theme.colors.error,
  },
  disabled: {
    bg: theme.colors.surfaceLow,
    fg: theme.colors.textMuted,
    border: theme.colors.outline,
  },
};

const s = StyleSheet.create({
  chip: {
    borderRadius: 20,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  chipFull: {
    alignSelf: "stretch",
  },
  chipDisabled: {
    opacity: 0.45,
  },
  text: {
    writingDirection: "rtl",
    fontFamily: "Nunito_400Regular",
    lineHeight: undefined,
  },
});

export default ArabicChip;

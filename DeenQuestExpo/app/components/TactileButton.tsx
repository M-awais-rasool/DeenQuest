import React from "react";
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { theme } from "../theme/themes";
import { TactilePressable } from "./ui";

export type TactileVariant =
  | "primary"
  | "secondary"
  | "gold"
  | "danger"
  | "ghost";
export type TactileSize = "sm" | "md" | "lg";

interface TactileButtonProps {
  title: string;
  onPress: () => void;
  variant?: TactileVariant;
  size?: TactileSize;
  disabled?: boolean;
  loading?: boolean;
  /** Optional icon rendered before/after the label. */
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const PALETTE: Record<
  TactileVariant,
  { bg: string; fg: string; edge: string }
> = {
  primary: {
    bg: theme.colors.primary,
    fg: theme.colors.onPrimary,
    edge: theme.colors.primaryContainer,
  },
  secondary: {
    bg: theme.colors.surfaceHigh,
    fg: theme.colors.secondary,
    edge: theme.colors.outline,
  },
  gold: {
    bg: theme.colors.secondary,
    fg: theme.colors.onSecondary,
    edge: theme.colors.goldDark,
  },
  danger: {
    bg: theme.colors.errorAccent,
    fg: theme.colors.white,
    edge: theme.colors.errorStrong,
  },
  ghost: {
    bg: theme.colors.surfaceHigh,
    fg: theme.colors.text,
    edge: theme.colors.outline,
  },
};

const SIZE: Record<TactileSize, { padV: number; padH: number; font: number }> =
  {
    sm: { padV: 10, padH: 16, font: 13 },
    md: { padV: 16, padH: 24, font: 14 },
    lg: { padV: 18, padH: 28, font: 16 },
  };

/**
 * The app-wide labeled button: shares the exact level-node press effect
 * (face sinks onto its darker edge with a haptic tick) via TactilePressable.
 */
export const TactileButton: React.FC<TactileButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  iconLeft,
  iconRight,
  style,
  textStyle,
}) => {
  const palette = PALETTE[variant];
  const dims = SIZE[size];

  return (
    <TactilePressable
      onPress={onPress}
      disabled={disabled || loading}
      edgeColor={palette.edge}
      radius={theme.borderRadius.sm}
      haptic={variant === "primary" || variant === "gold" ? "medium" : "light"}
      style={style}
      faceStyle={[
        styles.face,
        {
          backgroundColor: palette.bg,
          paddingVertical: dims.padV,
          paddingHorizontal: dims.padH,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {iconLeft}
          <Text
            style={[
              styles.text,
              { color: palette.fg, fontSize: dims.font },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {iconRight}
        </View>
      )}
    </TactilePressable>
  );
};

const styles = StyleSheet.create({
  face: {
    borderRadius: theme.borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  text: {
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});

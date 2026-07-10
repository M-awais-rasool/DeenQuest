import { Dimensions, Easing } from "react-native";
import { theme } from "../../theme/themes";

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const COLORS = {
  background: theme.colors.background,
  surface: theme.colors.surface,
  surfaceHigh: theme.colors.surfaceHigh,
  primary: theme.colors.primary,
  primaryContainer: theme.colors.primaryContainer,
  onPrimary: theme.colors.onPrimary,
  secondary: theme.colors.secondary,
  onSecondary: theme.colors.onSecondary,
  text: theme.colors.text,
  textMuted: theme.colors.textMuted,
  outline: theme.colors.outline,
  white: theme.colors.white,
} as const;

export const FONTS = {
  headline: "Nunito_800ExtraBold",
  body: "Nunito_600SemiBold",
} as const;

/** The exact Duolingo-style spring easing */
export const SPRING_EASE = Easing.bezier(0.34, 1.56, 0.64, 1);

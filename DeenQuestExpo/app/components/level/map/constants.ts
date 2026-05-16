import { Dimensions } from "react-native";
import { theme } from "../../../theme/themes";
import type { LevelStatus } from "../../../store/services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const NODE_SIZE = 72;
export const NODE_DEPTH = 8;

export function getNodeOffset(index: number): number {
  const amplitude = SCREEN_WIDTH * 0.22;
  return Math.sin((index * Math.PI) / 3) * amplitude;
}

export const STATUS_CONFIG: Record<
  LevelStatus,
  {
    topBg: string;
    bottomBg: string;
    borderColor: string;
    iconColor: string;
    baseColor: string;
    progressColor: string;
  }
> = {
  locked: {
    topBg: theme.colors.surfaceHigh,
    bottomBg: theme.colors.surfaceLow,
    borderColor: theme.colors.outline,
    iconColor: theme.colors.textMuted,
    baseColor: "transparent",
    progressColor: "transparent",
  },
  available: {
    topBg: theme.colors.primary,
    bottomBg: theme.colors.shadowGreen,
    borderColor: theme.colors.primary,
    iconColor: theme.colors.whiteSoft,
    baseColor: theme.colors.primary15,
    progressColor: theme.colors.secondary,
  },
  in_progress: {
    topBg: theme.colors.primary,
    bottomBg: theme.colors.shadowGreen,
    borderColor: theme.colors.primary,
    iconColor: theme.colors.whiteSoft,
    baseColor: theme.colors.primary15,
    progressColor: theme.colors.secondary,
  },
  completed: {
    topBg: theme.colors.primary,
    bottomBg: theme.colors.shadowGreen,
    borderColor: theme.colors.primary,
    iconColor: theme.colors.whiteSoft,
    baseColor: theme.colors.primary15,
    progressColor: theme.colors.secondary,
  },
};

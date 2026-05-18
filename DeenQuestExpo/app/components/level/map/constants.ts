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

export const LEVEL_GREEN = "#43A047"; // Main popup bg, node border
export const LEVEL_GREEN_LIGHT = "#66BB6A"; // 3D node top
export const LEVEL_GREEN_DARK = "#2E7D32"; // 3D node bottom shadow
export const LEVEL_GREEN_DEEP = "#1B5E20"; // Button text on white
export const LEVEL_GREEN_GLOW = "rgba(67, 160, 71, 0.15)"; // Subtle node glow

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
    topBg: LEVEL_GREEN_LIGHT,
    bottomBg: LEVEL_GREEN_DARK,
    borderColor: LEVEL_GREEN,
    iconColor: theme.colors.white,
    baseColor: LEVEL_GREEN_GLOW,
    progressColor: theme.colors.secondary,
  },
  in_progress: {
    topBg: LEVEL_GREEN_LIGHT,
    bottomBg: LEVEL_GREEN_DARK,
    borderColor: LEVEL_GREEN,
    iconColor: theme.colors.white,
    baseColor: LEVEL_GREEN_GLOW,
    progressColor: theme.colors.secondary,
  },
  completed: {
    topBg: LEVEL_GREEN_LIGHT,
    bottomBg: LEVEL_GREEN_DARK,
    borderColor: LEVEL_GREEN,
    iconColor: theme.colors.white,
    baseColor: LEVEL_GREEN_GLOW,
    progressColor: theme.colors.secondary,
  },
};

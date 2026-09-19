import { Dimensions } from "react-native";
import { theme } from "../../../theme/themes";
import type { LevelStatus } from "../../../store/services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ISLAND_ASPECT = 152 / 204;
const CIRCLE_OF_ISLAND_W = 0.4706;
const CIRCLE_CY_OF_ISLAND_H = 0.1842;
const PILL_TOP_OF_ISLAND_H = 0.5066;

export const NODE_SIZE = 58;
export const ACTIVE_NODE_SIZE = 62;
export const ISLAND_W = Math.round(NODE_SIZE / CIRCLE_OF_ISLAND_W);
export const ISLAND_H = Math.round(ISLAND_W * ISLAND_ASPECT);
export const CIRCLE_CY = Math.round(ACTIVE_NODE_SIZE / 2);
export const ISLAND_TOP = Math.round(
  CIRCLE_CY - CIRCLE_CY_OF_ISLAND_H * ISLAND_H,
);
export const BLOCK_H = ISLAND_TOP + ISLAND_H;
export const PILL_TOP = Math.round(
  ISLAND_TOP + PILL_TOP_OF_ISLAND_H * ISLAND_H,
);
export const PILL_H = 29;

const TROPHY_ART = {
  w: 192,
  h: 180,
  islandOfW: 178 / 192,
  islandTopOfH: 52 / 180,
};
const ISLAND_OF_W = 184 / 204;
const ISLAND_TOP_OF_H = 8 / 152;

export const TROPHY_W = Math.round(
  (ISLAND_W * ISLAND_OF_W) / TROPHY_ART.islandOfW,
);
export const TROPHY_H = Math.round(TROPHY_W * (TROPHY_ART.h / TROPHY_ART.w));
export const TROPHY_TOP = Math.round(
  ISLAND_TOP + ISLAND_TOP_OF_H * ISLAND_H - TROPHY_ART.islandTopOfH * TROPHY_H,
);

export const CIRCLE_TOUCH = ACTIVE_NODE_SIZE + 30;
export const ROW_PITCH = 98;

const SWAY_AMPLITUDE = SCREEN_WIDTH * 0.205;
const SWAY = [0.62, 1, 1.06, 1, 0.98, 0.7];

export function getNodeOffset(index: number): number {
  const direction = index % 2 === 0 ? -1 : 1;
  return direction * SWAY_AMPLITUDE * SWAY[index % SWAY.length];
}

export const PATH_CYAN = theme.colors.primary;
export const PATH_CYAN_BRIGHT = "#8FFFF3";
export const PATH_CYAN_DEEP = "#04343A";
/** The night the scene sits on — the app's own, shared with every screen. */
export const PATH_NIGHT = theme.colors.background;
export const PATH_GOLD = "#F2E273";

export const LEVEL_GREEN = theme.colors.primary; // Main popup bg, node border
export const LEVEL_GREEN_LIGHT = theme.colors.primary; // node top
export const LEVEL_GREEN_DARK = theme.colors.shadowGreen; // node bottom shadow
export const LEVEL_GREEN_DEEP = theme.colors.onPrimary; // Button text on white
export const LEVEL_GREEN_GLOW = theme.colors.primary15; // Subtle node glow

export interface SectionColors {
  accent: string;
  light: string;
  base: string;
  dark: string;
  deep: string;
  glow: string;
}

/** Default green identity — matches the original single-course look. */
export const DEFAULT_SECTION_COLORS: SectionColors = {
  accent: LEVEL_GREEN,
  light: LEVEL_GREEN_LIGHT,
  base: LEVEL_GREEN,
  dark: LEVEL_GREEN_DARK,
  deep: LEVEL_GREEN_DEEP,
  glow: LEVEL_GREEN_GLOW,
};

export interface NodeVisual {
  face: [string, string];
  borderColor: string;
  borderWidth: number;
  iconColor: string;
  halo: string | null;
  labelFill: string;
  labelBorder: string;
  labelText: string;
}

export function nodeVisual(
  status: LevelStatus,
  colors: SectionColors = DEFAULT_SECTION_COLORS,
): NodeVisual {
  if (status === "locked") {
    return {
      face: ["#16353F", "#05101A"],
      borderColor: "rgba(139, 183, 196, 0.30)",
      borderWidth: 1.5,
      iconColor: "#9FB3BE",
      halo: null,
      labelFill: "rgba(9, 24, 34, 0.74)",
      labelBorder: "rgba(130, 168, 182, 0.32)",
      labelText: "#C4D5DE",
    };
  }

  if (status === "completed") {
    return {
      face: [hexToRgba(colors.dark, 0.95), hexToRgba(colors.deep, 0.95)],
      borderColor: hexToRgba(colors.accent, 0.6),
      borderWidth: 2,
      iconColor: colors.accent,
      // No halo: only the stop you are on gets to glow.
      halo: null,
      labelFill: "rgba(6, 34, 36, 0.8)",
      labelBorder: hexToRgba(colors.accent, 0.5),
      labelText: "#DDF3EF",
    };
  }

  return {
    face: ["#4BF0DE", "#0E8F92"],
    borderColor: PATH_CYAN_BRIGHT,
    borderWidth: 4,
    iconColor: theme.colors.white,
    halo: "rgba(47, 227, 208, 0.18)",
    labelFill: "rgba(4, 42, 46, 0.88)",
    labelBorder: PATH_CYAN,
    labelText: theme.colors.white,
  };
}

/** Convert a 6-digit hex color to an `rgba()` string at the given alpha. */
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

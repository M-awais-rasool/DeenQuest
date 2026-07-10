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

export const LEVEL_GREEN = "#2CC9B5"; // Main popup bg, node border
export const LEVEL_GREEN_LIGHT = "#2CC9B5"; // 3D node top
export const LEVEL_GREEN_DARK = "#1B9484"; // 3D node bottom shadow
export const LEVEL_GREEN_DEEP = "#06302B"; // Button text on white
export const LEVEL_GREEN_GLOW = "rgba(44, 201, 181, 0.15)"; // Subtle node glow

/**
 * A full shade set that gives one section its own color identity. Every
 * section on the learning path picks one of these from the palette, and the
 * node primitives derive their 3-D faces, borders and glow from it so a whole
 * section reads as a single colored stretch of the journey (Duolingo-style).
 */
export interface SectionColors {
  /** Banner / accent ring color. */
  accent: string;
  /** Lighter shade — the raised top face of a 3-D node. */
  light: string;
  /** Mid shade — node border and popup background. */
  base: string;
  /** Darker shade — the node's bottom (depth) face. */
  dark: string;
  /** Deepest shade — high-contrast text on white (button labels). */
  deep: string;
  /** Translucent halo painted behind an active node. */
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
  topBg: string;
  bottomBg: string;
  borderColor: string;
  iconColor: string;
  baseColor: string;
  progressColor: string;
}

/** Locked nodes are always neutral grey regardless of their section color. */
const LOCKED_VISUAL: NodeVisual = {
  topBg: theme.colors.surfaceHigh,
  bottomBg: theme.colors.surfaceLow,
  borderColor: theme.colors.outline,
  iconColor: theme.colors.textMuted,
  baseColor: "transparent",
  progressColor: "transparent",
};

/**
 * Resolve the 3-D node appearance for a level given its status and the color
 * identity of the section it belongs to. Unlocked states share one tinted
 * look so progress within a section feels continuous.
 */
export function nodeVisual(
  status: LevelStatus,
  colors: SectionColors = DEFAULT_SECTION_COLORS,
): NodeVisual {
  if (status === "locked") return LOCKED_VISUAL;
  // The active node is always gold with a pulsing glow (mockup C1), no matter
  // which section hue surrounds it — it's the "you are here" marker.
  if (status === "in_progress") {
    return {
      topBg: "#EFB65A",
      bottomBg: "#C98F35",
      borderColor: "#EFB65A",
      iconColor: "#3A2A08",
      baseColor: "rgba(239, 182, 90, 0.2)",
      progressColor: theme.colors.secondary,
    };
  }
  return {
    topBg: colors.light,
    bottomBg: colors.dark,
    borderColor: colors.base,
    iconColor: colors.deep,
    baseColor: colors.glow,
    progressColor: theme.colors.secondary,
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

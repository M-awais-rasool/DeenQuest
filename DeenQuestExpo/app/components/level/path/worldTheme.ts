import type { CourseType } from "../../../store/services/api";

/**
 * Exact values from the approved "Learning Path" mockup.
 *
 * The mockup ships two families of the same screen — a warm one for Namaz and
 * a cool one for Noorani Qaida — that differ only in the sky, the road, the
 * course chip and the mascot. Everything else (hills, node rings, cards, the
 * locked palette) is shared, so it lives outside the family split rather than
 * being duplicated per course.
 *
 * Colours here are deliberately literal rather than pulled from the theme.
 * The mockup is the source of truth for this screen, and a token that later
 * shifts for another screen must not silently repaint the world.
 */

/** The frame the mockup was drawn in. Every x position scales from this. */
export const DESIGN_WIDTH = 390;

export interface WorldFamily {
  /** Sky gradient, top to bottom. */
  sky: [string, string, string];
  /** Halo behind the celestial body. */
  glow: string;
  /** The crescent itself. */
  crescent: string;
  /** Road fill gradient. */
  road: [string, string];
  /** Dashed centre line down the road. */
  roadDash: string;
  /** Course chip: border, badge fill, badge glyph colour, chevron. */
  chipBorder: string;
  chipBadge: string;
  chipBadgeInk: string;
  /** Mascot body gradient and its cap. */
  mascot: [string, string];
  mascotCap: string;
  mascotInk: string;
  mascotEyeGleam: string;
  /** Daily-challenge card border and the gift box. */
  challengeBorder: string;
  giftBox: string;
  giftLid: string;
}

const WARM: WorldFamily = {
  sky: ["#123243", "#0C2730", "#07201F"],
  glow: "#EFB65A",
  crescent: "#EFB65A",
  road: ["#F3E2BC", "#D9BE8C"],
  roadDash: "#B79A6A",
  chipBorder: "#EFB65A88",
  chipBadge: "#EFB65A",
  chipBadgeInk: "#3A2A08",
  mascot: ["#FFE9AE", "#E29A2E"],
  mascotCap: "#C98F35",
  mascotInk: "#3A2A08",
  mascotEyeGleam: "#FFF6DC",
  challengeBorder: "rgba(239,182,90,0.3)",
  giftBox: "#A78BFA",
  giftLid: "#C4B2FF",
};

const COOL: WorldFamily = {
  sky: ["#0F3540", "#0A2A2E", "#07201F"],
  glow: "#2CC9B5",
  crescent: "#5EE0CE",
  road: ["#E7F1EC", "#B9CFC6"],
  roadDash: "#7FA69B",
  chipBorder: "#2CC9B588",
  chipBadge: "#2CC9B5",
  chipBadgeInk: "#06302B",
  mascot: ["#8CF3E2", "#12907F"],
  mascotCap: "#0E6B5E",
  mascotInk: "#06302B",
  mascotEyeGleam: "#EAFFFB",
  challengeBorder: "rgba(44,201,181,0.3)",
  giftBox: "#2CC9B5",
  giftLid: "#5EE0CE",
};

export function worldFamily(courseType: CourseType): WorldFamily {
  return courseType === "namaz" ? WARM : COOL;
}

/** Shared across both families. */
export const WORLD = {
  screenBg: "#081F24",

  hillA: ["#14413B", "#0D2E2B"] as [string, string],
  hillB: ["#185144", "#0F3831"] as [string, string],
  hillC: ["#1D6151", "#134238"] as [string, string],
  mosque: "#0E3A38",
  bushDark: "#0B2E2A",
  bushLight: "#0F3B34",
  roadShadow: "#0C2724",
  star: "#EDF5F4",

  /** Glass panels: the stat cards, the challenge card, node labels. */
  panel: "rgba(11,21,23,0.6)",
  panelStrong: "rgba(11,21,23,0.72)",
  panelSolid: "rgba(11,21,23,0.84)",
  panelBorder: "rgba(237,245,244,0.12)",
  panelBorderSoft: "rgba(237,245,244,0.1)",
  panelBorderBright: "rgba(237,245,244,0.14)",

  text: "#EDF5F4",
  textMuted: "#9FBAB5",
  /** Locked node label — dimmer than textMuted. */
  lockedTitle: "#7DA39E",
  lockedBody: "#5F7E7C",
  gold: "#EFB65A",
  goldSoft: "#F5CE8A",

  /** The cream ring every node sits inside, and the star tray behind it. */
  ring: "#F2E6CE",

  /** Node fills, by state. */
  doneA: ["#3BE3CB", "#159485"] as [string, string],
  doneADepth: "#0B5C51",
  doneB: ["#8AD8F7", "#2E86AF"] as [string, string],
  doneBDepth: "#1A5875",
  current: ["#F9D98C", "#D08A22"] as [string, string],
  currentDepth: "#94600F",
  lockedA: ["#43396B", "#221C36"] as [string, string],
  lockedAStroke: "#8C7CC4",
  lockedB: ["#5A2E45", "#2E1A26"] as [string, string],
  lockedBStroke: "#C4738F",
  lockedDepth: "#101C1F",

  /** Star tray. */
  starFill: "#F7C64F",
  starStroke: "#8A5A0E",
  starEmptyFill: "#22383C",
  starEmptyStroke: "#3E5A5C",

  /** The ✓ badge on a finished node. */
  check: "#2CC9B5",
  checkInk: "#06302B",

  progressFrom: "#2CC9B5",
  progressTo: "#5EE0CE",
} as const;

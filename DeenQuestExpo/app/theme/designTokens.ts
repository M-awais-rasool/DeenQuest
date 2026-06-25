/**
 * Design tokens for the "DeenQuest" home / rewards / profile / unlock redesign.
 *
 * These are the exact literal colours from the approved mockup. They live here
 * (rather than in `theme.colors`) so the redesign can match the mockup pixel-for
 * -pixel without disturbing the tokens the rest of the app already depends on.
 */
export const dq = {
  // Surfaces
  screen: "#161616",
  card: "#1B1B1B",
  cardBorder: "rgba(255,255,255,0.06)",
  rowBorder: "rgba(255,255,255,0.05)",
  trackGreenTint: "rgba(136,217,130,0.12)",
  lockFill: "rgba(255,255,255,0.04)",
  lockBorder: "rgba(255,255,255,0.08)",
  lockBadge: "#242424",

  // Brand
  green: "#88D982",
  greenDark: "#5fae5a",
  onGreen: "#0f2a12",
  onGreenAlt: "#13351a",
  gold: "#FFDB3C",
  gold12: "rgba(255,219,60,0.12)",
  gold18: "rgba(255,219,60,0.18)",
  gold25: "rgba(255,219,60,0.25)",
  gold55: "rgba(255,219,60,0.55)",

  // Gold medallion gradient (radial in the mockup, approximated with a diagonal)
  badgeGoldFrom: "#FFE9A8",
  badgeGoldTo: "#E3A92E",
  onBadgeGold: "#5a3d05",

  // Text
  white: "#FFFFFF",
  text: "#E2E2E2",
  muted: "#8b968a",
  faint: "#6f7a6e",
  chevron: "#4a4f48",
  lockIcon: "#565b54",

  // Progress tracks
  trackWhite06: "rgba(255,255,255,0.06)",
  trackWhite07: "rgba(255,255,255,0.07)",
  trackWhite08: "rgba(255,255,255,0.08)",
  squareEmpty: "rgba(255,255,255,0.05)",
} as const;

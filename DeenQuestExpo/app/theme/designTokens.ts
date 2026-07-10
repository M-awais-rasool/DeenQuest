/**
 * Design tokens for the "Teal Night" redesign (home / rewards / profile /
 * unlock and friends).
 *
 * These are the exact literal colours from the approved HTML mockups in
 * /screens. They live here (rather than in `theme.colors`) so screens built
 * against the mockups can match them pixel-for-pixel.
 */
export const dq = {
  // Surfaces
  screen: "#0B1517",
  card: "#16272B",
  cardBorder: "#24393E",
  rowBorder: "#1E3238",
  trackGreenTint: "rgba(44,201,181,0.14)",
  lockFill: "#101D20",
  lockBorder: "#1E3238",
  lockBadge: "#0F1D20",

  // Brand (teal keeps the legacy "green" token names so call-sites don't churn)
  green: "#2CC9B5",
  greenBright: "#5EE0CE",
  greenDark: "#1B9484",
  onGreen: "#06302B",
  onGreenAlt: "#123B34",
  greenTint: "#123B34",
  gold: "#EFB65A",
  goldBright: "#F9DDA0",
  goldDark: "#C98F35",
  onGold: "#3A2A08",
  goldTint: "#3A2F16",
  goldBorder: "#4A3E28",
  gold12: "rgba(239,182,90,0.12)",
  gold18: "rgba(239,182,90,0.18)",
  gold25: "rgba(239,182,90,0.25)",
  gold55: "rgba(239,182,90,0.55)",

  // Gold medallion gradient
  badgeGoldFrom: "#F9DDA0",
  badgeGoldTo: "#C98F35",
  onBadgeGold: "#3A2A08",

  // Text
  white: "#FFFFFF",
  text: "#EDF5F4",
  muted: "#8DA5A3",
  faint: "#5F7E7C",
  chevron: "#4E6A68",
  lockIcon: "#5F7E7C",

  // Progress tracks
  trackWhite06: "rgba(237,245,244,0.06)",
  trackWhite07: "rgba(237,245,244,0.07)",
  trackWhite08: "rgba(237,245,244,0.08)",
  squareEmpty: "rgba(237,245,244,0.05)",
} as const;

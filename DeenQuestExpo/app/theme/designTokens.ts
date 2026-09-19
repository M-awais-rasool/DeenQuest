import { theme } from "./themes";

const c = theme.colors;

export const dq = {
  // Surfaces
  screen: c.background,
  card: c.surface,
  cardBorder: c.outline,
  rowBorder: "#123840",
  trackGreenTint: c.primary14,
  lockFill: c.surfaceLow,
  lockBorder: "#123840",
  lockBadge: "#02181E",

  // Brand (teal keeps the legacy "green" token names so call-sites don't churn)
  green: c.primary,
  greenBright: "#5EF3E6",
  greenDark: c.shadowGreen,
  onGreen: c.onPrimary,
  onGreenAlt: c.primaryContainer,
  greenTint: c.primaryContainer,
  gold: c.secondary,
  goldBright: "#F8F0B1",
  goldDark: c.goldDark,
  onGold: c.onSecondary,
  goldTint: "#3A2F16",
  goldBorder: "#4A3E28",
  gold12: c.secondary12,
  gold18: "rgba(242,195,107,0.18)",
  gold25: c.secondary25,
  gold55: "rgba(242,195,107,0.55)",

  // Gold medallion gradient
  badgeGoldFrom: "#F8F0B1",
  badgeGoldTo: c.goldDark,
  onBadgeGold: c.onSecondary,

  // Text
  white: c.white,
  text: c.text,
  muted: c.textMuted,
  faint: "#5F8189",
  chevron: "#4E7078",
  lockIcon: "#5F8189",

  // Progress tracks
  trackWhite06: "rgba(237,245,244,0.06)",
  trackWhite07: "rgba(237,245,244,0.07)",
  trackWhite08: "rgba(237,245,244,0.08)",
  squareEmpty: "rgba(237,245,244,0.05)",
} as const;

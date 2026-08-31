/**
 * The colour identity a stretch of the path carries, and one helper for
 * tinting with it.
 *
 * These are all that outlived the list-based path: the 3-D node primitives
 * that used to derive their faces from a full shade set are gone, and the
 * road drawn in their place takes its colours from `worldTheme`. What is left
 * is what still labels a section — the course switcher, the rewards screens —
 * plus the alpha helper those use.
 */
export interface SectionColors {
  /** Banner / accent ring colour. */
  accent: string;
  /** Lighter shade. */
  light: string;
  /** Mid shade. */
  base: string;
  /** Darker shade. */
  dark: string;
  /** Deepest shade — high-contrast text on white. */
  deep: string;
  /** Translucent halo. */
  glow: string;
}

/** Convert a 6-digit hex colour to an `rgba()` string at the given alpha. */
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

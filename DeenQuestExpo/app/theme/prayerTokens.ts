/**
 * Prayer-feature palette + per-prayer glyphs.
 *
 * Extends the app "Teal Night" tokens (`dq`) with the night-sky blues used by
 * the prayer design mockups (`prayer-design/*.html`).
 */
import type { PrayerName } from "../types/prayer";

export const prayerColors = {
  blue: "#6EC1E8",
  blueLight: "#9AD5F2",
  blueDark: "#0E2A3A",
  blueEdge: "#3E8AB3", // tactile edge under the blue button
  tileBlue: "#16303E", // hero icon tile, pills, next-row background
  nextTile: "#1D4152", // next-row icon tile
  dimTile: "#0F1D20", // past / future icon tile
  border: "#24505F", // hero + accent border
  heroFrom: "#153841", // next-prayer hero gradient start
  heroTo: "#16272B", // next-prayer hero gradient end
  emptyRing: "#2C464C", // future-row empty circle border
} as const;

/** Icon glyph per prayer. Colour is decided by row state, not the prayer. */
export const PRAYER_GLYPHS: Record<PrayerName, string> = {
  fajr: "☾",
  dhuhr: "☀",
  asr: "◑",
  maghrib: "☾",
  isha: "★",
};

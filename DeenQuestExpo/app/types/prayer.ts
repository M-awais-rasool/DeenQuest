export type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

/** Canonical display order (Fajr → Isha). */
export const PRAYER_ORDER: PrayerName[] = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

/** Human labels for each prayer. */
export const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

export type CalcMethodId =
  | "MuslimWorldLeague"
  | "Egyptian"
  | "Karachi"
  | "UmmAlQura"
  | "Dubai"
  | "MoonsightingCommittee"
  | "NorthAmerica"
  | "Kuwait"
  | "Qatar"
  | "Singapore"
  | "Tehran"
  | "Turkey";

/** School of thought — only affects the Asr time. */
export type Madhab = "shafi" | "hanafi";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** How the app learned the user's location. */
export type LocationMode = "auto" | "manual";

export interface SavedLocation {
  mode: LocationMode;
  coords: Coordinates;
  /** Display label, e.g. "Lahore, Pakistan". */
  city: string;
}

export interface ReminderSettings {
  /** Master switch — off means no notifications at all. */
  enabled: boolean;
  /** Per-prayer switches (only consulted when `enabled` is true). */
  perPrayer: Record<PrayerName, boolean>;
  /** Minutes BEFORE the prayer time to fire (0 = exactly at Adhan). */
  offsetMinutes: number;
}

export interface PrayerSettings {
  method: CalcMethodId;
  madhab: Madhab;
  reminders: ReminderSettings;
  /** null until the user's location has been resolved at least once. */
  location: SavedLocation | null;
}

/** One computed prayer time for a given day. */
export interface PrayerTime {
  name: PrayerName;
  label: string;
  /** Absolute clock time for this prayer on the computed day. */
  date: Date;
}

/**
 * Night-window helper for the dynamic app-icon "Sleeping" mood.
 *
 * Prayer times are currently mocked app-wide (see PrayerTimesScreen — Isha at
 * ~20:21 for Lahore). Until a real location-aware prayer-times API lands, we
 * approximate "after Isha" with a fixed night window: from Isha in the evening
 * until Fajr the next morning. When the real API arrives, wire it in here and
 * every caller (currently just the app-icon resolver) picks it up.
 */

/** Hour (0–23, local) at/after which Isha is considered to have begun. */
export const ISHA_HOUR = 20; // ~8pm, matching the mocked PrayerTimesScreen

/** Hour (0–23, local) at which Fajr/dawn begins, ending the night window. */
export const FAJR_HOUR = 5; // ~5am

/**
 * Returns true when `date` (local time) falls in the night window — at/after
 * Isha in the evening, or before Fajr in the early morning.
 */
export function isNightTime(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= ISHA_HOUR || hour < FAJR_HOUR;
}

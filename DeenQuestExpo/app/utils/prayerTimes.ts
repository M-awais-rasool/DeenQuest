import * as adhan from "adhan";
import type {
  CalcMethodId,
  Coordinates,
  Madhab,
  PrayerTime,
} from "../types/prayer";
import { PRAYER_LABELS, PRAYER_ORDER } from "../types/prayer";
import { buildParams } from "./prayerCalcMethods";

/** Compute the five prayer times for one day at a location. */
export function computeTimes(
  coords: Coordinates,
  date: Date,
  method: CalcMethodId,
  madhab: Madhab,
): PrayerTime[] {
  const c = new adhan.Coordinates(coords.latitude, coords.longitude);
  const params = buildParams(method, madhab);
  const pt = new adhan.PrayerTimes(c, date, params);
  return PRAYER_ORDER.map((name) => ({
    name,
    label: PRAYER_LABELS[name],
    date: pt[name],
  }));
}

export interface NextPrayerInfo {
  /** The upcoming prayer (today's remaining, or tomorrow's Fajr after Isha). */
  next: PrayerTime;
  /** The prayer currently in effect, or null before today's Fajr. */
  current: PrayerTime | null;
  /** 0..1 progress from `current` to `next`, for the hero countdown bar. */
  progress: number;
}

export function resolveNextPrayer(
  today: PrayerTime[],
  tomorrowFajr: PrayerTime,
  now: Date,
): NextPrayerInfo {
  const nowMs = now.getTime();
  const upcoming = today.find((p) => p.date.getTime() > nowMs);

  if (upcoming) {
    const idx = today.indexOf(upcoming);
    const current = idx > 0 ? today[idx - 1] : null;
    const start = current
      ? current.date.getTime()
      : upcoming.date.getTime() - 60 * 60 * 1000;
    const progress = clamp01((nowMs - start) / (upcoming.date.getTime() - start));
    return { next: upcoming, current, progress };
  }

  // After Isha → next is tomorrow's Fajr, current stays today's Isha.
  const isha = today[today.length - 1];
  const start = isha.date.getTime();
  const progress = clamp01(
    (nowMs - start) / (tomorrowFajr.date.getTime() - start),
  );
  return { next: tomorrowFajr, current: isha, progress };
}

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.min(Math.max(v, 0), 1);
}

/** Split a Date into a 12-hour "5:47" body and "PM" suffix. */
export function formatTime(date: Date): { time: string; suffix: string } {
  let h = date.getHours();
  const m = date.getMinutes();
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 === 0 ? 12 : h % 12;
  return { time: `${h}:${String(m).padStart(2, "0")}`, suffix };
}

/** Human countdown like "in 2h 14m" / "in 43m" / "now". */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "now";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
}

/** Start-of-day helper (local midnight) used for tomorrow's calculation. */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

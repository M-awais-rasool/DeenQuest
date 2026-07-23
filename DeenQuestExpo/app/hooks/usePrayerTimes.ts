import { useEffect, useMemo, useState } from "react";
import type { PrayerTime } from "../types/prayer";
import {
  addDays,
  computeTimes,
  formatCountdown,
  resolveNextPrayer,
  type NextPrayerInfo,
} from "../utils/prayerTimes";
import { usePrayerSettings } from "./usePrayerSettings";

export interface UsePrayerTimesResult {
  /** Today's five times (empty until a location is known). */
  times: PrayerTime[];
  next: NextPrayerInfo | null;
  /** Live "in 2h 14m" string ("" when no location). */
  countdown: string;
  /** Milliseconds until the next prayer (0 when no location). */
  msToNext: number;
  ready: boolean;
}

export function usePrayerTimes(): UsePrayerTimesResult {
  const { settings } = usePrayerSettings();
  const lat = settings.location?.coords.latitude ?? null;
  const lng = settings.location?.coords.longitude ?? null;
  const { method, madhab } = settings;

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Recompute the day's times only when inputs or the calendar day change.
  const dayKey = now.toDateString();

  const times = useMemo<PrayerTime[]>(() => {
    if (lat == null || lng == null) return [];
    return computeTimes({ latitude: lat, longitude: lng }, new Date(), method, madhab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, method, madhab, dayKey]);

  const tomorrowFajr = useMemo<PrayerTime | null>(() => {
    if (lat == null || lng == null) return null;
    const t = computeTimes(
      { latitude: lat, longitude: lng },
      addDays(new Date(), 1),
      method,
      madhab,
    );
    return t[0] ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, method, madhab, dayKey]);

  const next = useMemo<NextPrayerInfo | null>(() => {
    if (times.length === 0 || !tomorrowFajr) return null;
    return resolveNextPrayer(times, tomorrowFajr, now);
  }, [times, tomorrowFajr, now]);

  const msToNext = next ? next.next.date.getTime() - now.getTime() : 0;
  const countdown = next ? formatCountdown(msToNext) : "";

  return { times, next, countdown, msToNext, ready: times.length > 0 };
}

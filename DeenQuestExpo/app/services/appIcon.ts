import { isNightTime } from "../utils/prayerWindow";

export const MOODS = [
  "happy",
  "onfire",
  "worried",
  "fading",
  "sleeping",
  "celebrating",
] as const;

export type Mood = (typeof MOODS)[number];

/** AsyncStorage key holding the last mood the AppIconController resolved. */
export const LAST_MOOD_KEY = "appIcon.lastMood";


export function iconNameForMood(mood: Mood): string | null {
  return mood === "happy" ? null : mood;
}

/** The value getAppIcon() reports for a given mood, for diffing before a change. */
function currentIconName(mood: Mood): string {
  return mood === "happy" ? "DEFAULT" : mood;
}

/** Coerce an admin override string into a Mood, or null when it's "auto"/unset/unknown. */
export function normalizeOverride(value?: string | null): Mood | null {
  if (!value || value === "auto") return null;
  return (MOODS as readonly string[]).includes(value) ? (value as Mood) : null;
}

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Whole local-calendar days between two instants (Math.round guards DST). */
export function dayGap(from: Date, to: Date): number {
  return Math.round((startOfLocalDay(to) - startOfLocalDay(from)) / 86_400_000);
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return startOfLocalDay(a) === startOfLocalDay(b);
}

/** True if any reward was unlocked earlier today (the "badge earned" signal). */
export function hasRewardUnlockedToday(
  rewards: { unlocked?: boolean; unlocked_at?: string }[] | undefined,
  now: Date = new Date(),
): boolean {
  if (!rewards) return false;
  return rewards.some(
    (r) =>
      r.unlocked &&
      !!r.unlocked_at &&
      isSameLocalDay(new Date(r.unlocked_at), now),
  );
}

export interface MoodInput {
  override?: string | null;
  lastCompletedAt?: string | null;
  currentStreak?: number;
  weeklyCompletions?: boolean[];
  celebrateToday?: boolean;
  now?: Date;
}

interface HabitState {
  doneToday: boolean;
  gapDays: number;
  hasHistory: boolean;
}

function habitState(input: MoodInput, now: Date): HabitState {
  const raw = input.lastCompletedAt;
  const last = raw ? new Date(raw) : null;
  if (last && !Number.isNaN(last.getTime())) {
    const gapDays = dayGap(last, now);
    return { doneToday: gapDays <= 0, gapDays, hasHistory: true };
  }

  // No lastCompletedAt — fall back to the weekly array (index 6 = today).
  const weekly = input.weeklyCompletions;
  if (weekly && weekly.length > 0) {
    const doneToday = weekly[weekly.length - 1] === true;
    let lastTrue = -1;
    for (let i = weekly.length - 1; i >= 0; i--) {
      if (weekly[i]) {
        lastTrue = i;
        break;
      }
    }
    if (lastTrue === -1) {
      return { doneToday: false, gapDays: Infinity, hasHistory: false };
    }
    return {
      doneToday,
      gapDays: weekly.length - 1 - lastTrue,
      hasHistory: true,
    };
  }

  // Never completed anything we know of → brand-new user.
  return { doneToday: false, gapDays: Infinity, hasHistory: false };
}

export function resolveMood(input: MoodInput): Mood {
  const now = input.now ?? new Date();

  const override = normalizeOverride(input.override);
  if (override) return override;

  if (input.celebrateToday) return "celebrating";

  const { doneToday, gapDays, hasHistory } = habitState(input, now);

  if (doneToday) {
    if (isNightTime(now)) return "sleeping";
    if ((input.currentStreak ?? 0) >= 7) return "onfire";
    return "happy";
  }

  if (!hasHistory) return "happy"; // welcoming default, not a sad icon
  if (gapDays >= 3) return "fading";
  return "worried";
}

export function applyMoodIcon(mood: Mood): boolean {
  // Lazy requires keep this module pure/importable outside React Native.
  let Platform: { OS: string };
  try {
    Platform = require("react-native").Platform;
  } catch {
    return false;
  }
  if (Platform.OS === "web") return false;

  try {
    const mod = require("@g9k/expo-dynamic-app-icon");
    if (mod.getAppIcon() === currentIconName(mood)) return false;
    mod.setAppIcon(iconNameForMood(mood));
    return true;
  } catch (err) {
    if ((globalThis as { __DEV__?: boolean }).__DEV__) {
      console.warn("[appIcon] applyMoodIcon skipped:", err);
    }
    return false;
  }
}

export function getCurrentAppIconMood(): Mood | null {
  try {
    const name = require("@g9k/expo-dynamic-app-icon").getAppIcon();
    if (name === "DEFAULT") return "happy";
    return (MOODS as readonly string[]).includes(name) ? (name as Mood) : "happy";
  } catch {
    return null;
  }
}

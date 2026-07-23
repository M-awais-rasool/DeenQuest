import { createMMKV } from "react-native-mmkv";
import type { PrayerSettings } from "../../types/prayer";
import { DEFAULT_MADHAB, DEFAULT_METHOD } from "../../utils/prayerCalcMethods";

const storage = createMMKV({ id: "prayer" });
const SETTINGS_KEY = "settings";

export const DEFAULT_SETTINGS: PrayerSettings = {
  method: DEFAULT_METHOD,
  madhab: DEFAULT_MADHAB,
  reminders: {
    enabled: false,
    perPrayer: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
    offsetMinutes: 0,
  },
  location: null,
};

export function loadSettings(): PrayerSettings {
  try {
    const raw = storage.getString(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return mergeSettings(JSON.parse(raw) as Partial<PrayerSettings>);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: PrayerSettings): void {
  try {
    storage.set(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // best-effort; settings simply fall back to defaults next launch
  }
}

function mergeSettings(p: Partial<PrayerSettings>): PrayerSettings {
  return {
    method: p.method ?? DEFAULT_SETTINGS.method,
    madhab: p.madhab ?? DEFAULT_SETTINGS.madhab,
    reminders: {
      enabled: p.reminders?.enabled ?? DEFAULT_SETTINGS.reminders.enabled,
      perPrayer: {
        ...DEFAULT_SETTINGS.reminders.perPrayer,
        ...(p.reminders?.perPrayer ?? {}),
      },
      offsetMinutes:
        p.reminders?.offsetMinutes ?? DEFAULT_SETTINGS.reminders.offsetMinutes,
    },
    location: p.location ?? null,
  };
}

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { PrayerName, PrayerSettings } from "../types/prayer";
import { PRAYER_LABELS } from "../types/prayer";
import { addDays, computeTimes } from "../utils/prayerTimes";

export const ADHAN_CHANNEL_ID = "prayer-adhan";

export const ADHAN_NOTIFICATION_SOUND: string | true = "adhan_notification.wav";

// today + next 2 days → at most 15 pending notifications.
const DAYS_AHEAD = 2;
const ADHAN_DATA_TYPE = "adhan";

/** Ensure notification permission (needed to schedule locals on iOS). */
export async function ensureNotificationPermissionAsync(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Ensure the Android high-importance channel used for adhan reminders. */
export async function ensureAdhanChannelAsync(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ADHAN_CHANNEL_ID, {
    name: "Prayer reminders",
    importance: Notifications.AndroidImportance.MAX,
    sound:
      typeof ADHAN_NOTIFICATION_SOUND === "string"
        ? ADHAN_NOTIFICATION_SOUND
        : undefined,
    vibrationPattern: [0, 400, 200, 400],
    lightColor: "#2CC9B5",
  });
}

/** Remove every previously scheduled adhan reminder (tagged via data.type). */
export async function cancelAdhanReminders(): Promise<void> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      all
        .filter((n) => n.content.data?.type === ADHAN_DATA_TYPE)
        .map((n) =>
          Notifications.cancelScheduledNotificationAsync(n.identifier),
        ),
    );
  } catch {
    // best-effort
  }
}

export async function scheduleAdhanReminders(
  settings: PrayerSettings,
): Promise<number> {
  await cancelAdhanReminders();

  const coords = settings.location?.coords;
  if (!coords || !settings.reminders.enabled) return 0;
  if (!(await ensureNotificationPermissionAsync())) return 0;

  await ensureAdhanChannelAsync();

  const now = Date.now();
  const offsetMs = settings.reminders.offsetMinutes * 60_000;
  let scheduled = 0;

  for (let dayOffset = 0; dayOffset <= DAYS_AHEAD; dayOffset++) {
    const times = computeTimes(
      coords,
      addDays(new Date(), dayOffset),
      settings.method,
      settings.madhab,
    );
    for (const t of times) {
      if (!settings.reminders.perPrayer[t.name]) continue;
      const fireAt = t.date.getTime() - offsetMs;
      if (fireAt <= now + 5_000) continue; // skip past / too-imminent
      await scheduleOne(t.name, new Date(fireAt), settings.reminders.offsetMinutes);
      scheduled++;
    }
  }
  return scheduled;
}

async function scheduleOne(
  prayer: PrayerName,
  fireAt: Date,
  offsetMinutes: number,
): Promise<void> {
  const label = PRAYER_LABELS[prayer];
  const body =
    offsetMinutes > 0
      ? `${label} is in ${offsetMinutes} min — prepare for prayer.`
      : `It's time for ${label}. Tap to play the Adhan.`;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${label} · Prayer time`,
      body,
      sound: ADHAN_NOTIFICATION_SOUND,
      data: { type: ADHAN_DATA_TYPE, prayer },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
      channelId: ADHAN_CHANNEL_ID,
    },
  });
}

export async function scheduleTestAdhanInSeconds(
  prayer: PrayerName = "fajr",
  seconds = 5,
): Promise<void> {
  if (!(await ensureNotificationPermissionAsync())) return;
  await ensureAdhanChannelAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${PRAYER_LABELS[prayer]} · Prayer time`,
      body: "It's time to pray. Tap to play the Adhan.",
      sound: ADHAN_NOTIFICATION_SOUND,
      data: { type: ADHAN_DATA_TYPE, prayer },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, seconds),
      channelId: ADHAN_CHANNEL_ID,
    },
  });
}

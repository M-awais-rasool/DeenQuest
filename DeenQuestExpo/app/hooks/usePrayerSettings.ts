import { useCallback, useSyncExternalStore } from "react";
import type { PrayerSettings } from "../types/prayer";
import { loadSettings, saveSettings } from "../store/storage/prayerStorage";

type Updater = PrayerSettings | ((prev: PrayerSettings) => PrayerSettings);

let current: PrayerSettings = loadSettings();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): PrayerSettings {
  return current;
}

export function getPrayerSettings(): PrayerSettings {
  return current;
}

/** Imperatively update + persist + notify all subscribers. */
export function setPrayerSettings(updater: Updater): PrayerSettings {
  current = typeof updater === "function" ? updater(current) : updater;
  saveSettings(current);
  emit();
  return current;
}

export function usePrayerSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const update = useCallback((updater: Updater) => setPrayerSettings(updater), []);
  return { settings, update };
}

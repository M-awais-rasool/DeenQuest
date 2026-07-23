import { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";
import type { Coordinates, SavedLocation } from "../types/prayer";
import { getPrayerSettings, usePrayerSettings } from "./usePrayerSettings";

export type LocationStatus = "idle" | "loading" | "ready" | "denied" | "error";

export interface UsePrayerLocationResult {
  location: SavedLocation | null;
  status: LocationStatus;
  /** Ask the OS for GPS and resolve a fresh fix + city label. */
  detect: () => Promise<void>;
  /** Apply a manually chosen city. */
  setManual: (loc: Omit<SavedLocation, "mode">) => void;
}

// Guard so multiple mounted hooks don't each fire the first-run auto-detect.
let autoDetectTried = false;

export function usePrayerLocation(): UsePrayerLocationResult {
  const { settings, update } = usePrayerSettings();
  const location = settings.location;
  const [status, setStatus] = useState<LocationStatus>(
    location ? "ready" : "idle",
  );

  const detect = useCallback(async () => {
    setStatus("loading");
    try {
      const { status: perm } =
        await Location.requestForegroundPermissionsAsync();
      if (perm !== "granted") {
        setStatus("denied");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords: Coordinates = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      const city = await reverseCity(coords);
      update((prev) => ({ ...prev, location: { mode: "auto", coords, city } }));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [update]);

  const setManual = useCallback(
    (loc: Omit<SavedLocation, "mode">) => {
      update((prev) => ({ ...prev, location: { ...loc, mode: "manual" } }));
      setStatus("ready");
    },
    [update],
  );

  useEffect(() => {
    if (!getPrayerSettings().location && !autoDetectTried) {
      autoDetectTried = true;
      void detect();
    }
  }, [detect]);

  return { location, status, detect, setManual };
}

async function reverseCity(coords: Coordinates): Promise<string> {
  try {
    const [place] = await Location.reverseGeocodeAsync(coords);
    if (place) {
      const city = place.city || place.subregion || place.district || place.region;
      const label = [city, place.country].filter(Boolean).join(", ");
      if (label) return label;
    }
  } catch {
    // ignore — fall through to a generic label
  }
  return "Current location";
}

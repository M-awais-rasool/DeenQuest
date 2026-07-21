import { useCallback, useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppSelector } from "../store/hooks";
import {
  useGetProgressQuery,
  useGetProfileQuery,
  useGetRewardsQuery,
} from "../store/services/api";
import {
  applyMoodIcon,
  hasRewardUnlockedToday,
  LAST_MOOD_KEY,
  resolveMood,
} from "../services/appIcon";

const LAST_LEVEL_KEY = "appIcon.lastLevel";
const CELEBRATE_DATE_KEY = "appIcon.celebrateDate";

const RECOMPUTE_INTERVAL_MS = 30 * 60 * 1000; // catch the after-Isha transition

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function AppIconController() {
  const isAuthenticated = useAppSelector((state) => state.main.isAuthenticated);

  const { data: progressRes } = useGetProgressQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { data: profileRes } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { data: rewardsRes } = useGetRewardsQuery(undefined, {
    skip: !isAuthenticated,
  });

  const progress = progressRes?.data;
  const profile = profileRes?.data;
  const rewards = rewardsRes?.data;

  const dataRef = useRef({ progress, profile, rewards });
  dataRef.current = { progress, profile, rewards };

  const recompute = useCallback(async () => {
    const { progress: p, profile: prof, rewards: rw } = dataRef.current;
    if (!p) return;

    const now = new Date();
    const todayKey = localDateKey(now);

    let celebrateByLevel = false;
    try {
      const [storedLevelRaw, celebrateDate] = await Promise.all([
        AsyncStorage.getItem(LAST_LEVEL_KEY),
        AsyncStorage.getItem(CELEBRATE_DATE_KEY),
      ]);
      const storedLevel = storedLevelRaw != null ? Number(storedLevelRaw) : null;

      if (storedLevel != null && p.level > storedLevel) {
        await AsyncStorage.setItem(CELEBRATE_DATE_KEY, todayKey);
        celebrateByLevel = true;
      } else {
        celebrateByLevel = celebrateDate === todayKey;
      }
      if (storedLevel !== p.level) {
        await AsyncStorage.setItem(LAST_LEVEL_KEY, String(p.level));
      }
    } catch {
      // AsyncStorage unavailable — fall back to reward-only celebration.
    }

    const celebrateToday =
      celebrateByLevel || hasRewardUnlockedToday(rewards ?? rw, now);

    const mood = resolveMood({
      override: prof?.icon_override,
      lastCompletedAt: p.last_completed_at,
      currentStreak: p.current_streak,
      weeklyCompletions: p.weekly_completions,
      celebrateToday,
      now,
    });

    applyMoodIcon(mood);
    // Remember it so the next launch's splash can show the matching Noor even
    // before the native icon module is queried.
    AsyncStorage.setItem(LAST_MOOD_KEY, mood).catch(() => {});
  }, []);

  // Recompute whenever the underlying data changes.
  useEffect(() => {
    if (!isAuthenticated) return;
    recompute();
  }, [
    isAuthenticated,
    progress?.last_completed_at,
    progress?.current_streak,
    progress?.level,
    profile?.icon_override,
    rewards,
    recompute,
  ]);

  // Recompute on foreground and on a light interval (for the Isha transition).
  useEffect(() => {
    if (!isAuthenticated) return;

    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") recompute();
    });
    const timer = setInterval(recompute, RECOMPUTE_INTERVAL_MS);

    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, [isAuthenticated, recompute]);

  return null;
}

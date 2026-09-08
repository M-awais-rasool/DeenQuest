import { useEffect, useState } from "react";
import TrackPlayer, { State, type Track } from "react-native-track-player";

/**
 * react-native-track-player 4.1.2 predates the New Architecture, and on it the
 * native → JS event bridge never delivers a single event. Its own hooks split
 * cleanly on that: useProgress polls getProgress() and kept working, while
 * useActiveTrack and usePlaybackState read their value once on mount and then
 * wait forever for an event that never arrives.
 *
 * The result looked like three separate bugs — no ayah highlighted, a frozen
 * progress bar, a play button stuck on the wrong icon — but it was one. The
 * position was advancing the whole time; the UI hides it behind isCurrentQueue,
 * which is derived from the active track.
 *
 * Method calls do work, so these poll for the same values. Both take the same
 * interval as the progress hook, so the whole player updates in one rhythm.
 */

const usePolled = <T,>(
  read: () => Promise<T>,
  intervalMs: number,
  isEqual: (a: T, b: T) => boolean,
  initial: T,
) => {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      try {
        const next = await read();
        if (!mounted) return;
        setValue((current) => (isEqual(current, next) ? current : next));
      } catch {
        // Before setupPlayer runs every call rejects. That is not an error
        // worth surfacing — it just means there is nothing to report yet.
      }
      if (mounted) timer = setTimeout(tick, intervalMs);
    };

    tick();
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  return value;
};

export const useActiveTrackPolled = (intervalMs: number): Track | undefined =>
  usePolled<Track | undefined>(
    () => TrackPlayer.getActiveTrack(),
    intervalMs,
    (a, b) => a?.id === b?.id,
    undefined,
  );

export const usePlaybackStatePolled = (intervalMs: number): State | undefined =>
  usePolled<State | undefined>(
    async () => (await TrackPlayer.getPlaybackState()).state,
    intervalMs,
    (a, b) => a === b,
    undefined,
  );

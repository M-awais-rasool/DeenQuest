/**
 * Fail-safe sound-effects player for the learning experience.
 *
 * Mirrors the defensive style of `speech.ts`: if `expo-av` is unavailable
 * (e.g. before a native rebuild) every call becomes a silent no-op so the UI
 * never crashes. Sounds are loaded lazily on first use and reused after that.
 */

type SfxKey = "correct" | "wrong" | "pick" | "complete";

// Static requires so Metro bundles the assets.
const SOURCES: Record<SfxKey, number> = {
  correct: require("../../assets/sounds/Short_ascending_ding.mp3"),
  wrong: require("../../assets/sounds/Soft_descending_oud.mp3"),
  pick: require("../../assets/sounds/Quick_magical_sparkl.mp3"),
  complete: require("../../assets/sounds/Triumphant_fanfare.mp3"),
};

type SoundLike = {
  replayAsync: () => Promise<unknown>;
  setPositionAsync: (ms: number) => Promise<unknown>;
  playAsync: () => Promise<unknown>;
  unloadAsync: () => Promise<unknown>;
};

let AudioModule: any | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AudioModule = require("expo-av").Audio;
} catch {
  AudioModule = null;
}

let enabled = true;
const cache: Partial<Record<SfxKey, SoundLike>> = {};
const loading: Partial<Record<SfxKey, Promise<SoundLike | null>>> = {};

async function getSound(key: SfxKey): Promise<SoundLike | null> {
  if (!AudioModule) return null;
  if (cache[key]) return cache[key]!;
  if (loading[key]) return loading[key]!;

  loading[key] = (async () => {
    try {
      const { sound } = await AudioModule.Sound.createAsync(SOURCES[key], {
        shouldPlay: false,
        volume: 1.0,
      });
      cache[key] = sound as SoundLike;
      return cache[key]!;
    } catch {
      return null;
    } finally {
      delete loading[key];
    }
  })();

  return loading[key]!;
}

async function play(key: SfxKey): Promise<void> {
  if (!enabled || !AudioModule) return;
  try {
    const sound = await getSound(key);
    if (!sound) return;
    // Rewind so rapid repeated taps always re-trigger the sound.
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // ignore – audio is a non-critical enhancement
  }
}

export const sfx = {
  /** Correct answer — short ascending ding */
  correct: () => play("correct"),
  /** Wrong answer — soft descending oud */
  wrong: () => play("wrong"),
  /** Picking / placing a tile — quick magical sparkle */
  pick: () => play("pick"),
  /** Level / game finished — triumphant fanfare */
  complete: () => play("complete"),

  /** Globally mute or unmute effects */
  setEnabled(value: boolean) {
    enabled = value;
  },

  /** Free all loaded sounds (call on unmount of long-lived screens if desired) */
  async unloadAll() {
    const keys = Object.keys(cache) as SfxKey[];
    await Promise.all(
      keys.map(async (k) => {
        try {
          await cache[k]?.unloadAsync();
        } catch {
          // ignore
        }
        delete cache[k];
      }),
    );
  },
};

export default sfx;

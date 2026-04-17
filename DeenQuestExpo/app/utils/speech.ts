/**
 * Safe wrapper around expo-speech.
 * Falls back silently when the native module is not yet compiled
 * (i.e. before `expo prebuild` + native rebuild).
 */

type SpeechOptions = {
  language?: string;
  rate?: number;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: () => void;
};

let SpeechModule: {
  speak: (text: string, options?: SpeechOptions) => void;
  stop: () => void;
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SpeechModule = require("expo-speech");
} catch {
  // Native module not compiled yet – audio silently unavailable.
}

export const Speech = {
  speak(text: string, options?: SpeechOptions): void {
    if (!SpeechModule) return;
    try {
      SpeechModule.speak(text, options);
    } catch {
      options?.onError?.();
    }
  },
  stop(): void {
    if (!SpeechModule) return;
    try {
      SpeechModule.stop();
    } catch {
      // ignore
    }
  },
  /** Returns true when the native module is available */
  isAvailable(): boolean {
    return SpeechModule !== null;
  },
};

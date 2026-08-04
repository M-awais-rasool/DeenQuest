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
  SpeechModule = require("expo-speech");
} catch {
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
  isAvailable(): boolean {
    return SpeechModule !== null;
  },
};

import { AppState } from "react-native";
import { Audio } from "expo-av";

export const RECITATION_RECORDING: Audio.RecordingOptions = {
  isMeteringEnabled: false,
  android: {
    extension: ".m4a",
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 32000,
  },
  ios: {
    extension: ".m4a",
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.MEDIUM,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 32000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: 32000,
  },
};

/**
 * Wait until the app is genuinely foregrounded.
 *
 * iOS refuses to activate an audio session unless the app is active, and the
 * microphone permission alert itself pushes the app to `inactive`. So the first
 * time a learner records, the permission promise resolves the instant they tap
 * Allow — while the app is still inactive — and starting the recorder right
 * then fails with:
 *
 *   "This experience is currently in the background so the audio session
 *    could not be activated"
 *
 * which reads like a bug in the app rather than a race with the OS. Waiting for
 * `active` first turns that into an ordinary start.
 *
 * Resolves after `timeoutMs` regardless, so a missed AppState event can never
 * leave the recorder waiting forever — the caller's own error handling takes
 * over instead.
 */
export function waitForForeground(timeoutMs = 4000): Promise<void> {
  if (AppState.currentState === "active") return Promise.resolve();

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      sub.remove();
      resolve();
    };
    const timer = setTimeout(finish, timeoutMs);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") finish();
    });
  });
}

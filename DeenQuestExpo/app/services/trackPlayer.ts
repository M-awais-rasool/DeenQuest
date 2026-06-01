import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
} from "react-native-track-player";

let setupPromise: Promise<void> | null = null;

const isAlreadySetupError = (error: unknown) => {
  const err = error as { code?: string; message?: string };
  return (
    err?.code === "player_already_initialized" ||
    err?.message?.toLowerCase().includes("already")
  );
};

export const setupQuranPlayer = async () => {
  if (!setupPromise) {
    setupPromise = (async () => {
      try {
        await TrackPlayer.setupPlayer({
          autoHandleInterruptions: true,
          minBuffer: 15,
        });
      } catch (error) {
        if (!isAlreadySetupError(error)) {
          setupPromise = null;
          throw error;
        }
      }

      await TrackPlayer.updateOptions({
        android: {
          appKilledPlaybackBehavior:
            AppKilledPlaybackBehavior.ContinuePlayback,
        },
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
          Capability.SeekTo,
        ],
        notificationCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
        ],
        compactCapabilities: [Capability.Play, Capability.Pause],
        progressUpdateEventInterval: 1,
      });
    })();
  }

  return setupPromise;
};

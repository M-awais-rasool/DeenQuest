import { useProgress } from "react-native-track-player";

export const TRACK_PLAYER_PROGRESS_UPDATE_INTERVAL_MS = 250;

export const useTrackPlayerProgress = (
  updateInterval = TRACK_PLAYER_PROGRESS_UPDATE_INTERVAL_MS,
) => useProgress(updateInterval);

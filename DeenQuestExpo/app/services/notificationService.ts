import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { RegisterNotificationTokenRequest } from "../store/services/api";

export const DEFAULT_NOTIFICATION_CHANNEL_ID = "default";

const STORAGE_KEYS = {
  deviceId: "notifications.deviceId",
} as const;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const getOrCreateDeviceIdAsync = async () => {
  const existing = await AsyncStorage.getItem(STORAGE_KEYS.deviceId);
  if (existing) return existing;

  const next = `${Platform.OS}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
  await AsyncStorage.setItem(STORAGE_KEYS.deviceId, next);
  return next;
};

const getProjectId = () => {
  const constants = Constants as any;
  return (
    Constants.expoConfig?.extra?.eas?.projectId ||
    constants.easConfig?.projectId ||
    constants.manifest2?.extra?.eas?.projectId
  );
};

const ensureAndroidNotificationChannelAsync = async () => {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(
    DEFAULT_NOTIFICATION_CHANNEL_ID,
    {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#14b8a6",
    },
  );
};

export const getExpoPushRegistrationAsync =
  async (): Promise<RegisterNotificationTokenRequest | null> => {
    if (Platform.OS === "web") {
      return null;
    }

    if (!Device.isDevice) {
      return null;
    }

    try {
      await ensureAndroidNotificationChannelAsync();

      const existingPermission = await Notifications.getPermissionsAsync();
      let finalStatus = existingPermission.status;

      if (finalStatus !== "granted") {
        const requestedPermission =
          await Notifications.requestPermissionsAsync();
        finalStatus = requestedPermission.status;
      }

      if (finalStatus !== "granted") {
        return null;
      }

      const projectId = getProjectId();
      
      const tokenResult = (projectId && projectId != undefined ) 
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();

      const expoPushToken = tokenResult.data;
      const deviceId = await getOrCreateDeviceIdAsync();

      return {
        expo_push_token: expoPushToken,
        platform: Platform.OS as RegisterNotificationTokenRequest["platform"],
        device_id: deviceId,
        app_version:
          Constants.nativeAppVersion ||
          Constants.expoConfig?.version ||
          undefined,
      };
    } catch (error) {
      console.warn("Could not register push notifications", error);
      return null;
    }
  };

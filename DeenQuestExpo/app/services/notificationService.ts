import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Linking, Platform } from "react-native";
import type { RegisterNotificationTokenRequest } from "../store/services/api";

export const DEFAULT_NOTIFICATION_CHANNEL_ID = "default";

const STORAGE_KEYS = {
  deviceId: "notifications.deviceId",
  expoPushToken: "notifications.expoPushToken",
  enabled: "notifications.enabled",
} as const;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushRegistrationResult =
  | {
      status: "registered";
      payload: RegisterNotificationTokenRequest;
    }
  | {
      status: "denied" | "unsupported" | "error";
      message: string;
    };

export const getNotificationsEnabledPreference = async () => {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.enabled);
  return value !== "false";
};

export const setNotificationsEnabledPreference = async (enabled: boolean) => {
  await AsyncStorage.setItem(STORAGE_KEYS.enabled, String(enabled));
};

export const getStoredExpoPushTokenAsync = async () => {
  return AsyncStorage.getItem(STORAGE_KEYS.expoPushToken);
};

const setStoredExpoPushTokenAsync = async (token: string) => {
  await AsyncStorage.setItem(STORAGE_KEYS.expoPushToken, token);
};

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
  async (): Promise<PushRegistrationResult> => {
    if (Platform.OS === "web") {
      return {
        status: "unsupported",
        message: "Push notifications are available on iOS and Android.",
      };
    }

    if (!Device.isDevice) {
      return {
        status: "unsupported",
        message: "Push notifications require a physical device.",
      };
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
        return {
          status: "denied",
          message: "Notification permission was not granted.",
        };
      }

      const projectId = getProjectId();
      const tokenResult = projectId
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();

      const expoPushToken = tokenResult.data;
      const deviceId = await getOrCreateDeviceIdAsync();
      await setStoredExpoPushTokenAsync(expoPushToken);

      return {
        status: "registered",
        payload: {
          expo_push_token: expoPushToken,
          platform: Platform.OS as RegisterNotificationTokenRequest["platform"],
          device_id: deviceId,
          app_version:
            Constants.nativeAppVersion ||
            Constants.expoConfig?.version ||
            undefined,
        },
      };
    } catch (error) {
      return {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not register push notifications.",
      };
    }
  };

export const addNotificationListeners = (callbacks?: {
  onReceived?: (notification: Notifications.Notification) => void;
  onResponse?: (response: Notifications.NotificationResponse) => void;
}) => {
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      callbacks?.onReceived?.(notification);
    },
  );

  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      callbacks?.onResponse?.(response);
      openNotificationResponse(response);
    });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
};

const openNotificationResponse = (
  response: Notifications.NotificationResponse,
) => {
  const url = response.notification.request.content.data?.url;
  if (typeof url !== "string" || !url.trim()) return;

  Linking.openURL(url).catch((error) => {
    console.warn("Failed to open notification URL", error);
  });
};

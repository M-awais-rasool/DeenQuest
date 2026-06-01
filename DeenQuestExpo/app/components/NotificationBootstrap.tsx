import { useEffect } from "react";
import { useRegisterNotificationTokenMutation } from "../store/services/api";
import { useAppSelector } from "../store/hooks";
import { getExpoPushRegistrationAsync } from "../services/notificationService";
import * as Notifications from "expo-notifications";
import { Linking } from "react-native";

const openNotificationTarget = async (data?: Record<string, unknown>) => {
  const rawURL = data?.url;
  if (typeof rawURL === "string" && rawURL.length > 0) {
    await Linking.openURL(rawURL);
    return;
  }

  const rawSurahId = data?.surah_id;
  const surahId =
    typeof rawSurahId === "number" ? rawSurahId : Number(rawSurahId);
  if (Number.isInteger(surahId) && surahId >= 1 && surahId <= 114) {
    await Linking.openURL(`deenquest://quran/surah/${surahId}`);
  }
};

export function NotificationBootstrap() {
  const isAuthenticated = useAppSelector(
    (state) => state.main.isAuthenticated
  );

  const [registerNotificationToken] =
    useRegisterNotificationTokenMutation();

  useEffect(() => {
    let isMounted = true;

    const registerToken = async () => {
      const payload = await getExpoPushRegistrationAsync();

      if (!isMounted || !payload) return;

      try {
        await registerNotificationToken(payload).unwrap();
      } catch (error) {
        console.warn(
          "Failed to register notification token",
          error
        );
      }
    };

    if (isAuthenticated) {
      registerToken();
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const receivedSubscription =
      Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log(
            "Notification Received:",
            JSON.stringify(notification, null, 2)
          );
        }
      );

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(
        (response) => {
          console.log(
            "Notification Clicked:",
            JSON.stringify(response, null, 2)
          );
          openNotificationTarget(
            response.notification.request.content.data,
          ).catch((error) => {
            console.warn("Failed to open notification target", error);
          });
        }
      );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return null;
}

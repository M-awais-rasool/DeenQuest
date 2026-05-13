import { useEffect } from "react";
import { useRegisterNotificationTokenMutation } from "../store/services/api";
import { useAppSelector } from "../store/hooks";
import { getExpoPushRegistrationAsync } from "../services/notificationService";
import * as Notifications from "expo-notifications";

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
        }
      );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return null;
}

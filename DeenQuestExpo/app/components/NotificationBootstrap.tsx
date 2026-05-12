import { useEffect } from "react";
import { useRegisterNotificationTokenMutation } from "../store/services/api";
import { useAppSelector } from "../store/hooks";
import {
  addNotificationListeners,
  getExpoPushRegistrationAsync,
  getNotificationsEnabledPreference,
} from "../services/notificationService";

export function NotificationBootstrap() {
  const isAuthenticated = useAppSelector((state) => state.main.isAuthenticated);
  const [registerNotificationToken] = useRegisterNotificationTokenMutation();

  useEffect(() => {
    return addNotificationListeners();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const registerToken = async () => {
      const enabled = await getNotificationsEnabledPreference();
      if (!enabled || !isMounted) return;

      const result = await getExpoPushRegistrationAsync();
      if (!isMounted || result.status !== "registered") return;

      try {
        await registerNotificationToken(result.payload).unwrap();
      } catch (error) {
        console.warn("Failed to register notification token", error);
      }
    };

    if (isAuthenticated) {
      registerToken();
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, registerNotificationToken]);

  return null;
}

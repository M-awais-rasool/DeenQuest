import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthUser } from "../services/api";

export const STORAGE_KEYS = {
  accessToken: "accessToken",
  authUser: "authUser",
  isAuthenticated: "isAuthenticated",
  hasCompletedOnboarding: "hasCompletedOnboarding",
} as const;

export interface PersistedAuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

export const persistAccessToken = async (token: string | null) => {
  if (token) {
    await AsyncStorage.setItem(STORAGE_KEYS.accessToken, token);
    return;
  }

  await AsyncStorage.removeItem(STORAGE_KEYS.accessToken);
};

export const persistAuthUser = async (user: AuthUser | null) => {
  if (user) {
    await AsyncStorage.setItem(STORAGE_KEYS.authUser, JSON.stringify(user));
    return;
  }

  await AsyncStorage.removeItem(STORAGE_KEYS.authUser);
};

export const persistIsAuthenticated = async (isAuthenticated: boolean) => {
  await AsyncStorage.setItem(
    STORAGE_KEYS.isAuthenticated,
    String(isAuthenticated),
  );
};

export const clearPersistedAuth = async () => {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.accessToken),
    AsyncStorage.removeItem(STORAGE_KEYS.authUser),
    AsyncStorage.removeItem(STORAGE_KEYS.isAuthenticated),
  ]);
};

export const readPersistedAuth = async (): Promise<PersistedAuthState> => {
  const [token, userString, isAuthenticatedString] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.accessToken),
    AsyncStorage.getItem(STORAGE_KEYS.authUser),
    AsyncStorage.getItem(STORAGE_KEYS.isAuthenticated),
  ]);

  let user: AuthUser | null = null;

  if (userString) {
    try {
      user = JSON.parse(userString) as AuthUser;
    } catch {
      user = null;
    }
  }

  return {
    token,
    user,
    isAuthenticated: isAuthenticatedString === "true",
  };
};

export const setOnboardingCompleted = async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.hasCompletedOnboarding, "true");
};

export const hasCompletedOnboarding = async () => {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.hasCompletedOnboarding);
  return value === "true";
};

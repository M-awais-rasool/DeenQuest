import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import type { AuthUser } from "../services/api";

export const STORAGE_KEYS = {
  accessToken: "accessToken",
  authUser: "authUser",
  isAuthenticated: "isAuthenticated",
  hasCompletedOnboarding: "hasCompletedOnboarding",
  deviceId: "deviceId",
} as const;

const REFRESH_TOKEN_KEY = "deenquest.refreshToken";

export interface PersistedAuthState {
  token: string | null;
  refreshToken: string | null;
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

export const persistRefreshToken = async (token: string | null) => {
  try {
    if (token) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
      return;
    }
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.warn("Failed to persist refresh token securely", error);
  }
};

export const readRefreshToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
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
    persistRefreshToken(null),
  ]);
};

export const readPersistedAuth = async (): Promise<PersistedAuthState> => {
  const [token, refreshToken, userString, isAuthenticatedString] =
    await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.accessToken),
      readRefreshToken(),
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
    refreshToken,
    user,
    isAuthenticated: isAuthenticatedString === "true",
  };
};

export const getDeviceId = async (): Promise<string> => {
  const existing = await AsyncStorage.getItem(STORAGE_KEYS.deviceId);
  if (existing) return existing;

  const id = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  await AsyncStorage.setItem(STORAGE_KEYS.deviceId, id);
  return id;
};

export const setOnboardingCompleted = async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.hasCompletedOnboarding, "true");
};

export const hasCompletedOnboarding = async () => {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.hasCompletedOnboarding);
  return value === "true";
};

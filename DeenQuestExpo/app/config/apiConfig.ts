import Constants from "expo-constants";

/**
 * Which backend this build talks to.
 *
 * The value comes from app.config.js, which reads API_BASE_URL from the
 * environment — set per profile in eas.json. It is deliberately not a constant
 * in the source: whatever sits in the file at build time ships to real devices,
 * so a hardcoded LAN address is one forgotten edit away from a production
 * release that points at somebody's laptop.
 */
const api = (Constants.expoConfig?.extra?.api ?? {}) as {
  baseUrl?: string;
};

export const API_BASE_URL = api.baseUrl ?? "http://192.168.18.27:8080";

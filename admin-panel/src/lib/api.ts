import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "./tokenStore";

// Empty base URL keeps the dev-server proxy in vite.config.ts working; a
// deployed build sets VITE_API_BASE_URL because the panel is served from
// Cloudflare Pages, a different origin from the API.
const API_ORIGIN = import.meta.env.VITE_API_BASE_URL ?? "";

const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * One shared refresh, never several.
 *
 * A dashboard fires many requests at once, so when the 15-minute access token
 * expires they all 401 together. Refreshing per request would spend the same
 * refresh token repeatedly — which the server correctly reads as a stolen-token
 * replay and answers by revoking the entire session. Holding a single promise
 * means the first 401 refreshes and the rest wait for it.
 */
let refreshInFlight: Promise<string | null> | null = null;

async function refreshSession(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    // A bare axios call: going through `api` would recurse into this
    // interceptor on failure.
    const res = await axios.post("/api/v1/auth/refresh", {
      refresh_token: refreshToken,
    });

    const session = res.data?.data;
    if (!session?.access_token) return null;

    setAccessToken(session.access_token);
    setRefreshToken(session.refresh_token);
    return session.access_token;
  } catch {
    return null;
  }
}

export async function ensureSession(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = refreshSession().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retried?: boolean;
    };

    const isAuthCall = original?.url?.startsWith("/v1/auth/");
    if (error.response?.status !== 401 || !original || original._retried || isAuthCall) {
      if (error.response?.status === 401 && !isAuthCall) {
        clearSession();
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    original._retried = true;

    const token = await ensureSession();
    if (!token) {
      clearSession();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${token}`;
    return api(original);
  },
);

export default api;

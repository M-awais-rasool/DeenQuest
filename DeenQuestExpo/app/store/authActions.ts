import { API, API_BASE_URL, type AuthResponse } from "./services/api";
import {
  logout as logoutAction,
  setAccessToken,
  setError,
  setIsAuthenticated,
  setRefreshToken,
  setUser,
} from "./slices/mainSlice";
import { readRefreshToken } from "./storage/authStorage";
import { signOutOfProviders } from "../services/socialAuth";
import type { AppDispatch } from "./store";

export const signIn = (session: AuthResponse) => (dispatch: AppDispatch) => {
  dispatch(setUser(session.user));
  dispatch(setAccessToken(session.access_token));
  dispatch(setRefreshToken(session.refresh_token));
  dispatch(setIsAuthenticated(true));
  dispatch(setError(null));
  dispatch(API.util.resetApiState());
};

export const applySession =
  (session: AuthResponse) => (dispatch: AppDispatch) => {
    dispatch(setAccessToken(session.access_token));
    dispatch(setRefreshToken(session.refresh_token));
    if (session.user) {
      dispatch(setUser(session.user));
    }
  };


export const signOut = () => async (dispatch: AppDispatch) => {
  const refreshToken = await readRefreshToken().catch(() => null);

  dispatch(logoutAction());
  dispatch(API.util.resetApiState());

  await Promise.allSettled([
    signOutOfProviders(),
    refreshToken
      ? fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
      : Promise.resolve(),
  ]);
};

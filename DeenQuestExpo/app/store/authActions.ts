import { API, type AuthUser } from "./services/api";
import {
  logout as logoutAction,
  setAccessToken,
  setError,
  setIsAuthenticated,
  setUser,
} from "./slices/mainSlice";
import type { AppDispatch } from "./store";

export interface Session {
  user: AuthUser;
  accessToken: string;
}

/**
 * Establishes a signed-in session.
 *
 * Resetting the RTK Query cache is the load-bearing part. Cache keys are built
 * from endpoint + arguments, and endpoints like `getProfile` take no arguments
 * at all — so a second account's `getProfile` hits the *first* account's cache
 * entry and the app renders the previous user. The reset runs last so that any
 * refetch it triggers already carries the new token.
 */
export const signIn =
  (session: Session) => (dispatch: AppDispatch) => {
    dispatch(setUser(session.user));
    dispatch(setAccessToken(session.accessToken));
    dispatch(setIsAuthenticated(true));
    dispatch(setError(null));
    dispatch(API.util.resetApiState());
  };

/**
 * Ends the session and drops every cached response with it, so the next account
 * to sign in on this device starts from a clean slate. The credentials are
 * cleared first so nothing can refetch with the outgoing token.
 */
export const signOut = () => (dispatch: AppDispatch) => {
  dispatch(logoutAction());
  dispatch(API.util.resetApiState());
};

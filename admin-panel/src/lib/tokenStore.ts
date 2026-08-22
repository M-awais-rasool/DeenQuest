/**
 * Where the panel's session lives.
 *
 * The access token is kept in memory only. It used to sit in localStorage as a
 * JWT that never expired, which meant any XSS on this origin handed over a
 * permanent admin session. Now it lasts 15 minutes and dies with the tab.
 *
 * The refresh token still needs to survive a reload, so it goes to
 * localStorage. That is a deliberate trade-off: a browser has no Keychain, and
 * the stronger option (an httpOnly cookie) needs the API to set cookies and
 * carry CSRF protection. Rotation plus reuse detection limits the damage in the
 * meantime — a stolen token works once, then the whole session is revoked.
 */
const REFRESH_TOKEN_KEY = "dq_refresh_token";

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
    return;
  }
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function clearSession() {
  accessToken = null;
  setRefreshToken(null);
}

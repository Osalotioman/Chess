import type { AuthSession, AuthTokens, UserProfile } from "./auth";

const SESSION_STORAGE_KEY = "chess_auth_session";

export interface StoredSession {
  user: UserProfile;
  tokens: AuthTokens;
}

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getStoredSession(): StoredSession | null {
  if (!canUseStorage()) return null;

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredSession;

    if (!parsed?.tokens?.accessToken || !parsed?.tokens?.refreshToken) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function setStoredSession(session: AuthSession | StoredSession) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getAccessToken() {
  return getStoredSession()?.tokens.accessToken ?? null;
}

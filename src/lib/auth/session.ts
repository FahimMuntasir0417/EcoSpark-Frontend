import {
  AUTH_COOKIE_KEYS,
  AUTH_STORAGE_KEYS,
  FALLBACK_REFRESH_COOKIE_KEYS,
  FALLBACK_ROLE_COOKIE_KEYS,
  FALLBACK_TOKEN_COOKIE_KEYS,
} from "@/config/auth";
import { deleteCookie, getCookie, setCookie } from "@/lib/cookieUtils";
import { extractUserRoleFromToken, parseJwtPayload } from "@/lib/tokenUtils";

type SessionPayload = {
  accessToken?: string;
  refreshToken?: string;
  role?: string;
};

function getStorageItem(key: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageItem(key: string, value: string): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures and continue with cookie fallback.
  }
}

function removeStorageItem(key: string): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // noop
  }
}

function getTokenMaxAge(token: string): number | undefined {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) return undefined;

  const now = Math.floor(Date.now() / 1000);
  const seconds = payload.exp - now;
  if (seconds <= 0) return undefined;

  return seconds;
}

function resolveCookie(name: string, fallbacks: readonly string[]): string | null {
  const direct = getCookie(name);
  if (direct) {
    return direct;
  }

  for (const fallback of fallbacks) {
    const value = getCookie(fallback);
    if (value) {
      return value;
    }
  }

  return null;
}

export function getAccessToken(): string | null {
  const fromStorage = getStorageItem(AUTH_STORAGE_KEYS.accessToken);
  if (fromStorage) {
    return fromStorage;
  }

  return resolveCookie(AUTH_COOKIE_KEYS.accessToken, FALLBACK_TOKEN_COOKIE_KEYS);
}

export function getRefreshToken(): string | null {
  const fromStorage = getStorageItem(AUTH_STORAGE_KEYS.refreshToken);
  if (fromStorage) {
    return fromStorage;
  }

  return resolveCookie(AUTH_COOKIE_KEYS.refreshToken, FALLBACK_REFRESH_COOKIE_KEYS);
}

export function getUserRole(): string | null {
  const fromStorage = getStorageItem(AUTH_STORAGE_KEYS.userRole);
  if (fromStorage) {
    return fromStorage;
  }

  return resolveCookie(AUTH_COOKIE_KEYS.userRole, FALLBACK_ROLE_COOKIE_KEYS);
}

export function setAccessToken(token: string): void {
  setStorageItem(AUTH_STORAGE_KEYS.accessToken, token);
  setCookie(AUTH_COOKIE_KEYS.accessToken, token, {
    path: "/",
    maxAge: getTokenMaxAge(token),
    sameSite: "Lax",
  });
}

export function setRefreshToken(token: string): void {
  setStorageItem(AUTH_STORAGE_KEYS.refreshToken, token);
  setCookie(AUTH_COOKIE_KEYS.refreshToken, token, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "Lax",
  });
}

export function setUserRole(role: string): void {
  const normalizedRole = role.trim();
  if (!normalizedRole) return;

  setStorageItem(AUTH_STORAGE_KEYS.userRole, normalizedRole);
  setCookie(AUTH_COOKIE_KEYS.userRole, normalizedRole, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "Lax",
  });
}

export function persistAuthSession(payload: SessionPayload): void {
  if (payload.accessToken) {
    setAccessToken(payload.accessToken);

    const roleFromToken = extractUserRoleFromToken(payload.accessToken);
    if (roleFromToken) {
      setUserRole(roleFromToken);
    }
  }

  if (payload.refreshToken) {
    setRefreshToken(payload.refreshToken);
  }

  if (payload.role) {
    setUserRole(payload.role);
  }
}

export function clearAuthSession(): void {
  removeStorageItem(AUTH_STORAGE_KEYS.accessToken);
  removeStorageItem(AUTH_STORAGE_KEYS.refreshToken);
  removeStorageItem(AUTH_STORAGE_KEYS.userRole);

  deleteCookie(AUTH_COOKIE_KEYS.accessToken);
  deleteCookie(AUTH_COOKIE_KEYS.refreshToken);
  deleteCookie(AUTH_COOKIE_KEYS.userRole);

  for (const key of FALLBACK_TOKEN_COOKIE_KEYS) deleteCookie(key);
  for (const key of FALLBACK_REFRESH_COOKIE_KEYS) deleteCookie(key);
  for (const key of FALLBACK_ROLE_COOKIE_KEYS) deleteCookie(key);
}

export function syncRoleFromAccessToken(): string | null {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  const role = extractUserRoleFromToken(token);
  if (role) {
    setUserRole(role);
  }

  return role;
}

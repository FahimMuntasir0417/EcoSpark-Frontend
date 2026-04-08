import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  AUTH_COOKIE_KEYS,
  FALLBACK_REFRESH_COOKIE_KEYS,
  FALLBACK_ROLE_COOKIE_KEYS,
  FALLBACK_TOKEN_COOKIE_KEYS,
} from "@/config/auth";
import { extractUserRoleFromToken, isTokenExpired } from "@/lib/tokenUtils";

export type ServerAuthSession = {
  accessToken: string | null;
  refreshToken: string | null;
  role: string | null;
  isAuthenticated: boolean;
};

async function readCookieWithFallback(
  name: string,
  fallbacks: readonly string[],
) {
  const cookieStore = await cookies();
  const direct = cookieStore.get(name)?.value;

  if (direct) {
    return direct;
  }

  for (const key of fallbacks) {
    const value = cookieStore.get(key)?.value;
    if (value) {
      return value;
    }
  }

  return null;
}

export async function getServerAuthSession(): Promise<ServerAuthSession> {
  const [accessToken, refreshToken, roleCookie] = await Promise.all([
    readCookieWithFallback(
      AUTH_COOKIE_KEYS.accessToken,
      FALLBACK_TOKEN_COOKIE_KEYS,
    ),
    readCookieWithFallback(
      AUTH_COOKIE_KEYS.refreshToken,
      FALLBACK_REFRESH_COOKIE_KEYS,
    ),
    readCookieWithFallback(
      AUTH_COOKIE_KEYS.userRole,
      FALLBACK_ROLE_COOKIE_KEYS,
    ),
  ]);

  const roleFromToken = accessToken
    ? extractUserRoleFromToken(accessToken)
    : null;
  const role = roleCookie ?? roleFromToken;
  const tokenValid = accessToken ? !isTokenExpired(accessToken, 0) : false;

  return {
    accessToken,
    refreshToken,
    role,
    isAuthenticated: Boolean(accessToken && tokenValid),
  };
}

export async function requireAuthenticated(redirectTo = "/login") {
  const session = await getServerAuthSession();
  if (!session.isAuthenticated) {
    redirect(redirectTo);
  }

  return session;
}

export async function requireRole(
  allowedRoles: string[],
  options?: {
    unauthenticatedRedirect?: string;
    unauthorizedRedirect?: string;
  },
) {
  const session = await requireAuthenticated(
    options?.unauthenticatedRedirect ?? "/login",
  );

  const allowed = allowedRoles.map((role) => role.toUpperCase());

  if (!session.role || !allowed.includes(session.role.toUpperCase())) {
    redirect(options?.unauthorizedRedirect ?? "/");
  }

  return session;
}

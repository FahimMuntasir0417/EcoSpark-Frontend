import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_KEYS,
  FALLBACK_ROLE_COOKIE_KEYS,
  FALLBACK_TOKEN_COOKIE_KEYS,
} from "@/config/auth";
import {
  buildLoginHrefFromRequestPath,
  canRoleAccessPath,
  isProtectedPath,
  resolveUnauthorizedTarget,
} from "@/lib/navigation/redirect-policy";
import { extractUserRoleFromToken, isTokenExpired } from "@/lib/tokenUtils";

function readCookieValue(
  request: NextRequest,
  name: string,
  fallbackNames: readonly string[],
): string | null {
  const direct = request.cookies.get(name)?.value;

  if (direct) {
    return direct;
  }

  for (const fallback of fallbackNames) {
    const value = request.cookies.get(fallback)?.value;
    if (value) {
      return value;
    }
  }

  return null;
}

function getSessionFromRequest(request: NextRequest) {
  const accessToken = readCookieValue(
    request,
    AUTH_COOKIE_KEYS.accessToken,
    FALLBACK_TOKEN_COOKIE_KEYS,
  );

  const roleCookie = readCookieValue(
    request,
    AUTH_COOKIE_KEYS.userRole,
    FALLBACK_ROLE_COOKIE_KEYS,
  );

  const roleFromToken = accessToken ? extractUserRoleFromToken(accessToken) : null;
  const role = roleCookie ?? roleFromToken;
  const isAuthenticated = Boolean(accessToken && !isTokenExpired(accessToken, 0));

  return {
    role,
    isAuthenticated,
  };
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { isAuthenticated, role } = getSessionFromRequest(request);
  const protectedPath = isProtectedPath(pathname);

  if (protectedPath && !isAuthenticated) {
    const loginHref = buildLoginHrefFromRequestPath(pathname, search);
    return NextResponse.redirect(new URL(loginHref, request.url));
  }

  if (protectedPath && !canRoleAccessPath(pathname, role)) {
    return NextResponse.redirect(new URL(resolveUnauthorizedTarget(), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/scientist/dashboard/:path*",
    "/dashboard/:path*",
    "/my-profile/:path*",
    "/change-password/:path*",
  ],
};

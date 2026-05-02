import {
  canAccessAdminDashboard,
  canAccessScientistDashboard,
  getDefaultDashboardRoute,
  normalizeUserRole,
} from "@/lib/authUtils";

export const APP_ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
} as const;

const AUTH_ROUTES = [
  APP_ROUTES.login,
  APP_ROUTES.register,
  "/forgot-password",
  "/reset-password",
  "/verify-email",
] as const;

const GENERIC_PROTECTED_ROUTES = [
  "/dashboard",
  "/my-profile",
  "/change-password",
  "/my-vote",
  "/my-comment",
  "/saved-ideas",
  "/my-purchases",
  "/purches-idea",
] as const;

function matchesRoutePrefix(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function sanitizeInternalPath(
  path: string | null | undefined,
): string | null {
  if (!path) {
    return null;
  }

  const normalizedPath = path.trim();

  if (normalizedPath.length === 0) {
    return null;
  }

  if (!normalizedPath.startsWith("/") || normalizedPath.startsWith("//")) {
    return null;
  }

  return normalizedPath;
}

function getPathnameFromInternalPath(path: string): string {
  try {
    return new URL(path, "http://localhost").pathname;
  } catch {
    const [pathname] = path.split(/[?#]/, 1);
    return pathname || path;
  }
}

export function isAuthPath(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => matchesRoutePrefix(pathname, route));
}

export function isUnauthenticatedAllowedPath(pathname: string): boolean {
  return pathname === APP_ROUTES.home || isAuthPath(pathname);
}

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isScientistDashboardPath(pathname: string): boolean {
  return (
    pathname === "/scientist/dashboard" ||
    pathname.startsWith("/scientist/dashboard/")
  );
}

export function isGenericProtectedPath(pathname: string): boolean {
  return GENERIC_PROTECTED_ROUTES.some((route) =>
    matchesRoutePrefix(pathname, route),
  );
}

export function isProtectedPath(pathname: string): boolean {
  return (
    isAdminPath(pathname) ||
    isScientistDashboardPath(pathname) ||
    isGenericProtectedPath(pathname)
  );
}

export function canRoleAccessPath(
  pathname: string,
  role: string | null | undefined,
): boolean {
  if (isAdminPath(pathname)) {
    return canAccessAdminDashboard(role);
  }

  if (isScientistDashboardPath(pathname)) {
    return canAccessScientistDashboard(role);
  }

  return true;
}

export function resolveRoleDashboardTarget(
  role: string | null | undefined,
): string {
  const normalizedRole = normalizeUserRole(role);

  if (normalizedRole) {
    return getDefaultDashboardRoute(normalizedRole);
  }

  return APP_ROUTES.home;
}

export function resolveUnauthorizedTarget(): string {
  return APP_ROUTES.home;
}

export function resolveLogoutTarget(): string {
  return APP_ROUTES.home;
}

export function resolvePostLoginTarget(
  redirectPathname: string | null | undefined,
  role: string | null | undefined,
): string {
  const safeRedirectPath = sanitizeInternalPath(redirectPathname);

  if (safeRedirectPath) {
    const pathname = getPathnameFromInternalPath(safeRedirectPath);

    if (!isAuthPath(pathname) && canRoleAccessPath(pathname, role)) {
      return safeRedirectPath;
    }
  }

  return resolveRoleDashboardTarget(role);
}

export function buildLoginHref(nextPath?: string | null): string {
  const safeNextPath = sanitizeInternalPath(nextPath);

  if (!safeNextPath || isAuthPath(getPathnameFromInternalPath(safeNextPath))) {
    return APP_ROUTES.login;
  }

  const params = new URLSearchParams();
  params.set("redirect", safeNextPath);

  return `${APP_ROUTES.login}?${params.toString()}`;
}

export function buildLoginHrefFromRequestPath(
  pathname: string,
  search = "",
): string {
  const nextPath = `${pathname}${search}`;
  return buildLoginHref(nextPath);
}

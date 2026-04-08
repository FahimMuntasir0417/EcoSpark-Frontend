import {
  canAccessAdminDashboard,
  canAccessScientistDashboard,
  getDefaultDashboardRoute,
  normalizeUserRole,
  type UserRole,
} from "@/lib/authUtils";
import { getUserRole, syncRoleFromAccessToken } from "@/lib/auth/session";

export function sanitizeLoginRedirectPath(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const nextPath = value.trim();

  if (nextPath.length === 0) {
    return null;
  }

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return null;
  }

  if (
    nextPath === "/login" ||
    nextPath.startsWith("/login/") ||
    nextPath.startsWith("/login?")
  ) {
    return null;
  }

  return nextPath;
}

function canRoleAccessPath(pathname: string, role: UserRole | null): boolean {
  if (pathname.startsWith("/admin/") || pathname === "/admin") {
    return canAccessAdminDashboard(role);
  }

  if (pathname.startsWith("/scientist/dashboard")) {
    return canAccessScientistDashboard(role);
  }

  return true;
}

export function resolveLoginRedirectTarget(
  requestedRedirect: string | null | undefined,
  roleInput: string | null | undefined,
): string {
  const role = normalizeUserRole(roleInput);
  const safeRequestedPath = sanitizeLoginRedirectPath(requestedRedirect);

  if (safeRequestedPath && canRoleAccessPath(safeRequestedPath, role)) {
    return safeRequestedPath;
  }

  if (role) {
    return getDefaultDashboardRoute(role);
  }

  return "/";
}

export function resolveLoginRedirectTargetFromSession(
  requestedRedirect: string | null | undefined,
): string {
  const roleFromSession = getUserRole() ?? syncRoleFromAccessToken();

  return resolveLoginRedirectTarget(requestedRedirect, roleFromSession);
}

import { resolvePostLoginTarget } from "@/lib/navigation/redirect-policy";

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

export function resolveLoginRedirectTarget(
  requestedRedirect: string | null | undefined,
  roleInput: string | null | undefined,
): string {
  return resolvePostLoginTarget(requestedRedirect, roleInput);
}

export function resolveLoginRedirectTargetFromSession(
  requestedRedirect: string | null | undefined,
): string {
  return resolveLoginRedirectTarget(requestedRedirect, null);
}

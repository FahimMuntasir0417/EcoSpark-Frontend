export type UserRole = "SUPER_ADMIN" | "ADMIN" | "SCIENTIST" | "MEMBER";

export function normalizeUserRole(
  role: string | null | undefined,
): UserRole | null {
  const normalizedRole = role?.trim().toUpperCase();

  switch (normalizedRole) {
    case "SUPER_ADMIN":
    case "ADMIN":
    case "SCIENTIST":
    case "MEMBER":
      return normalizedRole;
    default:
      return null;
  }
}

export function getDefaultDashboardRoute(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return "/admin/dashboard";
    case "SCIENTIST":
      return "/scientist/dashboard";
    case "MEMBER":
      return "/dashboard";
    default:
      return "/";
  }
}

export function canAccessAdminDashboard(
  role: string | null | undefined,
): boolean {
  const normalizedRole = normalizeUserRole(role);

  return normalizedRole === "SUPER_ADMIN" || normalizedRole === "ADMIN";
}

export function canAccessScientistDashboard(
  role: string | null | undefined,
): boolean {
  const normalizedRole = normalizeUserRole(role);

  return (
    normalizedRole === "SUPER_ADMIN" ||
    normalizedRole === "ADMIN" ||
    normalizedRole === "SCIENTIST"
  );
}

import { getServerAuthSession } from "@/lib/auth/session.server";
import { getDefaultDashboardRoute, normalizeUserRole } from "@/lib/authUtils";
import { PublicNavbarClient } from "./public-navbar-client";

export async function PublicNavbar() {
  const session = await getServerAuthSession();
  const role = session.isAuthenticated ? normalizeUserRole(session.role) : null;
  const dashboardHref = role
    ? getDefaultDashboardRoute(role)
    : null;

  return (
    <PublicNavbarClient
      isAuthenticated={session.isAuthenticated}
      role={role}
      dashboardHref={dashboardHref}
    />
  );
}

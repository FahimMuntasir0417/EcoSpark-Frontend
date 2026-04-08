import { DashboardShell } from "./_components/dashboard-shell";
import type { ReactNode } from "react";
import { normalizeUserRole, type UserRole } from "@/lib/authUtils";
import { requireAuthenticated } from "@/lib/auth/session.server";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: Readonly<DashboardLayoutProps>) {
  const session = await requireAuthenticated();
  const role: UserRole = normalizeUserRole(session.role) ?? "MEMBER";

  return <DashboardShell role={role}>{children}</DashboardShell>;
}

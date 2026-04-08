import { requireRole } from "@/lib/auth/session.server";

type AdminDashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminDashboardLayout({
  children,
}: Readonly<AdminDashboardLayoutProps>) {
  await requireRole(["SUPER_ADMIN", "ADMIN"]);

  return <section className="space-y-4">{children}</section>;
}

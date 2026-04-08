import { requireRole } from "@/lib/auth/session.server";

type ScientistDashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function ScientistDashboardLayout({
  children,
}: Readonly<ScientistDashboardLayoutProps>) {
  await requireRole(["SCIENTIST", "SUPER_ADMIN", "ADMIN"]);

  return <section className="space-y-4">{children}</section>;
}

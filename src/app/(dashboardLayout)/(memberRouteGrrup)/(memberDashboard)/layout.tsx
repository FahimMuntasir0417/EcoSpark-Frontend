import { requireAuthenticated } from "@/lib/auth/session.server";

type MemberDashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function MemberDashboardLayout({
  children,
}: Readonly<MemberDashboardLayoutProps>) {
  await requireAuthenticated();

  return <>{children}</>;
}

import { requireAuthenticated } from "@/lib/auth/session.server";

type CommonProtectedLayoutProps = {
  children: React.ReactNode;
};

export default async function CommonProtectedLayout({
  children,
}: Readonly<CommonProtectedLayoutProps>) {
  await requireAuthenticated();

  return <>{children}</>;
}

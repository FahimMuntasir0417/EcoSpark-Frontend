import { getServerAuthSession } from "@/lib/auth/session.server";
import { PublicAuthSessionSync } from "./_components/public-auth-session-sync";
import { PublicFooter } from "./_components/public-footer";
import { PublicNavbar } from "./_components/public-navbar";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerAuthSession();

  return (
    <div className="theme-compat-scope min-h-screen overflow-x-clip bg-background text-foreground">
      <div className="flex min-h-screen flex-col">
        <PublicAuthSessionSync
          accessToken={session.accessToken}
          refreshToken={session.refreshToken}
          role={session.role}
        />
        <PublicNavbar />
        <div className="flex-1">{children}</div>
        <PublicFooter />
      </div>
    </div>
  );
}

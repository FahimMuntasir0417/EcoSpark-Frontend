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
    <div className="relative min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.14),transparent_38%),radial-gradient(circle_at_88%_18%,rgba(16,185,129,0.11),transparent_40%),linear-gradient(180deg,#ffffff_0%,#f6f9fc_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:42px_42px] opacity-[0.14]" />
      <div className="pointer-events-none absolute -left-24 top-24 size-80 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.18),rgba(56,189,248,0)_72%)]" />
      <div className="pointer-events-none absolute -right-28 bottom-20 size-80 rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.12),rgba(52,211,153,0)_72%)]" />
      <div className="pointer-events-none absolute left-1/3 top-44 size-64 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.1),rgba(99,102,241,0)_72%)]" />

      <div className="relative z-10 flex min-h-screen flex-col">
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

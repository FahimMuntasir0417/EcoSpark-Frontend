import Link from "next/link";
import { getServerAuthSession } from "@/lib/auth/session.server";
import {
  APP_ROUTES,
  buildLoginHref,
  resolvePostLoginTarget,
  resolveRoleDashboardTarget,
} from "@/lib/navigation/redirect-policy";

const primaryLinkClassName =
  "inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80";

const secondaryLinkClassName =
  "inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted";

function ExampleRow({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <code className="break-all rounded-xl bg-slate-950 px-3 py-2 text-sm text-slate-100">
        {value}
      </code>
    </div>
  );
}

export default async function RedirectDemoPage() {
  const session = await getServerAuthSession();
  const selfLoginHref = buildLoginHref("/redirect-demo");
  const dashboardLoginHref = buildLoginHref("/dashboard");
  const adminLoginHref = buildLoginHref("/admin/dashboard");
  const defaultDashboardTarget = resolveRoleDashboardTarget(session.role);
  const postLoginTarget = resolvePostLoginTarget("/admin/dashboard", session.role);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <section className="grid gap-4">
        <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
          Redirect Demo
        </span>
        <div className="grid gap-3">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Example usage for `redirect-policy.ts`
          </h1>
          <p className="max-w-3xl text-base leading-7 text-slate-600">
            This page is public. It shows how to build a login URL, how to resolve a
            user&apos;s dashboard, and how a post-login target changes based on the
            current session role.
          </p>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">Current session</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <ExampleRow
            label="Authenticated"
            value={session.isAuthenticated ? "true" : "false"}
          />
          <ExampleRow label="Role" value={session.role ?? "null"} />
          <ExampleRow label="Default dashboard" value={defaultDashboardTarget} />
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">Generated examples</h2>
        <div className="grid gap-3">
          <ExampleRow
            label='buildLoginHref("/redirect-demo")'
            value={selfLoginHref}
          />
          <ExampleRow
            label='buildLoginHref("/dashboard")'
            value={dashboardLoginHref}
          />
          <ExampleRow
            label='buildLoginHref("/admin/dashboard")'
            value={adminLoginHref}
          />
          <ExampleRow
            label='resolvePostLoginTarget("/admin/dashboard", session.role)'
            value={postLoginTarget}
          />
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">How to use it in a new page</h2>
        <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
{`import Link from "next/link";
import { getServerAuthSession } from "@/lib/auth/session.server";
import {
  buildLoginHref,
  resolveRoleDashboardTarget,
} from "@/lib/navigation/redirect-policy";

export default async function NewPage() {
  const session = await getServerAuthSession();
  const loginHref = buildLoginHref("/new-page");
  const dashboardHref = resolveRoleDashboardTarget(session.role);

  return (
    <div>
      <Link href={loginHref}>Login first</Link>
      <p>Dashboard after login: {dashboardHref}</p>
    </div>
  );
}`}
        </pre>
        <div className="flex flex-wrap gap-3">
          <Link className={primaryLinkClassName} href={selfLoginHref}>
            Login and return here
          </Link>
          <Link
            className={secondaryLinkClassName}
            href={session.isAuthenticated ? defaultDashboardTarget : APP_ROUTES.login}
          >
            Open dashboard target
          </Link>
        </div>
      </section>
    </main>
  );
}

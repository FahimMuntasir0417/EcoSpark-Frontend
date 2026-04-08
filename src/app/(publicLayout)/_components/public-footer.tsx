import Link from "next/link";
import { ArrowRight, Globe2, Mail, Sparkles } from "lucide-react";

const footerNavigation = [
  {
    title: "Platform",
    links: [
      { label: "Ideas", href: "/idea" },
      { label: "Campaigns", href: "/campaigns" },
      { label: "Scientists", href: "/scientist" },
      { label: "Community", href: "/community" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Home", href: "/" },
      { label: "Login", href: "/login" },
      { label: "Create account", href: "/register" },
    ],
  },
];

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="px-4 pb-8 pt-4 sm:px-6 lg:px-8 lg:pb-10">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-700/80 bg-[linear-gradient(145deg,#020617_0%,#0f172a_38%,#111827_100%)] p-8 text-slate-100 shadow-[0_30px_90px_-48px_rgba(2,6,23,0.98)] sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:34px_34px] opacity-25" />
          <div className="pointer-events-none absolute -left-24 top-0 size-64 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.24),rgba(56,189,248,0)_72%)]" />
          <div className="pointer-events-none absolute -right-28 bottom-0 size-72 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.24),rgba(16,185,129,0)_74%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.75),rgba(16,185,129,0.75),transparent)]" />

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="space-y-5">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-800/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                <Sparkles className="size-3.5" />
                Eco Spark
              </p>
              <h2 className="max-w-md text-2xl font-semibold leading-tight text-white sm:text-3xl">
                Industry-grade sustainability innovation, from submission to adoption.
              </h2>
              <p className="max-w-xl text-sm leading-7 text-slate-300">
                A professional workspace for scientists, admins, and members to
                evaluate ideas, run campaigns, and collaborate with confidence.
              </p>

              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-slate-300">
                <span className="rounded-full border border-slate-600 bg-slate-800/70 px-3 py-1">
                  Research teams
                </span>
                <span className="rounded-full border border-slate-600 bg-slate-800/70 px-3 py-1">
                  Admin workflows
                </span>
                <span className="rounded-full border border-slate-600 bg-slate-800/70 px-3 py-1">
                  Measurable impact
                </span>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:pt-1">
              {footerNavigation.map((group) => (
                <div key={group.title} className="space-y-3">
                  <p className="text-sm font-semibold text-white">{group.title}</p>
                  <div className="grid gap-2 text-sm text-slate-300">
                    {group.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="group inline-flex items-center gap-1.5 transition-colors hover:text-white"
                      >
                        {link.label}
                        <ArrowRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-8 rounded-2xl border border-slate-700 bg-slate-900/65 p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Start your sustainability workspace</p>
                <p className="mt-1 text-sm text-slate-300">
                  Bring your team from idea discovery to adoption with one professional platform.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100"
                >
                  Get started
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/community"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800/70 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-700/70"
                >
                  <Globe2 className="size-4" />
                  Community
                </Link>
              </div>
            </div>
          </div>

          <div className="relative mt-6 flex flex-col gap-3 border-t border-slate-800 pt-5 text-xs uppercase tracking-[0.14em] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>Eco Spark {year}</p>
            <p className="inline-flex items-center gap-1.5">
              <Mail className="size-3.5" />
              Professional workflows for sustainable impact
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

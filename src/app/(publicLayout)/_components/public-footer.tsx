import Link from "next/link";
import {
  ArrowRight,
  Facebook,
  Globe2,
  Instagram,
  Linkedin,
  Mail,
  Sparkles,
  Youtube,
} from "lucide-react";

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

const socialLinks = [
  {
    label: "YouTube",
    href: "https://www.youtube.com/",
    icon: Youtube,
    note: "Video updates",
    className:
      "border-rose-400/20 bg-rose-500/10 text-rose-100 hover:border-rose-300/35 hover:bg-rose-500/18",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/",
    icon: Linkedin,
    note: "Professional network",
    className:
      "border-sky-400/20 bg-sky-500/10 text-sky-100 hover:border-sky-300/35 hover:bg-sky-500/18",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/",
    icon: Facebook,
    note: "Community presence",
    className:
      "border-indigo-400/20 bg-indigo-500/10 text-indigo-100 hover:border-indigo-300/35 hover:bg-indigo-500/18",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/",
    icon: Instagram,
    note: "Visual highlights",
    className:
      "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100 hover:border-fuchsia-300/35 hover:bg-fuchsia-500/18",
  },
];

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="px-4  pb-8 pt-4 sm:px-6 lg:px-8 lg:pb-10">
      <div className="mx-auto   max-w-6xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-500/75 bg-[linear-gradient(145deg,#172033_0%,#22314a_38%,#35506f_100%)] p-8 text-slate-100 shadow-[0_30px_90px_-48px_rgba(15,23,42,0.68)] sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:34px_34px] opacity-25" />
          <div className="pointer-events-none absolute -left-24 top-0 size-64 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.28),rgba(56,189,248,0)_72%)]" />
          <div className="pointer-events-none absolute -right-28 bottom-0 size-72 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.2),rgba(16,185,129,0)_74%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.75),rgba(16,185,129,0.75),transparent)]" />

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-3 rounded-full border border-slate-400/70 bg-slate-700/55 px-3 py-2 shadow-[0_16px_40px_-28px_rgba(56,189,248,0.4)]">
                <span className="flex size-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0ea5e9_0%,#10b981_100%)] text-sm font-semibold text-white shadow-lg shadow-sky-900/30">
                  ES
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  <Sparkles className="size-3.5" />
                  Eco Spark
                </span>
              </div>
              <h2 className="max-w-md text-2xl font-semibold leading-tight text-white sm:text-3xl">
                Industry-grade sustainability innovation, from submission to
                adoption.
              </h2>
              <p className="max-w-xl text-sm leading-7 text-slate-300">
                A professional workspace for scientists, admins, and members to
                evaluate ideas, run campaigns, and collaborate with confidence.
              </p>

              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-slate-300">
                <span className="rounded-full border border-slate-400/70 bg-slate-700/45 px-3 py-1">
                  Research teams
                </span>
                <span className="rounded-full border border-slate-400/70 bg-slate-700/45 px-3 py-1">
                  Admin workflows
                </span>
                <span className="rounded-full border border-slate-400/70 bg-slate-700/45 px-3 py-1">
                  Measurable impact
                </span>
              </div>

              <div className="rounded-[1.6rem] border border-slate-500/70 bg-white/[0.1] p-4 shadow-[0_24px_50px_-38px_rgba(15,23,42,0.65)]">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Follow Eco Spark
                    </p>
                    <p className="mt-2 text-sm text-slate-200">
                      Stay close to new ideas, public updates, and platform
                      news.
                    </p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Social channels
                  </p>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {socialLinks.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={item.label}
                      className={`group flex items-center gap-3 rounded-2xl border px-3 py-3 transition-all ${item.className}`}
                    >
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/12 text-white shadow-inner">
                        <item.icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-white">
                          {item.label}
                        </span>
                        <span className="block text-xs text-white/70">
                          {item.note}
                        </span>
                      </span>
                      <ArrowRight className="ml-auto size-4 text-white/60 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:pt-1">
              {footerNavigation.map((group) => (
                <div
                  key={group.title}
                  className="rounded-[1.5rem] border border-slate-500/70 bg-white/[0.1] p-4 shadow-[0_22px_45px_-38px_rgba(15,23,42,0.65)]"
                >
                  <p className="text-sm font-semibold text-white">
                    {group.title}
                  </p>
                  <div className="mt-3 grid gap-2 text-sm text-slate-300">
                    {group.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="group inline-flex items-center justify-between rounded-xl px-3 py-2 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <span>{link.label}</span>
                        <ArrowRight className="size-3 text-slate-500 transition-all group-hover:translate-x-0.5 group-hover:text-white" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-8 overflow-hidden rounded-2xl border border-slate-500/70 bg-[linear-gradient(135deg,rgba(37,52,78,0.92),rgba(44,62,92,0.84),rgba(29,120,156,0.74))] p-4 sm:p-5">
            <div className="pointer-events-none absolute -right-14 top-0 size-36 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.22),rgba(56,189,248,0)_72%)]" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  Start your sustainability workspace
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Bring your team from idea discovery to adoption with one
                  professional platform.
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
                  className="inline-flex items-center gap-2 rounded-full border border-slate-400/70 bg-slate-700/45 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-600/55"
                >
                  <Globe2 className="size-4" />
                  Community
                </Link>
              </div>
            </div>
          </div>

          <div className="relative mt-6 flex flex-col gap-3 border-t border-slate-700/80 pt-5 text-xs uppercase tracking-[0.14em] text-slate-300 sm:flex-row sm:items-center sm:justify-between">
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

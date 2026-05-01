import type { Metadata } from "next";
import {
  ArrowRight,
  CircleHelp,
  KeyRound,
  LockKeyhole,
  Server,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Eco Spark Support",
  description:
    "Support resources for Eco Spark setup, authentication, backend API configuration, and role-based navigation.",
};

const supportCards = [
  {
    title: "API connection",
    description:
      "Set NEXT_PUBLIC_API_BASE_URL with the backend URL including the /api/v1 suffix, then restart the frontend server.",
    icon: Server,
  },
  {
    title: "Authentication",
    description:
      "Login persists auth cookies through the server action and mirrors client auth state for Axios request handling.",
    icon: KeyRound,
  },
  {
    title: "Protected routes",
    description:
      "Member, scientist, admin, and common protected routes are enforced through the project proxy and server layouts.",
    icon: LockKeyhole,
  },
  {
    title: "Validation",
    description:
      "Forms and service payloads should stay aligned with the Zod contracts in the contracts directory.",
    icon: ShieldCheck,
  },
];

const routeHelp = [
  { label: "Public discovery", href: "/idea", detail: "Browse ideas" },
  { label: "Campaigns", href: "/campaigns", detail: "Review campaigns" },
  { label: "Scientists", href: "/scientist", detail: "Find profiles" },
  { label: "Community", href: "/community", detail: "Read reports" },
  { label: "Plans", href: "/subscription-plan", detail: "Compare access" },
  { label: "Contact", href: "/contact", detail: "Prepare a support request" },
];

const setupChecks = [
  "Use Node.js 20.x and pnpm 10.x.",
  "Install dependencies with pnpm install.",
  "Create .env.local from .env.example.",
  "Set NEXT_PUBLIC_API_BASE_URL to the EcoSpark Hub backend.",
  "Start the backend API before testing authenticated data flows.",
  "Run pnpm typecheck and pnpm lint before deployment.",
];

export default function SupportPage() {
  return (
    <main className="public-page-shell">
      <section className="grid gap-4">
        <p className="section-kicker">Support</p>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Help for setup, account access, and production checks.
        </h1>
        <p className="section-copy">
          This support page is aligned with the repository README and existing
          project conventions so new users can troubleshoot the frontend without
          guessing how the backend, auth, and routes are connected.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {supportCards.map((card) => (
          <article key={card.title} className="surface-card p-5">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <card.icon className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">{card.title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {card.description}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="surface-card p-6">
          <TerminalSquare className="size-6 text-primary" />
          <h2 className="mt-4 text-2xl font-semibold">Setup checklist</h2>
          <div className="mt-5 grid gap-3">
            {setupChecks.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-border bg-muted p-3 text-sm leading-6"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-6">
          <CircleHelp className="size-6 text-primary" />
          <h2 className="mt-4 text-2xl font-semibold">Useful routes</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {routeHelp.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted"
              >
                <span>
                  <span className="block text-sm font-semibold">
                    {route.label}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {route.detail}
                  </span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-primary p-6 text-primary-foreground lg:p-8">
        <h2 className="text-2xl font-semibold">Need project-specific help?</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-primary-foreground/80">
          Use the contact page to prepare a request for the actual Eco Spark
          frontend repository, including your topic and setup context.
        </p>
        <Link
          href="/contact"
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-background px-5 py-3 text-sm font-semibold text-foreground"
        >
          Contact support
          <ArrowRight className="size-4" />
        </Link>
      </section>
    </main>
  );
}

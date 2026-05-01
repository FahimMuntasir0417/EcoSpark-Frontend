import type { Metadata } from "next";
import {
  ArrowRight,
  DatabaseZap,
  FileCheck2,
  FlaskConical,
  Globe2,
  ShieldCheck,
  ShoppingCart,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Eco Spark",
  description:
    "Learn how Eco Spark structures sustainability idea discovery, moderation, campaigns, commerce, and role-based workspaces.",
};

const productAreas = [
  {
    title: "Public discovery",
    description:
      "Ideas, campaigns, scientists, and community content are available before authentication so new users can evaluate the platform first.",
    icon: Globe2,
  },
  {
    title: "Role-based workspaces",
    description:
      "Members, scientists, admins, and super admins receive dashboard routes aligned to their permissions and primary tasks.",
    icon: UsersRound,
  },
  {
    title: "Moderated submissions",
    description:
      "Idea records move through structured admin review, featured and archived states, reports, and taxonomy management.",
    icon: ShieldCheck,
  },
  {
    title: "Paid idea access",
    description:
      "Commerce services cover checkout session creation, success handling, purchases, and transaction-oriented routes.",
    icon: ShoppingCart,
  },
];

const architecture = [
  "Route groups separate public pages from dashboard layouts.",
  "Feature hooks wrap TanStack Query and TanStack Form behavior.",
  "Service modules call the backend through a shared Axios client.",
  "Zod contracts validate request payloads and response data.",
  "Server session helpers and proxy rules protect role-specific routes.",
  "Next rewrites forward /api/v1 requests to NEXT_PUBLIC_API_BASE_URL.",
];

export default function AboutPage() {
  return (
    <main className="public-page-shell">
      <section className="grid gap-6 rounded-lg border border-border bg-card p-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:p-8">
        <div>
          <p className="section-kicker">About Eco Spark</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            A structured frontend for sustainability innovation operations.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">
            Eco Spark is built for organizations that need a reliable path from
            sustainability idea submission to review, prioritization, adoption,
            and paid access. The application is organized around public
            discovery, authenticated workspaces, and a contract-first backend
            integration.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/idea"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Browse ideas
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Read support
            </Link>
          </div>
        </div>

        <aside className="surface-muted grid content-start gap-4 p-5">
          <div>
            <FileCheck2 className="size-6 text-primary" />
            <p className="mt-4 text-3xl font-semibold">Contract-first</p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Domain contracts validate data before the UI depends on backend
              payloads.
            </p>
          </div>
          <div className="grid gap-3 border-t border-border pt-4">
            <div className="flex items-center gap-3">
              <FlaskConical className="size-4 text-primary" />
              <span className="text-sm font-medium">Scientist submissions</span>
            </div>
            <div className="flex items-center gap-3">
              <DatabaseZap className="size-4 text-primary" />
              <span className="text-sm font-medium">Typed API services</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-primary" />
              <span className="text-sm font-medium">Protected dashboards</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-5">
        <div>
          <p className="section-kicker">Product Surface</p>
          <h2 className="section-title mt-2">What the application covers.</h2>
          <p className="section-copy mt-2">
            The public and protected areas map directly to the existing route
            structure and service modules.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {productAreas.map((area) => (
            <article key={area.title} className="surface-card p-5">
              <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <area.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{area.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {area.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-card grid gap-6 p-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:p-8">
        <div>
          <p className="section-kicker">Architecture</p>
          <h2 className="section-title mt-2">A maintainable frontend flow.</h2>
          <p className="section-copy mt-2">
            Pages stay focused because routing, sessions, services, contracts,
            and query behavior are separated into their own modules.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {architecture.map((item) => (
            <div
              key={item}
              className="rounded-lg border border-border bg-muted p-4 text-sm leading-6"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

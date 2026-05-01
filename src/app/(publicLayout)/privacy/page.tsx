import type { Metadata } from "next";
import { Cookie, Database, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Eco Spark Privacy",
  description:
    "Privacy practices for Eco Spark account data, auth tokens, API requests, and public sustainability content.",
};

const privacySections = [
  {
    title: "Account and profile data",
    description:
      "Eco Spark displays account profile fields, role data, contact details, saved items, votes, comments, purchases, and dashboard activity returned by the configured backend API.",
    icon: Database,
  },
  {
    title: "Authentication storage",
    description:
      "The app uses a mixed server and client session model. Access and refresh tokens can be stored in cookies and mirrored locally so Axios can attach credentials to API calls.",
    icon: Cookie,
  },
  {
    title: "Role-based access",
    description:
      "Protected routes are guarded by server session helpers and proxy rules. Role values determine default dashboard redirects and access to admin or scientist surfaces.",
    icon: LockKeyhole,
  },
  {
    title: "Validation and errors",
    description:
      "Zod contracts validate API payloads and responses. Error helpers normalize backend or network failures before showing user-facing feedback.",
    icon: ShieldCheck,
  },
];

export default function PrivacyPage() {
  return (
    <main className="public-page-shell">
      <section className="grid gap-4">
        <p className="section-kicker">Privacy</p>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Privacy practices for the Eco Spark frontend.
        </h1>
        <p className="section-copy">
          This page documents how the current application handles user data from
          the configured backend, authentication state, role-based access, and
          validated API responses.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {privacySections.map((section) => (
          <article key={section.title} className="surface-card p-5">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <section.icon className="size-5" />
            </span>
            <h2 className="mt-4 text-xl font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {section.description}
            </p>
          </article>
        ))}
      </section>

      <section className="surface-card grid gap-4 p-6">
        <h2 className="text-2xl font-semibold">Data responsibilities</h2>
        <p className="text-sm leading-7 text-muted-foreground">
          Eco Spark is a frontend application. Data retention, account removal,
          payment records, and production security controls depend on the
          configured EcoSpark Hub backend and hosting environment. Deployment
          should use the correct backend origin, secure cookie configuration,
          and CORS settings for the production frontend domain.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/terms"
            className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Terms
          </Link>
          <Link
            href="/contact"
            className="rounded-md border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            Contact
          </Link>
        </div>
      </section>
    </main>
  );
}

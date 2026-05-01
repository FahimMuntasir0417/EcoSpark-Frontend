import type { Metadata } from "next";
import { BadgeCheck, KeyRound, Scale, ShieldAlert } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Eco Spark Terms",
  description:
    "Terms for using Eco Spark public discovery, authenticated workspaces, submissions, moderation, and paid idea access.",
};

const terms = [
  {
    title: "Use of the platform",
    description:
      "Users should use Eco Spark for sustainability idea discovery, structured submissions, campaign participation, community reports, and workspace operations supported by their role.",
    icon: BadgeCheck,
  },
  {
    title: "Account access",
    description:
      "Authenticated routes depend on valid tokens, role cookies, and backend account records. Users are responsible for keeping account credentials secure.",
    icon: KeyRound,
  },
  {
    title: "Submissions and moderation",
    description:
      "Idea submissions, attachments, comments, reports, and campaign participation can be reviewed, featured, archived, rejected, or moderated by authorized users.",
    icon: ShieldAlert,
  },
  {
    title: "Paid access",
    description:
      "Paid idea access, purchases, transactions, and checkout success behavior depend on the configured commerce backend and any payment provider connected to it.",
    icon: Scale,
  },
];

export default function TermsPage() {
  return (
    <main className="public-page-shell">
      <section className="grid gap-4">
        <p className="section-kicker">Terms</p>
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Terms for using Eco Spark.
        </h1>
        <p className="section-copy">
          These terms are written for the current frontend application and its
          role-based sustainability innovation workflows.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {terms.map((term) => (
          <article key={term.title} className="surface-card p-5">
            <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <term.icon className="size-5" />
            </span>
            <h2 className="mt-4 text-xl font-semibold">{term.title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {term.description}
            </p>
          </article>
        ))}
      </section>

      <section className="surface-card p-6">
        <h2 className="text-2xl font-semibold">Operational note</h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          Eco Spark depends on a separate backend API for user records, role
          permissions, idea data, payment records, and moderation actions.
          Production terms should be reviewed against the deployed backend,
          hosting provider, payment provider, and organization policies before
          public launch.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/privacy"
            className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Privacy
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

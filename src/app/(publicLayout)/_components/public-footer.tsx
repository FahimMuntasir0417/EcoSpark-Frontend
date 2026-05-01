import {
  ArrowRight,
  Code2,
  ExternalLink,
  Github,
  Globe2,
  LifeBuoy,
  Server,
  ShieldCheck,
  Video,
} from "lucide-react";
import Link from "next/link";

const footerNavigation = [
  {
    title: "Platform",
    links: [
      { label: "Ideas", href: "/idea" },
      { label: "Campaigns", href: "/campaigns" },
      { label: "Scientists", href: "/scientist" },
      { label: "Community", href: "/community" },
      { label: "Plans", href: "/subscription-plan" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Support", href: "/support" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Login", href: "/login" },
      { label: "Create account", href: "/register" },
      { label: "My profile", href: "/my-profile" },
      { label: "Saved ideas", href: "/saved-ideas" },
      { label: "Purchases", href: "/my-purchases" },
    ],
  },
];

const projectLinks = [
  {
    label: "Live frontend",
    href: "https://eco-spark-frontend.vercel.app",
    icon: Globe2,
  },
  {
    label: "Backend API",
    href: "https://assignment-eco-spark.vercel.app",
    icon: Server,
  },
  {
    label: "Frontend repo",
    href: "https://github.com/FahimMuntasir0417/EcoSpark-Frontend",
    icon: Github,
  },
  {
    label: "Backend repo",
    href: "https://github.com/FahimMuntasir0417/EcoSpark-Hub",
    icon: Code2,
  },
  {
    label: "Demo video",
    href: "https://drive.google.com/file/d/1ZzTSUULNzsSZ-n4m5TGL6SHEAomqg9z7/view",
    icon: Video,
  },
];

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="grid gap-5">
            <Link href="/" className="inline-flex w-fit items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                ES
              </span>
              <span>
                <span className="block text-sm font-semibold">Eco Spark</span>
                <span className="block text-xs text-muted-foreground">
                  Reviewed sustainability ideas, campaigns, and workspaces
                </span>
              </span>
            </Link>

            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              Eco Spark is a role-based frontend for public discovery,
              scientist submissions, member adoption, and admin moderation. It
              connects to the EcoSpark Hub backend through the existing
              contract-first API layer.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="surface-muted p-4">
                <LifeBuoy className="size-4 text-primary" />
                <p className="mt-3 text-sm font-semibold">Support</p>
                <Link
                  href="/contact"
                  className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Contact form
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
              <div className="surface-muted p-4">
                <Github className="size-4 text-primary" />
                <p className="mt-3 text-sm font-semibold">Issue tracker</p>
                <a
                  href="https://github.com/FahimMuntasir0417/EcoSpark-Frontend/issues"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  GitHub issues
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
              <div className="surface-muted p-4">
                <ShieldCheck className="size-4 text-primary" />
                <p className="mt-3 text-sm font-semibold">Governance</p>
                <Link
                  href="/privacy"
                  className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Privacy terms
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {footerNavigation.map((group) => (
              <div key={group.title} className="grid content-start gap-3">
                <p className="text-sm font-semibold">{group.title}</p>
                <nav className="grid gap-2" aria-label={group.title}>
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 border-t border-border pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Project links
          </p>
          <div className="flex flex-wrap gap-2">
            {projectLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <item.icon className="size-4" />
                {item.label}
                <ExternalLink className="size-3.5 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Eco Spark {year}</p>
          <p>Built with Next.js, React, TanStack Query, Zod, and Tailwind CSS.</p>
        </div>
      </div>
    </footer>
  );
}

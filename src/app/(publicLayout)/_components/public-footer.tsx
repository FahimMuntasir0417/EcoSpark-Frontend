import {
  ArrowRight,
  Code2,
  ExternalLink,
  Github,
  Globe2,
  Leaf,
  LifeBuoy,
  Server,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";
import Link from "next/link";

type SocialIconProps = {
  className?: string;
};

function FacebookIcon({ className }: SocialIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.48h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22C18.34 21.24 22 17.08 22 12.06z" />
    </svg>
  );
}

function LinkedinIcon({ className }: SocialIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.32 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.1 20.45H3.53V9H7.1v11.45z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: SocialIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.08 0C5.48 0 .11 5.37.11 11.97c0 2.11.55 4.17 1.6 5.99L0 24l6.19-1.62a11.95 11.95 0 0 0 5.89 1.5h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.25-6.21-3.54-8.43zM12.09 21.86h-.01a9.92 9.92 0 0 1-5.06-1.39l-.36-.21-3.67.96.98-3.58-.23-.37a9.9 9.9 0 0 1-1.52-5.3c0-5.49 4.47-9.96 9.97-9.96a9.89 9.89 0 0 1 7.04 2.92 9.88 9.88 0 0 1 2.92 7.04c0 5.5-4.47 9.97-10.06 9.97zm5.47-7.46c-.3-.15-1.78-.88-2.05-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.35.22-.65.08-.3-.15-1.26-.47-2.4-1.49-.89-.79-1.49-1.77-1.66-2.07-.18-.3-.02-.46.13-.61.14-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.64-.93-2.25-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.53.08-.81.38-.28.3-1.06 1.03-1.06 2.52s1.09 2.93 1.24 3.13c.15.2 2.14 3.27 5.18 4.58.72.31 1.29.5 1.73.64.73.23 1.39.2 1.91.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.31.18-1.43-.08-.13-.28-.2-.58-.35z" />
    </svg>
  );
}

function GmailIcon({ className }: SocialIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-.4 4.25-7.08 5.31a.86.86 0 0 1-1.04 0L4.4 8.25V6.4l7.6 5.7 7.6-5.7v1.85z" />
    </svg>
  );
}

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

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/mohammad.fahim.muntasir",
    icon: FacebookIcon,
    className: "hover:border-blue-500/40 hover:bg-blue-500 hover:text-white",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/md-fahim-muntasir-aa536b366/",
    icon: LinkedinIcon,
    className: "hover:border-sky-600/40 hover:bg-sky-600 hover:text-white",
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/8801571042536",
    icon: WhatsAppIcon,
    className:
      "hover:border-emerald-500/40 hover:bg-emerald-500 hover:text-white",
  },
  {
    label: "Gmail",
    href: "mailto:fahimmuntasirbejoy@gmail.com",
    icon: GmailIcon,
    className: "hover:border-red-500/40 hover:bg-red-500 hover:text-white",
  },
];

function isMailLink(href: string) {
  return href.startsWith("mailto:");
}

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-border bg-card text-card-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_34%),radial-gradient(circle_at_bottom_right,color-mix(in_oklch,var(--accent)_14%,transparent),transparent_32%)]"
      />

      <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="grid content-start gap-5">
            <Link
              href="/"
              className="group inline-flex w-fit items-center gap-3"
            >
              <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary via-emerald-500 to-accent text-primary-foreground shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105">
                <span className="absolute inset-0 bg-white/10" />
                <Leaf className="relative size-5" />
                <Sparkles className="absolute right-1.5 top-1.5 size-3 text-white/90" />
              </span>

              <span>
                <span className="block text-base font-bold tracking-tight">
                  Eco Spark
                </span>
                <span className="block max-w-xs text-xs leading-5 text-muted-foreground">
                  Reviewed sustainability ideas, campaigns, and workspaces
                </span>
              </span>
            </Link>

            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              Eco Spark is a role-based frontend for public discovery, scientist
              submissions, member adoption, and admin moderation. It connects to
              the EcoSpark Hub backend through the existing contract-first API
              layer.
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

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

            <div className="grid content-start gap-3">
              <p className="text-sm font-semibold">Connect</p>

              <div className="grid gap-2" aria-label="Social links">
                {socialLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target={isMailLink(item.href) ? undefined : "_blank"}
                    rel={isMailLink(item.href) ? undefined : "noreferrer"}
                    aria-label={item.label}
                    title={item.label}
                    className={`group inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${item.className}`}
                  >
                    <span className="inline-flex size-7 items-center justify-center rounded-full bg-muted text-foreground transition-colors group-hover:bg-white/20 group-hover:text-white">
                      <item.icon className="size-4" />
                    </span>

                    <span>{item.label}</span>
                  </a>
                ))}
              </div>
            </div>
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
          <p>
            Built with Next.js, React, TanStack Query, Zod, and Tailwind CSS.
          </p>
        </div>
      </div>
    </footer>
  );
}

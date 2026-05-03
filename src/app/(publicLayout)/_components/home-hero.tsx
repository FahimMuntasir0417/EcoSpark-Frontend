"use client";

import {
  ArrowRight,
  CheckCircle2,
  Compass,
  DatabaseZap,
  FileCheck2,
  FlaskConical,
  MessageSquare,
  ShieldCheck,
  ShoppingCart,
  Tags,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type HeroCheckpoint = {
  label: string;
  detail: string;
  status: string;
};

type HeroRoute = {
  label: string;
  href: string;
  detail: string;
};

type HeroProjectMetric = {
  value: string;
  label: string;
  detail: string;
  icon: LucideIcon;
};

type HeroSlide = {
  label: string;
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
  icon: LucideIcon;
  routes: HeroRoute[];
  domains: string[];
  checkpoints: HeroCheckpoint[];
};

const publicRoutes: HeroRoute[] = [
  { label: "Ideas", href: "/idea", detail: "Public idea catalog" },
  { label: "Campaigns", href: "/campaigns", detail: "Campaign directory" },
  { label: "Scientists", href: "/scientist", detail: "Scientist directory" },
  { label: "Community", href: "/community", detail: "Experience reports" },
  { label: "Plans", href: "/subscription-plan", detail: "Subscription plans" },
  { label: "Support", href: "/support", detail: "Setup and route support" },
  { label: "About", href: "/about", detail: "Platform overview" },
  { label: "Contact", href: "/contact", detail: "Validated contact request" },
  { label: "Privacy", href: "/privacy", detail: "Frontend privacy notes" },
  { label: "Terms", href: "/terms", detail: "Platform terms" },
  { label: "AI discover", href: "/ai-discover", detail: "AI discovery page" },
];

const authRoutes: HeroRoute[] = [
  { label: "Login", href: "/login", detail: "Authenticated entry" },
  { label: "Register", href: "/register", detail: "Account creation" },
  { label: "Verify email", href: "/verify-email", detail: "Email verification" },
  { label: "Forgot password", href: "/forgot-password", detail: "Recovery request" },
  { label: "Reset password", href: "/reset-password", detail: "Password reset" },
];

const commonProtectedRoutes: HeroRoute[] = [
  { label: "My profile", href: "/my-profile", detail: "Profile management" },
  { label: "Change password", href: "/change-password", detail: "Security" },
  { label: "Saved ideas", href: "/saved-ideas", detail: "Saved records" },
  { label: "My purchases", href: "/my-purchases", detail: "Purchase history" },
  { label: "My comments", href: "/my-comment", detail: "Comment activity" },
  { label: "My votes", href: "/my-vote", detail: "Voting activity" },
  { label: "Purchase idea", href: "/purches-idea", detail: "Legacy route" },
];

const scientistRoutes: HeroRoute[] = [
  { label: "Dashboard", href: "/scientist/dashboard", detail: "Overview" },
  { label: "My ideas", href: "/scientist/dashboard/my-ideas", detail: "Idea management" },
  { label: "Create idea", href: "/scientist/dashboard/create-idea", detail: "Submission workspace" },
  { label: "Idea attachments", href: "/scientist/dashboard/idea-attachments", detail: "Attachment records" },
  { label: "Draft ideas", href: "/scientist/dashboard/draft-ideas", detail: "Draft records" },
  { label: "Submitted ideas", href: "/scientist/dashboard/submitted-ideas", detail: "Submitted records" },
];

const memberWorkspaceRoutes: HeroRoute[] = [
  { label: "Dashboard", href: "/dashboard", detail: "Member overview" },
  { label: "Browse ideas", href: "/dashboard/browse-ideas", detail: "Member idea browsing" },
  { label: "Idea report", href: "/dashboard/idea-report", detail: "Create reports" },
  { label: "All reports", href: "/dashboard/al-idea-report", detail: "Report directory" },
  { label: "Arrange campaigns", href: "/dashboard/arrange-campaigns", detail: "Campaign workspace" },
  { label: "Purchased idea", href: "/dashboard/purches-idea", detail: "Legacy purchase route" },
];

const memberRoutes: HeroRoute[] = [
  ...memberWorkspaceRoutes,
  ...commonProtectedRoutes,
];

const adminRoutes: HeroRoute[] = [
  { label: "Dashboard", href: "/admin/dashboard", detail: "Overview" },
  { label: "Ideas", href: "/admin/dashboard/ideas-management", detail: "Idea operations" },
  { label: "Pending review", href: "/admin/dashboard/pending-review", detail: "Review queue" },
  { label: "Featured ideas", href: "/admin/dashboard/featured-ideas", detail: "Featured queue" },
  { label: "Archived ideas", href: "/admin/dashboard/archived-ideas", detail: "Archive queue" },
  { label: "Categories", href: "/admin/dashboard/create-idea-category", detail: "Category management" },
  { label: "Tags", href: "/admin/dashboard/tag-management", detail: "Tag management" },
  { label: "Specialties", href: "/admin/dashboard/specialty-management", detail: "Specialty management" },
  { label: "Admins", href: "/admin/dashboard/admins-management", detail: "Admin accounts" },
  { label: "Members", href: "/admin/dashboard/members-management", detail: "Member accounts" },
  { label: "Scientists", href: "/admin/dashboard/scientists-management", detail: "Scientist accounts" },
  { label: "Reports", href: "/admin/dashboard/al-idea-report", detail: "Report moderation" },
  { label: "Campaigns", href: "/admin/dashboard/arrange-campaigns", detail: "Campaign operations" },
];

const serviceDomains = [
  "auth",
  "idea",
  "campaign",
  "category",
  "tag",
  "specialty",
  "commerce",
  "community",
  "scientist",
  "interaction",
  "moderation",
  "user",
  "admin-analytics",
  "member-analytics",
  "scientist-analytics",
  "ai",
  "product",
];

const contractDomains = [
  "auth",
  "idea",
  "campaign",
  "category",
  "tag",
  "specialty",
  "commerce",
  "community",
  "scientist",
  "interaction",
  "moderation",
  "user",
  "admin-analytics",
  "member-analytics",
  "scientist-analytics",
  "ai",
  "product",
  "common",
];

const protectedRouteCount =
  commonProtectedRoutes.length +
  scientistRoutes.length +
  memberWorkspaceRoutes.length +
  adminRoutes.length;

const heroProjectMetrics: HeroProjectMetric[] = [
  {
    value: publicRoutes.length.toString(),
    label: "public routes",
    detail: "Ideas, campaigns, scientists, community, support, and legal pages.",
    icon: Compass,
  },
  {
    value: protectedRouteCount.toString(),
    label: "protected routes",
    detail: "Common, member, scientist, and admin workspace pages.",
    icon: ShieldCheck,
  },
  {
    value: authRoutes.length.toString(),
    label: "auth flows",
    detail: "Login, registration, verification, and password recovery pages.",
    icon: FileCheck2,
  },
  {
    value: `${serviceDomains.length}/${contractDomains.length}`,
    label: "services/contracts",
    detail: "Axios service domains paired with Zod contracts.",
    icon: DatabaseZap,
  },
];

const heroSlides: HeroSlide[] = [
  {
    label: "Discovery",
    title: "Public visitors can browse the real Eco Spark catalogs.",
    description:
      "The public surface links users into ideas, campaigns, scientists, community reports, plans, support, company, and legal routes already present in the app.",
    metric: publicRoutes.length.toString(),
    metricLabel: "public routes",
    icon: Compass,
    routes: publicRoutes,
    domains: ["idea", "campaign", "scientist", "community", "commerce"],
    checkpoints: [
      {
        label: "Idea catalog",
        detail: "Browse published sustainability ideas and detail pages.",
        status: "Discover",
      },
      {
        label: "Campaigns",
        detail: "Connect campaign records to voting activity.",
        status: "Campaign",
      },
      {
        label: "Community",
        detail: "Read reports that connect feedback to adoption.",
        status: "Signals",
      },
    ],
  },
  {
    label: "Scientists",
    title: "Submit high-context ideas with review-ready evidence.",
    description:
      "Scientists can package sustainability proposals with category, impact, attachments, pricing, and status data before the admin review cycle starts.",
    metric: scientistRoutes.length.toString(),
    metricLabel: "scientist routes",
    icon: FlaskConical,
    routes: scientistRoutes,
    domains: ["idea", "category", "tag", "specialty", "scientist-analytics"],
    checkpoints: [
      {
        label: "Create idea",
        detail: "Package impact, category, pricing, and evidence.",
        status: "Intake",
      },
      {
        label: "Drafts",
        detail: "Keep research records ready before submission.",
        status: "Refine",
      },
      {
        label: "Attachments",
        detail: "Attach proof, visuals, and supporting files.",
        status: "Evidence",
      },
    ],
  },
  {
    label: "Admins",
    title: "Moderate ideas, users, tags, specialties, and reports.",
    description:
      "Admin dashboards centralize approvals, archives, featured ideas, taxonomy, campaign arrangement, and member or scientist management.",
    metric: adminRoutes.length.toString(),
    metricLabel: "admin routes",
    icon: ShieldCheck,
    routes: adminRoutes,
    domains: ["moderation", "admin-analytics", "user", "campaign", "taxonomy"],
    checkpoints: [
      {
        label: "Pending review",
        detail: "Validate records before public discovery.",
        status: "Review",
      },
      {
        label: "Featured ideas",
        detail: "Promote approved innovation across public surfaces.",
        status: "Promote",
      },
      {
        label: "Reports",
        detail: "Moderate feedback and community experience signals.",
        status: "Moderate",
      },
    ],
  },
  {
    label: "Members",
    title: "Discover, save, vote, comment, and purchase ideas.",
    description:
      "Members get a practical adoption path from public discovery to saved ideas, votes, comments, purchases, and profile management.",
    metric: memberRoutes.length.toString(),
    metricLabel: "member and account routes",
    icon: UsersRound,
    routes: memberRoutes,
    domains: ["commerce", "interaction", "community", "member-analytics"],
    checkpoints: [
      {
        label: "Saved ideas",
        detail: "Keep promising opportunities close to the workspace.",
        status: "Save",
      },
      {
        label: "Votes",
        detail: "Signal demand and community confidence.",
        status: "Vote",
      },
      {
        label: "Purchases",
        detail: "Move from discovery to paid idea access.",
        status: "Adopt",
      },
    ],
  },
];

export function HomeHero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeCheckpointIndex, setActiveCheckpointIndex] = useState(0);
  const activeSlide = heroSlides[activeIndex] ?? heroSlides[0];
  const activeCheckpoint =
    activeSlide.checkpoints[activeCheckpointIndex] ??
    activeSlide.checkpoints[0] ?? {
      label: activeSlide.label,
      detail: activeSlide.description,
      status: "Live",
    };
  const visibleActiveRoutes = activeSlide.routes.slice(0, 6);
  const remainingRouteCount =
    activeSlide.routes.length - visibleActiveRoutes.length;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % heroSlides.length);
    }, 7000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setActiveCheckpointIndex(0);
  }, [activeIndex]);

  const handleHeroPointerMove = (event: PointerEvent<HTMLElement>) => {
    const section = heroRef.current;

    if (!section) {
      return;
    }

    const rect = section.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    section.style.setProperty("--hero-pointer-x", `${x.toFixed(2)}%`);
    section.style.setProperty("--hero-pointer-y", `${y.toFixed(2)}%`);
    section.style.setProperty("--hero-pointer-opacity", "1");
  };

  const handleHeroPointerLeave = () => {
    heroRef.current?.style.setProperty("--hero-pointer-opacity", "0.55");
  };

  return (
    <section
      ref={heroRef}
      onPointerMove={handleHeroPointerMove}
      onPointerLeave={handleHeroPointerLeave}
      className="home-hero-section relative grid gap-8 overflow-hidden border-b border-border bg-card px-4 py-10 sm:px-6 lg:min-h-[calc(100svh-4rem)] lg:px-8 lg:py-12"
    >
      <div
        aria-hidden="true"
        className="home-animated-grid pointer-events-none absolute inset-0 opacity-60 dark:opacity-35"
      />
      <div
        aria-hidden="true"
        className="home-trace-lines pointer-events-none absolute inset-0 opacity-70"
      />
      <div
        aria-hidden="true"
        className="home-hero-diagonal-map pointer-events-none absolute inset-0 opacity-[0.62] dark:opacity-[0.38]"
      />
      <div
        aria-hidden="true"
        className="home-hero-node-map pointer-events-none absolute inset-0 opacity-[0.6] dark:opacity-[0.36]"
      />
      <div
        aria-hidden="true"
        className="home-signal-sweep pointer-events-none absolute inset-y-0 left-0 w-2/5"
      />
      <div
        aria-hidden="true"
        className="home-content-wash pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden="true"
        className="home-hero-ribbons pointer-events-none absolute inset-0 opacity-[0.52] dark:opacity-[0.85]"
      />
      <div
        aria-hidden="true"
        className="home-hero-circuit pointer-events-none absolute inset-0 opacity-[0.5] dark:opacity-[0.75]"
      />
      <div
        aria-hidden="true"
        className="home-hero-data-stream pointer-events-none absolute inset-x-0 bottom-0 h-44 opacity-[0.76] dark:opacity-[0.42]"
      />
      <div
        aria-hidden="true"
        className="home-hero-pointer-light pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden="true"
        className="home-hero-depth-glow pointer-events-none absolute inset-0"
      />

      <div className="relative z-10 mx-auto grid w-full max-w-[91rem] items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.85fr)]">
        <div className="grid gap-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <FileCheck2 className="size-4" />
            Eco Spark Platform
          </div>

          <div className="grid gap-4">
            <h1 className="home-hero-title max-w-4xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Production-ready workflows for sustainability innovation.
            </h1>
            <p className="max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
              Eco Spark connects public discovery, role-based dashboards,
              contract-validated API calls, moderation, campaigns, community
              feedback, and paid idea access in one professional frontend.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/idea"
              className="home-hero-primary-action relative inline-flex items-center gap-2 overflow-hidden rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <span>Explore ideas</span>
              <ArrowRight className="relative z-10 size-4" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background/85 px-5 py-3 text-sm font-semibold text-foreground backdrop-blur-md transition-colors hover:bg-muted"
            >
              View platform
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {heroProjectMetrics.map((metric) => (
              <div
                key={metric.label}
                className="home-hero-data-card rounded-lg border border-border bg-background/88 p-3 shadow-sm backdrop-blur-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <metric.icon className="size-4 text-primary" />
                  <p className="text-2xl font-semibold tracking-tight text-foreground">
                    {metric.value}
                  </p>
                </div>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  {metric.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {metric.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.label}
                type="button"
                onClick={() => {
                  setActiveIndex(index);
                }}
                aria-pressed={activeIndex === index}
                className={cn(
                  "home-hero-role-card relative overflow-hidden rounded-lg border p-3 text-left transition-all duration-300",
                  activeIndex === index
                    ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "border-border bg-background/85 text-foreground hover:-translate-y-0.5 hover:bg-muted",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <slide.icon className="size-4" />
                  {slide.label}
                </span>
                <span
                  className={cn(
                    "mt-1 block text-xs",
                    activeIndex === index
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground",
                  )}
                >
                  {slide.metricLabel}
                </span>
                <span
                  className={cn(
                    "mt-3 block text-2xl font-semibold tracking-tight",
                    activeIndex === index
                      ? "text-primary-foreground"
                      : "text-foreground",
                  )}
                >
                  {slide.metric}
                </span>
                {activeIndex === index ? (
                  <span
                    key={slide.label}
                    aria-hidden="true"
                    className="home-hero-progress absolute inset-x-0 bottom-0 h-1 bg-primary-foreground/70"
                  />
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className="home-hero-panel surface-card overflow-hidden">
          <div className="border-b border-border bg-muted p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Interactive workflow
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {activeSlide.label} view
                </p>
              </div>
              <span className="home-hero-live-pill inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
                <span className="home-hero-live-dot size-2 rounded-full bg-primary" />
                {activeCheckpoint.status}
              </span>
            </div>
          </div>

          <div className="grid gap-5 p-5">
            <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
              <div className="home-hero-metric-card rounded-lg border border-border bg-background p-4">
                <activeSlide.icon className="size-6 text-primary" />
                <p className="mt-4 text-4xl font-semibold tracking-tight">
                  {activeSlide.metric}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {activeSlide.metricLabel}
                </p>
              </div>

              <div className="home-hero-story-card rounded-lg border border-border bg-background p-4">
                <p className="text-lg font-semibold leading-tight">
                  {activeSlide.title}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {activeSlide.description}
                </p>
              </div>
            </div>

            <div className="home-hero-route-panel rounded-lg border border-border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Project data
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {activeSlide.label} routes and domains
                  </p>
                </div>
                <span className="rounded-md border border-border bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                  {activeSlide.routes.length} routes
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {visibleActiveRoutes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    title={route.detail}
                    className="rounded-md border border-border bg-muted px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/10"
                  >
                    {route.label}
                  </Link>
                ))}
                {remainingRouteCount > 0 ? (
                  <span className="rounded-md border border-border bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                    +{remainingRouteCount} more
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {activeSlide.domains.map((domain) => (
                  <span
                    key={domain}
                    className="rounded-md bg-primary/10 px-3 py-2 text-xs font-semibold text-primary"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              {activeSlide.checkpoints.map((checkpoint, index) => (
                <button
                  key={checkpoint.label}
                  type="button"
                  onClick={() => {
                    setActiveCheckpointIndex(index);
                  }}
                  onMouseEnter={() => {
                    setActiveCheckpointIndex(index);
                  }}
                  onFocus={() => {
                    setActiveCheckpointIndex(index);
                  }}
                  className={cn(
                    "home-hero-checkpoint grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border p-3 text-left transition-all duration-300",
                    activeCheckpointIndex === index
                      ? "border-primary/70 bg-primary/10 shadow-sm shadow-primary/20"
                      : "border-border bg-background hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted",
                  )}
                  aria-pressed={activeCheckpointIndex === index}
                >
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md text-sm font-semibold transition-colors",
                      activeCheckpointIndex === index
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">
                      {checkpoint.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {checkpoint.detail}
                    </span>
                  </span>
                  <CheckCircle2
                    className={cn(
                      "size-5 transition-transform",
                      activeCheckpointIndex === index
                        ? "scale-110 text-primary"
                        : "text-primary/70",
                    )}
                  />
                </button>
              ))}
            </div>

            <div className="grid gap-3 rounded-lg border border-border bg-muted p-4 sm:grid-cols-3">
              <div>
                <Tags className="size-4 text-primary" />
                <p className="mt-2 text-sm font-semibold">Taxonomy tools</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Categories, tags, specialties
                </p>
              </div>
              <div>
                <ShoppingCart className="size-4 text-primary" />
                <p className="mt-2 text-sm font-semibold">Paid access</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Checkout and purchases
                </p>
              </div>
              <div>
                <MessageSquare className="size-4 text-primary" />
                <p className="mt-2 text-sm font-semibold">Community signals</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Votes, comments, reports
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

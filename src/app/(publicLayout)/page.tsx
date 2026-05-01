import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  DatabaseZap,
  FileCheck2,
  FlaskConical,
  KeyRound,
  Lightbulb,
  LockKeyhole,
  Megaphone,
  MessageSquare,
  Server,
  ShieldCheck,
  ShoppingCart,
  Tags,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { HomeHero } from "./_components/home-hero";
import { HomeIdeasShowcase } from "./_components/home-ideas-showcase";

type IconCard = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type RouteItem = {
  label: string;
  href: string;
  detail: string;
};

const publicRouteItems: RouteItem[] = [
  { label: "Home", href: "/", detail: "Public landing page" },
  { label: "Ideas", href: "/idea", detail: "Public idea catalog" },
  { label: "Campaigns", href: "/campaigns", detail: "Campaign directory" },
  { label: "Scientists", href: "/scientist", detail: "Scientist directory" },
  { label: "Community", href: "/community", detail: "Experience reports" },
  { label: "Plans", href: "/subscription-plan", detail: "Subscription plans" },
  { label: "About", href: "/about", detail: "Platform overview" },
  { label: "Contact", href: "/contact", detail: "Validated contact request" },
  { label: "Support", href: "/support", detail: "Setup and route support" },
  { label: "Privacy", href: "/privacy", detail: "Frontend privacy notes" },
  { label: "Terms", href: "/terms", detail: "Platform terms" },
];

const authRouteItems: RouteItem[] = [
  { label: "Login", href: "/login", detail: "Authenticated entry" },
  { label: "Register", href: "/register", detail: "Account creation" },
  { label: "Verify email", href: "/verify-email", detail: "Email verification" },
  {
    label: "Forgot password",
    href: "/forgot-password",
    detail: "Recovery request",
  },
  {
    label: "Reset password",
    href: "/reset-password",
    detail: "Password reset flow",
  },
];

const commonProtectedRoutes: RouteItem[] = [
  { label: "My profile", href: "/my-profile", detail: "Profile management" },
  { label: "Change password", href: "/change-password", detail: "Security" },
  { label: "Saved ideas", href: "/saved-ideas", detail: "Saved records" },
  { label: "My purchases", href: "/my-purchases", detail: "Purchase history" },
  { label: "My comments", href: "/my-comment", detail: "Comment activity" },
  { label: "My votes", href: "/my-vote", detail: "Voting activity" },
  { label: "Purchase idea", href: "/purches-idea", detail: "Legacy route" },
];

const memberWorkspaceRoutes: RouteItem[] = [
  { label: "Member dashboard", href: "/dashboard", detail: "Overview" },
  {
    label: "Browse ideas",
    href: "/dashboard/browse-ideas",
    detail: "Member idea browsing",
  },
  {
    label: "Idea report",
    href: "/dashboard/idea-report",
    detail: "Create reports",
  },
  {
    label: "All idea reports",
    href: "/dashboard/al-idea-report",
    detail: "Report directory",
  },
  {
    label: "Arrange campaigns",
    href: "/dashboard/arrange-campaigns",
    detail: "Campaign workspace",
  },
  {
    label: "Purchased idea",
    href: "/dashboard/purches-idea",
    detail: "Legacy purchase route",
  },
];

const scientistWorkspaceRoutes: RouteItem[] = [
  {
    label: "Scientist dashboard",
    href: "/scientist/dashboard",
    detail: "Overview",
  },
  {
    label: "My ideas",
    href: "/scientist/dashboard/my-ideas",
    detail: "Idea management",
  },
  {
    label: "Create idea",
    href: "/scientist/dashboard/create-idea",
    detail: "Submission workspace",
  },
  {
    label: "Idea attachments",
    href: "/scientist/dashboard/idea-attachments",
    detail: "Attachment records",
  },
  {
    label: "Draft ideas",
    href: "/scientist/dashboard/draft-ideas",
    detail: "Draft records",
  },
  {
    label: "Submitted ideas",
    href: "/scientist/dashboard/submitted-ideas",
    detail: "Submitted records",
  },
];

const adminWorkspaceRoutes: RouteItem[] = [
  { label: "Admin dashboard", href: "/admin/dashboard", detail: "Overview" },
  {
    label: "Ideas management",
    href: "/admin/dashboard/ideas-management",
    detail: "Idea operations",
  },
  {
    label: "Pending review",
    href: "/admin/dashboard/pending-review",
    detail: "Review queue",
  },
  {
    label: "Featured ideas",
    href: "/admin/dashboard/featured-ideas",
    detail: "Featured queue",
  },
  {
    label: "Archived ideas",
    href: "/admin/dashboard/archived-ideas",
    detail: "Archive queue",
  },
  {
    label: "Idea categories",
    href: "/admin/dashboard/create-idea-category",
    detail: "Category management",
  },
  {
    label: "Tag management",
    href: "/admin/dashboard/tag-management",
    detail: "Tag management",
  },
  {
    label: "Specialties",
    href: "/admin/dashboard/specialty-management",
    detail: "Specialty management",
  },
  {
    label: "Admins",
    href: "/admin/dashboard/admins-management",
    detail: "Admin accounts",
  },
  {
    label: "Members",
    href: "/admin/dashboard/members-management",
    detail: "Member accounts",
  },
  {
    label: "Scientists",
    href: "/admin/dashboard/scientists-management",
    detail: "Scientist accounts",
  },
  {
    label: "Idea reports",
    href: "/admin/dashboard/al-idea-report",
    detail: "Report moderation",
  },
  {
    label: "Arrange campaigns",
    href: "/admin/dashboard/arrange-campaigns",
    detail: "Campaign operations",
  },
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
];

const platformMetrics = [
  {
    value: publicRouteItems.length.toString(),
    label: "public routes",
    detail: "Clickable public pages in the current frontend",
  },
  {
    value: authRouteItems.length.toString(),
    label: "auth routes",
    detail: "Login, registration, verification, and recovery flows",
  },
  {
    value: (
      commonProtectedRoutes.length +
      memberWorkspaceRoutes.length +
      scientistWorkspaceRoutes.length +
      adminWorkspaceRoutes.length
    ).toString(),
    label: "protected routes",
    detail: "Common, member, scientist, and admin workspaces",
  },
  {
    value: serviceDomains.length.toString(),
    label: "service domains",
    detail: "Feature hooks, service modules, and contracts by domain",
  },
];

const roleWorkspaceGroups = [
  {
    title: "Member workspace",
    description:
      "Browse ideas, create reports, review purchases, votes, comments, saved ideas, and profile data.",
    icon: UsersRound,
    routes: memberWorkspaceRoutes,
  },
  {
    title: "Scientist workspace",
    description:
      "Create ideas, manage drafts, attach supporting files, and track submitted ideas.",
    icon: FlaskConical,
    routes: scientistWorkspaceRoutes,
  },
  {
    title: "Admin workspace",
    description:
      "Manage ideas, reports, users, campaigns, tags, categories, specialties, and review queues.",
    icon: ShieldCheck,
    routes: adminWorkspaceRoutes,
  },
];

const productSurfaces: IconCard[] = [
  {
    title: "Idea catalog and detail pages",
    description:
      "The `/idea` and `/idea/[id]` routes use the idea service for published ideas, pricing, metrics, and detail views.",
    icon: Lightbulb,
  },
  {
    title: "Campaign directory",
    description:
      "The `/campaigns` routes expose campaign records and connect voting activity to protected account flows.",
    icon: Megaphone,
  },
  {
    title: "Scientist directory",
    description:
      "The `/scientist` route presents scientist records from the scientist service and profile-related fields.",
    icon: FlaskConical,
  },
  {
    title: "Community reports",
    description:
      "The `/community` route presents experience reports that connect member feedback to idea adoption.",
    icon: MessageSquare,
  },
];

const workflowSteps = [
  {
    title: "Discover",
    description:
      "Public users review ideas, scientists, campaigns, and community reports before signing in.",
  },
  {
    title: "Register or login",
    description:
      "Auth routes handle registration, email verification, login, password recovery, and reset.",
  },
  {
    title: "Submit",
    description:
      "Scientists create structured idea records with category, impact, access, attachments, and status data.",
  },
  {
    title: "Moderate",
    description:
      "Admins review ideas, manage statuses, feature records, archive items, and moderate reports.",
  },
  {
    title: "Adopt",
    description:
      "Members save, vote, comment, purchase, and track ideas through protected account routes.",
  },
];

const commerceItems: IconCard[] = [
  {
    title: "Purchase access",
    description:
      "Commerce hooks and services support checkout session creation for paid idea access.",
    icon: ShoppingCart,
  },
  {
    title: "Payment success route",
    description:
      "The `/payments/success` route resolves successful checkout state and links users back to purchases.",
    icon: CheckCircle2,
  },
  {
    title: "My purchases",
    description:
      "Protected purchase routes show member purchase records from the commerce service.",
    icon: FileCheck2,
  },
];

const architectureItems: IconCard[] = [
  {
    title: "Contract-first API layer",
    description:
      "Request payloads and backend responses are validated with Zod contracts before UI state depends on them.",
    icon: FileCheck2,
  },
  {
    title: "TanStack Query hooks",
    description:
      "Feature hooks wrap loading, error, retry, stale data, and mutation behavior for each domain.",
    icon: DatabaseZap,
  },
  {
    title: "Axios service modules",
    description:
      "Service files call the backend through the shared HTTP client and `/api/v1` rewrite path.",
    icon: Server,
  },
  {
    title: "Typed analytics modules",
    description:
      "Admin, member, and scientist analytics services feed dashboard overview pages.",
    icon: BarChart3,
  },
];

const governanceItems: IconCard[] = [
  {
    title: "Role defaults",
    description:
      "Members, scientists, admins, and super admins land on the correct dashboard after authentication.",
    icon: Compass,
  },
  {
    title: "Protected routing",
    description:
      "Proxy and server layouts guard protected member, scientist, admin, and common account routes.",
    icon: LockKeyhole,
  },
  {
    title: "Typed failures",
    description:
      "Shared API error helpers normalize network, validation, and backend errors into user feedback.",
    icon: ClipboardCheck,
  },
  {
    title: "Token refresh",
    description:
      "The HTTP client injects access tokens and attempts refresh behavior when requests return unauthorized responses.",
    icon: KeyRound,
  },
];

const taxonomyItems: IconCard[] = [
  {
    title: "Idea categories",
    description:
      "Admins maintain categories through `/admin/dashboard/create-idea-category` for idea filtering and organization.",
    icon: Tags,
  },
  {
    title: "Idea tags",
    description:
      "The tag management route supports idea metadata used across admin and scientist workflows.",
    icon: Tags,
  },
  {
    title: "Scientist specialties",
    description:
      "Specialty management supports scientist profiles and search-friendly expertise records.",
    icon: FlaskConical,
  },
];

const stackItems = [
  "Next.js 16 App Router",
  "React 19 Server and Client Components",
  "Tailwind CSS 4 design tokens",
  "TanStack Query data orchestration",
  "TanStack Form and Zod validation",
  "Axios service modules",
  "Lucide icon system",
  "Role-based proxy protection",
];

const faqs = [
  {
    question: "What project data does this homepage use?",
    answer:
      "The sections are based on actual Eco Spark routes, dashboard groups, service domains, auth flows, README architecture, and the live idea query hook.",
  },
  {
    question: "Which roles are represented?",
    answer:
      "The homepage describes member, scientist, admin, and super admin behavior through the real dashboard routes and role defaults.",
  },
  {
    question: "Where does live data appear?",
    answer:
      "The live idea showcase uses the existing `useIdeasQuery` hook and the idea service instead of static idea records.",
  },
  {
    question: "How is the backend connected?",
    answer:
      "The app rewrites `/api/v1` requests to `NEXT_PUBLIC_API_BASE_URL`, and service modules validate responses with Zod contracts.",
  },
];

function SectionHeading({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-2">
      <p className="section-kicker">{kicker}</p>
      <h2 className="section-title">{title}</h2>
      <p className="section-copy">{description}</p>
    </div>
  );
}

function StandardCard({ item }: { item: IconCard }) {
  return (
    <article className="surface-card grid h-full gap-4 p-5">
      <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
        <item.icon className="size-5" />
      </span>
      <div>
        <h3 className="text-lg font-semibold">{item.title}</h3>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          {item.description}
        </p>
      </div>
    </article>
  );
}

function RouteCard({ route }: { route: RouteItem }) {
  return (
    <Link
      href={route.href}
      className="surface-card flex h-full items-center justify-between gap-4 p-4 transition-colors hover:bg-muted"
    >
      <span>
        <span className="block text-sm font-semibold">{route.label}</span>
        <span className="mt-1 block text-xs text-muted-foreground">
          {route.detail}
        </span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function RoutePill({ route }: { route: RouteItem }) {
  return (
    <Link
      href={route.href}
      className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {route.label}
    </Link>
  );
}

function HomePageBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="home-page-grid absolute inset-0 opacity-[0.55] dark:opacity-[0.35]" />
      <div className="home-page-lanes absolute inset-x-0 top-0 h-[52rem] opacity-[0.7] dark:opacity-50" />
      <div className="home-page-sweep absolute inset-y-0 left-0 w-1/2 opacity-[0.7] dark:opacity-[0.45]" />
      <div className="home-page-fade absolute inset-0" />
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative isolate overflow-hidden bg-background">
      <HomePageBackground />
      <HomeHero />

      <main className="public-page-shell relative z-10">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {platformMetrics.map((metric) => (
            <article key={metric.label} className="surface-card p-5">
              <p className="text-4xl font-semibold tracking-tight text-primary">
                {metric.value}
              </p>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.14em]">
                {metric.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {metric.detail}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-5">
          <SectionHeading
            kicker="Public Routes"
            title="Every public home section points to a real route."
            description="These links are the actual public pages available in this frontend, including the newly added company, support, and legal pages."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {publicRouteItems.map((route) => (
              <RouteCard key={route.href} route={route} />
            ))}
          </div>
        </section>

        <section className="grid gap-5">
          <SectionHeading
            kicker="Auth Flows"
            title="Authentication and recovery are shown as first-class flows."
            description="The project includes registration, email verification, login, forgot password, and reset password routes."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {authRouteItems.map((route) => (
              <RouteCard key={route.href} route={route} />
            ))}
          </div>
        </section>

        <section className="grid gap-5">
          <SectionHeading
            kicker="Role Workspaces"
            title="Member, scientist, and admin routes are mapped from the app."
            description="These dashboard groups reflect the protected route folders and role defaults already present in the project."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {roleWorkspaceGroups.map((group) => (
              <article key={group.title} className="surface-card p-5">
                <span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                  <group.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{group.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {group.description}
                </p>
                <p className="mt-4 text-sm font-semibold text-primary">
                  {group.routes.length} routes
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.routes.slice(0, 6).map((route) => (
                    <RoutePill key={route.href} route={route} />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5">
          <SectionHeading
            kicker="Common Protected Routes"
            title="Account activity routes come from real protected pages."
            description="These common protected routes are shared across authenticated roles for profile, security, purchases, saves, votes, and comments."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {commonProtectedRoutes.map((route) => (
              <RouteCard key={route.href} route={route} />
            ))}
          </div>
        </section>

        <section className="grid gap-5">
          <SectionHeading
            kicker="Product Surface"
            title="Public discovery matches the existing feature pages."
            description="Ideas, campaigns, scientists, and community reports are the core public browsing areas already implemented in the app."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {productSurfaces.map((item) => (
              <StandardCard key={item.title} item={item} />
            ))}
          </div>
        </section>

        <section className="surface-card grid gap-6 p-6 lg:p-8">
          <SectionHeading
            kicker="Workflow"
            title="The product lifecycle follows the real role model."
            description="The lifecycle starts in public discovery and continues through auth, scientist submission, admin moderation, and member adoption."
          />
          <div className="grid gap-4 lg:grid-cols-5">
            {workflowSteps.map((step, index) => (
              <article key={step.title} className="surface-muted p-5">
                <span className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5">
          <SectionHeading
            kicker="Commerce"
            title="Paid idea access is covered by existing routes and services."
            description="Commerce content references the real checkout, purchase, and payment-success surfaces already present in the project."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {commerceItems.map((item) => (
              <StandardCard key={item.title} item={item} />
            ))}
          </div>
        </section>

        <section className="grid gap-5">
          <SectionHeading
            kicker="Taxonomy"
            title="Admin taxonomy tools are part of the home story."
            description="Categories, tags, and specialties are real admin-managed records used by ideas and scientist profiles."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {taxonomyItems.map((item) => (
              <StandardCard key={item.title} item={item} />
            ))}
          </div>
        </section>

        <section className="grid gap-5">
          <SectionHeading
            kicker="API Domains"
            title="Service domains come from the project architecture."
            description="The list below mirrors the repository's feature, service, and contract domains."
          />
          <div className="surface-card flex flex-wrap gap-2 p-5">
            {serviceDomains.map((domain) => (
              <span
                key={domain}
                className="rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium"
              >
                {domain}
              </span>
            ))}
          </div>
        </section>

        <section className="grid gap-5">
          <SectionHeading
            kicker="Architecture"
            title="Data flow follows the repo's contract-first pattern."
            description="Pages use feature hooks, feature hooks call services, services use the shared HTTP client, and contracts validate data."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {architectureItems.map((item) => (
              <StandardCard key={item.title} item={item} />
            ))}
          </div>
        </section>

        <section className="grid gap-5">
          <SectionHeading
            kicker="Governance"
            title="Authentication, routing, and errors use existing utilities."
            description="This section is based on the current session helpers, proxy protection, dashboard defaults, token behavior, and API error handling."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {governanceItems.map((item) => (
              <StandardCard key={item.title} item={item} />
            ))}
          </div>
        </section>

        <HomeIdeasShowcase />

        <section className="grid gap-6 rounded-lg border border-border bg-foreground p-6 text-background lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:p-8 dark:bg-card dark:text-card-foreground">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Technical Stack
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Built with the stack declared in the project README.
            </h2>
            <p className="mt-3 text-sm leading-7 text-background/75 dark:text-muted-foreground">
              This section summarizes the actual framework, form, query,
              validation, HTTP, styling, and routing tools used by the app.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {stackItems.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-lg border border-background/15 bg-background/10 p-3 dark:border-border dark:bg-muted"
              >
                <CheckCircle2 className="size-5 shrink-0 text-accent" />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5">
          <SectionHeading
            kicker="FAQ"
            title="Answers are specific to this repository."
            description="The FAQ explains where the homepage content comes from and how it connects to real project code."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((item) => (
              <article key={item.question} className="surface-card p-5">
                <h3 className="text-base font-semibold">{item.question}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-lg border border-border bg-primary p-6 text-primary-foreground lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/75">
              Next Step
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Continue through real Eco Spark routes.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-primary-foreground/80">
              Browse public ideas, create an account, or use the support route
              for setup details around the backend API and protected workspaces.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/idea"
              className="inline-flex items-center gap-2 rounded-md bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-background/90"
            >
              Browse ideas
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/30 px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              Support
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

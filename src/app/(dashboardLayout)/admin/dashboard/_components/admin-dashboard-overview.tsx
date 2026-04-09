"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BadgeCheck,
  CircleDollarSign,
  FileWarning,
  FlaskConical,
  Lightbulb,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { PropsWithChildren } from "react";
import { Button } from "@/components/ui/button";
import {
  ErrorState,
  LoadingState,
} from "@/components/ui/data-state";
import { useAdminAnalyticsQuery } from "@/features/admin-analytics";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";

type SummaryTone = "sky" | "emerald" | "amber" | "rose";
type FocusTone = "success" | "warning" | "danger" | "info";

const snapshotFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSnapshot(value: number) {
  if (!value) {
    return "No snapshot yet";
  }

  return snapshotFormatter.format(value);
}

function toPercent(part: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((part / total) * 100);
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  caption,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  caption: string;
  tone: SummaryTone;
}) {
  return (
    <article className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-sm text-slate-600">{caption}</p>
        </div>

        <div
          className={cn(
            "rounded-2xl border p-3 shadow-sm",
            tone === "sky" && "border-sky-200 bg-sky-50 text-sky-700",
            tone === "emerald" &&
              "border-emerald-200 bg-emerald-50 text-emerald-700",
            tone === "amber" && "border-amber-200 bg-amber-50 text-amber-700",
            tone === "rose" && "border-rose-200 bg-rose-50 text-rose-700",
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </article>
  );
}

function SectionCard({
  eyebrow,
  title,
  description,
  children,
}: PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
}>) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          {eyebrow}
        </p>
        <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
          {title}
        </h3>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

function MetricTile({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-600">{caption}</p>
    </div>
  );
}

function ProgressMetric({
  label,
  value,
  total,
  tone = "sky",
}: {
  label: string;
  value: number;
  total: number;
  tone?: "sky" | "emerald" | "amber";
}) {
  const percent = toPercent(value, total);

  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-sm font-semibold text-slate-950">
          {formatNumber(value)} / {formatNumber(total)}
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "sky" && "bg-sky-500",
            tone === "emerald" && "bg-emerald-500",
            tone === "amber" && "bg-amber-500",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-xs text-slate-500">{percent}% of tracked total</p>
    </div>
  );
}

function FocusCard({
  icon: Icon,
  title,
  value,
  description,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  description: string;
  tone: FocusTone;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-4 shadow-sm",
        tone === "success" && "border-emerald-200 bg-emerald-50/80",
        tone === "warning" && "border-amber-200 bg-amber-50/80",
        tone === "danger" && "border-rose-200 bg-rose-50/80",
        tone === "info" && "border-sky-200 bg-sky-50/80",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "rounded-2xl border bg-white p-3 shadow-sm",
            tone === "success" && "border-emerald-200 text-emerald-700",
            tone === "warning" && "border-amber-200 text-amber-700",
            tone === "danger" && "border-rose-200 text-rose-700",
            tone === "info" && "border-sky-200 text-sky-700",
          )}
        >
          <Icon className="size-5" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardOverview() {
  const analyticsQuery = useAdminAnalyticsQuery();

  if (analyticsQuery.isPending) {
    return (
      <LoadingState
        title="Loading dashboard analytics"
        description="Fetching the latest admin control-tower metrics."
      />
    );
  }

  if (analyticsQuery.isError) {
    return (
      <ErrorState
        title="Could not load dashboard analytics"
        description={getApiErrorMessage(analyticsQuery.error)}
        onRetry={() => {
          void analyticsQuery.refetch();
        }}
      />
    );
  }

  const analytics = analyticsQuery.data.data;
  const openModerationQueue =
    analytics.moderation.pendingIdeaReports +
    analytics.moderation.pendingCommentReports +
    analytics.moderation.pendingExperienceReports;
  const userActivityRate = toPercent(
    analytics.users.active,
    analytics.users.total,
  );
  const scientistVerificationRate = toPercent(
    analytics.scientists.verified,
    analytics.scientists.total,
  );
  const publishingRate = toPercent(
    analytics.ideas.published,
    analytics.ideas.total,
  );
  const paidPurchaseRate = toPercent(
    analytics.commerce.paidPurchases,
    analytics.commerce.totalPurchases,
  );
  const activeCampaignRate = toPercent(
    analytics.campaigns.active,
    analytics.campaigns.total,
  );
  const operationalState =
    openModerationQueue === 0 && analytics.scientists.pendingVerification === 0
      ? {
          label: "Stable",
          description: "Queues are clear and the platform is operating normally.",
          tone:
            "border-emerald-200 bg-emerald-50 text-emerald-700" as const,
        }
      : openModerationQueue <= 3 &&
          analytics.scientists.pendingVerification <= 2
        ? {
            label: "Monitor closely",
            description:
              "A few queues need review, but the dashboard remains manageable.",
            tone: "border-amber-200 bg-amber-50 text-amber-700" as const,
          }
        : {
            label: "Needs attention",
            description:
              "Moderation or verification queues need direct admin action.",
            tone: "border-rose-200 bg-rose-50 text-rose-700" as const,
          };
  const snapshotLabel = formatSnapshot(analyticsQuery.dataUpdatedAt);

  const focusCards = [
    {
      icon: BadgeCheck,
      title: "Scientist Verification Queue",
      value: formatNumber(analytics.scientists.pendingVerification),
      description:
        analytics.scientists.pendingVerification > 0
          ? "Scientist records still waiting for approval."
          : "All scientist records are currently verified.",
      tone:
        analytics.scientists.pendingVerification > 0 ? "warning" : "success",
    },
    {
      icon: FileWarning,
      title: "Open Moderation Queue",
      value: formatNumber(openModerationQueue),
      description:
        openModerationQueue > 0
          ? "Reports are waiting for moderation review."
          : "No pending reports across ideas, comments, or experiences.",
      tone: openModerationQueue > 0 ? "danger" : "success",
    },
    {
      icon: ShoppingCart,
      title: "Pending Purchases",
      value: formatNumber(analytics.commerce.pendingPurchases),
      description:
        analytics.commerce.pendingPurchases > 0
          ? "Purchase items are awaiting payment or fulfilment decisions."
          : "No purchases are currently pending.",
      tone: analytics.commerce.pendingPurchases > 0 ? "warning" : "info",
    },
    {
      icon: Megaphone,
      title: "Active Campaigns",
      value: formatNumber(analytics.campaigns.active),
      description:
        analytics.campaigns.active > 0
          ? "Campaign activity is live across the platform."
          : "No campaigns are currently active.",
      tone: analytics.campaigns.active > 0 ? "info" : "warning",
    },
  ] as const;

  return (
    <section className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 shadow-sm">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_55%)]" />
        <div className="absolute -left-10 top-16 h-36 w-36 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute bottom-0 right-12 h-28 w-28 rounded-full bg-emerald-200/40 blur-3xl" />

        <div className="relative grid gap-6 px-6 py-7 md:px-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] xl:items-end">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 shadow-sm">
                <Sparkles className="size-3.5" />
                Admin Workspace
              </div>
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold shadow-sm",
                  operationalState.tone,
                )}
              >
                <ShieldCheck className="size-3.5" />
                {operationalState.label}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                  Executive overview for platform operations
              </h2>

              <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                Track user growth, scientist verification, content publishing,
                commerce health, moderation exposure, and campaign activity from
                one polished admin control tower.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl bg-white/90"
                onClick={() => {
                  void analyticsQuery.refetch();
                }}
                disabled={analyticsQuery.isRefetching}
              >
                <RefreshCw
                  className={cn(
                    "size-4",
                    analyticsQuery.isRefetching && "animate-spin",
                  )}
                />
                {analyticsQuery.isRefetching ? "Refreshing..." : "Refresh data"}
              </Button>

              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Scope
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {analytics.role} analytics snapshot
                </p>
                <p className="text-xs text-slate-500">
                  Updated {snapshotLabel}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Operational Read
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {operationalState.label}
                </p>
                <p className="text-xs text-slate-500">
                  {operationalState.description}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryCard
              icon={Users}
              label="Total Users"
              value={formatNumber(analytics.users.total)}
              caption={`${formatNumber(analytics.users.active)} active accounts`}
              tone="sky"
            />
            <SummaryCard
              icon={Lightbulb}
              label="Total Ideas"
              value={formatNumber(analytics.ideas.total)}
              caption={`${publishingRate}% currently published`}
              tone="emerald"
            />
            <SummaryCard
              icon={CircleDollarSign}
              label="Revenue"
              value={formatAmount(analytics.commerce.totalRevenue)}
              caption={`${formatNumber(analytics.commerce.totalPurchases)} tracked purchases`}
              tone="amber"
            />
            <SummaryCard
              icon={AlertTriangle}
              label="Open Queue"
              value={formatNumber(openModerationQueue)}
              caption="Pending moderation items"
              tone={openModerationQueue > 0 ? "rose" : "emerald"}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="space-y-6">
          <SectionCard
            eyebrow="Platform Health"
            title="Users and access posture"
            description="Role distribution and account state across the full admin-controlled platform footprint."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <MetricTile
                    label="Admins"
                    value={formatNumber(analytics.users.admins)}
                    caption="Administrative accounts"
                  />
                  <MetricTile
                    label="Scientists"
                    value={formatNumber(analytics.users.scientists)}
                    caption="Scientist user accounts"
                  />
                  <MetricTile
                    label="Members"
                    value={formatNumber(analytics.users.members)}
                    caption="Community member accounts"
                  />
                  <MetricTile
                    label="Moderators"
                    value={formatNumber(analytics.users.moderators)}
                    caption="Assigned moderation accounts"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <ProgressMetric
                  label="Active users"
                  value={analytics.users.active}
                  total={analytics.users.total}
                  tone="emerald"
                />
                <ProgressMetric
                  label="Blocked users"
                  value={analytics.users.blocked}
                  total={analytics.users.total}
                  tone="amber"
                />
                <ProgressMetric
                  label="Suspended users"
                  value={analytics.users.suspended}
                  total={analytics.users.total}
                  tone="amber"
                />
                <ProgressMetric
                  label="Deleted users"
                  value={analytics.users.deleted}
                  total={analytics.users.total}
                  tone="sky"
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    User Activity Ratio
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {userActivityRate}% of all accounts are currently active.
                  </p>
                </div>
                <p className="text-2xl font-semibold tracking-tight text-slate-950">
                  {userActivityRate}%
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Content Pipeline"
            title="Idea publishing and visibility"
            description="Monitor creation flow, approval states, featured distribution, and premium access coverage."
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <MetricTile
                  label="Draft"
                  value={formatNumber(analytics.ideas.draft)}
                  caption="Ideas not yet finalized"
                />
                <MetricTile
                  label="Under Review"
                  value={formatNumber(analytics.ideas.underReview)}
                  caption="Ideas waiting for formal review"
                />
                <MetricTile
                  label="Approved"
                  value={formatNumber(analytics.ideas.approved)}
                  caption="Approved within moderation"
                />
                <MetricTile
                  label="Archived"
                  value={formatNumber(analytics.ideas.archived)}
                  caption="Archived from active circulation"
                />
              </div>

              <div className="space-y-4">
                <ProgressMetric
                  label="Published ideas"
                  value={analytics.ideas.published}
                  total={analytics.ideas.total}
                  tone="emerald"
                />
                <ProgressMetric
                  label="Featured ideas"
                  value={analytics.ideas.featured}
                  total={analytics.ideas.total}
                  tone="sky"
                />
                <ProgressMetric
                  label="Highlighted ideas"
                  value={analytics.ideas.highlighted}
                  total={analytics.ideas.total}
                  tone="amber"
                />
                <ProgressMetric
                  label="Paid access ideas"
                  value={analytics.ideas.paidAccess}
                  total={analytics.ideas.total}
                  tone="sky"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Revenue Operations"
            title="Commerce and campaign performance"
            description="Watch payment outcomes, purchase states, revenue exposure, and campaign activity in one block."
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-800 px-5 py-5 text-white shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                    Total Revenue
                  </p>
                  <p className="mt-3 text-4xl font-semibold tracking-tight">
                    {formatAmount(analytics.commerce.totalRevenue)}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    Based on {formatNumber(analytics.commerce.totalPurchases)} total
                    purchase records.
                  </p>
                </div>

                <ProgressMetric
                  label="Paid purchases"
                  value={analytics.commerce.paidPurchases}
                  total={analytics.commerce.totalPurchases}
                  tone="emerald"
                />
                <ProgressMetric
                  label="Pending purchases"
                  value={analytics.commerce.pendingPurchases}
                  total={analytics.commerce.totalPurchases}
                  tone="amber"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <MetricTile
                  label="Cancelled"
                  value={formatNumber(analytics.commerce.cancelledPurchases)}
                  caption="Cancelled purchase records"
                />
                <MetricTile
                  label="Refunded"
                  value={formatNumber(analytics.commerce.refundedPurchases)}
                  caption="Refunded transactions"
                />
                <MetricTile
                  label="Failed"
                  value={formatNumber(analytics.commerce.failedPurchases)}
                  caption="Failed payment attempts"
                />
                <MetricTile
                  label="Campaigns Active"
                  value={`${formatNumber(analytics.campaigns.active)} / ${formatNumber(
                    analytics.campaigns.total,
                  )}`}
                  caption={`${activeCampaignRate}% campaign activation rate`}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            eyebrow="Operational Focus"
            title="What needs attention now"
            description="The fastest view of active risk, pending work, and live operating pressure."
          >
            <div className="space-y-4">
              {focusCards.map((card) => (
                <FocusCard
                  key={card.title}
                  icon={card.icon}
                  title={card.title}
                  value={card.value}
                  description={card.description}
                  tone={card.tone}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Scientist Oversight"
            title="Verification and profile readiness"
            description="Track scientist approval progress and verification health across the research-facing part of the platform."
          >
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Verification Rate
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {scientistVerificationRate}% of scientist records are verified.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
                    <FlaskConical className="size-5" />
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${scientistVerificationRate}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <MetricTile
                  label="Total Scientists"
                  value={formatNumber(analytics.scientists.total)}
                  caption="Scientist profile records"
                />
                <MetricTile
                  label="Verified"
                  value={formatNumber(analytics.scientists.verified)}
                  caption="Ready for public trust signals"
                />
                <MetricTile
                  label="Pending"
                  value={formatNumber(analytics.scientists.pendingVerification)}
                  caption="Awaiting admin approval"
                />
                <MetricTile
                  label="Linked Users"
                  value={formatNumber(analytics.users.scientists)}
                  caption="Users mapped to scientist role"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Community Pulse"
            title="Reports, subscribers, and growth signals"
            description="Lightweight readout of community pressure, featured reporting, and audience growth indicators."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricTile
                label="Experience Reports"
                value={formatNumber(analytics.community.totalExperienceReports)}
                caption="Total submitted experience reports"
              />
              <MetricTile
                label="Featured Reports"
                value={formatNumber(analytics.community.featuredExperienceReports)}
                caption="Reports marked as featured"
              />
              <MetricTile
                label="Newsletter Subscribers"
                value={formatNumber(analytics.community.newsletterSubscribers)}
                caption="Audience subscribed to updates"
              />
              <MetricTile
                label="Moderation Actions"
                value={formatNumber(analytics.moderation.totalModerationActions)}
                caption="Total recorded moderation actions"
              />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Purchase Conversion
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {paidPurchaseRate}% of purchases have reached paid status.
                  </p>
                </div>
                <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sky-700">
                  <TrendingUp className="size-5" />
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </section>
  );
}

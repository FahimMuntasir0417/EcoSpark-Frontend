"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Bookmark,
  Compass,
  Eye,
  Lightbulb,
  MessageSquare,
  ReceiptText,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";
import type { PropsWithChildren } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { useMemberAnalyticsQuery } from "@/features/member-analytics";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";

type SummaryTone = "sky" | "emerald" | "amber" | "rose";
type FocusTone = "success" | "warning" | "danger" | "info";

type ShortcutLink = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone: SummaryTone;
};

const memberLinks: ShortcutLink[] = [
  {
    title: "Browse Ideas",
    description: "Explore the idea catalog and discover new concepts.",
    href: "/dashboard/browse-ideas",
    icon: Compass,
    tone: "sky",
  },
  {
    title: "Saved Ideas",
    description: "Return to the ideas you bookmarked for later review.",
    href: "/dashboard/saved-ideas",
    icon: Bookmark,
    tone: "emerald",
  },
  {
    title: "Purchase Ideas",
    description: "Track purchases, pending orders, and access history.",
    href: "/dashboard/purches-idea",
    icon: ShoppingCart,
    tone: "amber",
  },
  {
    title: "My Votes",
    description: "Review the ideas you have supported or rated.",
    href: "/dashboard/my-votes",
    icon: ThumbsUp,
    tone: "rose",
  },
  {
    title: "My Comments",
    description: "Revisit your discussion history across idea pages.",
    href: "/dashboard/my-comments",
    icon: MessageSquare,
    tone: "sky",
  },
];

const snapshotFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const numberFormatter = new Intl.NumberFormat("en-US");
const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatAmount(value: number) {
  return amountFormatter.format(value);
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

function getSummaryToneClasses(tone: SummaryTone) {
  switch (tone) {
    case "sky":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-rose-200 bg-rose-50 text-rose-700";
  }
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
            getSummaryToneClasses(tone),
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

export function MemberDashboardOverview() {
  const analyticsQuery = useMemberAnalyticsQuery();

  if (analyticsQuery.isPending) {
    return (
      <LoadingState
        title="Loading member analytics"
        description="Fetching purchases, activity, engagement, and workspace status."
        className="rounded-[24px] border-slate-200 bg-white p-6 shadow-sm"
        rows={6}
      />
    );
  }

  if (analyticsQuery.isError) {
    return (
      <ErrorState
        title="Could not load member analytics"
        description={getApiErrorMessage(analyticsQuery.error)}
        onRetry={() => {
          void analyticsQuery.refetch();
        }}
        className="rounded-[24px] border-destructive/30 bg-white p-6 shadow-sm"
      />
    );
  }

  const analytics = analyticsQuery.data.data;
  const engagementActions =
    analytics.activity.comments +
    analytics.activity.votes +
    analytics.activity.bookmarks +
    analytics.activity.experienceReports;
  const purchaseResolutionRate = toPercent(
    analytics.purchases.paid + analytics.purchases.refunded,
    analytics.purchases.total,
  );
  const workspaceState =
    analytics.profile.unreadNotifications > 0 ||
    analytics.purchases.pending > 0 ||
    !analytics.profile.hasNewsletterSubscription
      ? {
          label: "Actions available",
          description:
            "There are still opportunities to review purchases, notifications, or subscription settings.",
          tone: "border-amber-200 bg-amber-50 text-amber-700",
        }
      : {
          label: "Clean workspace",
          description:
            "Your member workspace is clear and up to date with no outstanding queues.",
          tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
        };

  const focusCards = [
    {
      icon: ReceiptText,
      title: "Pending purchases",
      value: formatNumber(analytics.purchases.pending),
      description:
        analytics.purchases.pending > 0
          ? "You have purchase records waiting for payment or resolution."
          : "There are no purchase records waiting in your queue.",
      tone: analytics.purchases.pending > 0 ? "warning" : "success",
    },
    {
      icon: Bell,
      title: "Unread notifications",
      value: formatNumber(analytics.profile.unreadNotifications),
      description:
        analytics.profile.unreadNotifications > 0
          ? "There are unread updates waiting in your member workspace."
          : "Your notification queue is currently clear.",
      tone: analytics.profile.unreadNotifications > 0 ? "info" : "success",
    },
    {
      icon: Bookmark,
      title: "Saved activity",
      value: formatNumber(analytics.activity.bookmarks),
      description:
        analytics.activity.bookmarks > 0
          ? "You are actively saving ideas for later review."
          : "No saved ideas are recorded in this snapshot yet.",
      tone: analytics.activity.bookmarks > 0 ? "info" : "warning",
    },
    {
      icon: ShoppingCart,
      title: "Total spent",
      value: formatAmount(analytics.purchases.totalSpent),
      description:
        analytics.purchases.totalSpent > 0
          ? "Your member purchases are already generating spend history."
          : "No completed spend has been recorded in this analytics snapshot.",
      tone: analytics.purchases.totalSpent > 0 ? "success" : "warning",
    },
  ] as const;

  return (
    <section className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 shadow-sm">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.14),_transparent_55%)]" />
        <div className="absolute -left-10 top-16 h-36 w-36 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute bottom-0 right-12 h-28 w-28 rounded-full bg-emerald-200/40 blur-3xl" />

        <div className="relative grid gap-6 px-6 py-7 md:px-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] xl:items-end">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 shadow-sm">
                <Sparkles className="size-3.5" />
                Member Workspace
              </div>
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold shadow-sm",
                  workspaceState.tone,
                )}
              >
                <TrendingUp className="size-3.5" />
                {workspaceState.label}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Personal control center for purchases, saved ideas, and platform activity
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                See what you have explored, purchased, saved, and engaged with
                from one polished member dashboard built around your current
                analytics snapshot.
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
                  Updated {formatSnapshot(analyticsQuery.dataUpdatedAt)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Workspace status
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {workspaceState.label}
                </p>
                <p className="text-xs text-slate-500">
                  {workspaceState.description}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryCard
              icon={ShoppingCart}
              label="Purchases"
              value={formatNumber(analytics.purchases.total)}
              caption={`${formatNumber(analytics.purchases.pending)} currently pending`}
              tone="sky"
            />
            <SummaryCard
              icon={Bookmark}
              label="Saved activity"
              value={formatNumber(analytics.activity.bookmarks)}
              caption="Bookmarks created from your member workspace"
              tone="emerald"
            />
            <SummaryCard
              icon={TrendingUp}
              label="Total spent"
              value={formatAmount(analytics.purchases.totalSpent)}
              caption={`${purchaseResolutionRate}% resolved purchase flow`}
              tone="amber"
            />
            <SummaryCard
              icon={Bell}
              label="Notifications"
              value={formatNumber(analytics.profile.unreadNotifications)}
              caption="Unread updates waiting for review"
              tone={analytics.profile.unreadNotifications > 0 ? "rose" : "emerald"}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="space-y-6">
          <SectionCard
            eyebrow="Profile and Access"
            title="Membership status and inbox readiness"
            description="Stay aware of your notification queue and whether your subscription preferences are fully configured."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <MetricTile
                  label="Unread notifications"
                  value={formatNumber(analytics.profile.unreadNotifications)}
                  caption="Updates waiting in your inbox"
                />
                <MetricTile
                  label="Newsletter"
                  value={
                    analytics.profile.hasNewsletterSubscription
                      ? "Subscribed"
                      : "Not subscribed"
                  }
                  caption="Email subscription preference"
                />
              </div>

              <div className="space-y-4">
                <ProgressMetric
                  label="Subscription readiness"
                  value={analytics.profile.hasNewsletterSubscription ? 100 : 0}
                  total={100}
                  tone="emerald"
                />
                <ProgressMetric
                  label="Inbox clearance"
                  value={analytics.profile.unreadNotifications === 0 ? 100 : 0}
                  total={100}
                  tone="sky"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Purchases"
            title="Order flow and spend health"
            description="Review total purchases, pending orders, cancellations, and how much spend has been completed so far."
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <MetricTile
                  label="Paid"
                  value={formatNumber(analytics.purchases.paid)}
                  caption="Successfully completed purchases"
                />
                <MetricTile
                  label="Pending"
                  value={formatNumber(analytics.purchases.pending)}
                  caption="Orders waiting for resolution"
                />
                <MetricTile
                  label="Cancelled"
                  value={formatNumber(analytics.purchases.cancelled)}
                  caption="Cancelled purchase records"
                />
                <MetricTile
                  label="Refunded"
                  value={formatNumber(analytics.purchases.refunded)}
                  caption="Reversed transactions"
                />
                <MetricTile
                  label="Failed"
                  value={formatNumber(analytics.purchases.failed)}
                  caption="Unsuccessful payment attempts"
                />
                <MetricTile
                  label="Total spent"
                  value={formatAmount(analytics.purchases.totalSpent)}
                  caption="Recorded member spend"
                />
              </div>

              <div className="space-y-4">
                <ProgressMetric
                  label="Paid purchases"
                  value={analytics.purchases.paid}
                  total={analytics.purchases.total}
                  tone="emerald"
                />
                <ProgressMetric
                  label="Pending purchases"
                  value={analytics.purchases.pending}
                  total={analytics.purchases.total}
                  tone="amber"
                />
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-800 px-5 py-5 text-white shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                    Spend snapshot
                  </p>
                  <p className="mt-3 text-4xl font-semibold tracking-tight">
                    {formatAmount(analytics.purchases.totalSpent)}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    Current value of completed spending across your member account.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Workspace Activity"
            title="Ideas, participation, and saved interest"
            description="Monitor both your idea footprint and the ways you are interacting with content across the platform."
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <MetricTile
                  label="Ideas created"
                  value={formatNumber(analytics.ideas.totalCreated)}
                  caption="Ideas opened from your account"
                />
                <MetricTile
                  label="Draft"
                  value={formatNumber(analytics.ideas.draft)}
                  caption="Ideas still in draft mode"
                />
                <MetricTile
                  label="Under review"
                  value={formatNumber(analytics.ideas.underReview)}
                  caption="Ideas in moderation flow"
                />
                <MetricTile
                  label="Approved"
                  value={formatNumber(analytics.ideas.approved)}
                  caption="Ideas approved for publication"
                />
                <MetricTile
                  label="Published"
                  value={formatNumber(analytics.ideas.published)}
                  caption="Ideas visible in the platform"
                />
                <MetricTile
                  label="Archived"
                  value={formatNumber(analytics.ideas.archived)}
                  caption="Ideas retired from active view"
                />
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <MetricTile
                    label="Comments"
                    value={formatNumber(analytics.activity.comments)}
                    caption="Discussion participation"
                  />
                  <MetricTile
                    label="Votes"
                    value={formatNumber(analytics.activity.votes)}
                    caption="Support and reaction signals"
                  />
                  <MetricTile
                    label="Bookmarks"
                    value={formatNumber(analytics.activity.bookmarks)}
                    caption="Ideas saved for later"
                  />
                  <MetricTile
                    label="Experience reports"
                    value={formatNumber(analytics.activity.experienceReports)}
                    caption="Shared experience contributions"
                  />
                </div>

                <ProgressMetric
                  label="Published idea share"
                  value={analytics.ideas.published}
                  total={analytics.ideas.totalCreated}
                  tone="emerald"
                />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            eyebrow="Current Focus"
            title="What deserves attention now"
            description="A concise view of purchases, inbox state, and member momentum."
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
            eyebrow="Engagement"
            title="How your activity is landing"
            description="Track the visible footprint of your interactions across views, upvotes, comments, and bookmarks."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricTile
                label="Views"
                value={formatNumber(analytics.engagement.totalViews)}
                caption="Total recorded views"
              />
              <MetricTile
                label="Upvotes"
                value={formatNumber(analytics.engagement.totalUpvotes)}
                caption="Positive reactions received"
              />
              <MetricTile
                label="Comments"
                value={formatNumber(analytics.engagement.totalComments)}
                caption="Discussion generated"
              />
              <MetricTile
                label="Bookmarks"
                value={formatNumber(analytics.engagement.totalBookmarks)}
                caption="Times your activity led to saved ideas"
              />
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sky-700">
                    <Eye className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Visibility footprint
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatNumber(analytics.engagement.totalViews)} tracked views in the
                      current snapshot.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
                    <Lightbulb className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Interaction footprint
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatNumber(engagementActions)} combined actions across comments,
                      votes, bookmarks, and reports.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Shortcuts"
            title="Move through the member workspace"
            description="Quick entry points to the areas members use most often."
          >
            <div className="grid gap-3">
              {memberLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm transition-colors hover:border-slate-300 hover:bg-white"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "rounded-2xl border p-3 shadow-sm",
                        getSummaryToneClasses(link.tone),
                      )}
                    >
                      <link.icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {link.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {link.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </section>
  );
}

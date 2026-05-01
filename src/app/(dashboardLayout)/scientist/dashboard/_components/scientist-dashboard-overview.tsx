"use client";

import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Bell,
  FlaskConical,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  Sparkles,
  ThumbsUp,
  TrendingUp,
  Trophy,
} from "lucide-react";
import type { PropsWithChildren } from "react";
import { AiDashboardInsights } from "@/components/ai";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { useScientistAnalyticsQuery } from "@/features/scientist-analytics";
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
const numberFormatter = new Intl.NumberFormat("en-US");
const scoreFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatScore(value: number) {
  return scoreFormatter.format(value);
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

function ScoreTile({
  label,
  value,
  description,
  tone,
}: {
  label: string;
  value: number;
  description: string;
  tone: "sky" | "emerald" | "amber";
}) {
  const percent = Math.max(0, Math.min(100, Math.round((value / 10) * 100)));

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {formatScore(value)}
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-500">/ 10</span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
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

      <p className="mt-2 text-sm text-slate-600">{description}</p>
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

export function ScientistDashboardOverview() {
  const analyticsQuery = useScientistAnalyticsQuery();

  if (analyticsQuery.isPending) {
    return (
      <LoadingState
        title="Loading scientist analytics"
        description="Fetching profile readiness, idea workflow, and engagement signals."
        className="rounded-[24px] border-slate-200 bg-white p-6 shadow-sm"
        rows={6}
      />
    );
  }

  if (analyticsQuery.isError) {
    return (
      <ErrorState
        title="Could not load scientist analytics"
        description={getApiErrorMessage(analyticsQuery.error)}
        onRetry={() => {
          void analyticsQuery.refetch();
        }}
        className="rounded-[24px] border-destructive/30 bg-white p-6 shadow-sm"
      />
    );
  }

  const analytics = analyticsQuery.data.data;
  const reviewQueue = analytics.ideas.draft + analytics.ideas.underReview;
  const engagementActions =
    analytics.engagement.totalUpvotes +
    analytics.engagement.totalComments +
    analytics.engagement.totalBookmarks;
  const averageCompositeScore =
    (analytics.engagement.averageEcoScore +
      analytics.engagement.averageImpactScore +
      analytics.engagement.averageFeasibilityScore) /
    3;
  const publishRate = toPercent(
    analytics.ideas.published,
    analytics.ideas.totalCreated,
  );
  const approvalRate = toPercent(
    analytics.ideas.approved,
    analytics.ideas.totalCreated,
  );
  const profileReadinessRate = Math.round(
    (((analytics.profile.hasScientistProfile ? 1 : 0) +
      (analytics.profile.isVerified ? 1 : 0) +
      (analytics.profile.specialties > 0 ? 1 : 0)) /
      3) *
      100,
  );
  const workspaceState = !analytics.profile.hasScientistProfile
    ? {
        label: "Complete profile",
        description:
          "Your scientist profile needs to be completed before the workspace is fully ready.",
        tone: "border-rose-200 bg-rose-50 text-rose-700",
      }
    : !analytics.profile.isVerified
      ? {
          label: "Awaiting verification",
          description:
            "Your profile exists, but platform trust signals are still pending verification.",
          tone: "border-amber-200 bg-amber-50 text-amber-700",
        }
      : {
          label: "Verified workspace",
          description:
            "Your research workspace is verified and ready for publishing and audience growth.",
          tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
        };

  const focusCards = [
    {
      icon: BadgeCheck,
      title: "Verification status",
      value: analytics.profile.isVerified ? "Verified" : "Pending",
      description: analytics.profile.isVerified
        ? "Your profile is carrying active trust and credibility signals."
        : "Verification is still outstanding and should be prioritized.",
      tone: analytics.profile.isVerified ? "success" : "warning",
    },
    {
      icon: Lightbulb,
      title: "Ideas awaiting movement",
      value: formatNumber(reviewQueue),
      description:
        reviewQueue > 0
          ? "Draft and under-review ideas still need action before they convert into published outcomes."
          : "There are no stalled ideas in draft or review right now.",
      tone: reviewQueue > 0 ? "warning" : "success",
    },
    {
      icon: Bell,
      title: "Unread notifications",
      value: formatNumber(analytics.profile.unreadNotifications),
      description:
        analytics.profile.unreadNotifications > 0
          ? "There are unread updates waiting in your workspace."
          : "Your notification queue is currently clear.",
      tone: analytics.profile.unreadNotifications > 0 ? "info" : "success",
    },
    {
      icon: MessageSquare,
      title: "Review feedback",
      value: formatNumber(analytics.ideas.reviewFeedbackReceived),
      description:
        analytics.ideas.reviewFeedbackReceived > 0
          ? "Feedback is available to help improve ideas before the next iteration."
          : "No review feedback has been recorded in this snapshot.",
      tone: analytics.ideas.reviewFeedbackReceived > 0 ? "info" : "warning",
    },
  ] as const;

  return (
    <section className="space-y-8">
      <AiDashboardInsights />

      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 shadow-sm">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.14),_transparent_55%)]" />
        <div className="absolute -left-10 top-16 h-36 w-36 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute bottom-0 right-12 h-28 w-28 rounded-full bg-emerald-200/40 blur-3xl" />

        <div className="relative grid gap-6 px-6 py-7 md:px-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] xl:items-end">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 shadow-sm">
                <Sparkles className="size-3.5" />
                Scientist Workspace
              </div>
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold shadow-sm",
                  workspaceState.tone,
                )}
              >
                <FlaskConical className="size-3.5" />
                {workspaceState.label}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Research command center for ideas, credibility, and audience impact
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                Monitor your scientist profile health, idea publishing pipeline,
                activity footprint, and engagement quality from one modern
                dashboard built for professional research workflows.
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
              icon={Lightbulb}
              label="Ideas created"
              value={formatNumber(analytics.ideas.totalCreated)}
              caption={`${publishRate}% currently published`}
              tone="sky"
            />
            <SummaryCard
              icon={TrendingUp}
              label="Published ideas"
              value={formatNumber(analytics.ideas.published)}
              caption={`${approvalRate}% reached approval`}
              tone="emerald"
            />
            <SummaryCard
              icon={ThumbsUp}
              label="Audience actions"
              value={formatNumber(engagementActions)}
              caption="Upvotes, comments, and bookmarks combined"
              tone="amber"
            />
            <SummaryCard
              icon={Trophy}
              label="Composite score"
              value={formatScore(averageCompositeScore)}
              caption="Average of eco, impact, and feasibility"
              tone="rose"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="space-y-6">
          <SectionCard
            eyebrow="Profile Readiness"
            title="Research identity and trust posture"
            description="Keep profile completeness, verification, specialty coverage, and workspace readiness visible at a glance."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <MetricTile
                  label="Scientist profile"
                  value={analytics.profile.hasScientistProfile ? "Ready" : "Missing"}
                  caption="Whether your scientist record exists"
                />
                <MetricTile
                  label="Verification"
                  value={analytics.profile.isVerified ? "Verified" : "Pending"}
                  caption="Public trust and credibility state"
                />
                <MetricTile
                  label="Specialties"
                  value={formatNumber(analytics.profile.specialties)}
                  caption="Tagged expertise areas on your profile"
                />
                <MetricTile
                  label="Notifications"
                  value={formatNumber(analytics.profile.unreadNotifications)}
                  caption="Unread updates in your workspace"
                />
              </div>

              <div className="space-y-4">
                <ProgressMetric
                  label="Profile readiness"
                  value={profileReadinessRate}
                  total={100}
                  tone="emerald"
                />
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Workspace posture
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {workspaceState.label}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {workspaceState.description}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Idea Pipeline"
            title="Creation flow and publishing progress"
            description="Track how many ideas are moving through draft, approval, publication, promotion, and archive stages."
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <MetricTile
                  label="Draft"
                  value={formatNumber(analytics.ideas.draft)}
                  caption="Ideas still in personal preparation"
                />
                <MetricTile
                  label="Under review"
                  value={formatNumber(analytics.ideas.underReview)}
                  caption="Ideas currently in review flow"
                />
                <MetricTile
                  label="Approved"
                  value={formatNumber(analytics.ideas.approved)}
                  caption="Ideas approved for downstream publication"
                />
                <MetricTile
                  label="Archived"
                  value={formatNumber(analytics.ideas.archived)}
                  caption="Ideas removed from active circulation"
                />
                <MetricTile
                  label="Rejected"
                  value={formatNumber(analytics.ideas.rejected)}
                  caption="Ideas declined in moderation"
                />
                <MetricTile
                  label="Feedback received"
                  value={formatNumber(analytics.ideas.reviewFeedbackReceived)}
                  caption="Review responses returned to you"
                />
              </div>

              <div className="space-y-4">
                <ProgressMetric
                  label="Published ideas"
                  value={analytics.ideas.published}
                  total={analytics.ideas.totalCreated}
                  tone="emerald"
                />
                <ProgressMetric
                  label="Featured ideas"
                  value={analytics.ideas.featured}
                  total={analytics.ideas.totalCreated}
                  tone="sky"
                />
                <ProgressMetric
                  label="Highlighted ideas"
                  value={analytics.ideas.highlighted}
                  total={analytics.ideas.totalCreated}
                  tone="amber"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Audience Engagement"
            title="Reach and interaction footprint"
            description="Monitor how your published work is being discovered, saved, and discussed by the audience."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricTile
                label="Views"
                value={formatNumber(analytics.engagement.totalViews)}
                caption="Total recorded views across your ideas"
              />
              <MetricTile
                label="Upvotes"
                value={formatNumber(analytics.engagement.totalUpvotes)}
                caption="Positive audience reactions"
              />
              <MetricTile
                label="Comments"
                value={formatNumber(analytics.engagement.totalComments)}
                caption="Discussion activity on your ideas"
              />
              <MetricTile
                label="Bookmarks"
                value={formatNumber(analytics.engagement.totalBookmarks)}
                caption="Ideas saved for later review"
              />
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            eyebrow="Current Focus"
            title="What deserves attention next"
            description="A compact, high-signal view of profile state, idea movement, and response queues."
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
            eyebrow="Research Activity"
            title="Participation across the platform"
            description="Measure how actively you are contributing through comments, votes, and shared experience reports."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricTile
                label="Comments"
                value={formatNumber(analytics.activity.comments)}
                caption="Conversation participation"
              />
              <MetricTile
                label="Votes"
                value={formatNumber(analytics.activity.votes)}
                caption="Direct opinion signals"
              />
              <MetricTile
                label="Experience reports"
                value={formatNumber(analytics.activity.experienceReports)}
                caption="Contributed experience insights"
              />
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Quality Benchmarks"
            title="Average performance scores"
            description="See how your work is performing on eco value, impact strength, and delivery feasibility."
          >
            <div className="space-y-4">
              <ScoreTile
                label="Eco score"
                value={analytics.engagement.averageEcoScore}
                description="Environmental value and sustainability perception."
                tone="emerald"
              />
              <ScoreTile
                label="Impact score"
                value={analytics.engagement.averageImpactScore}
                description="Expected influence, usefulness, and broader significance."
                tone="sky"
              />
              <ScoreTile
                label="Feasibility score"
                value={analytics.engagement.averageFeasibilityScore}
                description="Practicality, execution confidence, and delivery readiness."
                tone="amber"
              />
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-800 px-5 py-5 text-white shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                  Composite benchmark
                </p>
                <p className="mt-3 text-4xl font-semibold tracking-tight">
                  {formatScore(averageCompositeScore)}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Consolidated average across eco, impact, and feasibility.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </section>
  );
}

"use client";

import { AlertTriangle, ArrowRight, BarChart3, CheckCircle2, Info } from "lucide-react";
import Link from "next/link";
import {
  useAiAnomalyAlertsQuery,
  useAiDashboardInsightsQuery,
  useAiNextActionsQuery,
} from "@/features/ai";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import type { AiAlert, AiInsight } from "@/services/ai.service";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";

type AiDashboardInsightsProps = {
  includeAdminAlerts?: boolean;
};

function getInsightTone(type: AiInsight["type"]) {
  if (type === "SUCCESS") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (type === "WARNING") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-sky-200 bg-sky-50 text-sky-800";
}

function getAlertTone(type: AiAlert["type"]) {
  if (type === "CRITICAL") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (type === "WARNING") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-sky-200 bg-sky-50 text-sky-800";
}

function InsightIcon({ type }: { type: AiInsight["type"] }) {
  if (type === "SUCCESS") {
    return <CheckCircle2 className="size-4" />;
  }

  if (type === "WARNING") {
    return <AlertTriangle className="size-4" />;
  }

  return <Info className="size-4" />;
}

export function AiDashboardInsights({
  includeAdminAlerts = false,
}: AiDashboardInsightsProps) {
  const insightsQuery = useAiDashboardInsightsQuery();
  const actionsQuery = useAiNextActionsQuery();
  const alertsQuery = useAiAnomalyAlertsQuery(includeAdminAlerts);

  if (insightsQuery.isPending) {
    return (
      <LoadingState
        title="Loading AI insights"
        description="Analyzing platform activity and user behavior."
      />
    );
  }

  if (insightsQuery.isError) {
    return (
      <ErrorState
        title="AI insights unavailable"
        description={getApiErrorMessage(insightsQuery.error)}
        onRetry={() => {
          void insightsQuery.refetch();
          void actionsQuery.refetch();
          if (includeAdminAlerts) {
            void alertsQuery.refetch();
          }
        }}
      />
    );
  }

  const insights = insightsQuery.data?.data.insights ?? [];
  const actions = actionsQuery.data?.data.actions ?? [];
  const alerts = alertsQuery.data?.data.alerts ?? [];

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-kicker">AI Analytics</p>
          <h2 className="section-title">Insights and next actions</h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          <BarChart3 className="size-4" />
          Role: {insightsQuery.data?.data.role ?? "USER"}
        </span>
      </div>

      {insights.length === 0 ? (
        <EmptyState
          title="No AI insights yet"
          description="More activity is needed before the assistant can summarize trends."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {insights.map((insight, index) => (
            <article
              key={`${insight.title}-${index}`}
              className={cn("rounded-lg border p-4", getInsightTone(insight.type))}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <InsightIcon type={insight.type} />
                {insight.title}
              </div>
              <p className="mt-2 text-sm leading-6">{insight.message}</p>
            </article>
          ))}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-4">
          <h3 className="text-base font-semibold">Predicted next actions</h3>
          {actionsQuery.isPending ? (
            <p className="mt-3 text-sm text-muted-foreground">Loading actions...</p>
          ) : actionsQuery.isError ? (
            <p className="mt-3 text-sm text-red-600">
              {getApiErrorMessage(actionsQuery.error)}
            </p>
          ) : actions.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No predicted actions available yet.
            </p>
          ) : (
            <div className="mt-3 grid gap-3">
              {actions.map((action, index) => (
                <Link
                  key={`${action.title}-${index}`}
                  href={action.link}
                  className="group rounded-md border border-border bg-muted p-3 text-sm transition-colors hover:bg-muted/70"
                >
                  <span className="flex items-center justify-between gap-3 font-medium text-foreground">
                    {action.title}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-1 block leading-6 text-muted-foreground">
                    {action.reason}
                  </span>
                  <span className="mt-2 inline-flex rounded-full bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
                    {action.priority} priority
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <h3 className="text-base font-semibold">Anomaly detection</h3>
          {!includeAdminAlerts ? (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Admin anomaly detection is available in protected dashboards and
              uses the same AI endpoint for unusual activity alerts.
            </p>
          ) : alertsQuery.isPending ? (
            <p className="mt-3 text-sm text-muted-foreground">Scanning activity...</p>
          ) : alertsQuery.isError ? (
            <p className="mt-3 text-sm text-red-600">
              {getApiErrorMessage(alertsQuery.error)}
            </p>
          ) : alerts.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No unusual activity detected.
            </p>
          ) : (
            <div className="mt-3 grid gap-3">
              {alerts.map((alert, index) => (
                <article
                  key={`${alert.title}-${index}`}
                  className={cn("rounded-md border p-3 text-sm", getAlertTone(alert.type))}
                >
                  <p className="font-medium">{alert.title}</p>
                  <p className="mt-1 leading-6">{alert.message}</p>
                  <p className="mt-2 text-xs font-semibold">{alert.priority} priority</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

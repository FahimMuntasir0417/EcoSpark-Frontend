"use client";

import {
  CheckCircle2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  XCircle,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useApproveExperienceReportMutation,
  useExperienceReportByIdQuery,
  useExperienceReportsQuery,
  useFeatureExperienceReportMutation,
  useRejectExperienceReportMutation,
} from "@/features/community";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import type { ExperienceReport } from "@/services/community.service";

type Feedback =
  | {
      type: "success" | "error";
      text: string;
    }
  | null;

type FeaturedFilter = "all" | "featured" | "standard";
type StatusFilter = "ALL" | "APPROVED" | "PENDING" | "REJECTED";

const STATUS_OPTIONS: StatusFilter[] = ["ALL", "APPROVED", "PENDING", "REJECTED"];
const LIMIT_OPTIONS = [5, 10, 20, 50] as const;

const selectClassName =
  "h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-amber-500 focus-visible:ring-3 focus-visible:ring-amber-500/15 disabled:cursor-not-allowed disabled:opacity-50";

const cardClassName =
  "rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_70px_-48px_rgba(15,23,42,0.38)]";

const detailCardClassName =
  "rounded-[24px] border border-slate-200 bg-slate-50/85 p-4";

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readString(report: ExperienceReport | null, key: string) {
  if (!report) return undefined;

  const value = toRecord(report)?.[key];
  return hasText(value) ? value.trim() : undefined;
}

function readNumber(report: ExperienceReport | null, key: string) {
  if (!report) return undefined;

  const value = toRecord(report)?.[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function readBoolean(report: ExperienceReport | null, key: string) {
  if (!report) return undefined;

  const value = toRecord(report)?.[key];
  return typeof value === "boolean" ? value : undefined;
}

function formatLabel(value: unknown, fallback = "N/A") {
  if (!hasText(value)) return fallback;

  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: unknown) {
  if (!hasText(value)) return "N/A";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleString();
}

function truncateText(value: string, maxLength = 140) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function getReportTitle(report: ExperienceReport) {
  return hasText(report.title) ? report.title.trim() : "Untitled report";
}

function getReportSummary(report: ExperienceReport) {
  return (
    readString(report, "summary") ??
    "No summary has been recorded for this experience report yet."
  );
}

function getReportStatus(report: ExperienceReport) {
  return formatLabel(readString(report, "status"), "Needs Review");
}

function getTotalPages(
  total: number | undefined,
  totalPages: number | undefined,
  totalPage: number | undefined,
  reportsLength: number,
  limit: number,
) {
  if (typeof totalPages === "number" && totalPages > 0) {
    return totalPages;
  }

  if (typeof totalPage === "number" && totalPage > 0) {
    return totalPage;
  }

  if (typeof total === "number" && total > 0) {
    return Math.max(1, Math.ceil(total / limit));
  }

  return Math.max(1, Math.ceil(Math.max(reportsLength, 1) / limit));
}

function ReportImagePreview({
  label,
  source,
}: Readonly<{
  label: string;
  source?: string;
}>) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
      </div>

      {hasText(source) ? (
        <img src={source} alt={label} className="h-48 w-full object-cover" />
      ) : (
        <div className="flex h-48 items-center justify-center bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.12),rgba(255,255,255,1)_70%)] px-4 text-center">
          <p className="text-sm text-slate-500">No image URL is available for this side.</p>
        </div>
      )}
    </div>
  );
}

export default function AdminAllIdeaReportPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("APPROVED");
  const [featuredFilter, setFeaturedFilter] =
    useState<FeaturedFilter>("featured");
  const [lookupIdInput, setLookupIdInput] = useState("");
  const [activeReportId, setActiveReportId] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { page, limit };

    if (statusFilter !== "ALL") {
      params.status = statusFilter;
    }

    if (featuredFilter === "featured") {
      params.isFeatured = true;
    } else if (featuredFilter === "standard") {
      params.isFeatured = false;
    }

    return params;
  }, [featuredFilter, limit, page, statusFilter]);

  const reportsQuery = useExperienceReportsQuery(queryParams);
  const reportQuery = useExperienceReportByIdQuery(activeReportId);
  const approveMutation = useApproveExperienceReportMutation();
  const rejectMutation = useRejectExperienceReportMutation();
  const featureMutation = useFeatureExperienceReportMutation();

  const reports = reportsQuery.data?.data ?? [];
  const selectedReportFromList =
    reports.find((report) => report.id === activeReportId) ?? null;
  const selectedReport = reportQuery.data?.data ?? selectedReportFromList;

  const totalItems =
    typeof reportsQuery.data?.meta?.total === "number"
      ? reportsQuery.data.meta.total
      : reports.length;

  const totalPages = getTotalPages(
    reportsQuery.data?.meta?.total,
    reportsQuery.data?.meta?.totalPages,
    reportsQuery.data?.meta?.totalPage,
    reports.length,
    limit,
  );

  const rangeStart = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd =
    totalItems === 0 ? 0 : Math.min(rangeStart + reports.length - 1, totalItems);

  const approvedCount = reports.filter(
    (report) => readString(report, "status")?.toUpperCase() === "APPROVED",
  ).length;
  const pendingCount = reports.filter(
    (report) => readString(report, "status")?.toUpperCase() === "PENDING",
  ).length;
  const rejectedCount = reports.filter(
    (report) => readString(report, "status")?.toUpperCase() === "REJECTED",
  ).length;
  const featuredCount = reports.filter(
    (report) => readBoolean(report, "isFeatured") === true,
  ).length;

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (hasAutoSelected || activeReportId || reports.length === 0) {
      return;
    }

    setActiveReportId(reports[0].id);
    setLookupIdInput(reports[0].id);
    setHasAutoSelected(true);
  }, [activeReportId, hasAutoSelected, reports]);

  useEffect(() => {
    if (!reportQuery.data?.data) {
      return;
    }

    setLookupIdInput(reportQuery.data.data.id);
  }, [reportQuery.data?.data]);

  const handleSelectReport = (reportId: string) => {
    setActiveReportId(reportId);
    setLookupIdInput(reportId);
    setFeedback(null);
  };

  const handleLookupSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedId = lookupIdInput.trim();
    if (!trimmedId) {
      setFeedback({
        type: "error",
        text: "Enter an experience report ID before loading a single record.",
      });
      return;
    }

    setActiveReportId(trimmedId);
    setFeedback(null);
  };

  const handleRefresh = () => {
    void reportsQuery.refetch();

    if (activeReportId) {
      void reportQuery.refetch();
    }
  };

  const runModerationAction = async ({
    run,
    successText,
  }: {
    run: () => Promise<unknown>;
    successText: string;
  }) => {
    if (!activeReportId) {
      setFeedback({
        type: "error",
        text: "Load a single report first before running a moderation action.",
      });
      return;
    }

    setFeedback(null);

    try {
      await run();
      await Promise.all([
        reportsQuery.refetch(),
        reportQuery.refetch(),
      ]);

      setFeedback({
        type: "success",
        text: successText,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(error),
      });
    }
  };

  const statusValue = readString(selectedReport, "status")?.toUpperCase() ?? "";
  const isFeatured = readBoolean(selectedReport, "isFeatured") === true;
  const isBusy =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    featureMutation.isPending;

  const beforeImageUrl = readString(selectedReport, "beforeImageUrl");
  const afterImageUrl = readString(selectedReport, "afterImageUrl");
  const effectivenessRating = readNumber(selectedReport, "effectivenessRating");

  return (
    <section className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-amber-100 bg-[linear-gradient(135deg,rgba(255,251,235,0.98),rgba(255,247,237,0.96),rgba(255,255,255,1))] shadow-[0_30px_90px_-60px_rgba(217,119,6,0.45)]">
        <div className="grid gap-6 px-6 py-7 lg:grid-cols-[minmax(0,1.2fr)_19rem] lg:px-8 lg:py-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
              <ShieldCheck className="size-4" />
              Admin Moderation
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950">
                Review experience reports and change approval state from one admin workspace.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                This page supports the report moderation flow you listed: filtered
                `GET` for all reports, `GET` by ID, and admin actions for
                approve, reject, and feature.
              </p>
              {reportsQuery.data?.message ? (
                <p className="text-sm text-slate-500">{reportsQuery.data.message}</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-amber-200 bg-white/80 p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Query Snapshot
            </p>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-700">
                  Total Matching
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">
                  {totalItems}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700">
                  Approved On Page
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">
                  {approvedCount}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/85 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  Featured On Page
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">
                  {featuredCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {feedback ? (
        <div
          aria-live="polite"
          className={cn(
            "flex items-start gap-3 rounded-[24px] border px-5 py-4 text-sm shadow-sm",
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50/90 text-emerald-800"
              : "border-red-200 bg-red-50/90 text-red-700",
          )}
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <p>{feedback.text}</p>
        </div>
      ) : null}

      <section className={`${cardClassName} p-5 sm:p-6`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Report Filters
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Control the `GET /community/experience-reports` query
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Defaults start with `page=1`, `limit=10`, `status=APPROVED`, and
              `isFeatured=true`.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="rounded-2xl border-slate-200"
            onClick={() => {
              setPage(1);
              setLimit(10);
              setStatusFilter("APPROVED");
              setFeaturedFilter("featured");
              setFeedback(null);
            }}
          >
            Reset filters
          </Button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,12rem)_minmax(0,12rem)_minmax(0,10rem)_minmax(0,1fr)]">
          <div className="space-y-2">
            <Label htmlFor="statusFilter">Status</Label>
            <select
              id="statusFilter"
              className={selectClassName}
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as StatusFilter);
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All statuses" : formatLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="featuredFilter">Feature State</Label>
            <select
              id="featuredFilter"
              className={selectClassName}
              value={featuredFilter}
              onChange={(event) => {
                setFeaturedFilter(event.target.value as FeaturedFilter);
                setPage(1);
              }}
            >
              <option value="featured">Featured only</option>
              <option value="all">All reports</option>
              <option value="standard">Standard only</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="limitFilter">Limit</Label>
            <select
              id="limitFilter"
              className={selectClassName}
              value={String(limit)}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
            >
              {LIMIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} per page
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/85 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Current Result Window
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              Showing {rangeStart}-{rangeEnd} of {totalItems} matching reports
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Page {page} of {totalPages}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-800">
            Approved: {approvedCount}
          </span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-800">
            Pending: {pendingCount}
          </span>
          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-red-800">
            Rejected: {rejectedCount}
          </span>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className={`${cardClassName} p-5 sm:p-6`}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Report List
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Matching experience reports
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Select a report to inspect the detail payload and run admin actions.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-slate-200"
              onClick={handleRefresh}
            >
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </div>

          <div className="mt-6 space-y-4">
            {reportsQuery.isPending && !reportsQuery.data ? (
              <LoadingState
                title="Loading reports"
                description="Fetching the filtered experience reports list."
                rows={5}
                className="rounded-[24px] border-slate-200"
              />
            ) : reportsQuery.isError && !reportsQuery.data ? (
              <ErrorState
                title="Could not load reports"
                description={getApiErrorMessage(reportsQuery.error)}
                className="rounded-[24px]"
                onRetry={() => {
                  void reportsQuery.refetch();
                }}
              />
            ) : reports.length === 0 ? (
              <EmptyState
                title="No reports match the active query"
                description="Adjust status or featured filters, or move to another page."
                className="rounded-[24px] border-slate-200"
              />
            ) : (
              <>
                <div className="space-y-3">
                  {reports.map((report) => {
                    const active = report.id === activeReportId;

                    return (
                      <button
                        key={report.id}
                        type="button"
                        onClick={() => handleSelectReport(report.id)}
                        className={cn(
                          "w-full rounded-[24px] border p-4 text-left transition-colors",
                          active
                            ? "border-amber-300 bg-amber-50/70 shadow-sm"
                            : "border-slate-200 bg-slate-50/70 hover:border-amber-200 hover:bg-amber-50/35",
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-white bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm">
                                {getReportStatus(report)}
                              </span>
                              {readBoolean(report, "isFeatured") === true ? (
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                  Featured
                                </span>
                              ) : null}
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-slate-950">
                                {getReportTitle(report)}
                              </p>
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {truncateText(getReportSummary(report))}
                              </p>
                            </div>
                          </div>

                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-700 shadow-sm">
                            {active ? "Selected" : "Review"}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                            ID {report.id}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                            Updated {formatDate(readString(report, "updatedAt"))}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Showing {rangeStart}-{rangeEnd} of {totalItems} reports on this query.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl border-slate-200"
                      disabled={page <= 1}
                      onClick={() => {
                        setPage((currentPage) => Math.max(1, currentPage - 1));
                      }}
                    >
                      Previous page
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl border-slate-200"
                      disabled={page >= totalPages}
                      onClick={() => {
                        setPage((currentPage) =>
                          Math.min(totalPages, currentPage + 1),
                        );
                      }}
                    >
                      Next page
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <section className={`${cardClassName} p-5 sm:p-6`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                Single Report
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Load and moderate a single report
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Enter an ID or select from the list to call `GET /community/experience-reports/:id`.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-slate-200"
              onClick={handleRefresh}
            >
              <RefreshCw className="size-4" />
              Refresh data
            </Button>
          </div>

          <form
            className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
            onSubmit={handleLookupSubmit}
          >
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={lookupIdInput}
                onChange={(event) => setLookupIdInput(event.target.value)}
                placeholder="cm_report_01hxyz123abc456def789ghij"
                className="h-11 rounded-2xl border-slate-200 bg-white pl-9 shadow-sm"
              />
            </label>

            <Button
              type="submit"
              className="h-11 rounded-2xl bg-amber-600 px-5 text-white hover:bg-amber-700"
            >
              Load report
            </Button>
          </form>

          <div className="mt-6">
            {!activeReportId ? (
              <EmptyState
                title="No report selected"
                description="Choose a report from the list or paste a report ID above."
                className="rounded-[24px] border-slate-200"
              />
            ) : reportQuery.isPending && !selectedReport ? (
              <LoadingState
                title="Loading selected report"
                description="Fetching the latest detail payload for this report."
                rows={4}
                className="rounded-[24px] border-slate-200"
              />
            ) : reportQuery.isError && !selectedReport ? (
              <ErrorState
                title="Could not load selected report"
                description={getApiErrorMessage(reportQuery.error)}
                className="rounded-[24px]"
                onRetry={() => {
                  void reportQuery.refetch();
                }}
              />
            ) : selectedReport ? (
              <div className="space-y-6">
                {reportQuery.isError ? (
                  <div className="rounded-[20px] border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700">
                    Latest detail refresh failed. Showing the data currently available in the client cache.
                  </div>
                ) : null}

                <section className="overflow-hidden rounded-[28px] border border-amber-100 bg-[linear-gradient(135deg,rgba(255,251,235,0.96),rgba(255,255,255,1))]">
                  <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-white bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                            {getReportStatus(selectedReport)}
                          </span>
                          {isFeatured ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                              <Star className="mr-1 inline size-3.5" />
                              Featured
                            </span>
                          ) : null}
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                            Selected record
                          </p>
                          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                            {getReportTitle(selectedReport)}
                          </h3>
                          <p className="mt-2 break-all text-sm text-slate-500">
                            {selectedReport.id}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[22px] border border-amber-200 bg-white/90 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Query route
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          `/community/experience-reports/:id`
                        </p>
                      </div>
                    </div>

                    <p className="text-sm leading-7 text-slate-600">
                      {getReportSummary(selectedReport)}
                    </p>
                  </div>
                </section>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className={detailCardClassName}>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Idea ID
                    </p>
                    <p className="mt-2 break-all text-sm font-medium text-slate-900">
                      {readString(selectedReport, "ideaId") ?? "Unlinked"}
                    </p>
                  </div>

                  <div className={detailCardClassName}>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Feature State
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {isFeatured ? "Featured" : "Standard"}
                    </p>
                  </div>

                  <div className={detailCardClassName}>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Rating
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {typeof effectivenessRating === "number"
                        ? `${effectivenessRating}/10`
                        : "Not rated"}
                    </p>
                  </div>

                  <div className={detailCardClassName}>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Updated
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {formatDate(readString(selectedReport, "updatedAt"))}
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.95fr)]">
                  <div className="space-y-6">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className={detailCardClassName}>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Outcome
                        </p>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {readString(selectedReport, "outcome") ??
                            "No outcome text has been captured yet."}
                        </p>
                      </div>

                      <div className={detailCardClassName}>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Challenges
                        </p>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {readString(selectedReport, "challenges") ??
                            "No challenges were stored for this report."}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <ReportImagePreview
                        label="Before Image"
                        source={beforeImageUrl}
                      />
                      <ReportImagePreview
                        label="After Image"
                        source={afterImageUrl}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                          Moderation Actions
                        </p>
                        <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                          Change report status
                        </h3>
                        <p className="text-sm leading-6 text-slate-600">
                          Approve, reject, or feature the selected experience report.
                        </p>
                      </div>

                      <div className="mt-5 space-y-3">
                        <Button
                          type="button"
                          className="w-full rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                          disabled={!activeReportId || isBusy || statusValue === "APPROVED"}
                          onClick={() => {
                            void runModerationAction({
                              run: () =>
                                approveMutation.mutateAsync({ id: activeReportId }),
                              successText: "Experience report approved successfully.",
                            });
                          }}
                        >
                          <CheckCircle2 className="size-4" />
                          {approveMutation.isPending ? "Approving..." : "Approve report"}
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          className="w-full rounded-2xl"
                          disabled={!activeReportId || isBusy || statusValue === "REJECTED"}
                          onClick={() => {
                            void runModerationAction({
                              run: () =>
                                rejectMutation.mutateAsync({ id: activeReportId }),
                              successText: "Experience report rejected successfully.",
                            });
                          }}
                        >
                          <XCircle className="size-4" />
                          {rejectMutation.isPending ? "Rejecting..." : "Reject report"}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full rounded-2xl border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                          disabled={!activeReportId || isBusy || isFeatured}
                          onClick={() => {
                            void runModerationAction({
                              run: () =>
                                featureMutation.mutateAsync({ id: activeReportId }),
                              successText: "Experience report marked as featured.",
                            });
                          }}
                        >
                          <Star className="size-4" />
                          {featureMutation.isPending ? "Featuring..." : "Feature report"}
                        </Button>
                      </div>

                      <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Current moderation state
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          Status: {formatLabel(statusValue, "Unknown")}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Feature state: {isFeatured ? "Featured" : "Not featured"}
                        </p>
                      </div>
                    </section>

                    <section className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Admin Note
                        </p>
                        <p className="text-sm leading-6 text-slate-600">
                          This route is focused on moderation only. It keeps the existing report
                          content read-only and limits admin actions to status updates and featured placement.
                        </p>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}

"use client";

import {
  CheckCircle2,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Trash2,
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
  useDeleteExperienceReportMutation,
  useExperienceReportByIdQuery,
  useExperienceReportsQuery,
  useUpdateExperienceReportMutation,
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

type EditFormState = {
  summary: string;
  outcome: string;
  effectivenessRating: string;
};

const STATUS_OPTIONS: StatusFilter[] = ["ALL", "APPROVED", "PENDING", "REJECTED"];
const LIMIT_OPTIONS = [5, 10, 20, 50] as const;

const selectClassName =
  "h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-sky-500 focus-visible:ring-3 focus-visible:ring-sky-500/15 disabled:cursor-not-allowed disabled:opacity-50";

const textareaClassName =
  "min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-xs outline-none transition-colors placeholder:text-slate-400 focus-visible:border-sky-500 focus-visible:ring-3 focus-visible:ring-sky-500/15 disabled:cursor-not-allowed disabled:opacity-50";

const cardClassName =
  "rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_70px_-48px_rgba(15,23,42,0.38)]";

const detailCardClassName =
  "rounded-[24px] border border-slate-200 bg-slate-50/85 p-4";

const initialEditForm: EditFormState = {
  summary: "",
  outcome: "",
  effectivenessRating: "",
};

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

function truncateText(value: string, maxLength = 150) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
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

function getReportTitle(report: ExperienceReport) {
  return hasText(report.title) ? report.title.trim() : "Untitled report";
}

function getReportSummary(report: ExperienceReport) {
  const summary = readString(report, "summary");
  return summary ?? "No summary has been recorded for this experience report yet.";
}

function getReportStatus(report: ExperienceReport) {
  return formatLabel(readString(report, "status"), "Needs Review");
}

function getFeaturedLabel(report: ExperienceReport) {
  return readBoolean(report, "isFeatured") === true ? "Featured" : "Standard";
}

function getEditFormState(report: ExperienceReport | null): EditFormState {
  return {
    summary: readString(report, "summary") ?? "",
    outcome: readString(report, "outcome") ?? "",
    effectivenessRating:
      typeof readNumber(report, "effectivenessRating") === "number"
        ? String(readNumber(report, "effectivenessRating"))
        : "",
  };
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
        <div className="flex h-48 items-center justify-center bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),rgba(255,255,255,1)_70%)] px-4 text-center">
          <p className="text-sm text-slate-500">No image URL is available for this side.</p>
        </div>
      )}
    </div>
  );
}

export default function AllIdeaReportPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("APPROVED");
  const [featuredFilter, setFeaturedFilter] =
    useState<FeaturedFilter>("featured");
  const [lookupIdInput, setLookupIdInput] = useState("");
  const [activeReportId, setActiveReportId] = useState("");
  const [editForm, setEditForm] = useState<EditFormState>(initialEditForm);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {
      page,
      limit,
    };

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
  const updateReportMutation = useUpdateExperienceReportMutation();
  const deleteReportMutation = useDeleteExperienceReportMutation();

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
    setEditForm(getEditFormState(reportQuery.data.data));
  }, [reportQuery.data?.data]);

  const handleSelectReport = (reportId: string) => {
    setActiveReportId(reportId);
    setLookupIdInput(reportId);
    setEditForm(initialEditForm);
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
    setEditForm(initialEditForm);
    setFeedback(null);
  };

  const handleRefresh = () => {
    void reportsQuery.refetch();

    if (activeReportId) {
      void reportQuery.refetch();
    }
  };

  const handleUpdateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!activeReportId) {
      setFeedback({
        type: "error",
        text: "Load a single report first before attempting an update.",
      });
      return;
    }

    const payload: {
      summary?: string;
      outcome?: string;
      effectivenessRating?: number;
    } = {};

    if (hasText(editForm.summary)) {
      payload.summary = editForm.summary.trim();
    }

    if (hasText(editForm.outcome)) {
      payload.outcome = editForm.outcome.trim();
    }

    if (editForm.effectivenessRating.trim()) {
      const parsedRating = Number(editForm.effectivenessRating);

      if (
        !Number.isFinite(parsedRating) ||
        parsedRating < 0 ||
        parsedRating > 10
      ) {
        setFeedback({
          type: "error",
          text: "Effectiveness rating must be a number between 0 and 10.",
        });
        return;
      }

      payload.effectivenessRating = parsedRating;
    }

    if (Object.keys(payload).length === 0) {
      setFeedback({
        type: "error",
        text: "Provide at least one field to send in the PATCH request.",
      });
      return;
    }

    try {
      await updateReportMutation.mutateAsync({
        id: activeReportId,
        payload,
      });

      setFeedback({
        type: "success",
        text: "Experience report updated successfully.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(error),
      });
    }
  };

  const handleDelete = async () => {
    if (!activeReportId) {
      setFeedback({
        type: "error",
        text: "Load a single report first before deleting it.",
      });
      return;
    }

    if (!window.confirm("Delete this experience report permanently?")) {
      return;
    }

    setFeedback(null);

    try {
      await deleteReportMutation.mutateAsync({
        id: activeReportId,
      });

      setFeedback({
        type: "success",
        text: "Experience report deleted successfully.",
      });
      setActiveReportId("");
      setLookupIdInput("");
      setEditForm(initialEditForm);
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(error),
      });
    }
  };

  const beforeImageUrl = readString(selectedReport, "beforeImageUrl");
  const afterImageUrl = readString(selectedReport, "afterImageUrl");
  const effectivenessRating = readNumber(selectedReport, "effectivenessRating");
  const isBusy =
    updateReportMutation.isPending || deleteReportMutation.isPending;

  return (
    <section className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-sky-100 bg-[linear-gradient(135deg,rgba(240,249,255,0.98),rgba(255,251,235,0.96),rgba(255,255,255,1))] shadow-[0_30px_90px_-60px_rgba(14,165,233,0.55)]">
        <div className="grid gap-6 px-6 py-7 lg:grid-cols-[minmax(0,1.2fr)_19rem] lg:px-8 lg:py-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              <Sparkles className="size-4" />
              All Experience Reports
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950">
                Review community experience reports, inspect a single record by
                ID, and send update or delete actions from one workspace.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                This page uses the existing community service for the same API
                flow you listed: filtered `GET` for all reports, `GET` by ID,
                `PATCH` for summary or outcome edits, and `DELETE` for record
                removal.
              </p>
              {reportsQuery.data?.message ? (
                <p className="text-sm text-slate-500">{reportsQuery.data.message}</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-sky-200 bg-white/80 p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Query Snapshot
            </p>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-sky-700">
                  Total Matching
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">
                  {totalItems}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-700">
                  Active Page
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">
                  {page}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/85 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  Filter Mode
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {statusFilter === "ALL" ? "All statuses" : formatLabel(statusFilter)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {featuredFilter === "featured"
                    ? "Featured only"
                    : featuredFilter === "standard"
                      ? "Standard only"
                      : "All feature states"}
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
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
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
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
                Select a report to load detail data and prepare an update or delete request.
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
                            ? "border-sky-300 bg-sky-50/70 shadow-sm"
                            : "border-slate-200 bg-slate-50/70 hover:border-sky-200 hover:bg-sky-50/40",
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

                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-sky-700 shadow-sm">
                            {active ? "Selected" : "Open"}
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
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Single Report
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Load, patch, or delete a single report
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
              className="h-11 rounded-2xl bg-sky-600 px-5 text-white hover:bg-sky-700"
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

                <section className="overflow-hidden rounded-[28px] border border-sky-100 bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(255,255,255,1))]">
                  <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-white bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                            {getReportStatus(selectedReport)}
                          </span>
                          {readBoolean(selectedReport, "isFeatured") === true ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                              <Star className="mr-1 inline size-3.5" />
                              Featured
                            </span>
                          ) : null}
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
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

                      <div className="rounded-[22px] border border-sky-200 bg-white/85 p-4">
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
                      {getFeaturedLabel(selectedReport)}
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

                      <div className={detailCardClassName}>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Measurable Result
                        </p>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {readString(selectedReport, "measurableResult") ??
                            "No measurable result has been recorded."}
                        </p>
                      </div>

                      <div className={detailCardClassName}>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Location / Scale
                        </p>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {[
                            readString(selectedReport, "location"),
                            readString(selectedReport, "adoptedScale"),
                          ]
                            .filter(Boolean)
                            .join(" / ") || "No location or adoption scale was stored."}
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

                    <div className={detailCardClassName}>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Audit Fields
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-slate-500">Created</p>
                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {formatDate(readString(selectedReport, "createdAt"))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Updated</p>
                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {formatDate(readString(selectedReport, "updatedAt"))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                          Update Request
                        </p>
                        <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                          Send a PATCH request
                        </h3>
                        <p className="text-sm leading-6 text-slate-600">
                          This editor is prefilled from the selected report and sends `summary`,
                          `outcome`, and `effectivenessRating`.
                        </p>
                      </div>

                      <form className="mt-5 space-y-4" onSubmit={handleUpdateSubmit}>
                        <div className="space-y-2">
                          <Label htmlFor="editSummary">Summary</Label>
                          <textarea
                            id="editSummary"
                            className={textareaClassName}
                            value={editForm.summary}
                            onChange={(event) =>
                              setEditForm((previous) => ({
                                ...previous,
                                summary: event.target.value,
                              }))
                            }
                            placeholder="Updated experience summary"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="editOutcome">Outcome</Label>
                          <textarea
                            id="editOutcome"
                            className={textareaClassName}
                            value={editForm.outcome}
                            onChange={(event) =>
                              setEditForm((previous) => ({
                                ...previous,
                                outcome: event.target.value,
                              }))
                            }
                            placeholder="Improved compost adoption"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="editRating">Effectiveness Rating</Label>
                          <Input
                            id="editRating"
                            type="number"
                            min="0"
                            max="10"
                            step="1"
                            value={editForm.effectivenessRating}
                            onChange={(event) =>
                              setEditForm((previous) => ({
                                ...previous,
                                effectivenessRating: event.target.value,
                              }))
                            }
                            placeholder="9"
                            className="h-11 rounded-2xl border-slate-200"
                          />
                        </div>

                        <p className="text-xs leading-5 text-slate-500">
                          Blank values are omitted from the patch payload. The selected report must be loaded first.
                        </p>

                        <div className="flex flex-wrap gap-3">
                          <Button
                            type="submit"
                            className="rounded-2xl bg-sky-600 px-5 text-white hover:bg-sky-700"
                            disabled={!activeReportId || isBusy}
                          >
                            {updateReportMutation.isPending ? "Saving..." : "Update report"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-2xl border-slate-200"
                            disabled={!selectedReport || isBusy}
                            onClick={() => {
                              setEditForm(getEditFormState(selectedReport));
                            }}
                          >
                            Reset form
                          </Button>
                        </div>
                      </form>
                    </section>

                    <section className="rounded-[28px] border border-red-200 bg-red-50/80 p-5">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
                          Delete Request
                        </p>
                        <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                          Remove the selected report
                        </h3>
                        <p className="text-sm leading-6 text-slate-600">
                          This calls `DELETE /community/experience-reports/:id` for the currently selected record.
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="destructive"
                        className="mt-5 rounded-2xl"
                        disabled={!activeReportId || isBusy}
                        onClick={() => {
                          void handleDelete();
                        }}
                      >
                        <Trash2 className="size-4" />
                        {deleteReportMutation.isPending ? "Deleting..." : "Delete report"}
                      </Button>
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

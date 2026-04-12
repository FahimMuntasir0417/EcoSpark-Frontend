"use client";

import { useDeferredValue, useState } from "react";
import {
  BookmarkCheck,
  MessageSquareQuote,
  Quote,
  Search,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import {
  DirectoryBadge,
  DirectoryDetailCard,
  DirectoryFieldGrid,
  DirectoryPaginationSection,
  DirectorySummaryCard,
} from "../_components/public-directory-primitives";
import {
  PUBLIC_DIRECTORY_PAGE_SIZE,
  formatBadgeLabel,
  getDirectoryFields,
  getPaginationItems,
  hasText,
} from "../_lib/public-directory";
import { useExperienceReportsQuery } from "@/features/community";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import type { ExperienceReport } from "@/services/community.service";

const REPORTS_PAGE_SIZE = PUBLIC_DIRECTORY_PAGE_SIZE;
const REPORT_FIELD_OPTIONS = {
  maxDepth: 3,
  hideIdentifierFields: true,
  priorityPaths: [
    "title",
    "summary",
    "status",
    "isFeatured",
    "outcome",
    "challenges",
    "measurableResult",
    "adoptedScale",
    "location",
    "effectivenessRating",
    "beforeImageUrl",
    "afterImageUrl",
    "updatedAt",
  ],
};

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isImageFieldKey(key: string) {
  return /(image|photo|thumbnail|cover)/i.test(key);
}

type ReportImage = {
  key: string;
  label: string;
  url: string;
};

function getReportTitle(report: ExperienceReport) {
  return hasText(report.title) ? report.title.trim() : "Untitled report";
}

function getReportSummary(report: ExperienceReport) {
  if (hasText(report.summary)) {
    return report.summary.trim();
  }

  return "No implementation summary has been added for this report yet.";
}

function getReportStatus(report: ExperienceReport) {
  return formatBadgeLabel(report.status, "Needs review");
}

function getReportPlacement(report: ExperienceReport) {
  return report.isFeatured === true ? "Featured placement" : "Standard placement";
}

function getReportConnectionLabel(report: ExperienceReport) {
  return hasText(report.ideaId)
    ? "Connected to an idea in the library"
    : "Shared as a standalone community report";
}

function getReportFields(report: ExperienceReport) {
  return getDirectoryFields(report, REPORT_FIELD_OPTIONS).filter((field) => {
    const leafKey = field.key.split(".").at(-1) ?? "";

    return leafKey !== "createdAt" && !isImageFieldKey(leafKey);
  });
}

function getReportImageUrls(report: ExperienceReport) {
  const reportRecord = report as Record<string, unknown>;
  const candidates: ReportImage[] = [
    {
      key: "beforeImageUrl",
      label: "Before Image",
      url:
        typeof reportRecord.beforeImageUrl === "string"
          ? reportRecord.beforeImageUrl.trim()
          : "",
    },
    {
      key: "afterImageUrl",
      label: "After Image",
      url:
        typeof reportRecord.afterImageUrl === "string"
          ? reportRecord.afterImageUrl.trim()
          : "",
    },
  ];

  return candidates.filter((image) => image.url && isHttpUrl(image.url));
}

function getReportSearchText(report: ExperienceReport) {
  return getReportFields(report)
    .map((field) => `${field.label} ${field.value}`)
    .join(" ")
    .toLowerCase();
}

function compareReports(a: ExperienceReport, b: ExperienceReport) {
  if (a.isFeatured === true && b.isFeatured !== true) {
    return -1;
  }

  if (a.isFeatured !== true && b.isFeatured === true) {
    return 1;
  }

  return getReportTitle(a).localeCompare(getReportTitle(b));
}

export default function CommunityPage() {
  const reportsQuery = useExperienceReportsQuery();
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const deferredSearchValue = useDeferredValue(searchValue);

  const reports = [...(reportsQuery.data?.data ?? [])].sort(compareReports);
  const activeQuery = deferredSearchValue.trim();
  const normalizedSearch = activeQuery.toLowerCase();
  const filteredReports = normalizedSearch
    ? reports.filter((report) => getReportSearchText(report).includes(normalizedSearch))
    : reports;

  const totalReports = filteredReports.length;
  const featuredReports = filteredReports.filter(
    (report) => report.isFeatured === true,
  ).length;
  const linkedIdeas = filteredReports.filter((report) => hasText(report.ideaId)).length;
  const distinctStatuses = new Set(
    filteredReports.map((report) => getReportStatus(report)),
  ).size;
  const totalPages = Math.max(1, Math.ceil(totalReports / REPORTS_PAGE_SIZE));

  if (reportsQuery.isPending) {
    return (
      <main className="public-page-shell">
        <LoadingState
          rows={4}
          title="Loading experience reports"
          description="Fetching community experience reports from the backend."
          className="surface-card p-5"
        />
      </main>
    );
  }

  if (reportsQuery.isError) {
    return (
      <main className="public-page-shell">
        <ErrorState
          title="Could not load experience reports"
          description={getApiErrorMessage(reportsQuery.error)}
          className="surface-card p-5"
          onRetry={() => {
            void reportsQuery.refetch();
          }}
        />
      </main>
    );
  }

  const activePage = Math.min(currentPage, totalPages);
  const pageStartIndex = (activePage - 1) * REPORTS_PAGE_SIZE;
  const pageReports = filteredReports.slice(
    pageStartIndex,
    pageStartIndex + REPORTS_PAGE_SIZE,
  );
  const rangeStart = totalReports === 0 ? 0 : pageStartIndex + 1;
  const rangeEnd =
    totalReports === 0
      ? 0
      : Math.min(pageStartIndex + pageReports.length, totalReports);
  const paginationItems = getPaginationItems(totalPages, activePage);
  const disablePrevious = activePage <= 1;
  const disableNext = activePage >= totalPages;

  return (
    <main className="public-page-shell">
      <section className="surface-card overflow-hidden">
        <div className="grid gap-6 p-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(19rem,0.9fr)] lg:p-8">
          <div className="space-y-5">
            <DirectoryBadge
              icon={Sparkles}
              label="Community Intelligence"
              tone="accent"
            />

            <div className="space-y-3">
              <h1 className="section-title">
                Surface practical lessons from the Eco Spark community in a
                cleaner, publication-ready format.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                Each report is organized for faster review by operations teams,
                partner organizations, and readers who need quick insight into
                what was tried, shared, and featured.
              </p>
              {reportsQuery.data?.message ? (
                <p className="text-sm text-slate-500">{reportsQuery.data.message}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-900">
                Featured reports lead the directory
              </span>
              <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-900">
                Two reports per page
              </span>
            </div>
          </div>

          <div className="rounded-[1.9rem] border border-amber-100 bg-[linear-gradient(145deg,rgba(255,251,235,0.98),rgba(255,241,242,0.96))] p-5 shadow-[0_28px_70px_-44px_rgba(120,53,15,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                  Reporting overview
                </p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-600">
                  A warmer editorial treatment for community stories, featured insights, and practical lessons.
                </p>
              </div>
              <span className="inline-flex rounded-full bg-white/80 p-3 text-amber-700 shadow-sm">
                <Quote className="size-5" />
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DirectorySummaryCard
                label="Matching"
                value={totalReports.toLocaleString()}
                caption="Reports in the current view"
                className="border-amber-100 bg-white/80"
              />
              <DirectorySummaryCard
                label="Featured"
                value={featuredReports.toLocaleString()}
                caption="Highlighted reports in the feed"
                className="border-rose-100 bg-white/80"
              />
              <DirectorySummaryCard
                label="Linked Ideas"
                value={linkedIdeas.toLocaleString()}
                caption="Reports connected to an idea record"
                className="border-orange-100 bg-white/80"
              />
              <DirectorySummaryCard
                label="Statuses"
                value={distinctStatuses.toLocaleString()}
                caption="Distinct review stages represented"
                className="border-yellow-100 bg-white/80"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card space-y-4 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="section-kicker">Directory Controls</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Search report summaries and linked idea references
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Filter by title, summary, status, featured placement, or report connection.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/85 px-4 py-3 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Page Status
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              Page {activePage} of {totalPages}
            </p>
            <p className="text-xs text-slate-500">
              {REPORTS_PAGE_SIZE} reports per page
            </p>
          </div>
        </div>

        <form
          className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by title, summary, status, or report connection"
              className="h-11 rounded-2xl border-slate-200 bg-white pl-9 shadow-sm"
            />
          </label>

          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-2xl border-slate-200 px-5 text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setSearchValue("");
              setCurrentPage(1);
            }}
            disabled={!searchValue.trim()}
          >
            Clear search
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-700">
            Showing {rangeStart}-{rangeEnd} of {totalReports.toLocaleString()}
          </span>
          {activeQuery ? (
            <p>
              Search:{" "}
              <span className="font-medium text-slate-900">{activeQuery}</span>
            </p>
          ) : (
            <p>Showing all published community reports</p>
          )}
        </div>

        <p className="text-xs text-slate-500">
          Results update as you type so review teams can move through reports
          without extra clicks.
        </p>
      </section>

      {totalReports === 0 ? (
        <EmptyState
          title="No experience reports found"
          description={
            activeQuery
              ? "Try another keyword or clear the search field."
              : "No community reports are available right now."
          }
          className="surface-card p-6"
        />
      ) : (
        <section className="space-y-5">
          {pageReports.map((report) => {
            const reportImages = getReportImageUrls(report);

            return (
              <article key={report.id} className="surface-card overflow-hidden">
                <div className="border-b border-amber-100 bg-[linear-gradient(135deg,rgba(255,251,235,0.95),rgba(255,241,242,0.92),rgba(255,255,255,0.98))] px-6 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <DirectoryBadge
                          icon={MessageSquareQuote}
                          label={getReportStatus(report)}
                          tone="accent"
                          className="normal-case tracking-normal"
                        />
                        {report.isFeatured === true ? (
                          <DirectoryBadge
                            icon={Star}
                            label="Featured"
                            tone="success"
                            className="normal-case tracking-normal"
                          />
                        ) : null}
                      </div>

                      <div>
                        <p className="section-kicker">Experience Report</p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                          {getReportTitle(report)}
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                          {getReportConnectionLabel(report)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-white/90 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Placement
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-900">
                        {getReportPlacement(report)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 p-6">
                  {reportImages.length > 0 ? (
                    <section className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="section-kicker">Report Images</p>
                        <p className="text-xs text-slate-500">
                          {reportImages.length} image{reportImages.length === 1 ? "" : "s"}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {reportImages.map((image, index) => (
                          <a
                            key={`${report.id}-${image.key}-${index}`}
                            href={image.url}
                            target="_blank"
                            rel="noreferrer"
                            className="group overflow-hidden rounded-[1.35rem] border border-slate-200 bg-slate-50"
                          >
                            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                              <span className="absolute left-3 top-3 z-10 rounded-full border border-white/80 bg-white/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700 shadow-sm backdrop-blur">
                                {image.label}
                              </span>
                              <img
                                src={image.url}
                                alt={`${getReportTitle(report)} ${image.label} ${index + 1}`}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                loading="lazy"
                              />
                            </div>
                          </a>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
                    <div className="space-y-4">
                      <div>
                        <p className="section-kicker">Implementation Summary</p>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          {getReportSummary(report)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/85 p-4">
                        <p className="section-kicker">Editorial Note</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          This report is currently labeled as{" "}
                          {getReportStatus(report).toLowerCase()} and appears in the
                          directory with {getReportPlacement(report).toLowerCase()}.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <DirectoryDetailCard
                        icon={BookmarkCheck}
                        label="Connection"
                        value={getReportConnectionLabel(report)}
                        className="border-amber-100 bg-amber-50/60"
                      />
                      <DirectoryDetailCard
                        icon={MessageSquareQuote}
                        label="Review Stage"
                        value={getReportStatus(report)}
                        className="border-rose-100 bg-rose-50/60"
                      />
                      <DirectoryDetailCard
                        icon={Star}
                        label="Placement"
                        value={getReportPlacement(report)}
                        className="border-orange-100 bg-orange-50/60"
                      />
                      <DirectoryDetailCard
                        icon={TrendingUp}
                        label="Story Signal"
                        value={
                          report.isFeatured === true
                            ? "Highlighted for broader attention"
                            : "Available in the standard report stream"
                        }
                        className="border-yellow-100 bg-yellow-50/70"
                      />
                    </div>
                  </div>

                  <DirectoryFieldGrid
                    title="Published Fields"
                    fields={getReportFields(report)}
                  />
                </div>
              </article>
            );
          })}
        </section>
      )}

      {totalPages > 1 ? (
        <DirectoryPaginationSection
          currentPage={activePage}
          totalPages={totalPages}
          paginationItems={paginationItems}
          onPageChange={(page) => {
            setCurrentPage(page);
          }}
          disablePrevious={disablePrevious}
          disableNext={disableNext}
          description={`Page ${activePage} of ${totalPages}. ${pageReports.length} reports are shown on this page.`}
        />
      ) : null}
    </main>
  );
}

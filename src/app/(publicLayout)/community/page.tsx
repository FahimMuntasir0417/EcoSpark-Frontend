"use client";

import {
  MessageSquareQuote,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useExperienceReportsQuery } from "@/features/community";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import type { ExperienceReport } from "@/services/community.service";

const REPORTS_PAGE_SIZE = 6;

type PaginationPageItem = number | "ellipsis";

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function formatBadgeLabel(value?: string | null) {
  if (!hasText(value)) {
    return "Unknown";
  }

  return value!
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getReportTitle(report: ExperienceReport) {
  return hasText(report.title) ? report.title!.trim() : "Untitled experience report";
}

function getReportSummary(report: ExperienceReport) {
  if (hasText(report.summary)) {
    return report.summary!.trim();
  }

  return "No summary has been added yet for this report.";
}

function getPaginationItems(
  totalPages: number,
  currentPage: number,
): PaginationPageItem[] {
  if (totalPages <= 1) {
    return [1];
  }

  const pages = new Set<number>([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
  }

  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
  }

  const sortedPages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items: PaginationPageItem[] = [];

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1];

    if (typeof previousPage === "number" && page - previousPage > 1) {
      items.push("ellipsis");
    }

    items.push(page);
  });

  return items;
}

function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        tone === "accent" && "bg-sky-100 text-sky-800",
        tone === "success" && "bg-emerald-100 text-emerald-800",
        tone === "neutral" && "bg-slate-100 text-slate-700",
      )}
    >
      {children}
    </span>
  );
}

export default function CommunityPage() {
  const reportsQuery = useExperienceReportsQuery();
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  if (reportsQuery.isPending) {
    return (
      <main className="public-page-shell">
        <LoadingState
          rows={6}
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

  const reports = reportsQuery.data?.data ?? [];
  const normalizedSearch = searchValue.trim().toLowerCase();

  const filteredReports = normalizedSearch
    ? reports.filter((report) => {
        const fields = [
          report.id,
          report.ideaId,
          report.title,
          report.summary,
          report.status,
        ];

        return fields.some(
          (field) =>
            typeof field === "string" &&
            field.toLowerCase().includes(normalizedSearch),
        );
      })
    : reports;

  const totalReports = filteredReports.length;
  const featuredReports = filteredReports.filter(
    (report) => report.isFeatured === true,
  ).length;
  const totalPages = Math.max(1, Math.ceil(totalReports / REPORTS_PAGE_SIZE));
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
      <section className="surface-card grid gap-6 p-7 lg:grid-cols-[minmax(0,1fr)_16rem] lg:p-8">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            <Sparkles className="size-3.5" />
            Community Reports
          </span>

          <div className="space-y-3">
            <h1 className="section-title">
              Learn from real implementation experience.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Discover outcome-focused reports, implementation notes, and lessons
              learned shared by the Eco Spark community.
            </p>
            {reportsQuery.data?.message ? (
              <p className="text-sm text-slate-500">{reportsQuery.data.message}</p>
            ) : null}
          </div>
        </div>

        <div className="surface-muted grid gap-3 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Matching reports
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {totalReports.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Featured</p>
            <p className="mt-1 font-semibold text-slate-900">
              {featuredReports.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card space-y-3 p-4 sm:p-5">
        <form
          className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            setCurrentPage(1);
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
              placeholder="Search by title, summary, status, idea ID, or report ID"
              className="h-10 border-slate-200 bg-white pl-9"
            />
          </label>

          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full border-slate-200 px-5 text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setSearchValue("");
              setCurrentPage(1);
            }}
            disabled={!normalizedSearch}
          >
            Clear search
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
          <p>
            Showing {rangeStart}-{rangeEnd} of {totalReports.toLocaleString()}
          </p>
          {normalizedSearch ? (
            <p>
              Search:{" "}
              <span className="font-medium text-slate-800">{searchValue.trim()}</span>
            </p>
          ) : (
            <p>Showing all reports</p>
          )}
        </div>
      </section>

      {totalReports === 0 ? (
        <EmptyState
          title="No experience reports found"
          description={
            normalizedSearch
              ? "Try another keyword."
              : "No community reports are available right now."
          }
          className="surface-card p-5"
        />
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          {pageReports.map((report) => (
            <article key={report.id} className="surface-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                    {getReportTitle(report)}
                  </h2>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Report ID: {report.id}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Pill tone="accent">{formatBadgeLabel(report.status)}</Pill>
                  {report.isFeatured ? <Pill tone="success">Featured</Pill> : null}
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                {getReportSummary(report)}
              </p>

              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div className="surface-muted flex items-center gap-2 px-3 py-2 text-slate-700">
                  <Tag className="size-4 text-slate-400" />
                  <span>Idea ID: {hasText(report.ideaId) ? report.ideaId : "Not set"}</span>
                </div>
                <div className="surface-muted flex items-center gap-2 px-3 py-2 text-slate-700">
                  <MessageSquareQuote className="size-4 text-slate-400" />
                  <span>Status: {formatBadgeLabel(report.status)}</span>
                </div>
              </div>

              <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <summary className="cursor-pointer text-sm font-medium text-slate-800">
                  View raw payload
                </summary>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-white p-3 text-xs leading-5 text-slate-700">
                  {JSON.stringify(report, null, 2)}
                </pre>
              </details>
            </article>
          ))}
        </section>
      )}

      {totalPages > 1 ? (
        <section className="surface-card grid gap-3 p-4">
          <Pagination>
            <PaginationContent className="flex-wrap items-center justify-center gap-2">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  className={cn(disablePrevious && "pointer-events-none opacity-50")}
                  onClick={(event) => {
                    event.preventDefault();
                    if (disablePrevious) {
                      return;
                    }
                    setCurrentPage(Math.max(1, activePage - 1));
                  }}
                />
              </PaginationItem>

              {paginationItems.map((item, index) => {
                if (item === "ellipsis") {
                  return (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                const isActivePage = item === activePage;

                return (
                  <PaginationItem key={`page-${item}`}>
                    <PaginationLink
                      href="#"
                      isActive={isActivePage}
                      className={cn(isActivePage && "pointer-events-none")}
                      onClick={(event) => {
                        event.preventDefault();
                        if (isActivePage) {
                          return;
                        }
                        setCurrentPage(item);
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  className={cn(disableNext && "pointer-events-none opacity-50")}
                  onClick={(event) => {
                    event.preventDefault();
                    if (disableNext) {
                      return;
                    }
                    setCurrentPage(Math.min(totalPages, activePage + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          <p className="text-center text-xs uppercase tracking-[0.14em] text-slate-500">
            Page {activePage} of {totalPages}
          </p>
        </section>
      ) : null}
    </main>
  );
}

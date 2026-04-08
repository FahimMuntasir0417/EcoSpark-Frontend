"use client";

import {
  BadgeCheck,
  IdCard,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useState } from "react";
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
import { useScientistsQuery } from "@/features/scientist";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import type { Scientist } from "@/services/scientist.service";

const SCIENTISTS_PAGE_SIZE = 6;

type PaginationPageItem = number | "ellipsis";

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function getScientistName(scientist: Scientist) {
  const record = scientist as Record<string, unknown>;
  const profile =
    record.scientist && typeof record.scientist === "object"
      ? (record.scientist as Record<string, unknown>)
      : null;
  const user =
    record.user && typeof record.user === "object"
      ? (record.user as Record<string, unknown>)
      : null;

  const candidates = [
    profile?.name,
    user?.name,
    record.name,
    record.fullName,
    scientist.userId,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return "Scientist profile";
}

function getScientistSummary(scientist: Scientist) {
  const record = scientist as Record<string, unknown>;
  const profile =
    record.scientist && typeof record.scientist === "object"
      ? (record.scientist as Record<string, unknown>)
      : null;

  const candidates = [record.bio, record.summary, profile?.bio, profile?.summary];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return "Profile details are available in the payload.";
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

export default function ScientistPage() {
  const scientistsQuery = useScientistsQuery({ page: 1, limit: 100 });
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  if (scientistsQuery.isPending) {
    return (
      <main className="public-page-shell">
        <LoadingState
          rows={6}
          title="Loading scientists"
          description="Fetching scientist profiles from the backend."
          className="surface-card p-5"
        />
      </main>
    );
  }

  if (scientistsQuery.isError) {
    return (
      <main className="public-page-shell">
        <ErrorState
          title="Could not load scientists"
          description={getApiErrorMessage(scientistsQuery.error)}
          className="surface-card p-5"
          onRetry={() => {
            void scientistsQuery.refetch();
          }}
        />
      </main>
    );
  }

  const scientists = scientistsQuery.data?.data ?? [];
  const meta = scientistsQuery.data?.meta;
  const normalizedSearch = searchValue.trim().toLowerCase();

  const filteredScientists = normalizedSearch
    ? scientists.filter((scientist) => {
        const record = scientist as Record<string, unknown>;
        const fields = [
          scientist.id,
          scientist.userId,
          getScientistName(scientist),
          typeof record.email === "string" ? record.email : "",
        ];

        return fields.some(
          (field) =>
            typeof field === "string" &&
            field.toLowerCase().includes(normalizedSearch),
        );
      })
    : scientists;

  const totalScientists = filteredScientists.length;
  const verifiedCount = filteredScientists.filter(
    (scientist) => scientist.isVerified === true,
  ).length;
  const totalPages = Math.max(1, Math.ceil(totalScientists / SCIENTISTS_PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);
  const pageStartIndex = (activePage - 1) * SCIENTISTS_PAGE_SIZE;
  const pageScientists = filteredScientists.slice(
    pageStartIndex,
    pageStartIndex + SCIENTISTS_PAGE_SIZE,
  );
  const rangeStart = totalScientists === 0 ? 0 : pageStartIndex + 1;
  const rangeEnd =
    totalScientists === 0
      ? 0
      : Math.min(pageStartIndex + pageScientists.length, totalScientists);
  const paginationItems = getPaginationItems(totalPages, activePage);
  const disablePrevious = activePage <= 1;
  const disableNext = activePage >= totalPages;

  return (
    <main className="public-page-shell">
      <section className="surface-card grid gap-6 p-7 lg:grid-cols-[minmax(0,1fr)_16rem] lg:p-8">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            <Sparkles className="size-3.5" />
            Scientist Directory
          </span>

          <div className="space-y-3">
            <h1 className="section-title">
              Discover verified experts and contributor profiles.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Browse researcher profiles connected to ideas, campaigns, and
              project outcomes across the platform.
            </p>
            {scientistsQuery.data?.message ? (
              <p className="text-sm text-slate-500">{scientistsQuery.data.message}</p>
            ) : null}
          </div>
        </div>

        <div className="surface-muted grid gap-3 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Matching profiles
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {totalScientists.toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Verified</p>
              <p className="mt-1 font-semibold text-slate-900">{verifiedCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">API page</p>
              <p className="mt-1 font-semibold text-slate-900">
                {meta?.page ?? 1}
              </p>
            </div>
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
              placeholder="Search by name, user ID, email, or scientist ID"
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
            Showing {rangeStart}-{rangeEnd} of {totalScientists.toLocaleString()}
          </p>
          {normalizedSearch ? (
            <p>
              Search:{" "}
              <span className="font-medium text-slate-800">{searchValue.trim()}</span>
            </p>
          ) : (
            <p>Showing all scientist profiles</p>
          )}
        </div>
      </section>

      {totalScientists === 0 ? (
        <EmptyState
          title="No scientists found"
          description={
            normalizedSearch
              ? "Try another search keyword."
              : "No scientist profiles are available right now."
          }
          className="surface-card p-5"
        />
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          {pageScientists.map((scientist) => (
            <article key={scientist.id} className="surface-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                    {getScientistName(scientist)}
                  </h2>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Scientist ID: {scientist.id}
                  </p>
                </div>

                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                    scientist.isVerified
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-700",
                  )}
                >
                  <BadgeCheck className="size-3.5" />
                  {scientist.isVerified ? "Verified" : "Unverified"}
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                {getScientistSummary(scientist)}
              </p>

              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div className="surface-muted flex items-center gap-2 px-3 py-2 text-slate-700">
                  <IdCard className="size-4 text-slate-400" />
                  <span>User ID: {hasText(scientist.userId) ? scientist.userId : "Not set"}</span>
                </div>
                <div className="surface-muted flex items-center gap-2 px-3 py-2 text-slate-700">
                  <UserRound className="size-4 text-slate-400" />
                  <span>Profile state: {scientist.isVerified ? "Approved" : "Pending review"}</span>
                </div>
              </div>

              <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <summary className="cursor-pointer text-sm font-medium text-slate-800">
                  View raw payload
                </summary>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-white p-3 text-xs leading-5 text-slate-700">
                  {JSON.stringify(scientist, null, 2)}
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

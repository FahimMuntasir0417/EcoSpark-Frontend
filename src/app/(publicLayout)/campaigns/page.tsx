"use client";

import {
  CalendarClock,
  CircleCheckBig,
  CircleOff,
  Search,
  Sparkles,
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
import { useCampaignsQuery } from "@/features/campaign";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/services/campaign.service";

const CAMPAIGNS_PAGE_SIZE = 6;

type PaginationPageItem = number | "ellipsis";

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function formatDate(value?: string | null) {
  if (!hasText(value)) {
    return "Not set";
  }

  const parsed = new Date(value!);

  if (Number.isNaN(parsed.getTime())) {
    return "Invalid date";
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getCampaignTitle(campaign: Campaign) {
  return hasText(campaign.title) ? campaign.title!.trim() : "Untitled campaign";
}

function getCampaignDescription(campaign: Campaign) {
  if (hasText(campaign.description)) {
    return campaign.description!.trim();
  }

  return "No campaign description has been added yet.";
}

function getCampaignDateRange(campaign: Campaign) {
  const start = formatDate(campaign.startDate);
  const end = formatDate(campaign.endDate);

  if (start === "Not set" && end === "Not set") {
    return "Date range not configured";
  }

  return `${start} to ${end}`;
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

function StatusBadge({
  active,
  label,
}: {
  active: boolean;
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        active
          ? "bg-emerald-100 text-emerald-800"
          : "bg-slate-100 text-slate-700",
      )}
    >
      {active ? (
        <CircleCheckBig className="size-3.5" />
      ) : (
        <CircleOff className="size-3.5" />
      )}
      {label}
    </span>
  );
}

export default function CampaignsPage() {
  const campaignsQuery = useCampaignsQuery();
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  if (campaignsQuery.isPending) {
    return (
      <main className="public-page-shell">
        <LoadingState
          rows={6}
          title="Loading campaigns"
          description="Fetching public campaigns from the backend."
          className="surface-card p-5"
        />
      </main>
    );
  }

  if (campaignsQuery.isError) {
    return (
      <main className="public-page-shell">
        <ErrorState
          title="Could not load campaigns"
          description={getApiErrorMessage(campaignsQuery.error)}
          className="surface-card p-5"
          onRetry={() => {
            void campaignsQuery.refetch();
          }}
        />
      </main>
    );
  }

  const campaigns = campaignsQuery.data?.data ?? [];
  const normalizedSearch = searchValue.trim().toLowerCase();

  const filteredCampaigns = normalizedSearch
    ? campaigns.filter((campaign) => {
        const fields = [
          campaign.title,
          campaign.description,
          campaign.slug,
          campaign.id,
        ];

        return fields.some(
          (field) =>
            typeof field === "string" &&
            field.toLowerCase().includes(normalizedSearch),
        );
      })
    : campaigns;

  const totalCampaigns = filteredCampaigns.length;
  const totalPages = Math.max(1, Math.ceil(totalCampaigns / CAMPAIGNS_PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);
  const pageStartIndex = (activePage - 1) * CAMPAIGNS_PAGE_SIZE;
  const pageCampaigns = filteredCampaigns.slice(
    pageStartIndex,
    pageStartIndex + CAMPAIGNS_PAGE_SIZE,
  );
  const rangeStart = totalCampaigns === 0 ? 0 : pageStartIndex + 1;
  const rangeEnd =
    totalCampaigns === 0
      ? 0
      : Math.min(pageStartIndex + pageCampaigns.length, totalCampaigns);
  const activeCampaigns = filteredCampaigns.filter(
    (campaign) => campaign.isActive === true,
  ).length;
  const publicCampaigns = filteredCampaigns.filter(
    (campaign) => campaign.isPublic === true,
  ).length;
  const paginationItems = getPaginationItems(totalPages, activePage);
  const disablePrevious = activePage <= 1;
  const disableNext = activePage >= totalPages;

  return (
    <main className="public-page-shell">
      <section className="surface-card grid gap-6 p-7 lg:grid-cols-[minmax(0,1fr)_16rem] lg:p-8">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            <Sparkles className="size-3.5" />
            Campaign Directory
          </span>

          <div className="space-y-3">
            <h1 className="section-title">
              Track every sustainability campaign in one place.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Review campaign scope, timeline, and visibility with a clean
              portfolio view designed for operational teams.
            </p>
            {campaignsQuery.data?.message ? (
              <p className="text-sm text-slate-500">{campaignsQuery.data.message}</p>
            ) : null}
          </div>
        </div>

        <div className="surface-muted grid gap-3 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Matching campaigns
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {totalCampaigns.toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Active</p>
              <p className="mt-1 font-semibold text-slate-900">
                {activeCampaigns.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Public</p>
              <p className="mt-1 font-semibold text-slate-900">
                {publicCampaigns.toLocaleString()}
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
              placeholder="Search by campaign title, slug, description, or ID"
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
            Showing {rangeStart}-{rangeEnd} of {totalCampaigns.toLocaleString()}
          </p>
          {normalizedSearch ? (
            <p>
              Search:{" "}
              <span className="font-medium text-slate-800">{searchValue.trim()}</span>
            </p>
          ) : (
            <p>Showing all campaigns</p>
          )}
        </div>
      </section>

      {totalCampaigns === 0 ? (
        <EmptyState
          title="No campaigns found"
          description={
            normalizedSearch
              ? "Try a different search keyword."
              : "No campaigns are available right now."
          }
          className="surface-card p-5"
        />
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          {pageCampaigns.map((campaign) => (
            <article key={campaign.id} className="surface-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                    {getCampaignTitle(campaign)}
                  </h2>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    ID: {campaign.id}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatusBadge active={campaign.isActive === true} label={campaign.isActive ? "Active" : "Inactive"} />
                  <StatusBadge active={campaign.isPublic === true} label={campaign.isPublic ? "Public" : "Private"} />
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                {getCampaignDescription(campaign)}
              </p>

              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div className="surface-muted flex items-center gap-2 px-3 py-2 text-slate-700">
                  <CalendarClock className="size-4 text-slate-400" />
                  <span>{getCampaignDateRange(campaign)}</span>
                </div>
                <div className="surface-muted px-3 py-2 text-slate-700">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                    Slug
                  </p>
                  <p className="mt-1 font-medium text-slate-900">
                    {hasText(campaign.slug) ? campaign.slug : "Not set"}
                  </p>
                </div>
              </div>

              <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <summary className="cursor-pointer text-sm font-medium text-slate-800">
                  View raw payload
                </summary>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-white p-3 text-xs leading-5 text-slate-700">
                  {JSON.stringify(campaign, null, 2)}
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

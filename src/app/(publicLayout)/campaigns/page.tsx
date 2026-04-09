"use client";

import { useDeferredValue, useEffect, useState } from "react";
import {
  CalendarClock,
  CircleCheckBig,
  CircleOff,
  Globe2,
  Search,
  Sparkles,
  Tag,
  Waypoints,
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
  formatDate,
  getDateSortValue,
  getDirectoryFields,
  getPaginationItems,
  hasText,
} from "../_lib/public-directory";
import { useCampaignsQuery } from "@/features/campaign";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import type { Campaign } from "@/services/campaign.service";

const CAMPAIGNS_PAGE_SIZE = PUBLIC_DIRECTORY_PAGE_SIZE;
const CAMPAIGN_FIELD_OPTIONS = {
  maxDepth: 2,
  hideIdentifierFields: true,
  priorityPaths: [
    "title",
    "slug",
    "description",
    "startDate",
    "endDate",
    "isActive",
    "isPublic",
  ],
};

function getCampaignTitle(campaign: Campaign) {
  return hasText(campaign.title) ? campaign.title.trim() : "Untitled campaign";
}

function getCampaignDescription(campaign: Campaign) {
  if (hasText(campaign.description)) {
    return campaign.description.trim();
  }

  return "No campaign brief has been published for this listing yet.";
}

function getCampaignDateRange(campaign: Campaign) {
  const hasStart = hasText(campaign.startDate);
  const hasEnd = hasText(campaign.endDate);

  if (!hasStart && !hasEnd) {
    return "Timeline not configured";
  }

  return `${formatDate(campaign.startDate, "Start not set")} to ${formatDate(
    campaign.endDate,
    "End not set",
  )}`;
}

function getCampaignVisibility(campaign: Campaign) {
  return campaign.isPublic === true ? "Public listing" : "Private listing";
}

function getCampaignOperationalState(campaign: Campaign) {
  if (campaign.isActive === true) {
    return "Running now";
  }

  if (hasText(campaign.startDate) || hasText(campaign.endDate)) {
    return "Scheduled or archived";
  }

  return "Draft setup";
}

function getCampaignMomentumLabel(campaign: Campaign) {
  if (campaign.isActive === true && campaign.isPublic === true) {
    return "Public and currently in motion";
  }

  if (campaign.isActive === true) {
    return "Operational but not publicly listed";
  }

  if (campaign.isPublic === true) {
    return "Visible archive or pre-launch listing";
  }

  return "Internal or limited visibility record";
}

function getCampaignFields(campaign: Campaign) {
  return getDirectoryFields(campaign, CAMPAIGN_FIELD_OPTIONS);
}

function getCampaignSearchText(campaign: Campaign) {
  return getCampaignFields(campaign)
    .map((field) => `${field.label} ${field.value}`)
    .join(" ")
    .toLowerCase();
}

function compareCampaigns(a: Campaign, b: Campaign) {
  if (a.isActive === true && b.isActive !== true) {
    return -1;
  }

  if (a.isActive !== true && b.isActive === true) {
    return 1;
  }

  const dateDifference = getDateSortValue(b.startDate) - getDateSortValue(a.startDate);

  if (dateDifference !== 0) {
    return dateDifference;
  }

  return getCampaignTitle(a).localeCompare(getCampaignTitle(b));
}

export default function CampaignsPage() {
  const campaignsQuery = useCampaignsQuery();
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const deferredSearchValue = useDeferredValue(searchValue);

  const campaigns = [...(campaignsQuery.data?.data ?? [])].sort(compareCampaigns);
  const activeQuery = deferredSearchValue.trim();
  const normalizedSearch = activeQuery.toLowerCase();
  const filteredCampaigns = normalizedSearch
    ? campaigns.filter((campaign) =>
        getCampaignSearchText(campaign).includes(normalizedSearch),
      )
    : campaigns;

  const totalCampaigns = filteredCampaigns.length;
  const activeCampaigns = filteredCampaigns.filter(
    (campaign) => campaign.isActive === true,
  ).length;
  const publicCampaigns = filteredCampaigns.filter(
    (campaign) => campaign.isPublic === true,
  ).length;
  const scheduledCampaigns = filteredCampaigns.filter(
    (campaign) => hasText(campaign.startDate) || hasText(campaign.endDate),
  ).length;
  const totalPages = Math.max(1, Math.ceil(totalCampaigns / CAMPAIGNS_PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

  if (campaignsQuery.isPending) {
    return (
      <main className="public-page-shell">
        <LoadingState
          rows={4}
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
  const paginationItems = getPaginationItems(totalPages, activePage);
  const disablePrevious = activePage <= 1;
  const disableNext = activePage >= totalPages;

  return (
    <main className="public-page-shell">
      <section className="surface-card overflow-hidden">
        <div className="relative overflow-hidden p-7 lg:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-2/5 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.22),transparent_58%),linear-gradient(135deg,rgba(15,23,42,1),rgba(8,47,73,0.94))] lg:block" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
          <div className="space-y-5">
            <DirectoryBadge
              icon={Sparkles}
              label="Campaign Operations"
              tone="accent"
            />

            <div className="space-y-3">
              <h1 className="section-title">
                Review public sustainability campaigns with clearer operational
                context.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                This directory surfaces live status, publication visibility, and
                campaign timing in a structure that is easier to scan during
                stakeholder reviews and public reporting.
              </p>
              {campaignsQuery.data?.message ? (
                <p className="text-sm text-slate-500">
                  {campaignsQuery.data.message}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-teal-800">
                Sorted with active campaigns first
              </span>
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-cyan-800">
                Two campaigns per page
              </span>
            </div>
          </div>

          <div className="relative rounded-[1.9rem] border border-slate-800/40 bg-slate-950 p-5 text-white shadow-[0_30px_80px_-45px_rgba(15,23,42,0.85)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Live overview
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DirectorySummaryCard
                label="Matching"
                value={totalCampaigns.toLocaleString()}
                caption="Campaigns in the current result set"
                inverse
                className="bg-teal-400/10"
              />
              <DirectorySummaryCard
                label="Active"
                value={activeCampaigns.toLocaleString()}
                caption="Records marked as operational"
                inverse
                className="bg-emerald-400/10"
              />
              <DirectorySummaryCard
                label="Public"
                value={publicCampaigns.toLocaleString()}
                caption="Visible listings for broader audiences"
                inverse
                className="bg-cyan-400/10"
              />
              <DirectorySummaryCard
                label="Scheduled"
                value={scheduledCampaigns.toLocaleString()}
                caption="Records with a defined timeline"
                inverse
                className="bg-sky-400/10"
              />
            </div>
          </div>
        </div>
        </div>
      </section>

      <section className="surface-card space-y-4 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="section-kicker">Directory Controls</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Search campaign records quickly
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Filter by campaign title, slug, description, visibility, or operational state.
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
              {CAMPAIGNS_PAGE_SIZE} campaigns per page
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
              placeholder="Search by campaign title, slug, description, or visibility"
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
            Showing {rangeStart}-{rangeEnd} of {totalCampaigns.toLocaleString()}
          </span>
          {activeQuery ? (
            <p>
              Search:{" "}
              <span className="font-medium text-slate-900">{activeQuery}</span>
            </p>
          ) : (
            <p>Showing all public campaign records</p>
          )}
        </div>

        <p className="text-xs text-slate-500">
          Results update as you type and stay grouped into compact review pages.
        </p>
      </section>

      {totalCampaigns === 0 ? (
        <EmptyState
          title="No campaigns found"
          description={
            activeQuery
              ? "Try a different keyword or clear the search field."
              : "No campaigns are available right now."
          }
          className="surface-card p-6"
        />
      ) : (
        <section className="space-y-5">
          {pageCampaigns.map((campaign) => (
            <article key={campaign.id} className="surface-card overflow-hidden">
              <div className="border-b border-teal-100 bg-[linear-gradient(135deg,rgba(236,253,245,0.92),rgba(224,242,254,0.95),rgba(248,250,252,0.98))] px-6 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <DirectoryBadge
                        icon={
                          campaign.isActive === true
                            ? CircleCheckBig
                            : CircleOff
                        }
                        label={
                          campaign.isActive === true ? "Active" : "Inactive"
                        }
                        tone={campaign.isActive === true ? "success" : "neutral"}
                        className="normal-case tracking-normal"
                      />
                      <DirectoryBadge
                        icon={Globe2}
                        label={
                          campaign.isPublic === true ? "Public" : "Private"
                        }
                        tone={
                          campaign.isPublic === true ? "accent" : "neutral"
                        }
                        className="normal-case tracking-normal"
                      />
                    </div>

                    <div>
                      <p className="section-kicker">Campaign Record</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                        {getCampaignTitle(campaign)}
                      </h2>
                      <p className="mt-2 text-sm text-slate-600">
                        {getCampaignMomentumLabel(campaign)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-teal-200 bg-white/90 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Operational State
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {getCampaignOperationalState(campaign)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
                  <div className="space-y-4">
                    <div>
                      <p className="section-kicker">Campaign Brief</p>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {getCampaignDescription(campaign)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/85 p-4">
                      <p className="section-kicker">Presentation Note</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        This entry is currently presented as a{" "}
                        {getCampaignVisibility(campaign).toLowerCase()} and is
                        tracked as{" "}
                        {getCampaignOperationalState(campaign).toLowerCase()}.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <DirectoryDetailCard
                      icon={CalendarClock}
                      label="Timeline"
                      value={getCampaignDateRange(campaign)}
                      className="border-teal-100 bg-teal-50/60"
                    />
                    <DirectoryDetailCard
                      icon={Tag}
                      label="Slug"
                      value={
                        hasText(campaign.slug)
                          ? campaign.slug
                          : "Slug not configured"
                      }
                      className="border-cyan-100 bg-cyan-50/60"
                    />
                    <DirectoryDetailCard
                      icon={Globe2}
                      label="Visibility"
                      value={getCampaignVisibility(campaign)}
                      className="border-sky-100 bg-sky-50/60"
                    />
                    <DirectoryDetailCard
                      icon={Waypoints}
                      label="Momentum"
                      value={getCampaignMomentumLabel(campaign)}
                      className="border-emerald-100 bg-emerald-50/60"
                    />
                  </div>
                </div>

                <DirectoryFieldGrid
                  title="Published Fields"
                  fields={getCampaignFields(campaign)}
                />
              </div>
            </article>
          ))}
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
          description={`Page ${activePage} of ${totalPages}. ${pageCampaigns.length} campaigns are shown on this page.`}
        />
      ) : null}
    </main>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarClock,
  Eye,
  Leaf,
  Lock,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { getMyPurchasesQueryOptions } from "@/features/commerce";
import { useIdeasQuery } from "@/features/idea";
import {
  getCurrentPurchaseForIdea,
  isPaidIdeaAccessType,
} from "@/features/commerce/utils/purchase-access";
import { getAccessToken, getUserRole } from "@/lib/auth/session";
import { normalizeUserRole } from "@/lib/authUtils";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import type { Idea } from "@/services/idea.service";

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function getIdeaTitle(idea: Idea) {
  return hasText(idea.title) ? idea.title!.trim() : "Untitled idea";
}

function getIdeaSummary(idea: Idea) {
  if (hasText(idea.excerpt)) {
    return idea.excerpt!.trim();
  }

  if (hasText(idea.description)) {
    return idea.description!.trim();
  }

  return "No summary has been added for this idea yet.";
}

function formatDate(value?: string | null) {
  if (!hasText(value)) {
    return "Not scheduled";
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

function formatMetric(value: number | null | undefined, suffix = "") {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "N/A";
  }

  return `${value.toLocaleString()}${suffix}`;
}

function formatCurrencyValue(amount: number, currency?: string | null) {
  const normalizedCurrency = currency?.trim().toUpperCase();
  const safeCurrency =
    normalizedCurrency && /^[A-Z]{3}$/.test(normalizedCurrency)
      ? normalizedCurrency
      : "USD";

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()}${
      normalizedCurrency ? ` ${normalizedCurrency}` : ""
    }`;
  }
}

function formatPrice(idea: Idea) {
  const rawPrice = idea.price;
  const accessType = hasText(idea.accessType) ? idea.accessType!.toUpperCase() : "";

  if (accessType === "FREE") {
    return "Free";
  }

  if (rawPrice === null || rawPrice === undefined || rawPrice === "") {
    return "Contact for pricing";
  }

  const price =
    typeof rawPrice === "number" ? rawPrice : Number.parseFloat(String(rawPrice));

  if (Number.isNaN(price)) {
    return String(rawPrice);
  }

  return formatCurrencyValue(price, idea.currency);
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

function Badge({
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

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

const IDEAS_PAGE_SIZE = 3;

function getTotalPages(totalPages?: number, totalPage?: number) {
  const resolvedTotalPages = totalPages ?? totalPage ?? 1;

  if (!Number.isFinite(resolvedTotalPages) || resolvedTotalPages <= 0) {
    return 1;
  }

  return Math.floor(resolvedTotalPages);
}

type PaginationPageItem = number | "ellipsis";

function getPaginationItems(totalPages: number, currentPage: number): PaginationPageItem[] {
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

export default function IdeaPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [appliedSearchValue, setAppliedSearchValue] = useState("");
  const [hasClientAuth, setHasClientAuth] = useState(false);
  const [clientRole, setClientRole] = useState<ReturnType<typeof normalizeUserRole>>(null);

  const ideasQueryParams = useMemo(() => {
    const normalizedSearch = appliedSearchValue.trim();
    const params: Record<string, unknown> = {};

    if (normalizedSearch) {
      params.search = normalizedSearch;
    }

    return params;
  }, [appliedSearchValue]);

  const ideasQuery = useIdeasQuery(ideasQueryParams);
  const purchasesQuery = useQuery({
    ...getMyPurchasesQueryOptions(),
    enabled: hasClientAuth,
    retry: false,
  });

  useEffect(() => {
    setHasClientAuth(Boolean(getAccessToken()));
    setClientRole(normalizeUserRole(getUserRole()));
  }, []);

  useEffect(() => {
    const normalizedSearch = searchInputValue.trim();
    const timer = window.setTimeout(() => {
      setAppliedSearchValue((previousValue) =>
        previousValue === normalizedSearch ? previousValue : normalizedSearch,
      );
      setCurrentPage((previousPage) => (previousPage === 1 ? previousPage : 1));
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInputValue]);

  const ideas = ideasQuery.data?.data ?? [];
  const purchases = purchasesQuery.data?.data ?? [];
  const totalIdeas = ideas.length;
  const totalPages = getTotalPages(
    totalIdeas > 0 ? Math.ceil(totalIdeas / IDEAS_PAGE_SIZE) : 1,
    undefined,
  );
  const activePage = Math.min(currentPage, totalPages);
  const pageStartIndex = (activePage - 1) * IDEAS_PAGE_SIZE;
  const pageIdeas = ideas.slice(pageStartIndex, pageStartIndex + IDEAS_PAGE_SIZE);
  const rangeStart = totalIdeas === 0 ? 0 : pageStartIndex + 1;
  const rangeEnd =
    totalIdeas === 0 ? 0 : Math.min(pageStartIndex + pageIdeas.length, totalIdeas);
  const hasAppliedSearch = appliedSearchValue.trim().length > 0;
  const disablePrevious = activePage <= 1 || ideasQuery.isFetching;
  const disableNext = activePage >= totalPages || ideasQuery.isFetching;
  const paginationItems = useMemo(
    () => getPaginationItems(totalPages, activePage),
    [activePage, totalPages],
  );

  if (ideasQuery.isPending) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <LoadingState
          rows={6}
          title="Loading ideas"
          description="Fetching the latest public ideas from the backend."
        />
      </main>
    );
  }

  if (ideasQuery.isError) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <ErrorState
          title="Could not load ideas"
          description={getApiErrorMessage(ideasQuery.error)}
          onRetry={() => {
            void ideasQuery.refetch();
          }}
        />
      </main>
    );
  }

  return (
    <main className="public-page-shell">
      <section className="surface-card grid gap-6 p-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          <Badge tone="accent">
            <Sparkles className="mr-1.5 size-3.5" />
            Public Idea Library
          </Badge>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Browse ideas ready for review, adoption, or purchase.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Free ideas open immediately. Paid ideas stay locked until the
              purchase is recorded as paid.
            </p>
            {ideasQuery.data?.message ? (
              <p className="text-sm text-slate-500">{ideasQuery.data.message}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 rounded-[1.5rem] bg-slate-950 p-5 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Library stats
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {totalIdeas.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-slate-300">matching ideas</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Page
              </p>
              <p className="mt-2 text-lg font-semibold">
                {activePage}/{totalPages}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Total
              </p>
              <p className="mt-2 text-lg font-semibold">
                {totalIdeas.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card grid gap-3 p-4 sm:p-5">
        <form
          className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            setCurrentPage(1);
            setAppliedSearchValue(searchInputValue.trim());
          }}
        >
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchInputValue}
              onChange={(event) => {
                setSearchInputValue(event.target.value);
              }}
              placeholder="Search ideas by title, summary, author, or category"
              className="h-10 border-slate-200 bg-white pl-9"
            />
          </label>

          <Button
            type="submit"
            className="h-10 rounded-full bg-slate-950 px-5 text-white hover:bg-slate-800"
          >
            Apply
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full border-slate-200 px-5 text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setSearchInputValue("");
              setAppliedSearchValue("");
              setCurrentPage(1);
            }}
            disabled={!searchInputValue.trim() && !hasAppliedSearch}
          >
            Clear
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
          <p>
            Showing {rangeStart}-{rangeEnd} of {totalIdeas.toLocaleString()}
          </p>
          {hasAppliedSearch ? (
            <p>
              Search: <span className="font-medium text-slate-800">{appliedSearchValue}</span>
            </p>
          ) : (
            <p>Showing all public ideas</p>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Search updates automatically while typing.
        </p>
      </section>

      {ideas.length === 0 ? (
        <EmptyState
          title="No ideas found"
          description={
            hasAppliedSearch
              ? "Try another keyword or clear the search filter."
              : "The public catalog is empty right now."
          }
        />
      ) : (
        <section className="grid gap-6">
          {pageIdeas.map((idea) => {
            const isPaidIdea = isPaidIdeaAccessType(idea.accessType);
            const currentPurchase = isPaidIdea
              ? getCurrentPurchaseForIdea(purchases, idea.id)
              : null;
            const purchaseStatus =
              typeof currentPurchase?.status === "string"
                ? currentPurchase.status
                : null;
            const isPurchased = purchaseStatus === "PAID";
            const canOpenDetails = !isPaidIdea || isPurchased;
            const actionHref = canOpenDetails
              ? `/idea/${idea.id}`
              : !hasClientAuth
                ? "/login"
                : clientRole === "MEMBER"
                  ? "/dashboard/purches-idea"
                  : `/idea/${idea.id}`;
            const actionLabel = canOpenDetails
              ? "Open details"
              : !hasClientAuth
                ? "Login to unlock"
                : clientRole === "MEMBER"
                  ? "Purchase access"
                  : "Unlock access";
            const actionDescription = isPaidIdea
              ? canOpenDetails
                ? "Paid access confirmed."
                : purchaseStatus === "PENDING"
                  ? "Payment is pending. Verify it before details unlock."
                  : "Protected details stay locked until purchase is complete."
              : "Public idea details are available now.";

            return (
              <article
                key={idea.id}
                className="surface-card overflow-hidden"
              >
                <div className="grid gap-0 lg:grid-cols-[19rem_minmax(0,1fr)]">
                  <div className="relative min-h-60 overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#0ea5e9_100%)]">
                    {hasText(idea.coverImageUrl) ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-80"
                        style={{ backgroundImage: `url(${idea.coverImageUrl})` }}
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.15),rgba(15,23,42,0.88))]" />
                    <div className="relative flex h-full flex-col justify-end p-5 text-white">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-200">
                        {idea.category?.name ?? "Uncategorized"}
                      </p>
                      <h2 className="mt-3 text-2xl font-semibold leading-tight">
                        {getIdeaTitle(idea)}
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-slate-200">
                        {getIdeaSummary(idea)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6 p-6 lg:p-7">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="success">{formatBadgeLabel(idea.status)}</Badge>
                      <Badge>{formatBadgeLabel(idea.visibility)}</Badge>
                      <Badge>{formatBadgeLabel(idea.accessType)}</Badge>
                      {isPaidIdea ? (
                        <Badge tone={canOpenDetails ? "success" : "accent"}>
                          {canOpenDetails ? "Purchased access" : "Purchase required"}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <StatCard label="Price" value={formatPrice(idea)} />
                      <StatCard label="Impact Score" value={formatMetric(idea.impactScore)} />
                      <StatCard label="Eco Score" value={formatMetric(idea.ecoScore)} />
                      <StatCard label="Views" value={formatMetric(idea.totalViews)} />
                    </div>

                    <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <p className="flex items-center gap-2">
                        <UserRound className="size-4 text-slate-400" />
                        {idea.author?.name ?? "Unknown author"}
                      </p>
                      <p className="flex items-center gap-2">
                        <CalendarClock className="size-4 text-slate-400" />
                        Updated {formatDate(idea.updatedAt)}
                      </p>
                      <p className="flex items-center gap-2">
                        <Leaf className="size-4 text-slate-400" />
                        CO2 {formatMetric(idea.estimatedCo2ReductionKgMonth, " kg/month")}
                      </p>
                      <p className="flex items-center gap-2">
                        <Eye className="size-4 text-slate-400" />
                        {formatMetric(idea.uniqueViews)} unique views
                      </p>
                    </div>

                    <div>
                      <Link
                        href={actionHref}
                        prefetch={canOpenDetails ? undefined : false}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
                          canOpenDetails
                            ? "bg-slate-950 text-white hover:bg-slate-800"
                            : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950",
                        )}
                      >
                        {actionLabel}
                        {canOpenDetails ? (
                          <ArrowRight className="size-4" />
                        ) : (
                          <Lock className="size-4" />
                        )}
                      </Link>
                      <p className="mt-3 text-xs text-slate-500">{actionDescription}</p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {totalPages > 1 ? (
        <section
          className="surface-card grid gap-3 p-4"
        >
          <Pagination>
            <PaginationContent className="flex-wrap items-center justify-center gap-2">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  className={cn(
                    disablePrevious && "pointer-events-none opacity-50",
                  )}
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
                      className={cn(
                        ideasQuery.isFetching &&
                          !isActivePage &&
                          "pointer-events-none opacity-60",
                        isActivePage && "pointer-events-none",
                      )}
                      onClick={(event) => {
                        event.preventDefault();

                        if (ideasQuery.isFetching || isActivePage) {
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

          <div className="text-center text-sm text-slate-600">
            <p>
              Page {activePage} of {totalPages}
            </p>
            <p className="text-xs text-slate-500">
              {ideasQuery.isFetching ? "Updating results..." : `${pageIdeas.length} ideas on this page`}
            </p>
          </div>
        </section>
      ) : null}
    </main>
  );
}

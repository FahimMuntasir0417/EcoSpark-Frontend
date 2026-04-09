"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { ExternalLink, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useApproveIdeaMutation,
  useArchiveIdeaMutation,
  useDeleteIdeaMutation,
  useFeatureIdeaMutation,
  useHighlightIdeaMutation,
  useIdeasQuery,
  usePublishIdeaMutation,
  useRejectIdeaMutation,
} from "@/features/idea";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import type { Idea } from "@/services/idea.service";

type Feedback = {
  type: "success" | "error";
  text: string;
};

type StatusAction = "APPROVE" | "REJECT" | "PUBLISH" | "ARCHIVE";
type FilterValue = "ALL" | string;
type PaginationPageItem = number | "ellipsis";

const IDEAS_PER_PAGE = 1;

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeValue(value?: string | null) {
  return hasText(value) ? value!.trim().toUpperCase() : "";
}

function getIdeaTitle(idea: Idea) {
  return hasText(idea.title) ? idea.title!.trim() : "Untitled idea";
}

function formatText(value?: string | null, fallback = "N/A") {
  return hasText(value) ? value!.trim() : fallback;
}

function formatLongText(value?: string | null, fallback = "Not provided") {
  return hasText(value) ? value!.trim() : fallback;
}

function formatDate(value?: string | null) {
  if (!hasText(value)) {
    return "N/A";
  }

  const parsed = new Date(value!);

  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }

  return parsed.toLocaleString();
}

function getDateValue(value?: string | null) {
  if (!hasText(value)) {
    return 0;
  }

  const parsed = new Date(value!);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function formatMetric(
  value: number | string | null | undefined,
  suffix = "",
  fallback = "N/A",
) {
  if (typeof value === "string") {
    const parsed = Number(value);
    value = Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return `${value.toLocaleString()}${suffix}`;
}

function formatCurrency(
  value: number | string | null | undefined,
  currency?: string | null,
) {
  if (typeof value === "string") {
    const parsed = Number(value);
    value = Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    return "N/A";
  }

  const normalizedCurrency = hasText(currency)
    ? currency!.trim().toUpperCase()
    : "USD";

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${normalizedCurrency}`;
  }
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

function matchesFilter(value: string, filter: FilterValue) {
  if (filter === "ALL") {
    return true;
  }

  return value === filter;
}

function isPendingReviewIdea(idea: Idea) {
  const status = normalizeValue(idea.status);
  return (
    status.includes("PENDING") ||
    status.includes("SUBMITTED") ||
    status.includes("REVIEW")
  );
}

function isArchivedIdea(idea: Idea) {
  const status = normalizeValue(idea.status);
  return status.includes("ARCHIV") || Boolean(idea.archivedAt);
}

function isPublishedIdea(idea: Idea) {
  const status = normalizeValue(idea.status);
  return status.includes("PUBLISH") || Boolean(idea.publishedAt);
}

function getDefaultStatusAction(idea: Idea): StatusAction {
  if (isPendingReviewIdea(idea)) {
    return "APPROVE";
  }

  if (isArchivedIdea(idea)) {
    return "PUBLISH";
  }

  if (isPublishedIdea(idea)) {
    return "ARCHIVE";
  }

  return "APPROVE";
}

function getSearchText(idea: Idea) {
  return [
    idea.id,
    idea.slug,
    idea.title,
    idea.excerpt,
    idea.problemStatement,
    idea.proposedSolution,
    idea.description,
    idea.implementationSteps,
    idea.risksAndChallenges,
    idea.requiredResources,
    idea.expectedBenefits,
    idea.targetAudience,
    idea.status,
    idea.visibility,
    idea.accessType,
    idea.rejectionFeedback,
    idea.adminNote,
    idea.currency,
    idea.seoTitle,
    idea.seoDescription,
    idea.authorId,
    idea.categoryId,
    idea.campaignId,
    idea.author?.name,
    idea.author?.email,
    idea.author?.role,
    idea.author?.status,
    idea.category?.name,
    idea.category?.slug,
  ]
    .filter(hasText)
    .join(" ")
    .toLowerCase();
}

function getSortTimestamp(idea: Idea) {
  return Math.max(
    getDateValue(idea.updatedAt),
    getDateValue(idea.lastActivityAt),
    getDateValue(idea.reviewedAt),
    getDateValue(idea.publishedAt),
    getDateValue(idea.submittedAt),
    getDateValue(idea.createdAt),
  );
}

function getDistinctValues(
  ideas: Idea[],
  selector: (idea: Idea) => string,
): string[] {
  return [...new Set(ideas.map(selector).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function SummaryCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{caption}</p>
    </div>
  );
}

function Badge({
  children,
  tone = "neutral",
}: Readonly<{
  children: string;
  tone?: "neutral" | "success" | "warning" | "accent";
}>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
        tone === "neutral" && "bg-slate-100 text-slate-700",
        tone === "success" && "bg-emerald-100 text-emerald-700",
        tone === "warning" && "bg-amber-100 text-amber-800",
        tone === "accent" && "bg-sky-100 text-sky-800",
      )}
    >
      {children}
    </span>
  );
}

function StatusBadge({ value }: Readonly<{ value?: string | null }>) {
  const normalized = normalizeValue(value);
  const tone =
    normalized.includes("APPROV") || normalized.includes("PUBLISH")
      ? "success"
      : normalized.includes("REJECT") || normalized.includes("ARCHIV")
        ? "warning"
        : normalized.includes("PENDING") || normalized.includes("REVIEW")
          ? "accent"
          : "neutral";

  return <Badge tone={tone}>{formatBadgeLabel(value)}</Badge>;
}

function MetricItem({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: Readonly<{
  title: string;
  children: ReactNode;
}>) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function DetailField({
  label,
  value,
  multiline = false,
}: Readonly<{
  label: string;
  value: string;
  multiline?: boolean;
}>) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p
        className={cn(
          "text-sm text-slate-700",
          multiline && "whitespace-pre-wrap leading-6",
        )}
      >
        {value}
      </p>
    </div>
  );
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
    .sort((left, right) => left - right);

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

export function AdminIdeasManagementWorkspace() {
  const ideasQuery = useIdeasQuery();

  const approveIdeaMutation = useApproveIdeaMutation();
  const rejectIdeaMutation = useRejectIdeaMutation();
  const archiveIdeaMutation = useArchiveIdeaMutation();
  const publishIdeaMutation = usePublishIdeaMutation();
  const featureIdeaMutation = useFeatureIdeaMutation();
  const highlightIdeaMutation = useHighlightIdeaMutation();
  const deleteIdeaMutation = useDeleteIdeaMutation();

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterValue>("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState<FilterValue>("ALL");
  const [accessFilter, setAccessFilter] = useState<FilterValue>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusActionByIdeaId, setStatusActionByIdeaId] = useState<
    Record<string, StatusAction>
  >({});
  const [rejectReasonByIdeaId, setRejectReasonByIdeaId] = useState<
    Record<string, string>
  >({});

  const ideas = useMemo(() => {
    return [...(ideasQuery.data?.data ?? [])].sort(
      (left, right) => getSortTimestamp(right) - getSortTimestamp(left),
    );
  }, [ideasQuery.data?.data]);

  const statusOptions = useMemo(
    () => getDistinctValues(ideas, (idea) => normalizeValue(idea.status)),
    [ideas],
  );
  const visibilityOptions = useMemo(
    () => getDistinctValues(ideas, (idea) => normalizeValue(idea.visibility)),
    [ideas],
  );
  const accessOptions = useMemo(
    () => getDistinctValues(ideas, (idea) => normalizeValue(idea.accessType)),
    [ideas],
  );

  const filteredIdeas = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return ideas.filter((idea) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        getSearchText(idea).includes(normalizedSearch);

      if (!matchesSearch) {
        return false;
      }

      return (
        matchesFilter(normalizeValue(idea.status), statusFilter) &&
        matchesFilter(normalizeValue(idea.visibility), visibilityFilter) &&
        matchesFilter(normalizeValue(idea.accessType), accessFilter)
      );
    });
  }, [accessFilter, ideas, searchValue, statusFilter, visibilityFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [accessFilter, searchValue, statusFilter, visibilityFilter]);

  const totalFilteredIdeas = filteredIdeas.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalFilteredIdeas / IDEAS_PER_PAGE),
  );
  const activePage = Math.min(currentPage, totalPages);
  const pageStartIndex = (activePage - 1) * IDEAS_PER_PAGE;
  const pageIdeas = filteredIdeas.slice(
    pageStartIndex,
    pageStartIndex + IDEAS_PER_PAGE,
  );
  const paginationItems = useMemo(
    () => getPaginationItems(totalPages, activePage),
    [activePage, totalPages],
  );

  const summary = useMemo(() => {
    return {
      total: ideas.length,
      pending: ideas.filter(isPendingReviewIdea).length,
      published: ideas.filter(isPublishedIdea).length,
      archived: ideas.filter(isArchivedIdea).length,
      featured: ideas.filter((idea) => Boolean(idea.isFeatured)).length,
      paid: ideas.filter((idea) => normalizeValue(idea.accessType) === "PAID")
        .length,
    };
  }, [ideas]);

  const clearRowDrafts = (ideaId: string) => {
    setStatusActionByIdeaId((previous) => {
      const next = { ...previous };
      delete next[ideaId];
      return next;
    });

    setRejectReasonByIdeaId((previous) => {
      const next = { ...previous };
      delete next[ideaId];
      return next;
    });
  };

  const onApprove = async (idea: Idea) => {
    setFeedback(null);

    try {
      const response = await approveIdeaMutation.mutateAsync({ id: idea.id });
      setFeedback({
        type: "success",
        text: response.message || "Idea approved.",
      });
      clearRowDrafts(idea.id);
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  const onReject = async (idea: Idea, reason: string) => {
    const normalizedReason = reason.trim();

    if (!normalizedReason) {
      setFeedback({
        type: "error",
        text: `A rejection reason is required for "${getIdeaTitle(idea)}".`,
      });
      return;
    }

    setFeedback(null);

    try {
      const response = await rejectIdeaMutation.mutateAsync({
        id: idea.id,
        payload: {
          status: "REJECTED",
          rejectionFeedback: normalizedReason,
          adminNote: normalizedReason,
        },
      });
      setFeedback({
        type: "success",
        text: response.message || "Idea rejected.",
      });
      clearRowDrafts(idea.id);
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  const onArchive = async (idea: Idea) => {
    setFeedback(null);

    try {
      const response = await archiveIdeaMutation.mutateAsync({ id: idea.id });
      setFeedback({
        type: "success",
        text: response.message || "Idea archived.",
      });
      clearRowDrafts(idea.id);
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  const onPublish = async (idea: Idea) => {
    setFeedback(null);

    try {
      const response = await publishIdeaMutation.mutateAsync({ id: idea.id });
      setFeedback({
        type: "success",
        text: response.message || "Idea published.",
      });
      clearRowDrafts(idea.id);
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  const onFeature = async (idea: Idea) => {
    setFeedback(null);

    try {
      const response = await featureIdeaMutation.mutateAsync({ id: idea.id });
      setFeedback({
        type: "success",
        text: response.message || "Idea featured.",
      });
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  const onHighlight = async (idea: Idea) => {
    setFeedback(null);

    try {
      const response = await highlightIdeaMutation.mutateAsync({ id: idea.id });
      setFeedback({
        type: "success",
        text: response.message || "Idea highlighted.",
      });
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  const onDelete = async (idea: Idea) => {
    const shouldDelete = window.confirm(
      `Delete "${getIdeaTitle(idea)}"? This action cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    setFeedback(null);

    try {
      const response = await deleteIdeaMutation.mutateAsync({ id: idea.id });
      setFeedback({
        type: "success",
        text: response.message || "Idea deleted.",
      });
      clearRowDrafts(idea.id);
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  const onApplyStatusAction = async (idea: Idea, action: StatusAction) => {
    switch (action) {
      case "APPROVE":
        await onApprove(idea);
        return;
      case "REJECT":
        await onReject(idea, rejectReasonByIdeaId[idea.id] ?? "");
        return;
      case "PUBLISH":
        await onPublish(idea);
        return;
      case "ARCHIVE":
        await onArchive(idea);
        return;
      default:
        return;
    }
  };

  if (ideasQuery.isPending) {
    return (
      <LoadingState
        rows={6}
        title="Loading ideas"
        description="Fetching the full idea inventory for administration."
      />
    );
  }

  if (ideasQuery.isError) {
    return (
      <ErrorState
        title="Could not load ideas"
        description={getApiErrorMessage(ideasQuery.error)}
        onRetry={() => {
          void ideasQuery.refetch();
        }}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#eff6ff_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              Ideas Management
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Full idea moderation workspace
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                This table shows the complete idea payload, gives you direct
                moderation controls, and keeps the workflow in one professional
                admin surface.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-slate-600">
            <Badge tone="accent">{summary.total.toLocaleString()} total</Badge>
            <Badge tone="accent">{summary.pending.toLocaleString()} pending</Badge>
            <Badge tone="success">
              {summary.published.toLocaleString()} published
            </Badge>
            <Badge tone="warning">
              {summary.archived.toLocaleString()} archived
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard
          label="Total Ideas"
          value={summary.total.toLocaleString()}
          caption="Every idea returned by the API."
        />
        <SummaryCard
          label="Pending Review"
          value={summary.pending.toLocaleString()}
          caption="Needs approval or rejection."
        />
        <SummaryCard
          label="Published"
          value={summary.published.toLocaleString()}
          caption="Visible in the public catalog."
        />
        <SummaryCard
          label="Archived"
          value={summary.archived.toLocaleString()}
          caption="Removed from active circulation."
        />
        <SummaryCard
          label="Featured"
          value={summary.featured.toLocaleString()}
          caption="Marked for elevated visibility."
        />
        <SummaryCard
          label="Paid Access"
          value={summary.paid.toLocaleString()}
          caption="Requires purchase before detail access."
        />
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,0.75fr))]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
              }}
              placeholder="Search by title, author, category, status, or content"
              className="h-11 border-slate-200 bg-white pl-9"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
            }}
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          >
            <option value="ALL">All statuses</option>
            {statusOptions.map((value) => (
              <option key={value} value={value}>
                {formatBadgeLabel(value)}
              </option>
            ))}
          </select>

          <select
            value={visibilityFilter}
            onChange={(event) => {
              setVisibilityFilter(event.target.value);
            }}
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          >
            <option value="ALL">All visibility</option>
            {visibilityOptions.map((value) => (
              <option key={value} value={value}>
                {formatBadgeLabel(value)}
              </option>
            ))}
          </select>

          <select
            value={accessFilter}
            onChange={(event) => {
              setAccessFilter(event.target.value);
            }}
            className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          >
            <option value="ALL">All access types</option>
            {accessOptions.map((value) => (
              <option key={value} value={value}>
                {formatBadgeLabel(value)}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <p>
            {totalFilteredIdeas === 0
              ? "No ideas in the current result set"
              : `Showing idea ${activePage.toLocaleString()} of ${totalFilteredIdeas.toLocaleString()} filtered results`}
          </p>
          <Button
            type="button"
            variant="outline"
            className="border-slate-200"
            disabled={
              !searchValue.trim() &&
              statusFilter === "ALL" &&
              visibilityFilter === "ALL" &&
              accessFilter === "ALL"
            }
            onClick={() => {
              setSearchValue("");
              setStatusFilter("ALL");
              setVisibilityFilter("ALL");
              setAccessFilter("ALL");
              setCurrentPage(1);
            }}
          >
            Reset filters
          </Button>
        </div>
      </div>

      {feedback ? (
        <div
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm shadow-sm",
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {feedback.text}
        </div>
      ) : null}

      {ideas.length === 0 ? (
        <EmptyState
          title="No ideas found"
          description="The ideas API returned an empty list."
        />
      ) : filteredIdeas.length === 0 ? (
        <EmptyState
          title="No ideas match the current filters"
          description="Broaden the search or reset filters to see more records."
        />
      ) : (
        <div className="space-y-4">
          <Table className="min-w-[1900px]">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[280px]">Idea</TableHead>
                <TableHead className="min-w-[210px]">Owner & taxonomy</TableHead>
                <TableHead className="min-w-[220px]">State</TableHead>
                <TableHead className="min-w-[220px]">Scores</TableHead>
                <TableHead className="min-w-[210px]">Delivery</TableHead>
                <TableHead className="min-w-[220px]">Engagement</TableHead>
                <TableHead className="min-w-[220px]">Lifecycle</TableHead>
                <TableHead className="min-w-[280px]">Moderation</TableHead>
                <TableHead className="min-w-[300px]">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {pageIdeas.map((idea) => {
                const selectedStatusAction =
                  statusActionByIdeaId[idea.id] ?? getDefaultStatusAction(idea);
                const rejectReason = rejectReasonByIdeaId[idea.id] ?? "";

                const isApproving =
                  approveIdeaMutation.isPending &&
                  approveIdeaMutation.variables?.id === idea.id;
                const isRejecting =
                  rejectIdeaMutation.isPending &&
                  rejectIdeaMutation.variables?.id === idea.id;
                const isPublishing =
                  publishIdeaMutation.isPending &&
                  publishIdeaMutation.variables?.id === idea.id;
                const isArchiving =
                  archiveIdeaMutation.isPending &&
                  archiveIdeaMutation.variables?.id === idea.id;
                const isFeaturing =
                  featureIdeaMutation.isPending &&
                  featureIdeaMutation.variables?.id === idea.id;
                const isHighlighting =
                  highlightIdeaMutation.isPending &&
                  highlightIdeaMutation.variables?.id === idea.id;
                const isDeleting =
                  deleteIdeaMutation.isPending &&
                  deleteIdeaMutation.variables?.id === idea.id;
                const isUpdatingPrimaryStatus =
                  isApproving || isRejecting || isPublishing || isArchiving;

                return (
                  <Fragment key={idea.id}>
                    <TableRow className="bg-white align-top">
                    <TableCell>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-slate-950">
                            {getIdeaTitle(idea)}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatText(idea.slug)}
                          </p>
                        </div>
                        <div className="grid gap-2 text-sm text-slate-600">
                          <p>
                            <span className="font-medium text-slate-800">
                              Idea ID:
                            </span>{" "}
                            {idea.id}
                          </p>
                          <p className="line-clamp-3 leading-6">
                            {formatLongText(
                              idea.excerpt ?? idea.description,
                              "No summary provided.",
                            )}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-3">
                        <MetricItem
                          label="Author"
                          value={formatText(idea.author?.name, "Unknown author")}
                        />
                        <MetricItem
                          label="Email"
                          value={formatText(idea.author?.email)}
                        />
                        <MetricItem
                          label="Role"
                          value={formatText(idea.author?.role)}
                        />
                        <MetricItem
                          label="Author status"
                          value={formatText(idea.author?.status)}
                        />
                        <MetricItem
                          label="Category"
                          value={formatText(
                            idea.category?.name ?? idea.categoryId,
                            "Uncategorized",
                          )}
                        />
                        <MetricItem
                          label="Campaign"
                          value={formatText(idea.campaignId)}
                        />
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge value={idea.status} />
                        <Badge>{formatBadgeLabel(idea.visibility)}</Badge>
                        <Badge>{formatBadgeLabel(idea.accessType)}</Badge>
                        {idea.isFeatured ? (
                          <Badge tone="success">Featured</Badge>
                        ) : null}
                        {idea.isHighlighted ? (
                          <Badge tone="accent">Highlighted</Badge>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-3">
                        <MetricItem
                          label="Impact score"
                          value={formatMetric(idea.impactScore)}
                        />
                        <MetricItem
                          label="Eco score"
                          value={formatMetric(idea.ecoScore)}
                        />
                        <MetricItem
                          label="Feasibility"
                          value={formatMetric(idea.feasibilityScore)}
                        />
                        <MetricItem
                          label="Scalability"
                          value={formatMetric(idea.scalabilityScore)}
                        />
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-3">
                        <MetricItem
                          label="Price"
                          value={formatCurrency(idea.price, idea.currency)}
                        />
                        <MetricItem
                          label="Estimated cost"
                          value={formatCurrency(idea.estimatedCost, idea.currency)}
                        />
                        <MetricItem
                          label="Time to implement"
                          value={formatMetric(idea.timeToImplementDays, " days")}
                        />
                        <MetricItem
                          label="Effort"
                          value={formatMetric(idea.implementationEffort)}
                        />
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-3">
                        <MetricItem
                          label="Views"
                          value={formatMetric(idea.totalViews)}
                        />
                        <MetricItem
                          label="Comments"
                          value={formatMetric(idea.totalComments)}
                        />
                        <MetricItem
                          label="Bookmarks"
                          value={formatMetric(idea.totalBookmarks)}
                        />
                        <MetricItem
                          label="Rating"
                          value={formatMetric(idea.averageRating)}
                        />
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-3">
                        <MetricItem
                          label="Submitted"
                          value={formatDate(idea.submittedAt)}
                        />
                        <MetricItem
                          label="Reviewed"
                          value={formatDate(idea.reviewedAt)}
                        />
                        <MetricItem
                          label="Published"
                          value={formatDate(idea.publishedAt)}
                        />
                        <MetricItem
                          label="Updated"
                          value={formatDate(idea.updatedAt)}
                        />
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-3">
                        <select
                          value={selectedStatusAction}
                          onChange={(event) => {
                            const nextAction = event.target.value as StatusAction;
                            setStatusActionByIdeaId((previous) => ({
                              ...previous,
                              [idea.id]: nextAction,
                            }));
                          }}
                          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                        >
                          <option value="APPROVE">Approve</option>
                          <option value="REJECT">Reject</option>
                          <option value="PUBLISH">Publish</option>
                          <option value="ARCHIVE">Archive</option>
                        </select>

                        {selectedStatusAction === "REJECT" ? (
                          <Input
                            value={rejectReason}
                            onChange={(event) => {
                              setRejectReasonByIdeaId((previous) => ({
                                ...previous,
                                [idea.id]: event.target.value,
                              }));
                            }}
                            placeholder="Rejection reason"
                            className="h-10 border-slate-200"
                          />
                        ) : (
                          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                            Current status: {formatBadgeLabel(idea.status)}
                          </p>
                        )}

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          disabled={
                            isUpdatingPrimaryStatus ||
                            isDeleting ||
                            (selectedStatusAction === "REJECT" &&
                              rejectReason.trim().length === 0)
                          }
                          onClick={() => {
                            void onApplyStatusAction(idea, selectedStatusAction);
                          }}
                        >
                          {isUpdatingPrimaryStatus ? "Updating..." : "Change status"}
                        </Button>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/idea/${idea.id}`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                          )}
                        >
                          <ExternalLink className="size-4" />
                          Open page
                        </Link>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isApproving || isDeleting}
                          onClick={() => {
                            void onApprove(idea);
                          }}
                        >
                          {isApproving ? "Approving..." : "Approve"}
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isPublishing || isDeleting}
                          onClick={() => {
                            void onPublish(idea);
                          }}
                        >
                          {isPublishing ? "Publishing..." : "Publish"}
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={isFeaturing || isDeleting || Boolean(idea.isFeatured)}
                          onClick={() => {
                            void onFeature(idea);
                          }}
                        >
                          {isFeaturing
                            ? "Featuring..."
                            : idea.isFeatured
                              ? "Featured"
                              : "Feature"}
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={
                            isHighlighting || isDeleting || Boolean(idea.isHighlighted)
                          }
                          onClick={() => {
                            void onHighlight(idea);
                          }}
                        >
                          {isHighlighting
                            ? "Highlighting..."
                            : idea.isHighlighted
                              ? "Highlighted"
                              : "Highlight"}
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isArchiving || isDeleting}
                          onClick={() => {
                            void onArchive(idea);
                          }}
                        >
                          {isArchiving ? "Archiving..." : "Archive"}
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={isDeleting || isUpdatingPrimaryStatus}
                          onClick={() => {
                            void onDelete(idea);
                          }}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableCell colSpan={9} className="px-5 py-5">
                      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                        <DetailSection title="Overview">
                          <DetailField label="Title" value={getIdeaTitle(idea)} />
                          <DetailField
                            label="Excerpt"
                            value={formatLongText(idea.excerpt)}
                            multiline
                          />
                          <DetailField
                            label="Description"
                            value={formatLongText(idea.description)}
                            multiline
                          />
                          <DetailField
                            label="Target audience"
                            value={formatLongText(idea.targetAudience)}
                            multiline
                          />
                        </DetailSection>

                        <DetailSection title="Proposal">
                          <DetailField
                            label="Problem statement"
                            value={formatLongText(idea.problemStatement)}
                            multiline
                          />
                          <DetailField
                            label="Proposed solution"
                            value={formatLongText(idea.proposedSolution)}
                            multiline
                          />
                          <DetailField
                            label="Expected benefits"
                            value={formatLongText(idea.expectedBenefits)}
                            multiline
                          />
                        </DetailSection>

                        <DetailSection title="Delivery">
                          <DetailField
                            label="Implementation steps"
                            value={formatLongText(idea.implementationSteps)}
                            multiline
                          />
                          <DetailField
                            label="Required resources"
                            value={formatLongText(idea.requiredResources)}
                            multiline
                          />
                          <DetailField
                            label="Risks and challenges"
                            value={formatLongText(idea.risksAndChallenges)}
                            multiline
                          />
                        </DetailSection>

                        <DetailSection title="Business & impact">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <DetailField
                              label="Price"
                              value={formatCurrency(idea.price, idea.currency)}
                            />
                            <DetailField
                              label="Currency"
                              value={formatText(idea.currency)}
                            />
                            <DetailField
                              label="Estimated cost"
                              value={formatCurrency(
                                idea.estimatedCost,
                                idea.currency,
                              )}
                            />
                            <DetailField
                              label="Implementation effort"
                              value={formatMetric(idea.implementationEffort)}
                            />
                            <DetailField
                              label="Expected impact"
                              value={formatMetric(idea.expectedImpact)}
                            />
                            <DetailField
                              label="Time to implement"
                              value={formatMetric(
                                idea.timeToImplementDays,
                                " days",
                              )}
                            />
                            <DetailField
                              label="Resource availability"
                              value={formatMetric(idea.resourceAvailability)}
                            />
                            <DetailField
                              label="Innovation level"
                              value={formatMetric(idea.innovationLevel)}
                            />
                            <DetailField
                              label="Scalability score"
                              value={formatMetric(idea.scalabilityScore)}
                            />
                            <DetailField
                              label="Feasibility score"
                              value={formatMetric(idea.feasibilityScore)}
                            />
                            <DetailField
                              label="Impact score"
                              value={formatMetric(idea.impactScore)}
                            />
                            <DetailField
                              label="Eco score"
                              value={formatMetric(idea.ecoScore)}
                            />
                          </div>
                        </DetailSection>

                        <DetailSection title="Sustainability & engagement">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <DetailField
                              label="Waste reduction"
                              value={formatMetric(
                                idea.estimatedWasteReductionKgMonth,
                                " kg/month",
                              )}
                            />
                            <DetailField
                              label="CO2 reduction"
                              value={formatMetric(
                                idea.estimatedCo2ReductionKgMonth,
                                " kg/month",
                              )}
                            />
                            <DetailField
                              label="Cost savings"
                              value={formatCurrency(
                                idea.estimatedCostSavingsMonth,
                                idea.currency,
                              )}
                            />
                            <DetailField
                              label="Water saved"
                              value={formatMetric(
                                idea.estimatedWaterSavedLitersMonth,
                                " L/month",
                              )}
                            />
                            <DetailField
                              label="Energy saved"
                              value={formatMetric(
                                idea.estimatedEnergySavedKwhMonth,
                                " kWh/month",
                              )}
                            />
                            <DetailField
                              label="Total views"
                              value={formatMetric(idea.totalViews)}
                            />
                            <DetailField
                              label="Unique views"
                              value={formatMetric(idea.uniqueViews)}
                            />
                            <DetailField
                              label="Upvotes"
                              value={formatMetric(idea.totalUpvotes)}
                            />
                            <DetailField
                              label="Downvotes"
                              value={formatMetric(idea.totalDownvotes)}
                            />
                            <DetailField
                              label="Comments"
                              value={formatMetric(idea.totalComments)}
                            />
                            <DetailField
                              label="Bookmarks"
                              value={formatMetric(idea.totalBookmarks)}
                            />
                            <DetailField
                              label="Average rating"
                              value={formatMetric(idea.averageRating)}
                            />
                            <DetailField
                              label="Trending score"
                              value={formatMetric(idea.trendingScore)}
                            />
                          </div>
                        </DetailSection>

                        <DetailSection title="Metadata, admin, and SEO">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <DetailField label="Slug" value={formatText(idea.slug)} />
                            <DetailField
                              label="Author ID"
                              value={formatText(idea.authorId)}
                            />
                            <DetailField
                              label="Category ID"
                              value={formatText(idea.categoryId)}
                            />
                            <DetailField
                              label="Campaign ID"
                              value={formatText(idea.campaignId)}
                            />
                            <DetailField
                              label="Campaign object ID"
                              value={formatText(idea.campaign?.id)}
                            />
                            <DetailField
                              label="Category slug"
                              value={formatText(idea.category?.slug)}
                            />
                            <DetailField
                              label="Category description"
                              value={formatLongText(idea.category?.description)}
                              multiline
                            />
                            <DetailField
                              label="Visibility"
                              value={formatBadgeLabel(idea.visibility)}
                            />
                            <DetailField
                              label="Access type"
                              value={formatBadgeLabel(idea.accessType)}
                            />
                            <DetailField
                              label="Featured"
                              value={idea.isFeatured ? "Yes" : "No"}
                            />
                            <DetailField
                              label="Highlighted"
                              value={idea.isHighlighted ? "Yes" : "No"}
                            />
                            <DetailField
                              label="Featured at"
                              value={formatDate(idea.featuredAt)}
                            />
                            <DetailField
                              label="Submitted at"
                              value={formatDate(idea.submittedAt)}
                            />
                            <DetailField
                              label="Reviewed at"
                              value={formatDate(idea.reviewedAt)}
                            />
                            <DetailField
                              label="Published at"
                              value={formatDate(idea.publishedAt)}
                            />
                            <DetailField
                              label="Last activity"
                              value={formatDate(idea.lastActivityAt)}
                            />
                            <DetailField
                              label="Archived at"
                              value={formatDate(idea.archivedAt)}
                            />
                            <DetailField
                              label="Deleted at"
                              value={formatDate(idea.deletedAt)}
                            />
                            <DetailField
                              label="Created at"
                              value={formatDate(idea.createdAt)}
                            />
                            <DetailField
                              label="Updated at"
                              value={formatDate(idea.updatedAt)}
                            />
                            <DetailField
                              label="Cover image URL"
                              value={formatText(idea.coverImageUrl)}
                              multiline
                            />
                            <DetailField
                              label="Video URL"
                              value={formatText(idea.videoUrl)}
                              multiline
                            />
                            <DetailField
                              label="SEO title"
                              value={formatLongText(idea.seoTitle)}
                              multiline
                            />
                            <DetailField
                              label="SEO description"
                              value={formatLongText(idea.seoDescription)}
                              multiline
                            />
                            <DetailField
                              label="Rejection feedback"
                              value={formatLongText(idea.rejectionFeedback)}
                              multiline
                            />
                            <DetailField
                              label="Admin note"
                              value={formatLongText(idea.adminNote)}
                              multiline
                            />
                          </div>
                        </DetailSection>
                      </div>
                    </TableCell>
                  </TableRow>
                </Fragment>
                );
              })}
            </TableBody>
          </Table>

          {totalPages > 1 ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
              <Pagination>
                <PaginationContent className="flex-wrap items-center justify-center gap-2">
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      className={cn(activePage <= 1 && "pointer-events-none opacity-50")}
                      onClick={(event) => {
                        event.preventDefault();

                        if (activePage <= 1) {
                          return;
                        }

                        setCurrentPage(activePage - 1);
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

                    return (
                      <PaginationItem key={`page-${item}`}>
                        <PaginationLink
                          href="#"
                          isActive={item === activePage}
                          className={cn(item === activePage && "pointer-events-none")}
                          onClick={(event) => {
                            event.preventDefault();
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
                      className={cn(
                        activePage >= totalPages && "pointer-events-none opacity-50",
                      )}
                      onClick={(event) => {
                        event.preventDefault();

                        if (activePage >= totalPages) {
                          return;
                        }

                        setCurrentPage(activePage + 1);
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              <p className="mt-3 text-center text-sm text-slate-500">
                Page {activePage.toLocaleString()} of {totalPages.toLocaleString()}.
                One idea is shown per page.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Layers3,
  RefreshCw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
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
import { useRemoveVoteMutation, useUpdateVoteMutation } from "@/features/interaction";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import { userService, type UserVote } from "@/services/user.service";

const PAGE_SIZE = 6;

type Feedback = {
  type: "success" | "error";
  text: string;
} | null;

type PaginationEntry = number | "ellipsis-left" | "ellipsis-right";

function SummaryCard({
  icon: Icon,
  label,
  value,
  caption,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  caption: string;
  tone: "slate" | "emerald" | "rose" | "sky";
}) {
  return (
    <article className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-sm text-slate-600">{caption}</p>
        </div>

        <div
          className={cn(
            "rounded-2xl border p-3 shadow-sm",
            tone === "slate" && "border-slate-200 bg-slate-50 text-slate-700",
            tone === "emerald" && "border-emerald-200 bg-emerald-50 text-emerald-700",
            tone === "rose" && "border-rose-200 bg-rose-50 text-rose-700",
            tone === "sky" && "border-sky-200 bg-sky-50 text-sky-700",
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </article>
  );
}

function buildPaginationEntries(
  currentPage: number,
  totalPages: number,
): PaginationEntry[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const entries: PaginationEntry[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    entries.push("ellipsis-left");
  }

  for (let page = start; page <= end; page += 1) {
    entries.push(page);
  }

  if (end < totalPages - 1) {
    entries.push("ellipsis-right");
  }

  entries.push(totalPages);

  return entries;
}

function getIdeaTitle(vote: UserVote) {
  const title = vote.idea?.title;
  return typeof title === "string" && title.trim() ? title : "Untitled idea";
}

function getIdeaStatus(vote: UserVote) {
  const status = vote.idea?.status;
  return typeof status === "string" && status.trim() ? status : "Unknown";
}

function getIdeaCategory(vote: UserVote) {
  const categoryName = vote.idea?.category?.name;
  return typeof categoryName === "string" && categoryName.trim()
    ? categoryName
    : "Uncategorized";
}

function formatTimestamp(value?: string) {
  if (typeof value !== "string" || !value.trim()) {
    return "Time unavailable";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Time unavailable";
  }

  return parsed.toLocaleString();
}

export default function MyVotePage() {
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const votesQuery = useQuery({
    queryKey: ["users", "me", "votes", { page, limit: PAGE_SIZE }],
    queryFn: ({ signal }) =>
      userService.getMyVotes({
        signal,
        params: {
          page,
          limit: PAGE_SIZE,
        },
      }),
    placeholderData: (previousData) => previousData,
  });
  const updateVoteMutation = useUpdateVoteMutation();
  const removeVoteMutation = useRemoveVoteMutation();

  if (votesQuery.isPending && !votesQuery.data) {
    return (
      <LoadingState
        title="Loading vote history"
        description="Preparing your voting activity workspace."
      />
    );
  }

  if (votesQuery.isError && !votesQuery.data) {
    return (
      <ErrorState
        title="Could not load vote history"
        description={getApiErrorMessage(votesQuery.error)}
        onRetry={() => {
          void votesQuery.refetch();
        }}
      />
    );
  }

  const votes = votesQuery.data?.data ?? [];
  const meta = votesQuery.data?.meta;
  const visiblePage = meta?.page ?? page;
  const totalPages = Math.max(meta?.totalPage ?? meta?.totalPages ?? 1, 1);
  const totalVotes = meta?.total ?? votes.length;
  const upvotesOnPage = votes.filter((vote) => vote.type === "UP").length;
  const downvotesOnPage = votes.filter((vote) => vote.type === "DOWN").length;
  const firstVisibleItem = totalVotes === 0 ? 0 : (visiblePage - 1) * PAGE_SIZE + 1;
  const lastVisibleItem = Math.min(visiblePage * PAGE_SIZE, totalVotes);
  const paginationEntries = buildPaginationEntries(visiblePage, totalPages);

  const handlePageChange = (nextPage: number) => {
    if (
      nextPage === page ||
      nextPage < 1 ||
      nextPage > totalPages ||
      votesQuery.isFetching
    ) {
      return;
    }

    setPage(nextPage);
    setFeedback(null);
  };

  const handleUpdateVote = async (vote: UserVote, nextType: "UP" | "DOWN") => {
    if (!vote.ideaId || vote.type === nextType) {
      return;
    }

    setFeedback(null);

    try {
      await updateVoteMutation.mutateAsync({
        ideaId: vote.ideaId,
        payload: { type: nextType },
      });
      await votesQuery.refetch();
      setFeedback({ type: "success", text: `Vote updated to ${nextType}.` });
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  const handleRemoveVote = async (vote: UserVote) => {
    if (!vote.ideaId) {
      return;
    }

    const confirmed = window.confirm("Remove this vote?");

    if (!confirmed) {
      return;
    }

    setFeedback(null);

    try {
      await removeVoteMutation.mutateAsync({ ideaId: vote.ideaId });

      if (votes.length === 1 && visiblePage > 1) {
        setPage(visiblePage - 1);
      } else {
        await votesQuery.refetch();
      }

      setFeedback({ type: "success", text: "Vote removed." });
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  return (
    <section className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 shadow-sm">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.14),_transparent_55%)]" />
        <div className="absolute -left-10 top-14 h-36 w-36 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute bottom-0 right-12 h-28 w-28 rounded-full bg-emerald-200/40 blur-3xl" />

        <div className="relative grid gap-6 px-6 py-7 md:px-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] xl:items-end">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 shadow-sm">
                <Sparkles className="size-3.5" />
                Member Activity
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 shadow-sm">
                <Layers3 className="size-3.5" />
                Page {visiblePage} of {totalPages}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Vote history with direct control over every signal
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                Review the ideas you reacted to, update your stance quickly,
                and manage your voting history inside a cleaner member workspace.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl bg-white/90"
                onClick={() => {
                  void votesQuery.refetch();
                }}
                disabled={votesQuery.isFetching}
              >
                <RefreshCw
                  className={cn(
                    "size-4",
                    votesQuery.isFetching && "animate-spin",
                  )}
                />
                {votesQuery.isFetching ? "Refreshing..." : "Refresh votes"}
              </Button>

              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Visible range
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {firstVisibleItem} to {lastVisibleItem} of {totalVotes}
                </p>
                <p className="text-xs text-slate-500">
                  {PAGE_SIZE} results per page
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryCard
              icon={Layers3}
              label="Total Votes"
              value={totalVotes.toLocaleString()}
              caption="Recorded vote history across your account"
              tone="slate"
            />
            <SummaryCard
              icon={Sparkles}
              label="Current Page"
              value={votes.length.toLocaleString()}
              caption="Votes visible in this view"
              tone="sky"
            />
            <SummaryCard
              icon={ThumbsUp}
              label="Upvotes"
              value={upvotesOnPage.toLocaleString()}
              caption="Positive signals on this page"
              tone="emerald"
            />
            <SummaryCard
              icon={ThumbsDown}
              label="Downvotes"
              value={downvotesOnPage.toLocaleString()}
              caption="Negative signals on this page"
              tone="rose"
            />
          </div>
        </div>
      </section>

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

      {totalVotes === 0 ? (
        <EmptyState
          title="No votes found"
          description="Vote on ideas to start building your activity history."
        />
      ) : (
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Vote Ledger
              </p>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                Review and adjust your current vote activity
              </h3>
              <p className="text-sm leading-6 text-slate-600">
                Every row is tied to one idea, with direct actions to switch your
                vote or remove it completely.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Live status
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {votesQuery.isFetching ? "Synchronizing activity" : "Everything is up to date"}
              </p>
              <p className="text-xs text-slate-500">
                Update or remove votes with immediate refresh
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Idea</TableHead>
                  <TableHead>Vote</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {votes.map((vote) => {
                  const isBusy =
                    (updateVoteMutation.isPending &&
                      updateVoteMutation.variables?.ideaId === vote.ideaId) ||
                    (removeVoteMutation.isPending &&
                      removeVoteMutation.variables?.ideaId === vote.ideaId);

                  return (
                    <TableRow key={vote.id}>
                      <TableCell className="min-w-72">
                        <div className="space-y-1">
                          <p className="font-medium text-slate-950">{getIdeaTitle(vote)}</p>
                          <p className="text-sm text-slate-600">
                            Vote ID: <span className="font-mono text-xs">{vote.id}</span>
                          </p>
                          <p className="text-sm text-slate-600">
                            Idea ID: <span className="font-mono text-xs">{vote.ideaId}</span>
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                            vote.type === "UP"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-rose-200 bg-rose-50 text-rose-700",
                          )}
                        >
                          {vote.type === "UP" ? (
                            <ThumbsUp className="size-3.5" />
                          ) : (
                            <ThumbsDown className="size-3.5" />
                          )}
                          {vote.type}
                        </span>
                      </TableCell>
                      <TableCell>{getIdeaStatus(vote)}</TableCell>
                      <TableCell>{getIdeaCategory(vote)}</TableCell>
                      <TableCell>{formatTimestamp(vote.updatedAt ?? vote.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link
                            href={`/idea/${vote.ideaId}`}
                            className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                          >
                            View
                            <ArrowUpRight className="size-3.5" />
                          </Link>
                          <Button
                            type="button"
                            size="sm"
                            variant={vote.type === "UP" ? "default" : "outline"}
                            disabled={isBusy || vote.type === "UP"}
                            className="rounded-xl"
                            onClick={() => {
                              void handleUpdateVote(vote, "UP");
                            }}
                          >
                            Upvote
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={vote.type === "DOWN" ? "default" : "outline"}
                            disabled={isBusy || vote.type === "DOWN"}
                            className="rounded-xl"
                            onClick={() => {
                              void handleUpdateVote(vote, "DOWN");
                            }}
                          >
                            Downvote
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={isBusy}
                            className="rounded-xl"
                            onClick={() => {
                              void handleRemoveVote(vote);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 ? (
            <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-5 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm text-slate-600">
                Showing <span className="font-medium text-slate-900">{firstVisibleItem}</span>
                {" "}to <span className="font-medium text-slate-900">{lastVisibleItem}</span>
                {" "}of <span className="font-medium text-slate-900">{totalVotes}</span> votes
              </p>

              <Pagination className="mx-0 w-auto justify-start lg:justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      className={cn(
                        (visiblePage === 1 || votesQuery.isFetching) &&
                          "pointer-events-none opacity-50",
                      )}
                      onClick={(event) => {
                        event.preventDefault();
                        handlePageChange(visiblePage - 1);
                      }}
                    />
                  </PaginationItem>

                  {paginationEntries.map((entry) => (
                    <PaginationItem key={String(entry)}>
                      {typeof entry === "number" ? (
                        <PaginationLink
                          href="#"
                          isActive={entry === visiblePage}
                          onClick={(event) => {
                            event.preventDefault();
                            handlePageChange(entry);
                          }}
                          className={cn(votesQuery.isFetching && "pointer-events-none")}
                        >
                          {entry}
                        </PaginationLink>
                      ) : (
                        <PaginationEllipsis />
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      className={cn(
                        (visiblePage === totalPages || votesQuery.isFetching) &&
                          "pointer-events-none opacity-50",
                      )}
                      onClick={(event) => {
                        event.preventDefault();
                        handlePageChange(visiblePage + 1);
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </section>
      )}
    </section>
  );
}

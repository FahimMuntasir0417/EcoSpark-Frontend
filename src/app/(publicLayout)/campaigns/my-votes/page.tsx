"use client";

import Link from "next/link";
import { Filter, RefreshCw, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIdeasQuery } from "@/features/idea";
import {
  useRemoveVoteMutation,
  useUpdateVoteMutation,
  useVoteIdeaMutation,
} from "@/features/interaction";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import type { Idea } from "@/services/idea.service";

type VoteType = "UP" | "DOWN";

type Feedback = {
  type: "success" | "error";
  text: string;
} | null;

function getIdeaTitle(idea: Idea) {
  return typeof idea.title === "string" && idea.title.trim()
    ? idea.title
    : "Untitled idea";
}

function extractCurrentVote(idea: Idea): VoteType | null {
  const record = idea as unknown as Record<string, unknown>;
  const nestedInteraction =
    record.interaction && typeof record.interaction === "object"
      ? (record.interaction as Record<string, unknown>)
      : null;
  const nestedVote =
    record.vote && typeof record.vote === "object"
      ? (record.vote as Record<string, unknown>)
      : null;

  const candidates = [
    record.myVote,
    record.userVote,
    record.viewerVote,
    record.currentUserVote,
    record.voteType,
    record.userVoteType,
    nestedInteraction?.myVote,
    nestedInteraction?.voteType,
    nestedVote?.type,
  ];

  for (const candidate of candidates) {
    if (candidate === "UP" || candidate === "DOWN") {
      return candidate;
    }
  }

  return null;
}

function formatLabel(value?: string | null, fallback = "N/A") {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
    <article className="rounded-2xl border border-white/60 bg-white/85 p-4 shadow-sm backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-600">{caption}</p>
    </article>
  );
}

export default function MyVotesPage() {
  const ideasQuery = useIdeasQuery();
  const voteIdeaMutation = useVoteIdeaMutation();
  const updateVoteMutation = useUpdateVoteMutation();
  const removeVoteMutation = useRemoveVoteMutation();
  const [feedback, setFeedback] = useState<Feedback>(null);

  if (ideasQuery.isPending) {
    return (
      <LoadingState
        title="Loading votes"
        description="Fetching ideas and vote metadata."
      />
    );
  }

  if (ideasQuery.isError) {
    return (
      <ErrorState
        title="Could not load votes"
        description={getApiErrorMessage(ideasQuery.error)}
        onRetry={() => {
          void ideasQuery.refetch();
        }}
      />
    );
  }

  const ideas = ideasQuery.data?.data ?? [];
  const ideasWithDetectedVotes = ideas.filter((idea) => extractCurrentVote(idea));
  const showingAllIdeas = ideasWithDetectedVotes.length === 0;
  const visibleIdeas = showingAllIdeas ? ideas : ideasWithDetectedVotes;
  const voteTotals = useMemo(() => {
    const totals = {
      totalIdeas: ideas.length,
      totalVisible: visibleIdeas.length,
      upvotes: 0,
      downvotes: 0,
      undecided: 0,
    };

    for (const idea of visibleIdeas) {
      const currentVote = extractCurrentVote(idea);
      if (currentVote === "UP") {
        totals.upvotes += 1;
      } else if (currentVote === "DOWN") {
        totals.downvotes += 1;
      } else {
        totals.undecided += 1;
      }
    }

    return totals;
  }, [ideas.length, visibleIdeas]);

  if (visibleIdeas.length === 0) {
    return <EmptyState title="No ideas available to vote on" />;
  }

  const submitVote = async (idea: Idea, nextVote: VoteType) => {
    const currentVote = extractCurrentVote(idea);
    setFeedback(null);

    try {
      if (currentVote === nextVote) {
        await removeVoteMutation.mutateAsync({ ideaId: idea.id });
        setFeedback({ type: "success", text: "Vote removed." });
        return;
      }

      if (currentVote) {
        await updateVoteMutation.mutateAsync({
          ideaId: idea.id,
          payload: { type: nextVote },
        });
        setFeedback({ type: "success", text: `Vote updated to ${nextVote}.` });
        return;
      }

      await voteIdeaMutation.mutateAsync({
        ideaId: idea.id,
        payload: { type: nextVote },
      });
      setFeedback({ type: "success", text: `${nextVote} vote submitted.` });
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  const removeVote = async (ideaId: string) => {
    setFeedback(null);

    try {
      await removeVoteMutation.mutateAsync({ ideaId });
      setFeedback({ type: "success", text: "Vote removed." });
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  return (
    <section className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 shadow-sm">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_55%)]" />
        <div className="absolute -left-10 top-16 h-36 w-36 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute bottom-0 right-12 h-28 w-28 rounded-full bg-emerald-200/40 blur-3xl" />

        <div className="relative grid gap-6 px-6 py-7 md:px-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] xl:items-end">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 shadow-sm">
              <Sparkles className="size-3.5" />
              Member Workspace
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Votes dashboard with sharper insight and clean actions
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                Review voting history, see how your reactions align with the idea
                pipeline, and adjust signals in one professional workspace.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl bg-white/90"
                onClick={() => {
                  void ideasQuery.refetch();
                }}
                disabled={ideasQuery.isFetching}
              >
                <RefreshCw
                  className={cn(
                    "size-4",
                    ideasQuery.isFetching && "animate-spin",
                  )}
                />
                {ideasQuery.isFetching ? "Refreshing..." : "Refresh votes"}
              </Button>

              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Scope
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {showingAllIdeas ? "All ideas workspace" : "Detected votes"}
                </p>
                <p className="text-xs text-slate-500">
                  {voteTotals.totalVisible} ideas in view
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryCard
              label="Ideas in scope"
              value={voteTotals.totalVisible.toLocaleString()}
              caption={`${voteTotals.totalIdeas.toLocaleString()} total ideas fetched`}
            />
            <SummaryCard
              label="Upvotes"
              value={voteTotals.upvotes.toLocaleString()}
              caption="Signals supporting ideas"
            />
            <SummaryCard
              label="Downvotes"
              value={voteTotals.downvotes.toLocaleString()}
              caption="Signals opposing ideas"
            />
            <SummaryCard
              label="Not voted"
              value={voteTotals.undecided.toLocaleString()}
              caption="Ideas without a detected vote"
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

      {showingAllIdeas ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
          The ideas API does not expose your current vote state, so this page is
          showing all ideas as a voting workspace instead of a filtered "my
          votes" list.
        </div>
      ) : null}

      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Vote Ledger
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              Review and update your vote signals
            </h3>
            <p className="text-sm leading-6 text-slate-600">
              Update your reactions with one-click actions and keep the idea
              catalog aligned with your current preferences.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right shadow-sm">
            <div className="flex items-center justify-end gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              <Filter className="size-3.5" />
              Signal mix
            </div>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {voteTotals.upvotes.toLocaleString()} up •{" "}
              {voteTotals.downvotes.toLocaleString()} down
            </p>
            <p className="text-xs text-slate-500">
              {voteTotals.undecided.toLocaleString()} not voted
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-slate-600">Idea</TableHead>
                <TableHead className="text-slate-600">Current Vote</TableHead>
                <TableHead className="text-slate-600">Status</TableHead>
                <TableHead className="text-slate-600">Totals</TableHead>
                <TableHead className="text-right text-slate-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleIdeas.map((idea) => {
                const currentVote = extractCurrentVote(idea);
                const isVoting =
                  (voteIdeaMutation.isPending &&
                    voteIdeaMutation.variables?.ideaId === idea.id) ||
                  (updateVoteMutation.isPending &&
                    updateVoteMutation.variables?.ideaId === idea.id) ||
                  (removeVoteMutation.isPending &&
                    removeVoteMutation.variables?.ideaId === idea.id);

                return (
                  <TableRow key={idea.id}>
                    <TableCell className="min-w-72">
                      <div className="space-y-1">
                        <p className="font-medium text-slate-950">
                          {getIdeaTitle(idea)}
                        </p>
                        <p className="text-sm text-slate-600">
                          {idea.excerpt ??
                            idea.description ??
                            "No summary available."}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                          currentVote === "UP"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : currentVote === "DOWN"
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-slate-200 bg-slate-50 text-slate-600",
                        )}
                      >
                        {currentVote === "UP" ? (
                          <ThumbsUp className="size-3.5" />
                        ) : currentVote === "DOWN" ? (
                          <ThumbsDown className="size-3.5" />
                        ) : null}
                        {currentVote ?? "Not detected"}
                      </span>
                    </TableCell>
                    <TableCell>{formatLabel(idea.status, "Unknown")}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm text-slate-600">
                        <p>Upvotes: {idea.totalUpvotes ?? 0}</p>
                        <p>Downvotes: {idea.totalDownvotes ?? 0}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          href={`/idea/${idea.id}`}
                          className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                        >
                          View
                        </Link>
                        <Button
                          type="button"
                          variant={currentVote === "UP" ? "default" : "outline"}
                          size="sm"
                          disabled={isVoting}
                          className="rounded-xl"
                          onClick={() => {
                            void submitVote(idea, "UP");
                          }}
                        >
                          Upvote
                        </Button>
                        <Button
                          type="button"
                          variant={currentVote === "DOWN" ? "default" : "outline"}
                          size="sm"
                          disabled={isVoting}
                          className="rounded-xl"
                          onClick={() => {
                            void submitVote(idea, "DOWN");
                          }}
                        >
                          Downvote
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isVoting || !currentVote}
                          className="rounded-xl"
                          onClick={() => {
                            void removeVote(idea.id);
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
      </section>
    </section>
  );
}

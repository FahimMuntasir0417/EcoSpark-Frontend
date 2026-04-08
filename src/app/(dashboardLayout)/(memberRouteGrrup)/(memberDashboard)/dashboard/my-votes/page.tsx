"use client";

import Link from "next/link";
import { useState } from "react";
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
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">My Votes</h2>
        <p className="text-sm text-muted-foreground">
          Review vote metadata returned by the API and cast or update your votes.
        </p>
      </div>

      {feedback ? (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            feedback.type === "success"
              ? "border-green-300 text-green-700"
              : "border-red-300 text-red-700"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}

      {showingAllIdeas ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          The ideas API does not expose your current vote state, so this page is showing all ideas as a voting workspace instead of a filtered "my votes" list.
        </p>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Idea</TableHead>
            <TableHead>Current Vote</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Totals</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleIdeas.map((idea) => {
            const currentVote = extractCurrentVote(idea);
            const isVoting =
              (voteIdeaMutation.isPending && voteIdeaMutation.variables?.ideaId === idea.id) ||
              (updateVoteMutation.isPending && updateVoteMutation.variables?.ideaId === idea.id) ||
              (removeVoteMutation.isPending && removeVoteMutation.variables?.ideaId === idea.id);

            return (
              <TableRow key={idea.id}>
                <TableCell className="min-w-72">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-950">{getIdeaTitle(idea)}</p>
                    <p className="text-sm text-slate-600">
                      {idea.excerpt ?? idea.description ?? "No summary available."}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{currentVote ?? "Not detected"}</TableCell>
                <TableCell>{formatLabel(idea.status, "Unknown")}</TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    <p>Upvotes: {idea.totalUpvotes ?? 0}</p>
                    <p>Downvotes: {idea.totalDownvotes ?? 0}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={`/idea/${idea.id}`}
                      className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                    >
                      View
                    </Link>
                    <Button
                      type="button"
                      variant={currentVote === "UP" ? "default" : "outline"}
                      size="sm"
                      disabled={isVoting}
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
    </section>
  );
}

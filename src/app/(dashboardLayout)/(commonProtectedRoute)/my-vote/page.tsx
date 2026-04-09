"use client";

import { useQuery } from "@tanstack/react-query";
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
import { useRemoveVoteMutation, useUpdateVoteMutation } from "@/features/interaction";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { userService, type UserVote } from "@/services/user.service";

type Feedback = {
  type: "success" | "error";
  text: string;
} | null;

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
  const votesQuery = useQuery({
    queryKey: ["users", "me", "votes"],
    queryFn: ({ signal }) => userService.getMyVotes({ signal, params: { limit: 100 } }),
  });
  const updateVoteMutation = useUpdateVoteMutation();
  const removeVoteMutation = useRemoveVoteMutation();
  const [feedback, setFeedback] = useState<Feedback>(null);

  if (votesQuery.isPending) {
    return (
      <LoadingState
        title="Loading votes"
        description="Fetching the ideas you have already voted on."
      />
    );
  }

  if (votesQuery.isError) {
    return (
      <ErrorState
        title="Could not load votes"
        description={getApiErrorMessage(votesQuery.error)}
        onRetry={() => {
          void votesQuery.refetch();
        }}
      />
    );
  }

  const votes = votesQuery.data?.data ?? [];
  const upvotes = votes.filter((vote) => vote.type === "UP").length;
  const downvotes = votes.filter((vote) => vote.type === "DOWN").length;

  if (votes.length === 0) {
    return (
      <EmptyState
        title="No votes found"
        description="Vote on ideas to see them in your activity list."
      />
    );
  }

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
      await votesQuery.refetch();
      setFeedback({ type: "success", text: "Vote removed." });
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">My Votes</h2>
        <p className="text-sm text-muted-foreground">
          Review your current votes and update them without reopening each idea.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Total Votes
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {votes.length}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
            Upvotes
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-900">
            {upvotes}
          </p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-700">
            Downvotes
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-rose-900">
            {downvotes}
          </p>
        </div>
      </div>

      {feedback ? (
        <div
          className={
            feedback.type === "success"
              ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
              : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          }
        >
          {feedback.text}
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Idea</TableHead>
            <TableHead>Current Vote</TableHead>
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
                    <p className="text-xs text-slate-500">Idea ID: {vote.ideaId}</p>
                    <p className="text-xs text-slate-500">Vote ID: {vote.id}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={
                      vote.type === "UP"
                        ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                        : "inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                    }
                  >
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
                      className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                    >
                      View
                    </Link>
                    <Button
                      type="button"
                      size="sm"
                      variant={vote.type === "UP" ? "default" : "outline"}
                      disabled={isBusy || vote.type === "UP"}
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
    </section>
  );
}


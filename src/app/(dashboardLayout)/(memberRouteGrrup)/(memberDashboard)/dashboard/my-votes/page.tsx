"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
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

      <ul className="space-y-3">
        {visibleIdeas.map((idea) => {
          const currentVote = extractCurrentVote(idea);
          const isVoting =
            (voteIdeaMutation.isPending && voteIdeaMutation.variables?.ideaId === idea.id) ||
            (updateVoteMutation.isPending && updateVoteMutation.variables?.ideaId === idea.id) ||
            (removeVoteMutation.isPending && removeVoteMutation.variables?.ideaId === idea.id);

          return (
            <li key={idea.id} className="rounded-xl border bg-background p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{getIdeaTitle(idea)}</p>
                  <p className="text-sm text-muted-foreground">Current vote: {currentVote ?? "Not detected"}</p>
                  <p className="text-sm text-muted-foreground">Upvotes: {idea.totalUpvotes ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Downvotes: {idea.totalDownvotes ?? 0}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={currentVote === "UP" ? "default" : "outline"}
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
                    disabled={isVoting || !currentVote}
                    onClick={() => {
                      void removeVote(idea.id);
                    }}
                  >
                    Remove Vote
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

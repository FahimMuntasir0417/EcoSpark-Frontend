"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { useIdeasQuery } from "@/features/idea";
import { useDeleteCommentMutation } from "@/features/interaction";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { interactionService } from "@/services/interaction.service";
import type { Comment } from "@/services/interaction.service";
import type { Idea } from "@/services/idea.service";
import { userService } from "@/services/user.service";

type CommentItem = {
  comment: Comment;
  idea: Idea;
};

function getCommentOwnerId(comment: Comment) {
  const record = comment as unknown as Record<string, unknown>;
  const author =
    record.author && typeof record.author === "object"
      ? (record.author as Record<string, unknown>)
      : null;
  const user =
    record.user && typeof record.user === "object"
      ? (record.user as Record<string, unknown>)
      : null;

  return (
    (typeof record.authorId === "string" && record.authorId) ||
    (typeof record.userId === "string" && record.userId) ||
    (author && typeof author.id === "string" && author.id) ||
    (user && typeof user.id === "string" && user.id) ||
    null
  );
}

function getIdeaTitle(idea: Idea) {
  return typeof idea.title === "string" && idea.title.trim()
    ? idea.title
    : "Untitled idea";
}

export default function MyCommentsPage() {
  const meQuery = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => userService.getMe(),
  });
  const ideasQuery = useIdeasQuery();
  const deleteCommentMutation = useDeleteCommentMutation();

  const ideas = ideasQuery.data?.data ?? [];
  const commentQueries = useQueries({
    queries: ideas.map((idea) => ({
      queryKey: ["interaction", "idea", idea.id, "comments"],
      queryFn: () => interactionService.getIdeaComments(idea.id),
      enabled: Boolean(idea.id),
    })),
  });

  const commentsPending = ideas.length > 0 && commentQueries.some((query) => query.isPending);
  const commentsError = commentQueries.find((query) => query.isError)?.error;

  if (meQuery.isPending || ideasQuery.isPending || commentsPending) {
    return (
      <LoadingState
        title="Loading comments"
        description="Fetching your comments across all available ideas."
      />
    );
  }

  if (meQuery.isError || ideasQuery.isError || commentsError) {
    return (
      <ErrorState
        title="Could not load comments"
        description={getApiErrorMessage(meQuery.error ?? ideasQuery.error ?? commentsError)}
        onRetry={() => {
          void meQuery.refetch();
          void ideasQuery.refetch();
          commentQueries.forEach((query) => {
            void query.refetch();
          });
        }}
      />
    );
  }

  const userId = meQuery.data?.data?.id ?? "";
  const allComments: CommentItem[] = commentQueries.flatMap((query, index) => {
    const idea = ideas[index];
    const comments = query.data?.data ?? [];

    return comments.map((comment) => ({ comment, idea }));
  });
  const identityMetadataMissing =
    allComments.length > 0 &&
    allComments.every((item) => !getCommentOwnerId(item.comment));
  const myComments = allComments.filter(
    (item) => getCommentOwnerId(item.comment) && getCommentOwnerId(item.comment) === userId,
  );

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">My Comments</h2>
        <p className="text-sm text-muted-foreground">
          Review and remove comments associated with your current user account.
        </p>
      </div>

      {identityMetadataMissing ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          The comments API response does not expose comment owner metadata, so this page cannot reliably match comments back to your account.
        </p>
      ) : null}

      {myComments.length === 0 ? (
        <EmptyState title="No comments found for your account" />
      ) : (
        <ul className="space-y-3">
          {myComments.map(({ comment, idea }) => {
            const isDeleting =
              deleteCommentMutation.isPending &&
              deleteCommentMutation.variables?.id === comment.id;

            return (
              <li key={comment.id} className="rounded-xl border bg-background p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{getIdeaTitle(idea)}</p>
                    <p className="text-sm text-muted-foreground">Comment ID: {comment.id}</p>
                    <p className="text-sm">{comment.content}</p>
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isDeleting}
                    onClick={() => {
                      const confirmed = window.confirm("Delete this comment?");

                      if (!confirmed) {
                        return;
                      }

                      deleteCommentMutation.mutate({ id: comment.id });
                    }}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}


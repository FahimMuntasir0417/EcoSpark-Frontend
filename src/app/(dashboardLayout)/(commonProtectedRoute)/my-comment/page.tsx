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
import { useDeleteCommentMutation, useUpdateCommentMutation } from "@/features/interaction";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { userService, type UserComment } from "@/services/user.service";

type Feedback = {
  type: "success" | "error";
  text: string;
} | null;

function getIdeaTitle(comment: UserComment) {
  const title = comment.idea?.title;
  return typeof title === "string" && title.trim() ? title : "Untitled idea";
}

function getCommentContext(comment: UserComment) {
  if (!comment.parentId) {
    return "Top-level comment";
  }

  const parentContent = comment.parent?.content;

  if (typeof parentContent === "string" && parentContent.trim()) {
    return `Reply to: ${parentContent}`;
  }

  return "Reply comment";
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

export default function MyCommentPage() {
  const commentsQuery = useQuery({
    queryKey: ["users", "me", "comments"],
    queryFn: ({ signal }) => userService.getMyComments({ signal, params: { limit: 100 } }),
  });
  const updateCommentMutation = useUpdateCommentMutation();
  const deleteCommentMutation = useDeleteCommentMutation();
  const [feedback, setFeedback] = useState<Feedback>(null);

  if (commentsQuery.isPending) {
    return (
      <LoadingState
        title="Loading comments"
        description="Fetching comments linked to your account."
      />
    );
  }

  if (commentsQuery.isError) {
    return (
      <ErrorState
        title="Could not load comments"
        description={getApiErrorMessage(commentsQuery.error)}
        onRetry={() => {
          void commentsQuery.refetch();
        }}
      />
    );
  }

  const comments = commentsQuery.data?.data ?? [];

  if (comments.length === 0) {
    return (
      <EmptyState
        title="No comments found"
        description="Comment on an idea to see it listed here."
      />
    );
  }

  const handleEditComment = async (comment: UserComment) => {
    const nextContent = window.prompt("Update your comment", comment.content);

    if (typeof nextContent !== "string") {
      return;
    }

    const trimmedContent = nextContent.trim();

    if (!trimmedContent || trimmedContent === comment.content) {
      return;
    }

    setFeedback(null);

    try {
      await updateCommentMutation.mutateAsync({
        id: comment.id,
        payload: { content: trimmedContent },
      });
      await commentsQuery.refetch();
      setFeedback({ type: "success", text: "Comment updated." });
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  const handleDeleteComment = async (comment: UserComment) => {
    const confirmed = window.confirm("Delete this comment?");

    if (!confirmed) {
      return;
    }

    setFeedback(null);

    try {
      await deleteCommentMutation.mutateAsync({ id: comment.id });
      await commentsQuery.refetch();
      setFeedback({ type: "success", text: "Comment deleted." });
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">My Comments</h2>
        <p className="text-sm text-muted-foreground">
          Review, update, or delete comments from one place.
        </p>
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
            <TableHead>Comment</TableHead>
            <TableHead>Context</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comments.map((comment) => {
            const isBusy =
              (updateCommentMutation.isPending &&
                updateCommentMutation.variables?.id === comment.id) ||
              (deleteCommentMutation.isPending &&
                deleteCommentMutation.variables?.id === comment.id);

            return (
              <TableRow key={comment.id}>
                <TableCell className="min-w-64">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-950">{getIdeaTitle(comment)}</p>
                    <p className="text-xs text-slate-500">Idea ID: {comment.ideaId ?? "N/A"}</p>
                  </div>
                </TableCell>
                <TableCell className="min-w-80">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-700">{comment.content}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>Comment ID: {comment.id}</span>
                      {comment.isEdited ? (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
                          Edited
                        </span>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs text-sm text-slate-600">
                  {getCommentContext(comment)}
                </TableCell>
                <TableCell>{formatTimestamp(comment.updatedAt ?? comment.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    {comment.ideaId ? (
                      <Link
                        href={`/idea/${comment.ideaId}`}
                        className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                      >
                        View
                      </Link>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isBusy}
                      onClick={() => {
                        void handleEditComment(comment);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={isBusy}
                      onClick={() => {
                        void handleDeleteComment(comment);
                      }}
                    >
                      Delete
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


"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  MessageSquareMore,
  PencilLine,
  RefreshCw,
  Reply,
  Sparkles,
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
import { useDeleteCommentMutation, useUpdateCommentMutation } from "@/features/interaction";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import { userService, type UserComment } from "@/services/user.service";

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
  tone: "sky" | "amber" | "emerald" | "slate";
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
            tone === "sky" && "border-sky-200 bg-sky-50 text-sky-700",
            tone === "amber" && "border-amber-200 bg-amber-50 text-amber-700",
            tone === "emerald" && "border-emerald-200 bg-emerald-50 text-emerald-700",
            tone === "slate" && "border-slate-200 bg-slate-50 text-slate-700",
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

function getIdeaTitle(comment: UserComment) {
  const title = comment.idea?.title;
  return typeof title === "string" && title.trim() ? title : "Untitled idea";
}

function getCommentContext(comment: UserComment) {
  if (!comment.parentId) {
    return "Top-level comment";
  }

  const parentContent = comment.parent?.content;

  if (typeof parentContent !== "string" || !parentContent.trim()) {
    return "Reply comment";
  }

  return `Reply to: ${parentContent}`;
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
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [editingComment, setEditingComment] = useState<UserComment | null>(null);
  const [draftContent, setDraftContent] = useState("");

  const commentsQuery = useQuery({
    queryKey: ["users", "me", "comments", { page, limit: PAGE_SIZE }],
    queryFn: ({ signal }) =>
      userService.getMyComments({
        signal,
        params: {
          page,
          limit: PAGE_SIZE,
        },
      }),
    placeholderData: (previousData) => previousData,
  });
  const updateCommentMutation = useUpdateCommentMutation();
  const deleteCommentMutation = useDeleteCommentMutation();

  if (commentsQuery.isPending && !commentsQuery.data) {
    return (
      <LoadingState
        title="Loading comment history"
        description="Preparing your discussion activity workspace."
      />
    );
  }

  if (commentsQuery.isError && !commentsQuery.data) {
    return (
      <ErrorState
        title="Could not load comment history"
        description={getApiErrorMessage(commentsQuery.error)}
        onRetry={() => {
          void commentsQuery.refetch();
        }}
      />
    );
  }

  const comments = commentsQuery.data?.data ?? [];
  const meta = commentsQuery.data?.meta;
  const visiblePage = meta?.page ?? page;
  const totalPages = Math.max(meta?.totalPage ?? meta?.totalPages ?? 1, 1);
  const totalComments = meta?.total ?? comments.length;
  const visibleCount = comments.length;
  const editedCount = comments.filter((comment) => comment.isEdited).length;
  const repliesCount = comments.filter((comment) => Boolean(comment.parentId)).length;
  const firstVisibleItem = totalComments === 0 ? 0 : (visiblePage - 1) * PAGE_SIZE + 1;
  const lastVisibleItem = Math.min(visiblePage * PAGE_SIZE, totalComments);
  const paginationEntries = buildPaginationEntries(visiblePage, totalPages);
  const isSavingEdit = updateCommentMutation.isPending;
  const isEditUnchanged =
    !editingComment || draftContent.trim() === editingComment.content.trim();

  const handlePageChange = (nextPage: number) => {
    if (
      nextPage === page ||
      nextPage < 1 ||
      nextPage > totalPages ||
      commentsQuery.isFetching
    ) {
      return;
    }

    setEditingComment(null);
    setDraftContent("");
    setFeedback(null);
    setPage(nextPage);
  };

  const handleStartEdit = (comment: UserComment) => {
    setEditingComment(comment);
    setDraftContent(comment.content);
    setFeedback(null);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setDraftContent("");
  };

  const handleSaveEdit = async () => {
    if (!editingComment) {
      return;
    }

    const trimmedContent = draftContent.trim();

    if (!trimmedContent || trimmedContent === editingComment.content.trim()) {
      return;
    }

    setFeedback(null);

    try {
      await updateCommentMutation.mutateAsync({
        id: editingComment.id,
        payload: { content: trimmedContent },
      });
      setEditingComment(null);
      setDraftContent("");
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

      if (editingComment?.id === comment.id) {
        setEditingComment(null);
        setDraftContent("");
      }

      if (comments.length === 1 && visiblePage > 1) {
        setPage(visiblePage - 1);
      } else {
        await commentsQuery.refetch();
      }

      setFeedback({ type: "success", text: "Comment deleted." });
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  return (
    <section className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-amber-50 via-white to-sky-50 shadow-sm">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.18),_transparent_55%)]" />
        <div className="absolute -left-10 top-14 h-36 w-36 rounded-full bg-amber-200/35 blur-3xl" />
        <div className="absolute bottom-0 right-12 h-28 w-28 rounded-full bg-sky-200/40 blur-3xl" />

        <div className="relative grid gap-6 px-6 py-7 md:px-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] xl:items-end">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-amber-700 shadow-sm">
                <Sparkles className="size-3.5" />
                Member Activity
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 shadow-sm">
                <MessageSquareMore className="size-3.5" />
                Page {visiblePage} of {totalPages}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Comment history designed for quick review and cleaner editing
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                Track the conversations you joined, update your wording when
                needed, and keep discussion history organized in one member view.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl bg-white/90"
                onClick={() => {
                  void commentsQuery.refetch();
                }}
                disabled={commentsQuery.isFetching}
              >
                <RefreshCw
                  className={cn(
                    "size-4",
                    commentsQuery.isFetching && "animate-spin",
                  )}
                />
                {commentsQuery.isFetching ? "Refreshing..." : "Refresh comments"}
              </Button>

              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Visible range
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {firstVisibleItem} to {lastVisibleItem} of {totalComments}
                </p>
                <p className="text-xs text-slate-500">
                  {PAGE_SIZE} results per page
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryCard
              icon={MessageSquareMore}
              label="Total Comments"
              value={totalComments.toLocaleString()}
              caption="Discussion items tied to your account"
              tone="slate"
            />
            <SummaryCard
              icon={Sparkles}
              label="Current Page"
              value={visibleCount.toLocaleString()}
              caption="Comments visible in this view"
              tone="sky"
            />
            <SummaryCard
              icon={PencilLine}
              label="Edited"
              value={editedCount.toLocaleString()}
              caption="Edited comments on this page"
              tone="amber"
            />
            <SummaryCard
              icon={Reply}
              label="Replies"
              value={repliesCount.toLocaleString()}
              caption="Reply threads on this page"
              tone="emerald"
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

      {editingComment ? (
        <section className="rounded-[24px] border border-sky-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
                Editing Comment
              </p>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                Refine your message before saving it back to the thread
              </h3>
              <p className="text-sm leading-6 text-slate-600">
                This updates the selected comment directly in your activity history.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 shadow-sm">
              Editing ID: <span className="font-mono text-xs">{editingComment.id}</span>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <textarea
              value={draftContent}
              onChange={(event) => {
                setDraftContent(event.target.value);
              }}
              placeholder="Write your updated comment"
              className="min-h-36 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
            />

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={handleCancelEdit}
                disabled={isSavingEdit}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="rounded-xl"
                onClick={() => {
                  void handleSaveEdit();
                }}
                disabled={
                  isSavingEdit ||
                  !draftContent.trim() ||
                  isEditUnchanged
                }
              >
                {isSavingEdit ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {totalComments === 0 ? (
        <EmptyState
          title="No comments found"
          description="Comment on an idea to start building your discussion history."
        />
      ) : (
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Comment Ledger
              </p>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                Review, edit, and clean up your discussion activity
              </h3>
              <p className="text-sm leading-6 text-slate-600">
                Use this workspace to manage top-level comments and replies from
                one organized member dashboard.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Live status
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {commentsQuery.isFetching ? "Synchronizing activity" : "Everything is up to date"}
              </p>
              <p className="text-xs text-slate-500">
                Edits and deletes refresh this list automatically
              </p>
            </div>
          </div>

          <div className="mt-6">
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
                          <p className="text-sm text-slate-600">
                            Idea ID: <span className="font-mono text-xs">{comment.ideaId ?? "N/A"}</span>
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-80">
                        <div className="space-y-2">
                          <p className="text-sm leading-6 text-slate-700">{comment.content}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>
                              Comment ID: <span className="font-mono">{comment.id}</span>
                            </span>
                            {comment.isEdited ? (
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                                Edited
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs text-sm leading-6 text-slate-600">
                        {getCommentContext(comment)}
                      </TableCell>
                      <TableCell>{formatTimestamp(comment.updatedAt ?? comment.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {comment.ideaId ? (
                            <Link
                              href={`/idea/${comment.ideaId}`}
                              className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                            >
                              View
                              <ArrowUpRight className="size-3.5" />
                            </Link>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            className="rounded-xl"
                            onClick={() => {
                              handleStartEdit(comment);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={isBusy}
                            className="rounded-xl"
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
          </div>

          {totalPages > 1 ? (
            <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-5 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm text-slate-600">
                Showing <span className="font-medium text-slate-900">{firstVisibleItem}</span>
                {" "}to <span className="font-medium text-slate-900">{lastVisibleItem}</span>
                {" "}of <span className="font-medium text-slate-900">{totalComments}</span> comments
              </p>

              <Pagination className="mx-0 w-auto justify-start lg:justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      className={cn(
                        (visiblePage === 1 || commentsQuery.isFetching) &&
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
                          className={cn(commentsQuery.isFetching && "pointer-events-none")}
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
                        (visiblePage === totalPages || commentsQuery.isFetching) &&
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

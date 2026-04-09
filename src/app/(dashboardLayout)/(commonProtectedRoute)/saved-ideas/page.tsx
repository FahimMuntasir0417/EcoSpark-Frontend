"use client";

import Link from "next/link";
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
import { useMyBookmarksQuery, useRemoveBookmarkMutation } from "@/features/interaction";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import type { Bookmark } from "@/services/interaction.service";
import type { Idea } from "@/services/idea.service";

function getIdeaTitle(idea?: Idea) {
  if (!idea) {
    return "Saved idea";
  }

  return typeof idea.title === "string" && idea.title.trim()
    ? idea.title
    : "Untitled idea";
}

function getBookmarkIdeaId(bookmark: Bookmark) {
  return typeof bookmark.ideaId === "string" ? bookmark.ideaId : "";
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

export default function SavedIdeasPage() {
  const bookmarksQuery = useMyBookmarksQuery();
  const ideasQuery = useIdeasQuery();
  const removeBookmarkMutation = useRemoveBookmarkMutation();

  if (bookmarksQuery.isPending || ideasQuery.isPending) {
    return (
      <LoadingState
        title="Loading saved ideas"
        description="Fetching your bookmarks and related idea details."
      />
    );
  }

  if (bookmarksQuery.isError || ideasQuery.isError) {
    return (
      <ErrorState
        title="Could not load saved ideas"
        description={getApiErrorMessage(bookmarksQuery.error ?? ideasQuery.error)}
        onRetry={() => {
          void bookmarksQuery.refetch();
          void ideasQuery.refetch();
        }}
      />
    );
  }

  const bookmarks = bookmarksQuery.data?.data ?? [];
  const ideas = ideasQuery.data?.data ?? [];
  const ideaMap = new Map(ideas.map((idea) => [idea.id, idea]));

  if (bookmarks.length === 0) {
    return <EmptyState title="No saved ideas yet" description="Bookmark ideas to see them here." />;
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Saved Ideas</h2>
        <p className="text-sm text-muted-foreground">
          Review the ideas you have bookmarked and remove any you no longer need.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Idea</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Idea ID</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookmarks.map((bookmark) => {
            const ideaId = getBookmarkIdeaId(bookmark);
            const idea = ideaMap.get(ideaId);
            const isRemoving =
              removeBookmarkMutation.isPending &&
              removeBookmarkMutation.variables?.ideaId === ideaId;

            return (
              <TableRow key={bookmark.id}>
                <TableCell className="min-w-72">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-950">{getIdeaTitle(idea)}</p>
                    <p className="text-sm text-slate-600">
                      {idea?.excerpt ?? idea?.description ?? "No summary available."}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{formatLabel(idea?.status, "Unknown")}</TableCell>
                <TableCell>{idea?.category?.name ?? "Uncategorized"}</TableCell>
                <TableCell className="font-mono text-xs">{ideaId || "N/A"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {ideaId ? (
                      <Link
                        href={`/idea/${ideaId}`}
                        className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                      >
                        View
                      </Link>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isRemoving || !ideaId}
                      onClick={() => {
                        removeBookmarkMutation.mutate({ ideaId });
                      }}
                    >
                      {isRemoving ? "Removing..." : "Remove"}
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

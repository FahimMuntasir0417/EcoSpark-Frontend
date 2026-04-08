"use client";

import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
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

      <ul className="space-y-3">
        {bookmarks.map((bookmark) => {
          const ideaId = getBookmarkIdeaId(bookmark);
          const idea = ideaMap.get(ideaId);
          const isRemoving =
            removeBookmarkMutation.isPending &&
            removeBookmarkMutation.variables?.ideaId === ideaId;

          return (
            <li key={bookmark.id} className="rounded-xl border bg-background p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{getIdeaTitle(idea)}</p>
                  <p className="text-sm text-muted-foreground">Idea ID: {ideaId || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">
                    Status: {idea?.status ?? "Unknown"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Category: {idea?.category?.name ?? "Uncategorized"}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  disabled={isRemoving || !ideaId}
                  onClick={() => {
                    removeBookmarkMutation.mutate({ ideaId });
                  }}
                >
                  {isRemoving ? "Removing..." : "Remove bookmark"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}


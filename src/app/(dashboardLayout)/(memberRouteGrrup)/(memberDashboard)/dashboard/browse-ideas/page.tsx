"use client";

import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { useIdeasQuery } from "@/features/idea";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import type { Idea } from "@/services/idea.service";

function getIdeaTitle(idea: Idea) {
  return typeof idea.title === "string" && idea.title.trim()
    ? idea.title
    : "Untitled idea";
}

function getIdeaSummary(idea: Idea) {
  if (typeof idea.excerpt === "string" && idea.excerpt.trim()) {
    return idea.excerpt;
  }

  if (typeof idea.description === "string" && idea.description.trim()) {
    return idea.description;
  }

  return "No description available.";
}

function getIdeaStatus(idea: Idea) {
  return typeof idea.status === "string" && idea.status.trim()
    ? idea.status
    : "DRAFT";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "N/A";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }

  return parsed.toLocaleString();
}

export default function BrowseIdeasPage() {
  const ideasQuery = useIdeasQuery();

  if (ideasQuery.isPending) {
    return (
      <LoadingState
        title="Loading ideas"
        description="Fetching the latest ideas available to members."
      />
    );
  }

  if (ideasQuery.isError) {
    return (
      <ErrorState
        title="Could not load ideas"
        description={getApiErrorMessage(ideasQuery.error)}
        onRetry={() => {
          void ideasQuery.refetch();
        }}
      />
    );
  }

  const ideas = ideasQuery.data?.data ?? [];
  const meta = ideasQuery.data?.meta;
  const totalPages = meta?.totalPages ?? meta?.totalPage ?? 1;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Browse Ideas</h2>
        <p className="text-sm text-muted-foreground">{ideasQuery.data?.message}</p>
        {meta ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Page {meta.page} of {totalPages} - Showing {ideas.length} of {meta.total}
          </p>
        ) : null}
      </div>

      {ideas.length === 0 ? (
        <EmptyState title="No ideas found" />
      ) : (
        <ul className="space-y-3">
          {ideas.map((idea) => (
            <li key={idea.id} className="rounded-md border p-4">
              <p className="font-medium">{getIdeaTitle(idea)}</p>
              <p className="text-sm text-muted-foreground">Slug: {idea.slug}</p>
              <p className="text-sm text-muted-foreground">
                Status: {getIdeaStatus(idea)}
              </p>
              <p className="mt-2 text-sm">{getIdeaSummary(idea)}</p>

              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p>Author: {idea.author?.name ?? "Unknown"}</p>
                <p>Category: {idea.category?.name ?? "Uncategorized"}</p>
                <p>Updated: {formatDate(idea.updatedAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

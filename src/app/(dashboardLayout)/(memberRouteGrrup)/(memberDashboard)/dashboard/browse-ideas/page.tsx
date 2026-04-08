"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
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
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
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

function MetricBadge({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Idea</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Metrics</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ideas.map((idea) => (
              <TableRow key={idea.id}>
                <TableCell className="min-w-72">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-950">{getIdeaTitle(idea)}</p>
                    <p className="text-xs text-slate-500">Slug: {idea.slug}</p>
                    <p className="max-w-xl text-sm text-slate-600">{getIdeaSummary(idea)}</p>
                    <p className="text-xs text-slate-500">Author: {idea.author?.name ?? "Unknown"}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <MetricBadge>{formatLabel(getIdeaStatus(idea), "Draft")}</MetricBadge>
                </TableCell>
                <TableCell>{idea.category?.name ?? "Uncategorized"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <MetricBadge>{idea.totalUpvotes ?? 0} upvotes</MetricBadge>
                    <MetricBadge>{idea.totalComments ?? 0} comments</MetricBadge>
                    <MetricBadge>{formatLabel(idea.accessType, "Unknown")}</MetricBadge>
                  </div>
                </TableCell>
                <TableCell>{formatDate(idea.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/idea/${idea.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    View Idea
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}

"use client";

import {
  ArrowRight,
  Bookmark,
  Eye,
  Leaf,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AiIdea } from "@/services/ai.service";

type AiIdeaCardProps = {
  idea: AiIdea;
  compact?: boolean;
};

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function getIdeaTitle(idea: AiIdea) {
  return hasText(idea.title) ? idea.title!.trim() : "Untitled idea";
}

function getIdeaSummary(idea: AiIdea) {
  if (hasText(idea.excerpt)) {
    return idea.excerpt!.trim();
  }

  if (hasText(idea.description)) {
    return idea.description!.trim();
  }

  return "No summary has been added for this idea yet.";
}

function formatMetric(value?: number | string | null) {
  const numericValue =
    typeof value === "string" ? Number.parseFloat(value) : value;

  if (typeof numericValue !== "number" || !Number.isFinite(numericValue)) {
    return "0";
  }

  return numericValue.toLocaleString();
}

function formatScore(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "AI ranked";
  }

  return `${Math.round(value)}% match`;
}

function getBadgeLabel(value?: string | null) {
  if (!hasText(value)) {
    return "Idea";
  }

  return value!
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AiIdeaCard({ idea, compact = false }: AiIdeaCardProps) {
  const summary = getIdeaSummary(idea);
  const categoryLabel = idea.category?.name ?? idea.category?.slug ?? "Eco idea";

  return (
    <article className="surface-card grid overflow-hidden">
      <div
        className={cn(
          "grid gap-0",
          compact ? "lg:grid-cols-[12rem_minmax(0,1fr)]" : "lg:grid-cols-[16rem_minmax(0,1fr)]",
        )}
      >
        <div className="relative min-h-48 overflow-hidden bg-primary/10">
          {hasText(idea.coverImageUrl) ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${idea.coverImageUrl})` }}
            />
          ) : (
            <div className="flex h-full min-h-48 items-center justify-center bg-[linear-gradient(135deg,rgba(22,101,52,0.15),rgba(14,165,233,0.14))]">
              <Leaf className="size-12 text-primary" />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-foreground/80 p-4 text-background">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-background/70">
              {categoryLabel}
            </p>
            <p className="mt-1 text-sm font-semibold">{formatScore(idea.aiScore)}</p>
          </div>
        </div>

        <div className="grid gap-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" />
              Recommended
            </span>
            <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {getBadgeLabel(idea.accessType)}
            </span>
            <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {getBadgeLabel(idea.status)}
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold leading-snug text-foreground">
              {getIdeaTitle(idea)}
            </h3>
            <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
              {summary}
            </p>
          </div>

          {hasText(idea.reason) ? (
            <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm leading-6 text-sky-800">
              {idea.reason}
            </p>
          ) : null}

          <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-2">
              <Eye className="size-4" />
              {formatMetric(idea.totalViews)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-2">
              <ThumbsUp className="size-4" />
              {formatMetric(idea.totalUpvotes)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-2">
              <Bookmark className="size-4" />
              {formatMetric(idea.totalBookmarks)}
            </span>
          </div>

          <Link
            href={`/idea/${idea.id}`}
            className="inline-flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Open idea
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

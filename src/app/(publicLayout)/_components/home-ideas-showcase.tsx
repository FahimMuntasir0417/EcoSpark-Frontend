"use client";

import * as React from "react";
import { ArrowRight, Layers3, Leaf, Sparkles } from "lucide-react";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { useIdeasQuery } from "@/features/idea";
import type { Idea } from "@/services/idea.service";

function hasText(value?: string | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getIdeaTitle(idea: Idea) {
  return hasText(idea.title) ? idea.title.trim() : "Untitled idea";
}

function getIdeaSummary(idea: Idea) {
  if (hasText(idea.excerpt)) {
    return idea.excerpt.trim();
  }

  if (hasText(idea.description)) {
    return idea.description.trim();
  }

  return "Summary unavailable for this idea.";
}

function getIdeaCategory(idea: Idea) {
  const name = idea.category?.name;
  return hasText(name) ? name.trim() : "Uncategorized";
}

function formatLabel(value?: string | null, fallback = "Unspecified") {
  if (!hasText(value)) {
    return fallback;
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatMetric(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "N/A";
  }

  return value.toLocaleString();
}

function formatDate(value?: string | null) {
  if (!hasText(value)) {
    return "Recently added";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Recently added";
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPrice(idea: Idea) {
  if (idea.accessType?.toUpperCase() === "FREE") {
    return "Free";
  }

  if (idea.price === null || idea.price === undefined || idea.price === "") {
    return "Contact for pricing";
  }

  const amount =
    typeof idea.price === "number"
      ? idea.price
      : Number.parseFloat(String(idea.price));

  if (!Number.isFinite(amount)) {
    return String(idea.price);
  }

  const normalizedCurrency = idea.currency?.trim().toUpperCase();
  const currency =
    normalizedCurrency && /^[A-Z]{3}$/.test(normalizedCurrency)
      ? normalizedCurrency
      : "USD";

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

function sortIdeas(ideas: Idea[]) {
  return [...ideas].sort((left, right) => {
    const featuredDifference =
      Number(Boolean(right.isFeatured)) - Number(Boolean(left.isFeatured));

    if (featuredDifference !== 0) {
      return featuredDifference;
    }

    const leftTimestamp = new Date(
      left.updatedAt ?? left.createdAt ?? 0,
    ).getTime();
    const rightTimestamp = new Date(
      right.updatedAt ?? right.createdAt ?? 0,
    ).getTime();

    return rightTimestamp - leftTimestamp;
  });
}

export function HomeIdeasShowcase() {
  const ideasQuery = useIdeasQuery();
  const ideas = React.useMemo(
    () => sortIdeas(ideasQuery.data?.data ?? []),
    [ideasQuery.data?.data],
  );
  const featuredCount = React.useMemo(
    () => ideas.filter((idea) => Boolean(idea.isFeatured)).length,
    [ideas],
  );
  const categoryCount = React.useMemo(
    () => new Set(ideas.map((idea) => getIdeaCategory(idea))).size,
    [ideas],
  );
  const freeIdeasCount = React.useMemo(
    () =>
      ideas.filter((idea) => idea.accessType?.toUpperCase() === "FREE").length,
    [ideas],
  );

  if (ideasQuery.isPending) {
    return (
      <section className="surface-card p-6 lg:p-8">
        <p className="section-kicker">Live Ideas</p>
        <h2 className="section-title mt-2">Loading the public idea catalog.</h2>
        <div className="mt-6 surface-muted p-5">
          <LoadingState
            rows={4}
            title="Loading live ideas"
            description="Fetching the public idea catalog for the homepage showcase."
          />
        </div>
      </section>
    );
  }

  if (ideasQuery.isError) {
    return (
      <section className="surface-card p-6 lg:p-8">
        <p className="section-kicker">Live Ideas</p>
        <h2 className="section-title mt-2">Browse live sustainability ideas.</h2>
        <div className="mt-6 surface-muted p-5">
          <ErrorState
            title="Could not load ideas"
            description="The homepage showcase could not fetch the public idea catalog."
            onRetry={() => {
              void ideasQuery.refetch();
            }}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="surface-card p-6 lg:p-8">
      <div className="grid gap-5 border-b border-border pb-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div>
          <span className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="size-4" />
            Live Ideas
          </span>
          <h2 className="section-title mt-3">Browse live sustainability ideas.</h2>
          <p className="section-copy mt-2">
            The carousel uses the same public idea service as the idea catalog,
            sorted by featured status and recent activity.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <span className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
            <Layers3 className="size-4 text-primary" />
            <span className="font-semibold">{ideas.length.toLocaleString()}</span>
            ideas
          </span>
          <span className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
            <Sparkles className="size-4 text-primary" />
            <span className="font-semibold">
              {featuredCount.toLocaleString()}
            </span>
            featured
          </span>
          <span className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
            <Leaf className="size-4 text-primary" />
            <span className="font-semibold">
              {categoryCount.toLocaleString()}
            </span>
            categories
            <span className="text-muted-foreground">/</span>
            {freeIdeasCount.toLocaleString()} free
          </span>
        </div>
      </div>

      {ideas.length === 0 ? (
        <div className="mt-6 surface-muted p-5">
          <EmptyState
            title="No ideas available"
            description="The public idea catalog is empty right now."
          />
        </div>
      ) : (
        <Carousel className="mt-6 w-full pt-14">
          <CarouselContent className="-ml-3 pb-2">
            {ideas.map((idea) => (
              <CarouselItem
                key={idea.id}
                className="basis-[88%] pl-3 sm:basis-[30rem] xl:basis-[26rem]"
              >
                <article className="surface-card flex h-full flex-col p-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md border border-border bg-muted px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {getIdeaCategory(idea)}
                    </span>
                    <span className="rounded-md border border-border bg-secondary px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-secondary-foreground">
                      {idea.isFeatured ? "Featured" : formatLabel(idea.accessType)}
                    </span>
                  </div>

                  <div className="mt-4 flex-1">
                    <h3 className="text-2xl font-semibold leading-tight tracking-tight">
                      {getIdeaTitle(idea)}
                    </h3>
                    <p className="mt-3 line-clamp-4 text-sm leading-7 text-muted-foreground">
                      {getIdeaSummary(idea)}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="surface-muted p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Impact
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {formatMetric(idea.impactScore)}
                      </p>
                    </div>
                    <div className="surface-muted p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Eco
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {formatMetric(idea.ecoScore)}
                      </p>
                    </div>
                    <div className="surface-muted p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Price
                      </p>
                      <p className="mt-2 text-lg font-semibold">
                        {formatPrice(idea)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <span className="text-xs text-muted-foreground">
                      Updated {formatDate(idea.updatedAt)}
                    </span>
                    <Link
                      href={`/idea/${idea.id}`}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Review idea
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </article>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-auto right-12 top-0 size-9 translate-y-0" />
          <CarouselNext className="right-0 top-0 size-9 translate-y-0" />
        </Carousel>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-muted p-4">
        <div>
          <p className="text-sm font-semibold">Open the complete idea library</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the full catalog route for search, filtering, and detail pages.
          </p>
        </div>
        <Link
          href="/idea"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Open library
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

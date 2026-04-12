"use client";

import * as React from "react";
import { ArrowRight, Layers3, Leaf, Sparkles } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { useIdeasQuery } from "@/features/idea";
import { cn } from "@/lib/utils";
import type { Idea } from "@/services/idea.service";

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function getIdeaTitle(idea: Idea) {
  return hasText(idea.title) ? idea.title!.trim() : "Untitled idea";
}

function getIdeaSummary(idea: Idea) {
  if (hasText(idea.excerpt)) {
    return idea.excerpt!.trim();
  }

  if (hasText(idea.description)) {
    return idea.description!.trim();
  }

  return "No summary has been added for this idea yet.";
}

function getIdeaCategory(idea: Idea) {
  const name = idea.category?.name;
  return hasText(name) ? name!.trim() : "Uncategorized";
}

function formatLabel(value?: string | null, fallback = "Unspecified") {
  if (!hasText(value)) {
    return fallback;
  }

  return value!
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAudience(value?: string | null) {
  return hasText(value) ? value!.trim() : "General";
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

  const parsed = new Date(value!);

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
    typeof idea.price === "number" ? idea.price : Number.parseFloat(String(idea.price));

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

    const leftTimestamp = new Date(left.updatedAt ?? left.createdAt ?? 0).getTime();
    const rightTimestamp = new Date(right.updatedAt ?? right.createdAt ?? 0).getTime();

    return rightTimestamp - leftTimestamp;
  });
}

function getIdeaTheme(idea: Idea) {
  if (idea.isFeatured) {
    return {
      ribbon: "from-emerald-400 via-cyan-400 to-sky-500",
      halo: "bg-emerald-300/25",
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      stat: "border-emerald-100 bg-emerald-50/80",
    };
  }

  if (idea.accessType?.toUpperCase() === "PAID") {
    return {
      ribbon: "from-amber-300 via-orange-300 to-rose-300",
      halo: "bg-amber-300/20",
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      stat: "border-amber-100 bg-amber-50/80",
    };
  }

  return {
    ribbon: "from-sky-400 via-cyan-400 to-teal-400",
    halo: "bg-sky-300/20",
    badge: "border-sky-200 bg-sky-50 text-sky-700",
    stat: "border-sky-100 bg-sky-50/80",
  };
}

export function HomeIdeasShowcase() {
  const ideasQuery = useIdeasQuery();
  const ideas = React.useMemo(
    () => sortIdeas(ideasQuery.data?.data ?? []),
    [ideasQuery.data?.data],
  );
  const showcasedIdeas = ideas;
  const featuredCount = React.useMemo(
    () => ideas.filter((idea) => Boolean(idea.isFeatured)).length,
    [ideas],
  );
  const categoryCount = React.useMemo(
    () => new Set(ideas.map((idea) => getIdeaCategory(idea))).size,
    [ideas],
  );
  const freeIdeasCount = React.useMemo(
    () => ideas.filter((idea) => idea.accessType?.toUpperCase() === "FREE").length,
    [ideas],
  );

  if (ideasQuery.isPending) {
    return (
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(145deg,#f8fbff_0%,#ffffff_45%,#ecfeff_100%)] p-6 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.4)] sm:p-8">
        <div className="space-y-2">
          <p className="section-kicker">Idea Showcase</p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Browse ideas in a live carousel.
          </h2>
        </div>
        <div className="mt-5 rounded-[1.7rem] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.35)] backdrop-blur">
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
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(145deg,#f8fbff_0%,#ffffff_45%,#ecfeff_100%)] p-6 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.4)] sm:p-8">
        <div className="space-y-2">
          <p className="section-kicker">Idea Showcase</p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Browse ideas in a live carousel.
          </h2>
        </div>
        <div className="mt-5 rounded-[1.7rem] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.35)] backdrop-blur">
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
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(145deg,#f8fbff_0%,#ffffff_42%,#f0fdf4_100%)] p-6 shadow-[0_30px_80px_-52px_rgba(15,23,42,0.42)] sm:p-8">
      <div className="pointer-events-none absolute -left-16 top-0 size-56 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.16),rgba(56,189,248,0)_72%)]" />
      <div className="pointer-events-none absolute -right-12 bottom-0 size-64 rounded-full bg-[radial-gradient(circle,rgba(74,222,128,0.14),rgba(74,222,128,0)_72%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(56,189,248,0.85),rgba(74,222,128,0.8),transparent)]" />

      <div className="relative space-y-5">
        <div className="flex flex-col gap-4 border-b border-slate-200/70 pb-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
              <Sparkles className="size-3.5" />
              Idea Showcase
            </span>
            <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.45rem]">
              Browse live sustainability ideas.
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              A clean carousel view of the latest ideas from the platform.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 xl:justify-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-2 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.28)] backdrop-blur">
                <Layers3 className="size-4" />
              <span className="font-medium text-slate-900">{ideas.length.toLocaleString()}</span>
              <span>live ideas</span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-2 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.28)] backdrop-blur">
                <Sparkles className="size-4" />
              <span className="font-medium text-slate-900">{featuredCount.toLocaleString()}</span>
              <span>featured</span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-2 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.28)] backdrop-blur">
                <Leaf className="size-4" />
              <span className="font-medium text-slate-900">{categoryCount.toLocaleString()}</span>
              <span>categories</span>
              <span className="text-slate-400">•</span>
              <span>{freeIdeasCount.toLocaleString()} free</span>
            </span>
          </div>
        </div>

        {showcasedIdeas.length === 0 ? (
          <div className="rounded-[1.7rem] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.35)] backdrop-blur">
            <EmptyState
              title="No ideas available"
              description="The public idea catalog is empty right now."
            />
          </div>
        ) : (
          <Carousel className="w-full pt-16">
            <CarouselContent className="-ml-3 pb-2">
              {showcasedIdeas.map((idea) => {
                const theme = getIdeaTheme(idea);

                return (
                  <CarouselItem
                    key={idea.id}
                    className="basis-[88%] pl-3 sm:basis-[31rem] xl:basis-[25.5rem]"
                  >
                    <Card className="group relative h-full overflow-hidden rounded-[1.9rem] border-white/70 bg-white/92 shadow-[0_26px_70px_-48px_rgba(15,23,42,0.42)] backdrop-blur">
                      <div className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", theme.ribbon)} />
                      <div className={cn("pointer-events-none absolute -right-10 top-10 size-28 rounded-full blur-3xl", theme.halo)} />

                      <CardContent className="relative flex h-full flex-col p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                                {getIdeaCategory(idea)}
                              </span>
                              <span className={cn("rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]", theme.badge)}>
                                {idea.isFeatured ? "Featured" : formatLabel(idea.accessType)}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <h3 className="text-[1.9rem] font-semibold leading-[1.1] tracking-tight text-slate-950">
                                {getIdeaTitle(idea)}
                              </h3>
                              <p className="text-sm leading-7 text-slate-600">
                                {getIdeaSummary(idea)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                            {formatLabel(idea.status)}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                            {formatAudience(idea.targetAudience)}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                            Updated {formatDate(idea.updatedAt)}
                          </span>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                          <div className={cn("rounded-2xl border p-4", theme.stat)}>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Impact
                            </p>
                            <p className="mt-2 text-xl font-semibold text-slate-950">
                              {formatMetric(idea.impactScore)}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white/85 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Eco Score
                            </p>
                            <p className="mt-2 text-xl font-semibold text-slate-950">
                              {formatMetric(idea.ecoScore)}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white/85 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Price
                            </p>
                            <p className="mt-2 text-xl font-semibold text-slate-950">
                              {formatPrice(idea)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 rounded-[1.35rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Idea Signal
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                Views {formatMetric(idea.totalViews)} and access set to{" "}
                                <span className="font-medium text-slate-900">
                                  {formatLabel(idea.accessType)}
                                </span>
                              </p>
                            </div>

                            <Link
                              href={`/idea/${idea.id}`}
                              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800 hover:shadow-[0_18px_32px_-22px_rgba(15,23,42,0.95)]"
                            >
                              Review idea
                              <ArrowRight className="size-4" />
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="left-auto right-14 top-0 size-10 translate-y-0 border-white/70 bg-white/90 text-slate-900 shadow-[0_18px_34px_-22px_rgba(15,23,42,0.4)] backdrop-blur hover:bg-white" />
            <CarouselNext className="right-2 top-0 size-10 translate-y-0 border-white/70 bg-white/90 text-slate-900 shadow-[0_18px_34px_-22px_rgba(15,23,42,0.4)] backdrop-blur hover:bg-white" />
          </Carousel>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.7rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(248,250,252,0.92))] px-5 py-4 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Live From Eco Spark
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Showing {showcasedIdeas.length.toLocaleString()} live ideas with richer on-page comparison.
            </p>
          </div>
          <Link
            href="/idea"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800 hover:shadow-[0_18px_32px_-20px_rgba(15,23,42,0.95)]"
          >
            Open full library
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

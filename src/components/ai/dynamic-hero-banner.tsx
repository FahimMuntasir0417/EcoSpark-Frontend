"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAiPersonalizedBannerQuery } from "@/features/ai";
import { getApiErrorMessage } from "@/lib/errors/api-error";

const fallbackBanner = {
  title: "Discover ideas matched to your activity",
  subtitle:
    "Browse recommendations, trending sustainability ideas, and your next best actions from one focused workspace.",
  ctaText: "Browse ideas",
  ctaLink: "/idea",
};

function normalizeIdeaHref(href: string) {
  return href.replace(/^\/ideas(?=\/|\?|$)/, "/idea");
}

export function DynamicHeroBanner() {
  const bannerQuery = useAiPersonalizedBannerQuery();
  const banner = bannerQuery.data?.data ?? fallbackBanner;
  const personalization =
    bannerQuery.data?.data?.personalization?.category?.name ??
    bannerQuery.data?.data?.personalization?.tag?.name ??
    null;

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-5 p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <Sparkles className="size-3.5" />
            AI Personalization
          </div>

          <div className="space-y-3">
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              {banner.title}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              {banner.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={normalizeIdeaHref(banner.ctaLink)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              {banner.ctaText}
              <ArrowRight className="size-4" />
            </Link>
            {personalization ? (
              <span className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800">
                Based on {personalization}
              </span>
            ) : null}
          </div>

          {bannerQuery.isError ? (
            <p className="text-xs text-muted-foreground">
              Personalization is unavailable: {getApiErrorMessage(bannerQuery.error)}
            </p>
          ) : null}
        </div>

        <div className="grid min-h-48 content-between bg-primary p-6 text-primary-foreground">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
              Live AI
            </p>
            <p className="mt-3 text-4xl font-semibold">
              {bannerQuery.isPending ? "..." : "1-2"}
            </p>
            <p className="mt-2 text-sm text-primary-foreground/80">
              smart features active on this page
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md bg-primary-foreground/10 p-3">
              <p className="font-semibold">Search</p>
              <p className="text-primary-foreground/70">suggestions</p>
            </div>
            <div className="rounded-md bg-primary-foreground/10 p-3">
              <p className="font-semibold">Insights</p>
              <p className="text-primary-foreground/70">next actions</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

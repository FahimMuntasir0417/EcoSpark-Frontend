"use client";

import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileCheck2,
  Lightbulb,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type HeroSlide = {
  label: string;
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
  icon: LucideIcon;
  checkpoints: string[];
};

const heroSlides: HeroSlide[] = [
  {
    label: "Scientists",
    title: "Submit high-context ideas with review-ready evidence.",
    description:
      "Scientists can package sustainability proposals with category, impact, attachments, pricing, and status data before the admin review cycle starts.",
    metric: "5",
    metricLabel: "scientist workspace routes",
    icon: Lightbulb,
    checkpoints: ["Create idea", "Drafts", "Attachments"],
  },
  {
    label: "Admins",
    title: "Moderate ideas, users, tags, specialties, and reports.",
    description:
      "Admin dashboards centralize approvals, archives, featured ideas, taxonomy, campaign arrangement, and member or scientist management.",
    metric: "12+",
    metricLabel: "admin operations",
    icon: ShieldCheck,
    checkpoints: ["Pending review", "Featured ideas", "Reports"],
  },
  {
    label: "Members",
    title: "Discover, save, vote, comment, and purchase ideas.",
    description:
      "Members get a practical adoption path from public discovery to saved ideas, votes, comments, purchases, and profile management.",
    metric: "6",
    metricLabel: "member activity routes",
    icon: UsersRound,
    checkpoints: ["Saved ideas", "Votes", "Purchases"],
  },
];

export function HomeHero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = heroSlides[activeIndex] ?? heroSlides[0];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % heroSlides.length);
    }, 7000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <section className="relative grid gap-8 overflow-hidden border-b border-border bg-card px-4 py-10 sm:px-6 lg:min-h-[calc(100svh-4rem)] lg:px-8 lg:py-12">
      <div
        aria-hidden="true"
        className="home-animated-grid pointer-events-none absolute inset-0 opacity-60 dark:opacity-35"
      />
      <div
        aria-hidden="true"
        className="home-trace-lines pointer-events-none absolute inset-0 opacity-70"
      />
      <div
        aria-hidden="true"
        className="home-signal-sweep pointer-events-none absolute inset-y-0 left-0 w-2/5"
      />
      <div
        aria-hidden="true"
        className="home-content-wash pointer-events-none absolute inset-0"
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.85fr)]">
        <div className="grid gap-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <FileCheck2 className="size-4" />
            Eco Spark Platform
          </div>

          <div className="grid gap-4">
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Production-ready workflows for sustainability innovation.
            </h1>
            <p className="max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
              Eco Spark connects public discovery, role-based dashboards,
              contract-validated API calls, moderation, campaigns, community
              feedback, and paid idea access in one professional frontend.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/idea"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Explore ideas
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              View platform
            </Link>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.label}
                type="button"
                onClick={() => {
                  setActiveIndex(index);
                }}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  activeIndex === index
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-muted",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <slide.icon className="size-4" />
                  {slide.label}
                </span>
                <span
                  className={cn(
                    "mt-1 block text-xs",
                    activeIndex === index
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground",
                  )}
                >
                  {slide.metricLabel}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="surface-card overflow-hidden">
          <div className="border-b border-border bg-muted p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Interactive workflow
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {activeSlide.label} view
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
                <span className="size-2 rounded-full bg-primary" />
                Live routes
              </span>
            </div>
          </div>

          <div className="grid gap-5 p-5">
            <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
              <div className="rounded-lg border border-border bg-background p-4">
                <activeSlide.icon className="size-6 text-primary" />
                <p className="mt-4 text-4xl font-semibold tracking-tight">
                  {activeSlide.metric}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {activeSlide.metricLabel}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-lg font-semibold leading-tight">
                  {activeSlide.title}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {activeSlide.description}
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {activeSlide.checkpoints.map((checkpoint, index) => (
                <div
                  key={checkpoint}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-border bg-background p-3"
                >
                  <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">
                      {checkpoint}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Route-aligned workflow action
                    </span>
                  </span>
                  <CheckCircle2 className="size-5 text-primary" />
                </div>
              ))}
            </div>

            <div className="grid gap-3 rounded-lg border border-border bg-muted p-4 sm:grid-cols-3">
              <div>
                <BarChart3 className="size-4 text-primary" />
                <p className="mt-2 text-sm font-semibold">Typed services</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Zod contracts
                </p>
              </div>
              <div>
                <ShieldCheck className="size-4 text-primary" />
                <p className="mt-2 text-sm font-semibold">Protected routes</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Role policy
                </p>
              </div>
              <div>
                <UsersRound className="size-4 text-primary" />
                <p className="mt-2 text-sm font-semibold">Public discovery</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Live catalogs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

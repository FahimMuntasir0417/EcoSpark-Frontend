"use client";

import { ArrowRight, Lightbulb, LogIn, Search, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AiDashboardInsights,
  AiIdeaCard,
  DynamicHeroBanner,
} from "@/components/ai";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import {
  useAiRecommendationsQuery,
  useAiSearchSuggestionsQuery,
  useAiTrendingIdeasQuery,
} from "@/features/ai";
import { getApiErrorMessage } from "@/lib/errors/api-error";

const IDEA_LIMIT = 6;

function normalizeSearch(value: string) {
  return value.trim();
}

function normalizeIdeaHref(href: string) {
  return href.replace(/^\/ideas(?=\/|\?|$)/, "/idea");
}

export default function AiDiscoverPage() {
  const [searchValue, setSearchValue] = useState("");
  const [suggestionQuery, setSuggestionQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSuggestionQuery(normalizeSearch(searchValue));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchValue]);

  const suggestionParams = useMemo(
    () => ({
      searchTerm: suggestionQuery,
      limit: 8,
    }),
    [suggestionQuery],
  );
  const suggestionsEnabled = suggestionQuery.length >= 2;

  const suggestionsQuery = useAiSearchSuggestionsQuery(
    suggestionParams,
    suggestionsEnabled,
  );
  const recommendationsQuery = useAiRecommendationsQuery({ limit: IDEA_LIMIT });
  const trendingQuery = useAiTrendingIdeasQuery({ limit: IDEA_LIMIT });

  const recommendations = recommendationsQuery.data?.data.data ?? [];
  const trendingIdeas = trendingQuery.data?.data ?? [];
  const suggestions = suggestionsQuery.data?.data ?? [];
  const personalization =
    recommendationsQuery.data?.data.basedOn?.category?.name ??
    recommendationsQuery.data?.data.basedOn?.tag?.name ??
    null;

  return (
    <main className="public-page-shell space-y-10">
      <DynamicHeroBanner />

      <section className="grid gap-4 rounded-lg border border-border bg-background p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-kicker">AI Search</p>
            <h2 className="section-title">Search suggestions while typing</h2>
          </div>
          <Link
            href="/login"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-muted"
          >
            <LogIn className="size-4" />
            Sign in for personalization
          </Link>
        </div>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search ideas, categories, or tags"
            className="h-11 bg-background pl-9"
          />
        </label>

        <div className="min-h-12">
          {!suggestionsEnabled ? (
            <p className="text-sm text-muted-foreground">
              Type at least two characters to get AI-powered suggestions.
            </p>
          ) : suggestionsQuery.isPending ? (
            <p className="text-sm text-muted-foreground">Finding suggestions...</p>
          ) : suggestionsQuery.isError ? (
            <p className="text-sm text-red-600">
              {getApiErrorMessage(suggestionsQuery.error)}
            </p>
          ) : suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No suggestions found.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <Link
                  key={`${suggestion.type}-${suggestion.value}`}
                  href={normalizeIdeaHref(suggestion.href)}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/70"
                >
                  <Sparkles className="size-3.5 text-primary" />
                  {suggestion.label}
                  <span className="text-xs text-muted-foreground">
                    {suggestion.type}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-kicker">Recommendations</p>
            <h2 className="section-title">Personalized idea matches</h2>
            <p className="section-copy">
              {personalization
                ? `Ranked from your recent activity around ${personalization}.`
                : "Ranked from recent platform activity and your available history."}
            </p>
          </div>
          <Link
            href="/idea"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary"
          >
            View all ideas
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {recommendationsQuery.isPending ? (
          <LoadingState
            title="Loading recommendations"
            description="Finding ideas most relevant to your behavior."
          />
        ) : recommendationsQuery.isError ? (
          <ErrorState
            title="Recommendations unavailable"
            description={getApiErrorMessage(recommendationsQuery.error)}
            onRetry={() => void recommendationsQuery.refetch()}
          />
        ) : recommendations.length === 0 ? (
          <EmptyState
            title="No recommendations yet"
            description="Browse or vote on ideas to help the assistant learn your interests."
          />
        ) : (
          <div className="grid gap-5">
            {recommendations.map((idea) => (
              <AiIdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-kicker">Trending</p>
            <h2 className="section-title">Ideas gaining attention</h2>
            <p className="section-copy">
              AI ranking uses views, votes, bookmarks, comments, and recency to
              surface ideas with active momentum.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
            <TrendingUp className="size-4" />
            Live ranking
          </span>
        </div>

        {trendingQuery.isPending ? (
          <LoadingState
            title="Loading trending ideas"
            description="Calculating current platform momentum."
          />
        ) : trendingQuery.isError ? (
          <ErrorState
            title="Trending ideas unavailable"
            description={getApiErrorMessage(trendingQuery.error)}
            onRetry={() => void trendingQuery.refetch()}
          />
        ) : trendingIdeas.length === 0 ? (
          <EmptyState
            title="No trending ideas yet"
            description="More community activity is needed before trends appear."
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {trendingIdeas.map((idea) => (
              <AiIdeaCard key={idea.id} idea={idea} compact />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-background p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
            <Lightbulb className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              UX enhancements now covered
            </p>
            <p className="text-sm text-muted-foreground">
              Dynamic banner, predictive recommendations, AI search suggestions,
              smart form autofill, chatbot support, dashboard insights, behavior
              predictions, and anomaly alerts are connected to backend endpoints.
            </p>
          </div>
        </div>
      </section>

      <AiDashboardInsights />
    </main>
  );
}

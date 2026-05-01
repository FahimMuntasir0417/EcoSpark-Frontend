import { queryOptions, useQuery } from "@tanstack/react-query";
import { aiService } from "@/services/ai.service";

export const aiQueryKeys = {
  all: ["ai"] as const,
  searchSuggestions: (params?: Record<string, unknown>) =>
    [...aiQueryKeys.all, "search-suggestions", params ?? {}] as const,
  recommendations: (params?: Record<string, unknown>) =>
    [...aiQueryKeys.all, "recommendations", params ?? {}] as const,
  trendingIdeas: (params?: Record<string, unknown>) =>
    [...aiQueryKeys.all, "trending-ideas", params ?? {}] as const,
  personalizedBanner: () => [...aiQueryKeys.all, "personalized-banner"] as const,
  dashboardInsights: () => [...aiQueryKeys.all, "dashboard-insights"] as const,
  nextActions: () => [...aiQueryKeys.all, "next-actions"] as const,
  anomalyAlerts: () => [...aiQueryKeys.all, "anomaly-alerts"] as const,
};

export function getAiSearchSuggestionsQueryOptions(
  params?: Record<string, unknown>,
  enabled = true,
) {
  return queryOptions({
    queryKey: aiQueryKeys.searchSuggestions(params),
    queryFn: ({ signal }) => aiService.getSearchSuggestions({ params, signal }),
    enabled,
  });
}

export function getAiRecommendationsQueryOptions(
  params?: Record<string, unknown>,
) {
  return queryOptions({
    queryKey: aiQueryKeys.recommendations(params),
    queryFn: ({ signal }) => aiService.getRecommendations({ params, signal }),
  });
}

export function getAiTrendingIdeasQueryOptions(
  params?: Record<string, unknown>,
) {
  return queryOptions({
    queryKey: aiQueryKeys.trendingIdeas(params),
    queryFn: ({ signal }) => aiService.getTrendingIdeas({ params, signal }),
  });
}

export function getAiPersonalizedBannerQueryOptions() {
  return queryOptions({
    queryKey: aiQueryKeys.personalizedBanner(),
    queryFn: ({ signal }) => aiService.getPersonalizedBanner({ signal }),
  });
}

export function getAiDashboardInsightsQueryOptions() {
  return queryOptions({
    queryKey: aiQueryKeys.dashboardInsights(),
    queryFn: ({ signal }) => aiService.getDashboardInsights({ signal }),
  });
}

export function getAiNextActionsQueryOptions() {
  return queryOptions({
    queryKey: aiQueryKeys.nextActions(),
    queryFn: ({ signal }) => aiService.getNextActions({ signal }),
  });
}

export function getAiAnomalyAlertsQueryOptions(enabled = true) {
  return queryOptions({
    queryKey: aiQueryKeys.anomalyAlerts(),
    queryFn: ({ signal }) => aiService.getAnomalyAlerts({ signal }),
    enabled,
  });
}

export function useAiSearchSuggestionsQuery(
  params?: Record<string, unknown>,
  enabled = true,
) {
  return useQuery(getAiSearchSuggestionsQueryOptions(params, enabled));
}

export function useAiRecommendationsQuery(params?: Record<string, unknown>) {
  return useQuery(getAiRecommendationsQueryOptions(params));
}

export function useAiTrendingIdeasQuery(params?: Record<string, unknown>) {
  return useQuery(getAiTrendingIdeasQueryOptions(params));
}

export function useAiPersonalizedBannerQuery() {
  return useQuery(getAiPersonalizedBannerQueryOptions());
}

export function useAiDashboardInsightsQuery() {
  return useQuery(getAiDashboardInsightsQueryOptions());
}

export function useAiNextActionsQuery() {
  return useQuery(getAiNextActionsQueryOptions());
}

export function useAiAnomalyAlertsQuery(enabled = true) {
  return useQuery(getAiAnomalyAlertsQueryOptions(enabled));
}

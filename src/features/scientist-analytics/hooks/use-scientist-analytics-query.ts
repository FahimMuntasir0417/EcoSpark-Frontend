import { queryOptions, useQuery } from "@tanstack/react-query";
import { scientistAnalyticsService } from "@/services/scientist-analytics.service";

export const scientistAnalyticsQueryKeys = {
  all: ["scientist-analytics"] as const,
  dashboard: () => [...scientistAnalyticsQueryKeys.all, "dashboard"] as const,
};

export function getScientistAnalyticsQueryOptions() {
  return queryOptions({
    queryKey: scientistAnalyticsQueryKeys.dashboard(),
    queryFn: ({ signal }) =>
      scientistAnalyticsService.getScientistAnalytics({ signal }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useScientistAnalyticsQuery() {
  return useQuery(getScientistAnalyticsQueryOptions());
}

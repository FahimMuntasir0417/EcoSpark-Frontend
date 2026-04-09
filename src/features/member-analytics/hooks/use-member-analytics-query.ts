import { queryOptions, useQuery } from "@tanstack/react-query";
import { memberAnalyticsService } from "@/services/member-analytics.service";

export const memberAnalyticsQueryKeys = {
  all: ["member-analytics"] as const,
  dashboard: () => [...memberAnalyticsQueryKeys.all, "dashboard"] as const,
};

export function getMemberAnalyticsQueryOptions() {
  return queryOptions({
    queryKey: memberAnalyticsQueryKeys.dashboard(),
    queryFn: ({ signal }) => memberAnalyticsService.getMemberAnalytics({ signal }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useMemberAnalyticsQuery() {
  return useQuery(getMemberAnalyticsQueryOptions());
}

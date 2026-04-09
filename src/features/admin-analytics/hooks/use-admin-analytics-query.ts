import { queryOptions, useQuery } from "@tanstack/react-query";
import { adminAnalyticsService } from "@/services/admin-analytics.service";

export const adminAnalyticsQueryKeys = {
  all: ["admin-analytics"] as const,
  dashboard: () => [...adminAnalyticsQueryKeys.all, "dashboard"] as const,
};

export function getAdminAnalyticsQueryOptions() {
  return queryOptions({
    queryKey: adminAnalyticsQueryKeys.dashboard(),
    queryFn: ({ signal }) => adminAnalyticsService.getAdminAnalytics({ signal }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useAdminAnalyticsQuery() {
  return useQuery(getAdminAnalyticsQueryOptions());
}

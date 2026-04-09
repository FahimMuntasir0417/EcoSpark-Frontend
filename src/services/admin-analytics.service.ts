import { httpClient } from "@/lib/axios/httpClient";
import { parseApiData } from "@/lib/api/parse";
import {
  adminAnalyticsSchema,
  type AdminAnalytics,
} from "@/contracts/admin-analytics.contract";

type AdminAnalyticsQueryOptions = {
  signal?: AbortSignal;
};

export type { AdminAnalytics };

export const adminAnalyticsService = {
  async getAdminAnalytics(options: AdminAnalyticsQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/analytics/admin", {
      signal: options.signal,
    });

    return parseApiData(response, adminAnalyticsSchema);
  },
};

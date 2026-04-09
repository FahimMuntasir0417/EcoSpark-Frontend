import { httpClient } from "@/lib/axios/httpClient";
import { parseApiData } from "@/lib/api/parse";
import {
  scientistAnalyticsSchema,
  type ScientistAnalytics,
} from "@/contracts/scientist-analytics.contract";

type ScientistAnalyticsQueryOptions = {
  signal?: AbortSignal;
};

export type { ScientistAnalytics };

export const scientistAnalyticsService = {
  async getScientistAnalytics(options: ScientistAnalyticsQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/analytics/scientist", {
      signal: options.signal,
    });

    return parseApiData(response, scientistAnalyticsSchema);
  },
};

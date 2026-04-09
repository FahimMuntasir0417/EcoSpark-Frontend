import { httpClient } from "@/lib/axios/httpClient";
import { parseApiData } from "@/lib/api/parse";
import {
  memberAnalyticsSchema,
  type MemberAnalytics,
} from "@/contracts/member-analytics.contract";

type MemberAnalyticsQueryOptions = {
  signal?: AbortSignal;
};

export type { MemberAnalytics };

export const memberAnalyticsService = {
  async getMemberAnalytics(options: MemberAnalyticsQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/analytics/member", {
      signal: options.signal,
    });

    return parseApiData(response, memberAnalyticsSchema);
  },
};

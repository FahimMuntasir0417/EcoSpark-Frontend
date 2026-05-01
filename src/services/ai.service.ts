import { z } from "zod";
import { httpClient, type ApiRequestOptions } from "@/lib/axios/httpClient";
import { parseApiData, parseApiPayload } from "@/lib/api/parse";
import {
  aiAnomalyAlertsSchema,
  aiBannerSchema,
  aiChatInputSchema,
  aiChatResponseSchema,
  aiDashboardInsightsSchema,
  aiIdeaFormSuggestionInputSchema,
  aiIdeaFormSuggestionSchema,
  aiNextActionsSchema,
  aiRecommendationsSchema,
  aiSuggestionSchema,
  aiIdeaSchema,
  type AiChatInput,
  type AiIdeaFormSuggestionInput,
} from "@/contracts/ai.contract";

export type {
  AiAction,
  AiAlert,
  AiAnomalyAlerts,
  AiBanner,
  AiChatInput,
  AiChatResponse,
  AiDashboardInsights,
  AiIdea,
  AiIdeaFormSuggestion,
  AiIdeaFormSuggestionInput,
  AiInsight,
  AiNextActions,
  AiRecommendations,
  AiSuggestion,
} from "@/contracts/ai.contract";

type AiQueryOptions = ApiRequestOptions;

const aiSuggestionsListSchema = z.array(aiSuggestionSchema);
const aiIdeasListSchema = z.array(aiIdeaSchema);

export const aiService = {
  async getSearchSuggestions(options: AiQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/ai/search-suggestions", {
      params: options.params,
      signal: options.signal,
    });

    return parseApiData(response, aiSuggestionsListSchema);
  },

  async getRecommendations(options: AiQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/ai/recommendations", {
      params: options.params,
      signal: options.signal,
    });

    return parseApiData(response, aiRecommendationsSchema);
  },

  async getTrendingIdeas(options: AiQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/ai/trending-ideas", {
      params: options.params,
      signal: options.signal,
    });

    return parseApiData(response, aiIdeasListSchema);
  },

  async getPersonalizedBanner(options: AiQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/ai/personalized-banner", {
      signal: options.signal,
    });

    return parseApiData(response, aiBannerSchema);
  },

  async getDashboardInsights(options: AiQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/ai/dashboard-insights", {
      signal: options.signal,
    });

    return parseApiData(response, aiDashboardInsightsSchema);
  },

  async getNextActions(options: AiQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/ai/next-actions", {
      signal: options.signal,
    });

    return parseApiData(response, aiNextActionsSchema);
  },

  async getAnomalyAlerts(options: AiQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/ai/anomaly-alerts", {
      signal: options.signal,
    });

    return parseApiData(response, aiAnomalyAlertsSchema);
  },

  async chat(payload: AiChatInput, options: AiQueryOptions = {}) {
    const parsedPayload = parseApiPayload(payload, aiChatInputSchema);
    const response = await httpClient.post<unknown>("/ai/chat", parsedPayload, {
      signal: options.signal,
    });

    return parseApiData(response, aiChatResponseSchema);
  },

  async getIdeaFormSuggestions(
    payload: AiIdeaFormSuggestionInput,
    options: AiQueryOptions = {},
  ) {
    const parsedPayload = parseApiPayload(
      payload,
      aiIdeaFormSuggestionInputSchema,
    );
    const response = await httpClient.post<unknown>(
      "/ai/idea-form-suggestions",
      parsedPayload,
      {
        signal: options.signal,
      },
    );

    return parseApiData(response, aiIdeaFormSuggestionSchema);
  },
};

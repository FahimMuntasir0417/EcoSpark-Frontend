import { z } from "zod";
import { httpClient } from "@/lib/axios/httpClient";
import { parseApiData, parseApiPayload } from "@/lib/api/parse";
import {
  campaignIdeaSchema,
  campaignSchema,
  createCampaignInputSchema,
  updateCampaignInputSchema,
  updateCampaignStatusInputSchema,
} from "@/contracts/campaign.contract";
import { nullSchema } from "@/contracts/common";
import type {
  Campaign,
  CampaignIdea,
  CreateCampaignInput,
  UpdateCampaignInput,
  UpdateCampaignStatusInput,
} from "@/contracts/campaign.contract";

export type {
  Campaign,
  CampaignIdea,
  CreateCampaignInput,
  UpdateCampaignInput,
  UpdateCampaignStatusInput,
};

type CampaignQueryOptions = {
  params?: Record<string, unknown>;
  signal?: AbortSignal;
};

const campaignListSchema = z.array(campaignSchema);
const campaignIdeaListSchema = z.array(campaignIdeaSchema);

export const campaignService = {
  async createCampaign(payload: CreateCampaignInput) {
    const parsedPayload = parseApiPayload(payload, createCampaignInputSchema);
    const response = await httpClient.post<unknown>("/campaigns", parsedPayload);
    return parseApiData(response, campaignSchema);
  },

  async getAllCampaigns(options: CampaignQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/campaigns", {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, campaignListSchema);
  },

  async getCampaignBySlug(slug: string, options: CampaignQueryOptions = {}) {
    const response = await httpClient.get<unknown>(`/campaigns/slug/${encodeURIComponent(slug)}`, {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, campaignSchema);
  },

  async getSingleCampaign(id: string, options: CampaignQueryOptions = {}) {
    const response = await httpClient.get<unknown>(`/campaigns/${encodeURIComponent(id)}`, {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, campaignSchema);
  },

  async updateCampaign(id: string, payload: UpdateCampaignInput) {
    const parsedPayload = parseApiPayload(payload, updateCampaignInputSchema);
    const response = await httpClient.patch<unknown>(
      `/campaigns/${encodeURIComponent(id)}`,
      parsedPayload,
    );
    return parseApiData(response, campaignSchema);
  },

  async updateCampaignStatus(id: string, payload: UpdateCampaignStatusInput) {
    const parsedPayload = parseApiPayload(payload, updateCampaignStatusInputSchema);
    const response = await httpClient.patch<unknown>(
      `/campaigns/${encodeURIComponent(id)}/status`,
      parsedPayload,
    );
    return parseApiData(response, campaignSchema);
  },

  async deleteCampaign(id: string) {
    const response = await httpClient.delete<unknown>(`/campaigns/${encodeURIComponent(id)}`);
    return parseApiData(response, nullSchema);
  },

  async getCampaignIdeas(id: string, options: CampaignQueryOptions = {}) {
    const response = await httpClient.get<unknown>(`/campaigns/${encodeURIComponent(id)}/ideas`, {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, campaignIdeaListSchema);
  },
};

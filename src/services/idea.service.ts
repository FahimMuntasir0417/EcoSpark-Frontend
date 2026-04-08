import { z } from "zod";
import { httpClient } from "@/lib/axios/httpClient";
import { parseApiData, parseApiPayload } from "@/lib/api/parse";
import {
  createIdeaAttachmentInputSchema,
  createIdeaInputSchema,
  createIdeaMediaInputSchema,
  ideaSchema,
  rejectIdeaInputSchema,
  updateIdeaInputSchema,
  updateIdeaTagsInputSchema,
} from "@/contracts/idea.contract";
import { nullSchema } from "@/contracts/common";
import type {
  CreateIdeaAttachmentInput,
  CreateIdeaInput,
  CreateIdeaMediaInput,
  Idea,
  IdeaAuthor,
  IdeaCampaign,
  IdeaCategory,
  RejectIdeaInput,
  UpdateIdeaInput,
  UpdateIdeaTagsInput,
} from "@/contracts/idea.contract";

export type {
  CreateIdeaAttachmentInput,
  CreateIdeaInput,
  CreateIdeaMediaInput,
  Idea,
  IdeaAuthor,
  IdeaCampaign,
  IdeaCategory,
  RejectIdeaInput,
  UpdateIdeaInput,
  UpdateIdeaTagsInput,
};

type IdeaQueryOptions = {
  params?: Record<string, unknown>;
  signal?: AbortSignal;
};

const ideaListSchema = z.array(ideaSchema);

export const ideaService = {
  async createIdea(payload: CreateIdeaInput) {
    const parsedPayload = parseApiPayload(payload, createIdeaInputSchema);
    const response = await httpClient.post<unknown>("/ideas", parsedPayload);
    return parseApiData(response, ideaSchema);
  },

  async getAllIdeas(options: IdeaQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/ideas", {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, ideaListSchema);
  },

  async getIdeaBySlug(slug: string, options: IdeaQueryOptions = {}) {
    const response = await httpClient.get<unknown>(`/ideas/slug/${encodeURIComponent(slug)}`, {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, ideaSchema);
  },

  async getSingleIdea(id: string, options: IdeaQueryOptions = {}) {
    const response = await httpClient.get<unknown>(`/ideas/${encodeURIComponent(id)}`, {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, ideaSchema);
  },

  async updateIdea(id: string, payload: UpdateIdeaInput) {
    const parsedPayload = parseApiPayload(payload, updateIdeaInputSchema);
    const response = await httpClient.patch<unknown>(
      `/ideas/${encodeURIComponent(id)}`,
      parsedPayload,
    );
    return parseApiData(response, ideaSchema);
  },

  async deleteIdea(id: string) {
    const response = await httpClient.delete<unknown>(`/ideas/${encodeURIComponent(id)}`);
    return parseApiData(response, nullSchema);
  },

  async submitIdea(id: string) {
    const response = await httpClient.patch<unknown>(`/ideas/${encodeURIComponent(id)}/submit`, {});
    return parseApiData(response, ideaSchema);
  },

  async approveIdea(id: string) {
    const response = await httpClient.patch<unknown>(`/ideas/${encodeURIComponent(id)}/approve`, {});
    return parseApiData(response, ideaSchema);
  },

  async rejectIdea(id: string, payload: RejectIdeaInput) {
    const parsedPayload = parseApiPayload(payload, rejectIdeaInputSchema);
    const response = await httpClient.patch<unknown>(
      `/ideas/${encodeURIComponent(id)}/reject`,
      parsedPayload,
    );
    return parseApiData(response, ideaSchema);
  },

  async archiveIdea(id: string) {
    const response = await httpClient.patch<unknown>(`/ideas/${encodeURIComponent(id)}/archive`, {});
    return parseApiData(response, ideaSchema);
  },

  async publishIdea(id: string) {
    const response = await httpClient.patch<unknown>(`/ideas/${encodeURIComponent(id)}/publish`, {});
    return parseApiData(response, ideaSchema);
  },

  async featureIdea(id: string) {
    const response = await httpClient.patch<unknown>(`/ideas/${encodeURIComponent(id)}/feature`, {});
    return parseApiData(response, ideaSchema);
  },

  async highlightIdea(id: string) {
    const response = await httpClient.patch<unknown>(`/ideas/${encodeURIComponent(id)}/highlight`, {});
    return parseApiData(response, ideaSchema);
  },

  async updateIdeaTags(id: string, payload: UpdateIdeaTagsInput) {
    const parsedPayload = parseApiPayload(payload, updateIdeaTagsInputSchema);
    const response = await httpClient.patch<unknown>(
      `/ideas/${encodeURIComponent(id)}/tags`,
      parsedPayload,
    );
    return parseApiData(response, ideaSchema);
  },

  async addIdeaAttachment(id: string, payload: CreateIdeaAttachmentInput) {
    const parsedPayload = parseApiPayload(payload, createIdeaAttachmentInputSchema);
    const response = await httpClient.post<unknown>(
      `/ideas/${encodeURIComponent(id)}/attachments`,
      parsedPayload,
    );
    return parseApiData(response, ideaSchema);
  },

  async deleteIdeaAttachment(id: string, attachmentId: string) {
    const response = await httpClient.delete<unknown>(
      `/ideas/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}`,
    );
    return parseApiData(response, nullSchema);
  },

  async addIdeaMedia(id: string, payload: CreateIdeaMediaInput) {
    const parsedPayload = parseApiPayload(payload, createIdeaMediaInputSchema);
    const response = await httpClient.post<unknown>(
      `/ideas/${encodeURIComponent(id)}/media`,
      parsedPayload,
    );
    return parseApiData(response, ideaSchema);
  },

  async deleteIdeaMedia(id: string, mediaId: string) {
    const response = await httpClient.delete<unknown>(
      `/ideas/${encodeURIComponent(id)}/media/${encodeURIComponent(mediaId)}`,
    );
    return parseApiData(response, nullSchema);
  },
};

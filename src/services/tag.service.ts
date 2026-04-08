import { z } from "zod";
import { httpClient } from "@/lib/axios/httpClient";
import { parseApiData, parseApiPayload } from "@/lib/api/parse";
import {
  createTagInputSchema,
  tagSchema,
  updateTagInputSchema,
} from "@/contracts/tag.contract";
import { nullSchema } from "@/contracts/common";
import type { CreateTagInput, Tag, UpdateTagInput } from "@/contracts/tag.contract";

export type { CreateTagInput, Tag, UpdateTagInput };

type TagQueryOptions = {
  params?: Record<string, unknown>;
  signal?: AbortSignal;
};

const tagListSchema = z.array(tagSchema);

export const tagService = {
  async createTag(payload: CreateTagInput) {
    const parsedPayload = parseApiPayload(payload, createTagInputSchema);
    const response = await httpClient.post<unknown>("/tags", parsedPayload);
    return parseApiData(response, tagSchema);
  },

  async getAllTags(options: TagQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/tags", {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, tagListSchema);
  },

  async getTagBySlug(slug: string, options: TagQueryOptions = {}) {
    const response = await httpClient.get<unknown>(`/tags/slug/${encodeURIComponent(slug)}`, {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, tagSchema);
  },

  async getSingleTag(id: string, options: TagQueryOptions = {}) {
    const response = await httpClient.get<unknown>(`/tags/${encodeURIComponent(id)}`, {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, tagSchema);
  },

  async updateTag(id: string, payload: UpdateTagInput) {
    const parsedPayload = parseApiPayload(payload, updateTagInputSchema);
    const response = await httpClient.patch<unknown>(
      `/tags/${encodeURIComponent(id)}`,
      parsedPayload,
    );
    return parseApiData(response, tagSchema);
  },

  async deleteTag(id: string) {
    const response = await httpClient.delete<unknown>(`/tags/${encodeURIComponent(id)}`);
    return parseApiData(response, nullSchema);
  },
};

import { z } from "zod";
import { httpClient } from "@/lib/axios/httpClient";
import { parseApiData, parseApiPayload } from "@/lib/api/parse";
import {
  categorySchema,
  createCategoryInputSchema,
  updateCategoryInputSchema,
} from "@/contracts/category.contract";
import { nullSchema } from "@/contracts/common";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/contracts/category.contract";

export type { Category, CreateCategoryInput, UpdateCategoryInput };

type CategoryQueryOptions = {
  params?: Record<string, unknown>;
  signal?: AbortSignal;
};

const categoryListSchema = z.array(categorySchema);

export const categoryService = {
  async createCategory(payload: CreateCategoryInput) {
    const parsedPayload = parseApiPayload(payload, createCategoryInputSchema);
    const response = await httpClient.post<unknown>("/categories", parsedPayload);
    return parseApiData(response, categorySchema);
  },

  async getAllCategories(options: CategoryQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/categories", {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, categoryListSchema);
  },

  async getCategoryBySlug(slug: string, options: CategoryQueryOptions = {}) {
    const response = await httpClient.get<unknown>(
      `/categories/slug/${encodeURIComponent(slug)}`,
      {
        params: options.params,
        signal: options.signal,
      },
    );
    return parseApiData(response, categorySchema);
  },

  async getCategoryById(id: string, options: CategoryQueryOptions = {}) {
    const response = await httpClient.get<unknown>(`/categories/${encodeURIComponent(id)}`, {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, categorySchema);
  },

  async getSingleCategory(id: string, options: CategoryQueryOptions = {}) {
    return this.getCategoryById(id, options);
  },

  async updateCategory(id: string, payload: UpdateCategoryInput) {
    const parsedPayload = parseApiPayload(payload, updateCategoryInputSchema);
    const response = await httpClient.patch<unknown>(
      `/categories/${encodeURIComponent(id)}`,
      parsedPayload,
    );
    return parseApiData(response, categorySchema);
  },

  async deleteCategory(id: string) {
    const response = await httpClient.delete<unknown>(`/categories/${encodeURIComponent(id)}`);
    return parseApiData(response, nullSchema);
  },

  async getCategories(options: CategoryQueryOptions = {}) {
    return this.getAllCategories(options);
  },
};

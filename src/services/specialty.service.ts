import { z } from "zod";
import { httpClient } from "@/lib/axios/httpClient";
import { parseApiData, parseApiPayload } from "@/lib/api/parse";
import {
  createSpecialtyInputSchema,
  specialtySchema,
  updateSpecialtyInputSchema,
} from "@/contracts/specialty.contract";
import { nullSchema } from "@/contracts/common";
import type {
  CreateSpecialtyInput,
  Specialty,
  UpdateSpecialtyInput,
} from "@/contracts/specialty.contract";

export type { CreateSpecialtyInput, Specialty, UpdateSpecialtyInput };

type SpecialtyQueryOptions = {
  params?: Record<string, unknown>;
  signal?: AbortSignal;
};

const specialtyListSchema = z.array(specialtySchema);

export const specialtyService = {
  async createSpecialty(payload: CreateSpecialtyInput) {
    const parsedPayload = parseApiPayload(payload, createSpecialtyInputSchema);
    const response = await httpClient.post<unknown>("/specialties", parsedPayload);
    return parseApiData(response, specialtySchema);
  },

  async getAllSpecialties(options: SpecialtyQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/specialties", {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, specialtyListSchema);
  },

  async getSingleSpecialty(id: string, options: SpecialtyQueryOptions = {}) {
    const response = await httpClient.get<unknown>(
      `/specialties/${encodeURIComponent(id)}`,
      {
        params: options.params,
        signal: options.signal,
      },
    );
    return parseApiData(response, specialtySchema);
  },

  async updateSpecialty(id: string, payload: UpdateSpecialtyInput) {
    const parsedPayload = parseApiPayload(payload, updateSpecialtyInputSchema);
    const response = await httpClient.patch<unknown>(
      `/specialties/${encodeURIComponent(id)}`,
      parsedPayload,
    );
    return parseApiData(response, specialtySchema);
  },

  async deleteSpecialty(id: string) {
    const response = await httpClient.delete<unknown>(`/specialties/${encodeURIComponent(id)}`);
    return parseApiData(response, nullSchema);
  },
};

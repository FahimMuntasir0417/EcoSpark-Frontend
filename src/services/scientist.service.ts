import { z } from "zod";
import { httpClient } from "@/lib/axios/httpClient";
import { parseApiData, parseApiPayload } from "@/lib/api/parse";
import {
  assignScientistSpecialtiesInputSchema,
  createScientistInputSchema,
  scientistSchema,
  updateScientistInputSchema,
  verifyScientistInputSchema,
} from "@/contracts/scientist.contract";
import { nullSchema } from "@/contracts/common";
import type {
  AssignScientistSpecialtiesInput,
  CreateScientistInput,
  Scientist,
  UpdateScientistInput,
  VerifyScientistInput,
} from "@/contracts/scientist.contract";

export type {
  AssignScientistSpecialtiesInput,
  CreateScientistInput,
  Scientist,
  UpdateScientistInput,
  VerifyScientistInput,
};

type ScientistQueryOptions = {
  params?: Record<string, unknown>;
  signal?: AbortSignal;
};

const scientistListSchema = z.array(scientistSchema);

export const scientistService = {
  async createScientist(payload: CreateScientistInput) {
    const parsedPayload = parseApiPayload(payload, createScientistInputSchema);
    const response = await httpClient.post<unknown>("/scientists", parsedPayload);
    return parseApiData(response, scientistSchema);
  },

  async getAllScientists(options: ScientistQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/scientists", {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, scientistListSchema);
  },

  async getScientistByUserId(userId: string, options: ScientistQueryOptions = {}) {
    const response = await httpClient.get<unknown>(
      `/scientists/user/${encodeURIComponent(userId)}`,
      {
        params: options.params,
        signal: options.signal,
      },
    );
    return parseApiData(response, scientistSchema);
  },

  async getSingleScientist(id: string, options: ScientistQueryOptions = {}) {
    const response = await httpClient.get<unknown>(`/scientists/${encodeURIComponent(id)}`, {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, scientistSchema);
  },

  async updateScientist(id: string, payload: UpdateScientistInput) {
    const parsedPayload = parseApiPayload(payload, updateScientistInputSchema);
    const response = await httpClient.patch<unknown>(
      `/scientists/${encodeURIComponent(id)}`,
      parsedPayload,
    );
    return parseApiData(response, scientistSchema);
  },

  async assignScientistSpecialties(
    id: string,
    payload: AssignScientistSpecialtiesInput,
  ) {
    const parsedPayload = parseApiPayload(
      payload,
      assignScientistSpecialtiesInputSchema,
    );
    const response = await httpClient.patch<unknown>(
      `/scientists/${encodeURIComponent(id)}/specialties`,
      parsedPayload,
    );
    return parseApiData(response, scientistSchema);
  },

  async removeScientistSpecialty(id: string, specialtyId: string) {
    const response = await httpClient.delete<unknown>(
      `/scientists/${encodeURIComponent(id)}/specialties/${encodeURIComponent(specialtyId)}`,
    );
    return parseApiData(response, nullSchema);
  },

  async verifyScientist(id: string, payload: VerifyScientistInput) {
    const parsedPayload = parseApiPayload(payload, verifyScientistInputSchema);
    const response = await httpClient.patch<unknown>(
      `/scientists/${encodeURIComponent(id)}/verify`,
      parsedPayload,
    );
    return parseApiData(response, scientistSchema);
  },

  async deleteScientist(id: string) {
    const response = await httpClient.delete<unknown>(`/scientists/${encodeURIComponent(id)}`);
    return parseApiData(response, nullSchema);
  },
};

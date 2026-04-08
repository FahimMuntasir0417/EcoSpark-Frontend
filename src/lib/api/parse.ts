import { z } from "zod";
import type { ApiResponse } from "@/types/api";

export function parseApiPayload<T>(payload: unknown, schema: z.ZodType<T>): T {
  return schema.parse(payload);
}

export function parseApiData<T>(
  response: ApiResponse<unknown>, schema: z.ZodType<T>,): ApiResponse<T> {
  return {
    ...response,
    data: schema.parse(response.data),
  };
}

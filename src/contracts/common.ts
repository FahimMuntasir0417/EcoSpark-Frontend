import { z } from "zod";

export const idSchema = z.string().min(1);
export const nullableStringSchema = z.string().nullable();
export const nullableNumberSchema = z.number().nullable();
export const nullableBooleanSchema = z.boolean().nullable();

export const paginationMetaSchema = z
  .object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPage: z.number().int().positive().optional(),
    totalPages: z.number().int().positive().optional(),
  })
  .passthrough();

export const nullSchema = z.null();

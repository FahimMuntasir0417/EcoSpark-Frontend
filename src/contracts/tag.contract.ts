import { z } from "zod";
import { idSchema } from "./common";

export const tagSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1),
    slug: z.string().min(1),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export const createTagInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

export const updateTagInputSchema = createTagInputSchema.partial();

export type Tag = z.infer<typeof tagSchema>;
export type CreateTagInput = z.infer<typeof createTagInputSchema>;
export type UpdateTagInput = z.infer<typeof updateTagInputSchema>;

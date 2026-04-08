import { z } from "zod";
import { idSchema } from "./common";

const nonEmptyString = z.string().trim().min(1);

export const specialtySchema = z
  .object({
    id: idSchema,
    title: nonEmptyString.optional(),
    name: nonEmptyString.optional(),
    description: z.string().nullable().optional(),
    icon: z.string().nullable().optional(),
    slug: nonEmptyString.optional(),
  })
  .passthrough();

export const createSpecialtyInputSchema = z.object({
  title: nonEmptyString,
  description: z.string().trim().min(1).optional(),
  icon: z.string().trim().min(1).optional(),
});

export const updateSpecialtyInputSchema = createSpecialtyInputSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required to update a specialty.",
  });

export type Specialty = z.infer<typeof specialtySchema>;
export type CreateSpecialtyInput = z.infer<typeof createSpecialtyInputSchema>;
export type UpdateSpecialtyInput = z.infer<typeof updateSpecialtyInputSchema>;

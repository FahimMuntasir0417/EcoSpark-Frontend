import { z } from "zod";
import { idSchema } from "./common";

export const scientistSchema = z
  .object({
    id: idSchema,
    userId: z.string().optional(),
    isVerified: z.boolean().optional(),
  })
  .passthrough();

export const createScientistInputSchema = z.object({
  userId: z.string().min(1),
  scientist: z.record(z.string(), z.unknown()),
  specialtyIds: z.array(z.string().min(1)).optional(),
});

export const updateScientistInputSchema = z.record(z.string(), z.unknown());

export const assignScientistSpecialtiesInputSchema = z.object({
  specialtyIds: z.array(z.string().min(1)).min(1),
});

export const verifyScientistInputSchema = z.object({
  verified: z.boolean(),
});

export type Scientist = z.infer<typeof scientistSchema>;
export type CreateScientistInput = z.infer<typeof createScientistInputSchema>;
export type UpdateScientistInput = z.infer<typeof updateScientistInputSchema>;
export type AssignScientistSpecialtiesInput = z.infer<
  typeof assignScientistSpecialtiesInputSchema
>;
export type VerifyScientistInput = z.infer<typeof verifyScientistInputSchema>;

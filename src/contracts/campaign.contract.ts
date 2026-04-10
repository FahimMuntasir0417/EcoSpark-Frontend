import { z } from "zod";
import { idSchema, nullableBooleanSchema, nullableStringSchema } from "./common";

export const campaignSchema = z
  .object({
    id: idSchema,
    title: nullableStringSchema.optional(),
    slug: nullableStringSchema.optional(),
    description: nullableStringSchema.optional(),
    bannerImage: nullableStringSchema.optional(),
    startDate: nullableStringSchema.optional(),
    endDate: nullableStringSchema.optional(),
    goalText: nullableStringSchema.optional(),
    seoTitle: nullableStringSchema.optional(),
    seoDescription: nullableStringSchema.optional(),
    isActive: nullableBooleanSchema.optional(),
    isPublic: nullableBooleanSchema.optional(),
  })
  .passthrough();

export const campaignIdeaSchema = z
  .object({
    id: idSchema,
    title: nullableStringSchema.optional(),
    slug: nullableStringSchema.optional(),
  })
  .passthrough();

export const createCampaignInputSchema = z
  .object({
    title: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    bannerImage: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    goalText: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    isActive: z.boolean().optional(),
    isPublic: z.boolean().optional(),
  })
  .passthrough();

export const updateCampaignInputSchema = createCampaignInputSchema.partial();

export const updateCampaignStatusInputSchema = z.object({
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

export type Campaign = z.infer<typeof campaignSchema>;
export type CampaignIdea = z.infer<typeof campaignIdeaSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignInputSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignInputSchema>;
export type UpdateCampaignStatusInput = z.infer<
  typeof updateCampaignStatusInputSchema
>;

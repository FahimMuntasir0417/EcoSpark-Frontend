import { z } from "zod";
import { idSchema } from "./common";

export const campaignSchema = z
  .object({
    id: idSchema,
    title: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    isActive: z.boolean().optional(),
    isPublic: z.boolean().optional(),
  })
  .passthrough();

export const campaignIdeaSchema = z
  .object({
    id: idSchema,
    title: z.string().optional(),
    slug: z.string().optional(),
  })
  .passthrough();

export const createCampaignInputSchema = z
  .object({
    title: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
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

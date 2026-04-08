import { z } from "zod";
import { idSchema } from "./common";

export const experienceReportSchema = z
  .object({
    id: idSchema,
    ideaId: z.string().optional(),
    title: z.string().optional(),
    summary: z.string().optional(),
    status: z.string().optional(),
    isFeatured: z.boolean().optional(),
  })
  .passthrough();

export const notificationSchema = z
  .object({
    id: idSchema,
    readAt: z.string().nullable().optional(),
  })
  .passthrough();

export const newsletterSubscriptionSchema = z
  .object({
    id: idSchema,
    email: z.string().email().optional(),
    source: z.string().optional(),
  })
  .passthrough();

export const createExperienceReportInputSchema = z
  .object({
    ideaId: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
    outcome: z.string().optional(),
    challenges: z.string().optional(),
    measurableResult: z.string().optional(),
    adoptedScale: z.string().optional(),
    location: z.string().optional(),
    effectivenessRating: z.number().min(0).max(10).optional(),
    beforeImageUrl: z.string().url().optional(),
    afterImageUrl: z.string().url().optional(),
  })
  .passthrough();

export const updateExperienceReportInputSchema =
  createExperienceReportInputSchema.partial();

export const newsletterSubscribeInputSchema = z.object({
  email: z.string().email(),
  source: z.string().optional(),
});

export const newsletterUnsubscribeInputSchema = z.object({
  email: z.string().email(),
});

export type ExperienceReport = z.infer<typeof experienceReportSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type NewsletterSubscription = z.infer<typeof newsletterSubscriptionSchema>;
export type CreateExperienceReportInput = z.infer<
  typeof createExperienceReportInputSchema
>;
export type UpdateExperienceReportInput = z.infer<
  typeof updateExperienceReportInputSchema
>;
export type NewsletterSubscribeInput = z.infer<
  typeof newsletterSubscribeInputSchema
>;
export type NewsletterUnsubscribeInput = z.infer<
  typeof newsletterUnsubscribeInputSchema
>;

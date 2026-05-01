import { z } from "zod";
import { ideaSchema } from "./idea.contract";

const scoreItemSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string().nullable().optional(),
    score: z.number().optional(),
  })
  .passthrough();

export const aiSuggestionSchema = z
  .object({
    type: z.enum(["IDEA", "CATEGORY", "TAG"]),
    label: z.string(),
    value: z.string(),
    href: z.string(),
  })
  .passthrough();

export const aiIdeaSchema = ideaSchema
  .extend({
    aiScore: z.number().optional(),
    reason: z.string().optional(),
  })
  .passthrough();

export const aiRecommendationsSchema = z
  .object({
    source: z.string(),
    basedOn: z
      .object({
        category: scoreItemSchema.nullable().optional(),
        tag: scoreItemSchema.nullable().optional(),
      })
      .passthrough(),
    data: z.array(aiIdeaSchema),
  })
  .passthrough();

export const aiBannerSchema = z
  .object({
    title: z.string(),
    subtitle: z.string(),
    ctaText: z.string(),
    ctaLink: z.string(),
    personalization: z
      .object({
        category: scoreItemSchema.nullable().optional(),
        tag: scoreItemSchema.nullable().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const aiInsightSchema = z
  .object({
    title: z.string(),
    message: z.string(),
    type: z.enum(["INFO", "SUCCESS", "WARNING"]),
  })
  .passthrough();

export const aiDashboardInsightsSchema = z
  .object({
    role: z.string(),
    insights: z.array(aiInsightSchema),
  })
  .passthrough();

export const aiActionSchema = z
  .object({
    title: z.string(),
    reason: z.string(),
    link: z.string(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  })
  .passthrough();

export const aiNextActionsSchema = z
  .object({
    actions: z.array(aiActionSchema),
  })
  .passthrough();

export const aiAlertSchema = z
  .object({
    type: z.enum(["INFO", "WARNING", "CRITICAL"]),
    title: z.string(),
    message: z.string(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  })
  .passthrough();

export const aiAnomalyAlertsSchema = z
  .object({
    alerts: z.array(aiAlertSchema),
  })
  .passthrough();

export const aiChatInputSchema = z
  .object({
    message: z.string().trim().min(1).max(1500),
  })
  .strict();

export const aiChatResponseSchema = z
  .object({
    reply: z.string(),
    suggestedActions: z
      .array(
        z
          .object({
            label: z.string(),
            href: z.string(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

export const aiIdeaFormSuggestionInputSchema = z
  .object({
    title: z.string().trim().optional(),
    problemStatement: z.string().trim().optional(),
    proposedSolution: z.string().trim().optional(),
    description: z.string().trim().optional(),
    targetAudience: z.string().trim().optional(),
    categoryId: z.string().trim().optional(),
    tagIds: z.array(z.string().trim()).optional(),
  })
  .passthrough();

export const aiIdeaFormSuggestionSchema = z
  .object({
    suggestions: z
      .object({
        excerpt: z.string().optional(),
        description: z.string().optional(),
        proposedSolution: z.string().optional(),
        implementationSteps: z.string().optional(),
        expectedBenefits: z.string().optional(),
        risksAndChallenges: z.string().optional(),
        requiredResources: z.string().optional(),
        suggestedCategoryName: z.string().optional(),
        suggestedTags: z.array(z.string()).optional(),
      })
      .passthrough(),
  })
  .passthrough();

export type AiSuggestion = z.infer<typeof aiSuggestionSchema>;
export type AiIdea = z.infer<typeof aiIdeaSchema>;
export type AiRecommendations = z.infer<typeof aiRecommendationsSchema>;
export type AiBanner = z.infer<typeof aiBannerSchema>;
export type AiInsight = z.infer<typeof aiInsightSchema>;
export type AiDashboardInsights = z.infer<typeof aiDashboardInsightsSchema>;
export type AiAction = z.infer<typeof aiActionSchema>;
export type AiNextActions = z.infer<typeof aiNextActionsSchema>;
export type AiAlert = z.infer<typeof aiAlertSchema>;
export type AiAnomalyAlerts = z.infer<typeof aiAnomalyAlertsSchema>;
export type AiChatInput = z.infer<typeof aiChatInputSchema>;
export type AiChatResponse = z.infer<typeof aiChatResponseSchema>;
export type AiIdeaFormSuggestionInput = z.infer<
  typeof aiIdeaFormSuggestionInputSchema
>;
export type AiIdeaFormSuggestion = z.infer<typeof aiIdeaFormSuggestionSchema>;

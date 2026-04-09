import { z } from "zod";

const countSchema = z.number().int().nonnegative();
const scoreSchema = z.number().nonnegative();

export const scientistAnalyticsSchema = z
  .object({
    role: z.string().min(1),
    profile: z
      .object({
        hasScientistProfile: z.boolean(),
        isVerified: z.boolean(),
        specialties: countSchema,
        unreadNotifications: countSchema,
      })
      .passthrough(),
    ideas: z
      .object({
        totalCreated: countSchema,
        draft: countSchema,
        underReview: countSchema,
        approved: countSchema,
        rejected: countSchema,
        archived: countSchema,
        published: countSchema,
        featured: countSchema,
        highlighted: countSchema,
        reviewFeedbackReceived: countSchema,
      })
      .passthrough(),
    activity: z
      .object({
        comments: countSchema,
        votes: countSchema,
        experienceReports: countSchema,
      })
      .passthrough(),
    engagement: z
      .object({
        totalViews: countSchema,
        totalUpvotes: countSchema,
        totalComments: countSchema,
        totalBookmarks: countSchema,
        averageEcoScore: scoreSchema,
        averageImpactScore: scoreSchema,
        averageFeasibilityScore: scoreSchema,
      })
      .passthrough(),
  })
  .passthrough();

export type ScientistAnalytics = z.infer<typeof scientistAnalyticsSchema>;

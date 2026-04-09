import { z } from "zod";

const countSchema = z.number().int().nonnegative();
const amountSchema = z.number().nonnegative();

export const adminAnalyticsSchema = z
  .object({
    role: z.string().min(1),
    users: z
      .object({
        total: countSchema,
        admins: countSchema,
        scientists: countSchema,
        members: countSchema,
        moderators: countSchema,
        active: countSchema,
        blocked: countSchema,
        suspended: countSchema,
        deleted: countSchema,
      })
      .passthrough(),
    scientists: z
      .object({
        total: countSchema,
        verified: countSchema,
        pendingVerification: countSchema,
      })
      .passthrough(),
    ideas: z
      .object({
        total: countSchema,
        draft: countSchema,
        underReview: countSchema,
        approved: countSchema,
        rejected: countSchema,
        archived: countSchema,
        published: countSchema,
        featured: countSchema,
        highlighted: countSchema,
        paidAccess: countSchema,
      })
      .passthrough(),
    commerce: z
      .object({
        totalPurchases: countSchema,
        paidPurchases: countSchema,
        pendingPurchases: countSchema,
        failedPurchases: countSchema,
        refundedPurchases: countSchema,
        cancelledPurchases: countSchema,
        totalRevenue: amountSchema,
      })
      .passthrough(),
    moderation: z
      .object({
        pendingIdeaReports: countSchema,
        pendingCommentReports: countSchema,
        pendingExperienceReports: countSchema,
        totalModerationActions: countSchema,
      })
      .passthrough(),
    community: z
      .object({
        totalExperienceReports: countSchema,
        featuredExperienceReports: countSchema,
        newsletterSubscribers: countSchema,
      })
      .passthrough(),
    campaigns: z
      .object({
        total: countSchema,
        active: countSchema,
      })
      .passthrough(),
  })
  .passthrough();

export type AdminAnalytics = z.infer<typeof adminAnalyticsSchema>;

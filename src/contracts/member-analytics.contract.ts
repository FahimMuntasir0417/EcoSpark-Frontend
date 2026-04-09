import { z } from "zod";

const countSchema = z.number().int().nonnegative();
const amountSchema = z.number().nonnegative();

export const memberAnalyticsSchema = z
  .object({
    role: z.string().min(1),
    profile: z
      .object({
        unreadNotifications: countSchema,
        hasNewsletterSubscription: z.boolean(),
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
      })
      .passthrough(),
    purchases: z
      .object({
        total: countSchema,
        paid: countSchema,
        pending: countSchema,
        failed: countSchema,
        refunded: countSchema,
        cancelled: countSchema,
        totalSpent: amountSchema,
      })
      .passthrough(),
    activity: z
      .object({
        comments: countSchema,
        votes: countSchema,
        bookmarks: countSchema,
        experienceReports: countSchema,
      })
      .passthrough(),
    engagement: z
      .object({
        totalViews: countSchema,
        totalUpvotes: countSchema,
        totalComments: countSchema,
        totalBookmarks: countSchema,
      })
      .passthrough(),
  })
  .passthrough();

export type MemberAnalytics = z.infer<typeof memberAnalyticsSchema>;

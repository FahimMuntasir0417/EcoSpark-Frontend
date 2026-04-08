import { z } from "zod";
import { idSchema } from "./common";

export const ideaAuthorSchema = z
  .object({
    id: idSchema,
    name: z.string().optional(),
    email: z.string().email().optional(),
    role: z.string().optional(),
    status: z.string().optional(),
  })
  .passthrough();

export const ideaCategorySchema = z
  .object({
    id: idSchema,
    name: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
  })
  .passthrough();

export const ideaCampaignSchema = z
  .object({
    id: idSchema,
  })
  .passthrough();

export const ideaSchema = z
  .object({
    id: idSchema,
    title: z.string().optional(),
    slug: z.string().min(1),
    excerpt: z.string().nullable().optional(),
    problemStatement: z.string().nullable().optional(),
    proposedSolution: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    implementationSteps: z.string().nullable().optional(),
    risksAndChallenges: z.string().nullable().optional(),
    requiredResources: z.string().nullable().optional(),
    expectedBenefits: z.string().nullable().optional(),
    targetAudience: z.string().nullable().optional(),
    coverImageUrl: z.string().nullable().optional(),
    videoUrl: z.string().nullable().optional(),
    status: z.string().optional(),
    visibility: z.string().optional(),
    accessType: z.string().optional(),
    price: z.union([z.string(), z.number(), z.null()]).optional(),
    currency: z.string().nullable().optional(),
    rejectionFeedback: z.string().nullable().optional(),
    adminNote: z.string().nullable().optional(),
    isFeatured: z.boolean().optional(),
    featuredAt: z.string().nullable().optional(),
    isHighlighted: z.boolean().optional(),
    authorId: z.string().optional(),
    categoryId: z.string().optional(),
    campaignId: z.string().nullable().optional(),
    estimatedCost: z.number().nullable().optional(),
    implementationEffort: z.number().nullable().optional(),
    expectedImpact: z.number().nullable().optional(),
    timeToImplementDays: z.number().nullable().optional(),
    resourceAvailability: z.number().nullable().optional(),
    innovationLevel: z.number().nullable().optional(),
    scalabilityScore: z.number().nullable().optional(),
    feasibilityScore: z.number().nullable().optional(),
    impactScore: z.number().nullable().optional(),
    ecoScore: z.number().nullable().optional(),
    estimatedWasteReductionKgMonth: z.number().nullable().optional(),
    estimatedCo2ReductionKgMonth: z.number().nullable().optional(),
    estimatedCostSavingsMonth: z.number().nullable().optional(),
    estimatedWaterSavedLitersMonth: z.number().nullable().optional(),
    estimatedEnergySavedKwhMonth: z.number().nullable().optional(),
    totalViews: z.number().optional(),
    uniqueViews: z.number().optional(),
    totalUpvotes: z.number().optional(),
    totalDownvotes: z.number().optional(),
    totalComments: z.number().optional(),
    totalBookmarks: z.number().optional(),
    averageRating: z.number().nullable().optional(),
    trendingScore: z.number().nullable().optional(),
    submittedAt: z.string().nullable().optional(),
    reviewedAt: z.string().nullable().optional(),
    publishedAt: z.string().nullable().optional(),
    lastActivityAt: z.string().nullable().optional(),
    archivedAt: z.string().nullable().optional(),
    deletedAt: z.string().nullable().optional(),
    seoTitle: z.string().nullable().optional(),
    seoDescription: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    author: ideaAuthorSchema.nullable().optional(),
    category: ideaCategorySchema.nullable().optional(),
    campaign: ideaCampaignSchema.nullable().optional(),
  })
  .passthrough();

export const createIdeaInputSchema = z
  .object({
    title: z.string().min(1),
    slug: z.string().min(1),
    categoryId: z.string().min(1),
    description: z.string().optional(),
    excerpt: z.string().optional(),
    problemStatement: z.string().optional(),
    proposedSolution: z.string().optional(),
    implementationSteps: z.string().optional(),
    risksAndChallenges: z.string().optional(),
    requiredResources: z.string().optional(),
    expectedBenefits: z.string().optional(),
    targetAudience: z.string().optional(),
    coverImageUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),
    campaignId: z.string().optional(),
    visibility: z.string().optional(),
    accessType: z.string().optional(),
    price: z.number().optional(),
    currency: z.string().optional(),
    estimatedCost: z.number().optional(),
    implementationEffort: z.number().optional(),
    expectedImpact: z.number().optional(),
    timeToImplementDays: z.number().optional(),
    resourceAvailability: z.number().optional(),
    innovationLevel: z.number().optional(),
    scalabilityScore: z.number().optional(),
    feasibilityScore: z.number().optional(),
    impactScore: z.number().optional(),
    ecoScore: z.number().optional(),
    estimatedWasteReductionKgMonth: z.number().optional(),
    estimatedCo2ReductionKgMonth: z.number().optional(),
    estimatedCostSavingsMonth: z.number().optional(),
    estimatedWaterSavedLitersMonth: z.number().optional(),
    estimatedEnergySavedKwhMonth: z.number().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    tagIds: z.array(z.string()).optional(),
  })
  .passthrough();

export const updateIdeaInputSchema = createIdeaInputSchema
  .omit({ title: true, slug: true, categoryId: true })
  .partial()
  .extend({
    title: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    categoryId: z.string().min(1).optional(),
    adminNote: z.string().optional(),
  })
  .passthrough();

export const rejectIdeaInputSchema = z
  .object({
    status: z.string().optional(),
    rejectionFeedback: z.string().optional(),
    adminNote: z.string().optional(),
    reason: z.string().optional(),
    note: z.string().optional(),
  })
  .passthrough();

export const updateIdeaTagsInputSchema = z
  .object({
    tagIds: z.array(z.string().min(1)).min(1),
  })
  .passthrough();

export const createIdeaAttachmentInputSchema = z
  .object({
    title: z.string().optional(),
    fileUrl: z.string().url().optional(),
    fileType: z.string().optional(),
    fileName: z.string().optional(),
    fileSizeBytes: z.number().int().nonnegative().optional(),
    mimeType: z.string().optional(),
  })
  .passthrough();

export const createIdeaMediaInputSchema = z
  .object({
    url: z.string().url(),
    type: z.string().min(1),
    altText: z.string().optional(),
    caption: z.string().optional(),
    sortOrder: z.number().int().optional(),
    isPrimary: z.boolean().optional(),
  })
  .passthrough();

export type IdeaAuthor = z.infer<typeof ideaAuthorSchema>;
export type IdeaCategory = z.infer<typeof ideaCategorySchema>;
export type IdeaCampaign = z.infer<typeof ideaCampaignSchema>;
export type Idea = z.infer<typeof ideaSchema>;
export type CreateIdeaInput = z.infer<typeof createIdeaInputSchema>;
export type UpdateIdeaInput = z.infer<typeof updateIdeaInputSchema>;
export type RejectIdeaInput = z.infer<typeof rejectIdeaInputSchema>;
export type UpdateIdeaTagsInput = z.infer<typeof updateIdeaTagsInputSchema>;
export type CreateIdeaAttachmentInput = z.infer<
  typeof createIdeaAttachmentInputSchema
>;
export type CreateIdeaMediaInput = z.infer<typeof createIdeaMediaInputSchema>;

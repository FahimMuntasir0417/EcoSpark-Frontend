import { z } from "zod";
import { idSchema } from "./common";

export const reportReasonSchema = z.string().min(1);

export const reportIdeaInputSchema = z
  .object({
    reason: reportReasonSchema,
    note: z.string().optional(),
  })
  .passthrough();

export const reportCommentInputSchema = reportIdeaInputSchema;

export const reviewReportInputSchema = z
  .object({
    status: z.string().min(1),
    note: z.string().optional(),
  })
  .passthrough();

export const reviewFeedbackInputSchema = z
  .object({
    feedbackType: z.string().min(1),
    title: z.string().min(1),
    message: z.string().min(1),
    isVisibleToAuthor: z.boolean().optional(),
  })
  .passthrough();

export const reviewIdeaInputSchema = z
  .object({
    action: z.string().min(1),
    note: z.string().optional(),
  })
  .passthrough();

export const moderationCommentActionInputSchema = z
  .object({
    note: z.string().optional(),
  })
  .passthrough();

export const moderationReportSchema = z
  .object({
    id: idSchema,
    status: z.string().optional(),
  })
  .passthrough();

export const reviewFeedbackSchema = z
  .object({
    id: idSchema,
    ideaId: z.string().optional(),
  })
  .passthrough();

export const moderationActionSchema = z
  .object({
    id: idSchema,
    type: z.string().optional(),
  })
  .passthrough();

export type ReportReason = z.infer<typeof reportReasonSchema>;
export type ReportIdeaInput = z.infer<typeof reportIdeaInputSchema>;
export type ReportCommentInput = z.infer<typeof reportCommentInputSchema>;
export type ReviewReportInput = z.infer<typeof reviewReportInputSchema>;
export type ReviewFeedbackInput = z.infer<typeof reviewFeedbackInputSchema>;
export type ReviewIdeaInput = z.infer<typeof reviewIdeaInputSchema>;
export type ModerationCommentActionInput = z.infer<
  typeof moderationCommentActionInputSchema
>;
export type ModerationReport = z.infer<typeof moderationReportSchema>;
export type ReviewFeedback = z.infer<typeof reviewFeedbackSchema>;
export type ModerationAction = z.infer<typeof moderationActionSchema>;

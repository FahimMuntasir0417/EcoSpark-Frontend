import { z } from "zod";
import { httpClient } from "@/lib/axios/httpClient";
import { parseApiData, parseApiPayload } from "@/lib/api/parse";
import {
  moderationActionSchema,
  moderationCommentActionInputSchema,
  moderationReportSchema,
  reportCommentInputSchema,
  reportIdeaInputSchema,
  reviewFeedbackInputSchema,
  reviewFeedbackSchema,
  reviewIdeaInputSchema,
  reviewReportInputSchema,
} from "@/contracts/moderation.contract";
import type {
  ModerationAction,
  ModerationCommentActionInput,
  ModerationReport,
  ReportCommentInput,
  ReportIdeaInput,
  ReviewFeedback,
  ReviewFeedbackInput,
  ReviewIdeaInput,
  ReviewReportInput,
  ReportReason,
} from "@/contracts/moderation.contract";

export type {
  ModerationAction,
  ModerationCommentActionInput,
  ModerationReport,
  ReportCommentInput,
  ReportIdeaInput,
  ReportReason,
  ReviewFeedback,
  ReviewFeedbackInput,
  ReviewIdeaInput,
  ReviewReportInput,
};

export type ModerationQueryOptions = {
  params?: Record<string, unknown>;
  signal?: AbortSignal;
};

const moderationReportListSchema = z.array(moderationReportSchema);
const reviewFeedbackListSchema = z.array(reviewFeedbackSchema);
const moderationActionListSchema = z.array(moderationActionSchema);

export const moderationService = {
  async reportIdea(ideaId: string, payload: ReportIdeaInput) {
    const parsedPayload = parseApiPayload(payload, reportIdeaInputSchema);
    const response = await httpClient.post<unknown>(
      `/moderation/ideas/${encodeURIComponent(ideaId)}/reports`,
      parsedPayload,
    );
    return parseApiData(response, moderationReportSchema);
  },

  async reportComment(commentId: string, payload: ReportCommentInput) {
    const parsedPayload = parseApiPayload(payload, reportCommentInputSchema);
    const response = await httpClient.post<unknown>(
      `/moderation/comments/${encodeURIComponent(commentId)}/reports`,
      parsedPayload,
    );
    return parseApiData(response, moderationReportSchema);
  },

  async getIdeaReports(options: ModerationQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/moderation/reports/ideas", {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, moderationReportListSchema);
  },

  async getSingleIdeaReport(id: string, options: ModerationQueryOptions = {}) {
    const response = await httpClient.get<unknown>(
      `/moderation/reports/ideas/${encodeURIComponent(id)}`,
      {
        params: options.params,
        signal: options.signal,
      },
    );
    return parseApiData(response, moderationReportSchema);
  },

  async reviewIdeaReport(id: string, payload: ReviewReportInput) {
    const parsedPayload = parseApiPayload(payload, reviewReportInputSchema);
    const response = await httpClient.patch<unknown>(
      `/moderation/reports/ideas/${encodeURIComponent(id)}/review`,
      parsedPayload,
    );
    return parseApiData(response, moderationReportSchema);
  },

  async getCommentReports(options: ModerationQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/moderation/reports/comments", {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, moderationReportListSchema);
  },

  async getSingleCommentReport(id: string, options: ModerationQueryOptions = {}) {
    const response = await httpClient.get<unknown>(
      `/moderation/reports/comments/${encodeURIComponent(id)}`,
      {
        params: options.params,
        signal: options.signal,
      },
    );
    return parseApiData(response, moderationReportSchema);
  },

  async reviewCommentReport(id: string, payload: ReviewReportInput) {
    const parsedPayload = parseApiPayload(payload, reviewReportInputSchema);
    const response = await httpClient.patch<unknown>(
      `/moderation/reports/comments/${encodeURIComponent(id)}/review`,
      parsedPayload,
    );
    return parseApiData(response, moderationReportSchema);
  },

  async createIdeaReviewFeedback(ideaId: string, payload: ReviewFeedbackInput) {
    const parsedPayload = parseApiPayload(payload, reviewFeedbackInputSchema);
    const response = await httpClient.post<unknown>(
      `/moderation/ideas/${encodeURIComponent(ideaId)}/review-feedback`,
      parsedPayload,
    );
    return parseApiData(response, reviewFeedbackSchema);
  },

  async getIdeaReviewFeedbacks(
    ideaId: string,
    options: ModerationQueryOptions = {},
  ) {
    const response = await httpClient.get<unknown>(
      `/moderation/ideas/${encodeURIComponent(ideaId)}/review-feedback`,
      {
        params: options.params,
        signal: options.signal,
      },
    );
    return parseApiData(response, reviewFeedbackListSchema);
  },

  async getSingleReviewFeedback(id: string, options: ModerationQueryOptions = {}) {
    const response = await httpClient.get<unknown>(
      `/moderation/review-feedback/${encodeURIComponent(id)}`,
      {
        params: options.params,
        signal: options.signal,
      },
    );
    return parseApiData(response, reviewFeedbackSchema);
  },

  async reviewIdea(ideaId: string, payload: ReviewIdeaInput) {
    const parsedPayload = parseApiPayload(payload, reviewIdeaInputSchema);
    const response = await httpClient.post<unknown>(
      `/moderation/ideas/${encodeURIComponent(ideaId)}/review`,
      parsedPayload,
    );
    return parseApiData(response, moderationReportSchema);
  },

  async deleteCommentByModerator(
    commentId: string,
    payload: ModerationCommentActionInput,
  ) {
    const parsedPayload = parseApiPayload(payload, moderationCommentActionInputSchema);
    const response = await httpClient.post<unknown>(
      `/moderation/comments/${encodeURIComponent(commentId)}/delete`,
      parsedPayload,
    );
    return parseApiData(response, moderationActionSchema);
  },

  async restoreCommentByModerator(
    commentId: string,
    payload: ModerationCommentActionInput,
  ) {
    const parsedPayload = parseApiPayload(payload, moderationCommentActionInputSchema);
    const response = await httpClient.post<unknown>(
      `/moderation/comments/${encodeURIComponent(commentId)}/restore`,
      parsedPayload,
    );
    return parseApiData(response, moderationActionSchema);
  },

  async getModerationActions(options: ModerationQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/moderation/actions", {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, moderationActionListSchema);
  },

  async getSingleModerationAction(
    id: string,
    options: ModerationQueryOptions = {},
  ) {
    const response = await httpClient.get<unknown>(
      `/moderation/actions/${encodeURIComponent(id)}`,
      {
        params: options.params,
        signal: options.signal,
      },
    );
    return parseApiData(response, moderationActionSchema);
  },
};

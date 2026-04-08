import { queryOptions, useQuery } from "@tanstack/react-query";
import { moderationService } from "@/services/moderation.service";

export const moderationQueryKeys = {
  all: ["moderation"] as const,
  ideaReports: (params?: Record<string, unknown>) =>
    [...moderationQueryKeys.all, "reports", "ideas", params ?? {}] as const,
  ideaReport: (id: string) =>
    [...moderationQueryKeys.all, "reports", "ideas", id] as const,
  commentReports: (params?: Record<string, unknown>) =>
    [...moderationQueryKeys.all, "reports", "comments", params ?? {}] as const,
  commentReport: (id: string) =>
    [...moderationQueryKeys.all, "reports", "comments", id] as const,
  ideaReviewFeedbacks: (ideaId: string, params?: Record<string, unknown>) =>
    [
      ...moderationQueryKeys.all,
      "ideas",
      ideaId,
      "review-feedback",
      params ?? {},
    ] as const,
  reviewFeedback: (id: string) =>
    [...moderationQueryKeys.all, "review-feedback", id] as const,
  actions: (params?: Record<string, unknown>) =>
    [...moderationQueryKeys.all, "actions", params ?? {}] as const,
  action: (id: string) => [...moderationQueryKeys.all, "actions", id] as const,
};

export function getIdeaReportsQueryOptions(params?: Record<string, unknown>) {
  return queryOptions({
    queryKey: moderationQueryKeys.ideaReports(params),
    queryFn: ({ signal }) => moderationService.getIdeaReports({ params, signal }),
  });
}

export function getSingleIdeaReportQueryOptions(id: string) {
  return queryOptions({
    queryKey: moderationQueryKeys.ideaReport(id),
    queryFn: ({ signal }) => moderationService.getSingleIdeaReport(id, { signal }),
    enabled: Boolean(id),
  });
}

export function getCommentReportsQueryOptions(params?: Record<string, unknown>) {
  return queryOptions({
    queryKey: moderationQueryKeys.commentReports(params),
    queryFn: ({ signal }) => moderationService.getCommentReports({ params, signal }),
  });
}

export function getSingleCommentReportQueryOptions(id: string) {
  return queryOptions({
    queryKey: moderationQueryKeys.commentReport(id),
    queryFn: ({ signal }) =>
      moderationService.getSingleCommentReport(id, { signal }),
    enabled: Boolean(id),
  });
}

export function getIdeaReviewFeedbacksQueryOptions(
  ideaId: string,
  params?: Record<string, unknown>,
) {
  return queryOptions({
    queryKey: moderationQueryKeys.ideaReviewFeedbacks(ideaId, params),
    queryFn: ({ signal }) =>
      moderationService.getIdeaReviewFeedbacks(ideaId, { params, signal }),
    enabled: Boolean(ideaId),
  });
}

export function getSingleReviewFeedbackQueryOptions(id: string) {
  return queryOptions({
    queryKey: moderationQueryKeys.reviewFeedback(id),
    queryFn: ({ signal }) => moderationService.getSingleReviewFeedback(id, { signal }),
    enabled: Boolean(id),
  });
}

export function getModerationActionsQueryOptions(params?: Record<string, unknown>) {
  return queryOptions({
    queryKey: moderationQueryKeys.actions(params),
    queryFn: ({ signal }) => moderationService.getModerationActions({ params, signal }),
  });
}

export function getSingleModerationActionQueryOptions(id: string) {
  return queryOptions({
    queryKey: moderationQueryKeys.action(id),
    queryFn: ({ signal }) =>
      moderationService.getSingleModerationAction(id, { signal }),
    enabled: Boolean(id),
  });
}

export function useIdeaReportsQuery(params?: Record<string, unknown>) {
  return useQuery(getIdeaReportsQueryOptions(params));
}

export function useSingleIdeaReportQuery(id: string) {
  return useQuery(getSingleIdeaReportQueryOptions(id));
}

export function useCommentReportsQuery(params?: Record<string, unknown>) {
  return useQuery(getCommentReportsQueryOptions(params));
}

export function useSingleCommentReportQuery(id: string) {
  return useQuery(getSingleCommentReportQueryOptions(id));
}

export function useIdeaReviewFeedbacksQuery(
  ideaId: string,
  params?: Record<string, unknown>,
) {
  return useQuery(getIdeaReviewFeedbacksQueryOptions(ideaId, params));
}

export function useSingleReviewFeedbackQuery(id: string) {
  return useQuery(getSingleReviewFeedbackQueryOptions(id));
}

export function useModerationActionsQuery(params?: Record<string, unknown>) {
  return useQuery(getModerationActionsQueryOptions(params));
}

export function useSingleModerationActionQuery(id: string) {
  return useQuery(getSingleModerationActionQueryOptions(id));
}
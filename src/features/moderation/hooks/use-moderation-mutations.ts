import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  moderationService,
  type ModerationCommentActionInput,
  type ReportCommentInput,
  type ReportIdeaInput,
  type ReviewFeedbackInput,
  type ReviewIdeaInput,
  type ReviewReportInput,
} from "@/services/moderation.service";
import { moderationQueryKeys } from "./use-moderation-queries";

type ReportIdeaVariables = {
  ideaId: string;
  payload: ReportIdeaInput;
};

type ReportCommentVariables = {
  commentId: string;
  payload: ReportCommentInput;
};

type ReviewReportVariables = {
  id: string;
  payload: ReviewReportInput;
};

type CreateIdeaReviewFeedbackVariables = {
  ideaId: string;
  payload: ReviewFeedbackInput;
};

type ReviewIdeaVariables = {
  ideaId: string;
  payload: ReviewIdeaInput;
};

type ModerationCommentActionVariables = {
  commentId: string;
  payload: ModerationCommentActionInput;
};

function useModerationInvalidator() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: moderationQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["ideas"] }),
      queryClient.invalidateQueries({ queryKey: ["interaction"] }),
    ]);
  };
}

export function useReportIdeaMutation() {
  const invalidate = useModerationInvalidator();

  return useMutation({
    mutationFn: ({ ideaId, payload }: ReportIdeaVariables) =>
      moderationService.reportIdea(ideaId, payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useReportCommentMutation() {
  const invalidate = useModerationInvalidator();

  return useMutation({
    mutationFn: ({ commentId, payload }: ReportCommentVariables) =>
      moderationService.reportComment(commentId, payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useReviewIdeaReportMutation() {
  const invalidate = useModerationInvalidator();

  return useMutation({
    mutationFn: ({ id, payload }: ReviewReportVariables) =>
      moderationService.reviewIdeaReport(id, payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useReviewCommentReportMutation() {
  const invalidate = useModerationInvalidator();

  return useMutation({
    mutationFn: ({ id, payload }: ReviewReportVariables) =>
      moderationService.reviewCommentReport(id, payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useCreateIdeaReviewFeedbackMutation() {
  const invalidate = useModerationInvalidator();

  return useMutation({
    mutationFn: ({ ideaId, payload }: CreateIdeaReviewFeedbackVariables) =>
      moderationService.createIdeaReviewFeedback(ideaId, payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useReviewIdeaMutation() {
  const invalidate = useModerationInvalidator();

  return useMutation({
    mutationFn: ({ ideaId, payload }: ReviewIdeaVariables) =>
      moderationService.reviewIdea(ideaId, payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useDeleteCommentByModeratorMutation() {
  const invalidate = useModerationInvalidator();

  return useMutation({
    mutationFn: ({ commentId, payload }: ModerationCommentActionVariables) =>
      moderationService.deleteCommentByModerator(commentId, payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useRestoreCommentByModeratorMutation() {
  const invalidate = useModerationInvalidator();

  return useMutation({
    mutationFn: ({ commentId, payload }: ModerationCommentActionVariables) =>
      moderationService.restoreCommentByModerator(commentId, payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  communityService,
  type CreateExperienceReportInput,
  type NewsletterSubscribeInput,
  type NewsletterUnsubscribeInput,
  type UpdateExperienceReportInput,
} from "@/services/community.service";
import { communityQueryKeys } from "./use-community-queries";

type ReportIdVariables = {
  id: string;
};

type CreateExperienceReportVariables = {
  payload: CreateExperienceReportInput;
};

type UpdateExperienceReportVariables = {
  id: string;
  payload: UpdateExperienceReportInput;
};

function useCommunityInvalidator() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["ideas"] }),
    ]);
  };
}

export function useCreateExperienceReportMutation() {
  const invalidate = useCommunityInvalidator();

  return useMutation({
    mutationFn: ({ payload }: CreateExperienceReportVariables) =>
      communityService.createExperienceReport(payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useUpdateExperienceReportMutation() {
  const invalidate = useCommunityInvalidator();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateExperienceReportVariables) =>
      communityService.updateExperienceReport(id, payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useDeleteExperienceReportMutation() {
  const queryClient = useQueryClient();
  const invalidate = useCommunityInvalidator();

  return useMutation({
    mutationFn: ({ id }: ReportIdVariables) => communityService.deleteExperienceReport(id),
    onSuccess: async (_data, variables) => {
      await invalidate();
      queryClient.removeQueries({ queryKey: communityQueryKeys.experienceReport(variables.id) });
    },
  });
}

export function useApproveExperienceReportMutation() {
  const invalidate = useCommunityInvalidator();

  return useMutation({
    mutationFn: ({ id }: ReportIdVariables) => communityService.approveExperienceReport(id),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useRejectExperienceReportMutation() {
  const invalidate = useCommunityInvalidator();

  return useMutation({
    mutationFn: ({ id }: ReportIdVariables) => communityService.rejectExperienceReport(id),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useFeatureExperienceReportMutation() {
  const invalidate = useCommunityInvalidator();

  return useMutation({
    mutationFn: ({ id }: ReportIdVariables) => communityService.featureExperienceReport(id),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useMarkNotificationReadMutation() {
  const invalidate = useCommunityInvalidator();

  return useMutation({
    mutationFn: ({ id }: ReportIdVariables) => communityService.markNotificationRead(id),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const invalidate = useCommunityInvalidator();

  return useMutation({
    mutationFn: () => communityService.markAllNotificationsRead(),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();
  const invalidate = useCommunityInvalidator();

  return useMutation({
    mutationFn: ({ id }: ReportIdVariables) => communityService.deleteNotification(id),
    onSuccess: async (_data, variables) => {
      await invalidate();
      queryClient.removeQueries({ queryKey: communityQueryKeys.notification(variables.id) });
    },
  });
}

export function useSubscribeNewsletterMutation() {
  const invalidate = useCommunityInvalidator();

  return useMutation({
    mutationFn: (payload: NewsletterSubscribeInput) =>
      communityService.subscribeNewsletter(payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useUnsubscribeNewsletterMutation() {
  const invalidate = useCommunityInvalidator();

  return useMutation({
    mutationFn: (payload: NewsletterUnsubscribeInput) =>
      communityService.unsubscribeNewsletter(payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

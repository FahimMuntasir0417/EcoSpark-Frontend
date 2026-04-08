import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ideaService,
  type CreateIdeaAttachmentInput,
  type CreateIdeaInput,
  type CreateIdeaMediaInput,
  type RejectIdeaInput,
  type UpdateIdeaInput,
  type UpdateIdeaTagsInput,
} from "@/services/idea.service";
import { ideaQueryKeys } from "./use-ideas-query";

type IdeaIdVariables = {
  id: string;
};

type UpdateIdeaVariables = {
  id: string;
  payload: UpdateIdeaInput;
};

type RejectIdeaVariables = {
  id: string;
  payload: RejectIdeaInput;
};

type UpdateIdeaTagsVariables = {
  id: string;
  payload: UpdateIdeaTagsInput;
};

type AddIdeaAttachmentVariables = {
  id: string;
  payload: CreateIdeaAttachmentInput;
};

type DeleteIdeaAttachmentVariables = {
  id: string;
  attachmentId: string;
};

type AddIdeaMediaVariables = {
  id: string;
  payload: CreateIdeaMediaInput;
};

type DeleteIdeaMediaVariables = {
  id: string;
  mediaId: string;
};

function useIdeaCacheInvalidator() {
  const queryClient = useQueryClient();

  return async (ideaId?: string) => {
    if (ideaId) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ideaQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: ideaQueryKeys.detail(ideaId) }),
      ]);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ideaQueryKeys.all });
  };
}

export function useCreateIdeaMutation() {
  const invalidate = useIdeaCacheInvalidator();

  return useMutation({
    mutationFn: (payload: CreateIdeaInput) => ideaService.createIdea(payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useUpdateIdeaMutation() {
  const invalidate = useIdeaCacheInvalidator();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateIdeaVariables) =>
      ideaService.updateIdea(id, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

export function useDeleteIdeaMutation() {
  const queryClient = useQueryClient();
  const invalidate = useIdeaCacheInvalidator();

  return useMutation({
    mutationFn: ({ id }: IdeaIdVariables) => ideaService.deleteIdea(id),
    onSuccess: async (_data, variables) => {
      await invalidate();
      queryClient.removeQueries({ queryKey: ideaQueryKeys.detail(variables.id) });
    },
  });
}

export function useSubmitIdeaMutation() {
  const invalidate = useIdeaCacheInvalidator();

  return useMutation({
    mutationFn: ({ id }: IdeaIdVariables) => ideaService.submitIdea(id),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

export function useApproveIdeaMutation() {
  const invalidate = useIdeaCacheInvalidator();

  return useMutation({
    mutationFn: ({ id }: IdeaIdVariables) => ideaService.approveIdea(id),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

export function useRejectIdeaMutation() {
  const invalidate = useIdeaCacheInvalidator();

  return useMutation({
    mutationFn: ({ id, payload }: RejectIdeaVariables) =>
      ideaService.rejectIdea(id, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

export function useArchiveIdeaMutation() {
  const invalidate = useIdeaCacheInvalidator();

  return useMutation({
    mutationFn: ({ id }: IdeaIdVariables) => ideaService.archiveIdea(id),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

export function usePublishIdeaMutation() {
  const invalidate = useIdeaCacheInvalidator();

  return useMutation({
    mutationFn: ({ id }: IdeaIdVariables) => ideaService.publishIdea(id),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

export function useFeatureIdeaMutation() {
  const invalidate = useIdeaCacheInvalidator();

  return useMutation({
    mutationFn: ({ id }: IdeaIdVariables) => ideaService.featureIdea(id),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

export function useHighlightIdeaMutation() {
  const invalidate = useIdeaCacheInvalidator();

  return useMutation({
    mutationFn: ({ id }: IdeaIdVariables) => ideaService.highlightIdea(id),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

export function useUpdateIdeaTagsMutation() {
  const invalidate = useIdeaCacheInvalidator();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateIdeaTagsVariables) =>
      ideaService.updateIdeaTags(id, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

export function useAddIdeaAttachmentMutation() {
  const invalidate = useIdeaCacheInvalidator();

  return useMutation({
    mutationFn: ({ id, payload }: AddIdeaAttachmentVariables) =>
      ideaService.addIdeaAttachment(id, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

export function useDeleteIdeaAttachmentMutation() {
  const invalidate = useIdeaCacheInvalidator();

  return useMutation({
    mutationFn: ({ id, attachmentId }: DeleteIdeaAttachmentVariables) =>
      ideaService.deleteIdeaAttachment(id, attachmentId),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

export function useAddIdeaMediaMutation() {
  const invalidate = useIdeaCacheInvalidator();

  return useMutation({
    mutationFn: ({ id, payload }: AddIdeaMediaVariables) =>
      ideaService.addIdeaMedia(id, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

export function useDeleteIdeaMediaMutation() {
  const invalidate = useIdeaCacheInvalidator();

  return useMutation({
    mutationFn: ({ id, mediaId }: DeleteIdeaMediaVariables) =>
      ideaService.deleteIdeaMedia(id, mediaId),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}
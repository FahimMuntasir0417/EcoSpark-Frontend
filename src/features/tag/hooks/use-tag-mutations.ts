import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  tagService,
  type CreateTagInput,
  type UpdateTagInput,
} from "@/services/tag.service";
import { tagQueryKeys } from "./use-tags-query";

type TagIdVariables = {
  id: string;
};

type UpdateTagVariables = {
  id: string;
  payload: UpdateTagInput;
};

function useTagInvalidator() {
  const queryClient = useQueryClient();

  return async (tagId?: string) => {
    if (tagId) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tagQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: tagQueryKeys.detail(tagId) }),
        queryClient.invalidateQueries({ queryKey: ["ideas"] }),
      ]);
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["ideas"] }),
    ]);
  };
}

export function useCreateTagMutation() {
  const invalidate = useTagInvalidator();

  return useMutation({
    mutationFn: (payload: CreateTagInput) => tagService.createTag(payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useUpdateTagMutation() {
  const invalidate = useTagInvalidator();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateTagVariables) =>
      tagService.updateTag(id, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

export function useDeleteTagMutation() {
  const queryClient = useQueryClient();
  const invalidate = useTagInvalidator();

  return useMutation({
    mutationFn: ({ id }: TagIdVariables) => tagService.deleteTag(id),
    onSuccess: async (_data, variables) => {
      await invalidate();
      queryClient.removeQueries({ queryKey: tagQueryKeys.detail(variables.id) });
    },
  });
}
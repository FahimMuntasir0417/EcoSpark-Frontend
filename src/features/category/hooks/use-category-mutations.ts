import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  categoryService,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "@/services/category.service";
import { categoryQueryKeys } from "./use-categories-query";

type UpdateCategoryVariables = {
  id: string;
  payload: UpdateCategoryInput;
};

type DeleteCategoryVariables = {
  id: string;
};

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCategoryInput) =>
      categoryService.createCategory(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });
    },
  });
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateCategoryVariables) =>
      categoryService.updateCategory(id, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: categoryQueryKeys.detail(variables.id),
        }),
      ]);
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteCategoryVariables) =>
      categoryService.deleteCategory(id),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all }),
        queryClient.removeQueries({
          queryKey: categoryQueryKeys.detail(variables.id),
        }),
      ]);
    },
  });
}
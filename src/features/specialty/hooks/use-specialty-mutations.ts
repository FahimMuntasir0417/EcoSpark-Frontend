import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  specialtyService,
  type CreateSpecialtyInput,
  type UpdateSpecialtyInput,
} from "@/services/specialty.service";
import { specialtyQueryKeys } from "./use-specialties-query";

type SpecialtyIdVariables = {
  id: string;
};

type UpdateSpecialtyVariables = {
  id: string;
  payload: UpdateSpecialtyInput;
};

function useSpecialtyInvalidator() {
  const queryClient = useQueryClient();

  return async (specialtyId?: string) => {
    if (specialtyId) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: specialtyQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: specialtyQueryKeys.detail(specialtyId) }),
        queryClient.invalidateQueries({ queryKey: ["scientists"] }),
      ]);
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: specialtyQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["scientists"] }),
    ]);
  };
}

export function useCreateSpecialtyMutation() {
  const invalidate = useSpecialtyInvalidator();

  return useMutation({
    mutationFn: (payload: CreateSpecialtyInput) => specialtyService.createSpecialty(payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useUpdateSpecialtyMutation() {
  const invalidate = useSpecialtyInvalidator();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateSpecialtyVariables) =>
      specialtyService.updateSpecialty(id, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

export function useDeleteSpecialtyMutation() {
  const queryClient = useQueryClient();
  const invalidate = useSpecialtyInvalidator();

  return useMutation({
    mutationFn: ({ id }: SpecialtyIdVariables) => specialtyService.deleteSpecialty(id),
    onSuccess: async (_data, variables) => {
      await invalidate();
      queryClient.removeQueries({ queryKey: specialtyQueryKeys.detail(variables.id) });
    },
  });
}
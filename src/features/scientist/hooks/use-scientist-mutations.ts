import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  scientistService,
  type AssignScientistSpecialtiesInput,
  type CreateScientistInput,
  type UpdateScientistInput,
  type VerifyScientistInput,
} from "@/services/scientist.service";
import { scientistQueryKeys } from "./use-scientists-query";

type ScientistIdVariables = {
  id: string;
};

type UpdateScientistVariables = {
  id: string;
  payload: UpdateScientistInput;
};

type AssignScientistSpecialtiesVariables = {
  id: string;
  payload: AssignScientistSpecialtiesInput;
};

type RemoveScientistSpecialtyVariables = {
  id: string;
  specialtyId: string;
};

type VerifyScientistVariables = {
  id: string;
  payload: VerifyScientistInput;
};

function useScientistInvalidator() {
  const queryClient = useQueryClient();

  return async (scientistId?: string) => {
    if (scientistId) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: scientistQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: scientistQueryKeys.detail(scientistId) }),
      ]);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: scientistQueryKeys.all });
  };
}

export function useCreateScientistMutation() {
  const invalidate = useScientistInvalidator();

  return useMutation({
    mutationFn: (payload: CreateScientistInput) => scientistService.createScientist(payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useUpdateScientistMutation() {
  const invalidate = useScientistInvalidator();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateScientistVariables) =>
      scientistService.updateScientist(id, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

export function useAssignScientistSpecialtiesMutation() {
  const invalidate = useScientistInvalidator();

  return useMutation({
    mutationFn: ({ id, payload }: AssignScientistSpecialtiesVariables) =>
      scientistService.assignScientistSpecialties(id, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

export function useRemoveScientistSpecialtyMutation() {
  const invalidate = useScientistInvalidator();

  return useMutation({
    mutationFn: ({ id, specialtyId }: RemoveScientistSpecialtyVariables) =>
      scientistService.removeScientistSpecialty(id, specialtyId),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

export function useVerifyScientistMutation() {
  const invalidate = useScientistInvalidator();

  return useMutation({
    mutationFn: ({ id, payload }: VerifyScientistVariables) =>
      scientistService.verifyScientist(id, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

export function useDeleteScientistMutation() {
  const queryClient = useQueryClient();
  const invalidate = useScientistInvalidator();

  return useMutation({
    mutationFn: ({ id }: ScientistIdVariables) => scientistService.deleteScientist(id),
    onSuccess: async (_data, variables) => {
      await invalidate();
      queryClient.removeQueries({ queryKey: scientistQueryKeys.detail(variables.id) });
    },
  });
}
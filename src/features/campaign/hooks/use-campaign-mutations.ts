import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  campaignService,
  type CreateCampaignInput,
  type UpdateCampaignInput,
  type UpdateCampaignStatusInput,
} from "@/services/campaign.service";
import { campaignQueryKeys } from "./use-campaigns-query";

type CampaignIdVariables = {
  id: string;
};

type UpdateCampaignVariables = {
  id: string;
  payload: UpdateCampaignInput;
};

type UpdateCampaignStatusVariables = {
  id: string;
  payload: UpdateCampaignStatusInput;
};

function useCampaignInvalidator() {
  const queryClient = useQueryClient();

  return async (campaignId?: string) => {
    if (campaignId) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: campaignQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: campaignQueryKeys.detail(campaignId) }),
      ]);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: campaignQueryKeys.all });
  };
}

export function useCreateCampaignMutation() {
  const invalidate = useCampaignInvalidator();

  return useMutation({
    mutationFn: (payload: CreateCampaignInput) => campaignService.createCampaign(payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useUpdateCampaignMutation() {
  const invalidate = useCampaignInvalidator();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateCampaignVariables) =>
      campaignService.updateCampaign(id, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

export function useUpdateCampaignStatusMutation() {
  const invalidate = useCampaignInvalidator();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateCampaignStatusVariables) =>
      campaignService.updateCampaignStatus(id, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

export function useDeleteCampaignMutation() {
  const queryClient = useQueryClient();
  const invalidate = useCampaignInvalidator();

  return useMutation({
    mutationFn: ({ id }: CampaignIdVariables) => campaignService.deleteCampaign(id),
    onSuccess: async (_data, variables) => {
      await invalidate();
      queryClient.removeQueries({ queryKey: campaignQueryKeys.detail(variables.id) });
    },
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  commerceService,
  type CreateCheckoutSessionInput,
  type RefundPurchaseInput,
} from "@/services/commerce.service";
import { commerceQueryKeys } from "./use-commerce-queries";

type CreateCheckoutSessionVariables = {
  ideaId: string;
  payload?: CreateCheckoutSessionInput;
};

type PurchaseIdVariables = {
  id: string;
};

type RefundPurchaseVariables = {
  id: string;
  payload: RefundPurchaseInput;
};

function useCommerceInvalidator() {
  const queryClient = useQueryClient();

  return async (purchaseId?: string) => {
    const tasks: Promise<unknown>[] = [
      queryClient.invalidateQueries({ queryKey: commerceQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["ideas"] }),
    ];

    if (purchaseId) {
      tasks.push(
        queryClient.invalidateQueries({ queryKey: commerceQueryKeys.purchase(purchaseId) }),
      );
    }

    await Promise.all(tasks);
  };
}

export function useCreateCheckoutSessionMutation() {
  const invalidate = useCommerceInvalidator();

  return useMutation({
    mutationFn: ({ ideaId, payload }: CreateCheckoutSessionVariables) =>
      commerceService.createCheckoutSession(ideaId, payload),
    onSuccess: async (response) => {
      await invalidate(response.data.purchaseId);
    },
  });
}

export function useRefundPurchaseMutation() {
  const invalidate = useCommerceInvalidator();

  return useMutation({
    mutationFn: ({ id, payload }: RefundPurchaseVariables) =>
      commerceService.refundPurchase(id, payload),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

export function useCancelPurchaseMutation() {
  const invalidate = useCommerceInvalidator();

  return useMutation({
    mutationFn: ({ id }: PurchaseIdVariables) => commerceService.cancelPurchase(id),
    onSuccess: async (_data, variables) => {
      await invalidate(variables.id);
    },
  });
}

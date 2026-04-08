import { queryOptions, useQuery } from "@tanstack/react-query";
import { commerceService } from "@/services/commerce.service";

export const commerceQueryKeys = {
  all: ["commerce"] as const,
  purchases: (params?: Record<string, unknown>) =>
    [...commerceQueryKeys.all, "purchases", params ?? {}] as const,
  purchase: (id: string) => [...commerceQueryKeys.all, "purchase", id] as const,
  myPurchases: (params?: Record<string, unknown>) =>
    [...commerceQueryKeys.all, "my-purchases", params ?? {}] as const,
  transactions: (params?: Record<string, unknown>) =>
    [...commerceQueryKeys.all, "transactions", params ?? {}] as const,
  transaction: (id: string) =>
    [...commerceQueryKeys.all, "transaction", id] as const,
};

export function getPurchasesQueryOptions(params?: Record<string, unknown>) {
  return queryOptions({
    queryKey: commerceQueryKeys.purchases(params),
    queryFn: ({ signal }) => commerceService.getAllPurchases({ params, signal }),
  });
}

export function getPurchaseByIdQueryOptions(id: string) {
  return queryOptions({
    queryKey: commerceQueryKeys.purchase(id),
    queryFn: ({ signal }) => commerceService.getSinglePurchase(id, { signal }),
    enabled: Boolean(id),
  });
}

export function getMyPurchasesQueryOptions(params?: Record<string, unknown>) {
  return queryOptions({
    queryKey: commerceQueryKeys.myPurchases(params),
    queryFn: ({ signal }) => commerceService.getMyPurchases({ params, signal }),
  });
}

export function getTransactionsQueryOptions(params?: Record<string, unknown>) {
  return queryOptions({
    queryKey: commerceQueryKeys.transactions(params),
    queryFn: ({ signal }) => commerceService.getAllTransactions({ params, signal }),
  });
}

export function getTransactionByIdQueryOptions(id: string) {
  return queryOptions({
    queryKey: commerceQueryKeys.transaction(id),
    queryFn: ({ signal }) => commerceService.getSingleTransaction(id, { signal }),
    enabled: Boolean(id),
  });
}

export function usePurchasesQuery(params?: Record<string, unknown>) {
  return useQuery(getPurchasesQueryOptions(params));
}

export function usePurchaseByIdQuery(id: string) {
  return useQuery(getPurchaseByIdQueryOptions(id));
}

export function useMyPurchasesQuery(params?: Record<string, unknown>) {
  return useQuery(getMyPurchasesQueryOptions(params));
}

export function useTransactionsQuery(params?: Record<string, unknown>) {
  return useQuery(getTransactionsQueryOptions(params));
}

export function useTransactionByIdQuery(id: string) {
  return useQuery(getTransactionByIdQueryOptions(id));
}

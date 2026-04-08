import { queryOptions, useQuery } from "@tanstack/react-query";
import { scientistService } from "@/services/scientist.service";

export const scientistQueryKeys = {
  all: ["scientists"] as const,
  lists: () => [...scientistQueryKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...scientistQueryKeys.lists(), params ?? {}] as const,
  details: () => [...scientistQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...scientistQueryKeys.details(), id] as const,
  user: (userId: string) => [...scientistQueryKeys.all, "user", userId] as const,
};

export function getScientistsQueryOptions(params?: Record<string, unknown>) {
  return queryOptions({
    queryKey: scientistQueryKeys.list(params),
    queryFn: ({ signal }) => scientistService.getAllScientists({ params, signal }),
  });
}

export function getScientistByIdQueryOptions(id: string) {
  return queryOptions({
    queryKey: scientistQueryKeys.detail(id),
    queryFn: ({ signal }) => scientistService.getSingleScientist(id, { signal }),
    enabled: Boolean(id),
  });
}

export function getScientistByUserIdQueryOptions(userId: string) {
  return queryOptions({
    queryKey: scientistQueryKeys.user(userId),
    queryFn: ({ signal }) => scientistService.getScientistByUserId(userId, { signal }),
    enabled: Boolean(userId),
  });
}

export function useScientistsQuery(params?: Record<string, unknown>) {
  return useQuery(getScientistsQueryOptions(params));
}

export function useScientistByIdQuery(id: string) {
  return useQuery(getScientistByIdQueryOptions(id));
}

export function useScientistByUserIdQuery(userId: string) {
  return useQuery(getScientistByUserIdQueryOptions(userId));
}
import { queryOptions, useQuery } from "@tanstack/react-query";
import { specialtyService } from "@/services/specialty.service";

export const specialtyQueryKeys = {
  all: ["specialties"] as const,
  lists: () => [...specialtyQueryKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...specialtyQueryKeys.lists(), params ?? {}] as const,
  details: () => [...specialtyQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...specialtyQueryKeys.details(), id] as const,
};

export function getSpecialtiesQueryOptions(params?: Record<string, unknown>) {
  return queryOptions({
    queryKey: specialtyQueryKeys.list(params),
    queryFn: ({ signal }) => specialtyService.getAllSpecialties({ params, signal }),
  });
}

export function getSpecialtyByIdQueryOptions(id: string) {
  return queryOptions({
    queryKey: specialtyQueryKeys.detail(id),
    queryFn: ({ signal }) => specialtyService.getSingleSpecialty(id, { signal }),
    enabled: Boolean(id),
  });
}

export function useSpecialtiesQuery(params?: Record<string, unknown>) {
  return useQuery(getSpecialtiesQueryOptions(params));
}

export function useSpecialtyByIdQuery(id: string) {
  return useQuery(getSpecialtyByIdQueryOptions(id));
}
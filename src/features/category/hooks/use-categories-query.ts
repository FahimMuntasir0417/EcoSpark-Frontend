import { queryOptions, useQuery } from "@tanstack/react-query";
import { categoryService } from "@/services/category.service";

export const categoryQueryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryQueryKeys.all, "list"] as const,
  list: () => [...categoryQueryKeys.lists()] as const,
  details: () => [...categoryQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...categoryQueryKeys.details(), id] as const,
  slug: (slug: string) => [...categoryQueryKeys.all, "slug", slug] as const,
};

export function getCategoriesQueryOptions() {
  return queryOptions({
    queryKey: categoryQueryKeys.list(),
    queryFn: ({ signal }) => categoryService.getCategories({ signal }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // 10    minutes
  });
}

export function useCategoriesQuery() {
  return useQuery(getCategoriesQueryOptions());
}

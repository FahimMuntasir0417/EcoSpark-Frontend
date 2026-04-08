import { queryOptions, useQuery } from "@tanstack/react-query";
import { tagService } from "@/services/tag.service";

export const tagQueryKeys = {
  all: ["tags"] as const,
  lists: () => [...tagQueryKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...tagQueryKeys.lists(), params ?? {}] as const,
  details: () => [...tagQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...tagQueryKeys.details(), id] as const,
  slug: (slug: string) => [...tagQueryKeys.all, "slug", slug] as const,
};

export function getTagsQueryOptions(params?: Record<string, unknown>) {
  return queryOptions({
    queryKey: tagQueryKeys.list(params),
    queryFn: ({ signal }) => tagService.getAllTags({ params, signal }),
  });
}

export function getTagByIdQueryOptions(id: string) {
  return queryOptions({
    queryKey: tagQueryKeys.detail(id),
    queryFn: ({ signal }) => tagService.getSingleTag(id, { signal }),
    enabled: Boolean(id),
  });
}

export function getTagBySlugQueryOptions(slug: string) {
  return queryOptions({
    queryKey: tagQueryKeys.slug(slug),
    queryFn: ({ signal }) => tagService.getTagBySlug(slug, { signal }),
    enabled: Boolean(slug),
  });
}

export function useTagsQuery(params?: Record<string, unknown>) {
  return useQuery(getTagsQueryOptions(params));
}

export function useTagByIdQuery(id: string) {
  return useQuery(getTagByIdQueryOptions(id));
}

export function useTagBySlugQuery(slug: string) {
  return useQuery(getTagBySlugQueryOptions(slug));
}
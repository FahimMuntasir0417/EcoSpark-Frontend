import { queryOptions, useQuery } from "@tanstack/react-query";
import { ideaService } from "@/services/idea.service";

export const ideaQueryKeys = {
  all: ["ideas"] as const,
  lists: () => [...ideaQueryKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...ideaQueryKeys.lists(), params ?? {}] as const,
  details: () => [...ideaQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...ideaQueryKeys.details(), id] as const,
  slug: (slug: string) => [...ideaQueryKeys.all, "slug", slug] as const,
};

export function getIdeasQueryOptions(params?: Record<string, unknown>) {
  return queryOptions({
    queryKey: ideaQueryKeys.list(params),
    queryFn: ({ signal }) => ideaService.getAllIdeas({ params, signal }),
  });
}

export function getIdeaByIdQueryOptions(id: string) {
  return queryOptions({
    queryKey: ideaQueryKeys.detail(id),
    queryFn: ({ signal }) => ideaService.getSingleIdea(id, { signal }),
    enabled: Boolean(id),
  });
}

export function getIdeaBySlugQueryOptions(slug: string) {
  return queryOptions({
    queryKey: ideaQueryKeys.slug(slug),
    queryFn: ({ signal }) => ideaService.getIdeaBySlug(slug, { signal }),
    enabled: Boolean(slug),
  });
}

export function useIdeasQuery(params?: Record<string, unknown>) {
  return useQuery(getIdeasQueryOptions(params));
}

export function useIdeaByIdQuery(id: string) {
  return useQuery(getIdeaByIdQueryOptions(id));
}

export function useIdeaBySlugQuery(slug: string) {
  return useQuery(getIdeaBySlugQueryOptions(slug));
}
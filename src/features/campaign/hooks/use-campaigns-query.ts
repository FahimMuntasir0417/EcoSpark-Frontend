import { queryOptions, useQuery } from "@tanstack/react-query";
import { campaignService } from "@/services/campaign.service";

export const campaignQueryKeys = {
  all: ["campaigns"] as const,
  lists: () => [...campaignQueryKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) =>
    [...campaignQueryKeys.lists(), params ?? {}] as const,
  details: () => [...campaignQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...campaignQueryKeys.details(), id] as const,
  slug: (slug: string) => [...campaignQueryKeys.all, "slug", slug] as const,
  ideas: (id: string, params?: Record<string, unknown>) =>
    [...campaignQueryKeys.all, "ideas", id, params ?? {}] as const,
};

export function getCampaignsQueryOptions(params?: Record<string, unknown>) {
  return queryOptions({
    queryKey: campaignQueryKeys.list(params),
    queryFn: ({ signal }) => campaignService.getAllCampaigns({ params, signal }),
  });
}

export function getCampaignByIdQueryOptions(id: string) {
  return queryOptions({
    queryKey: campaignQueryKeys.detail(id),
    queryFn: ({ signal }) => campaignService.getSingleCampaign(id, { signal }),
    enabled: Boolean(id),
  });
}

export function getCampaignBySlugQueryOptions(slug: string) {
  return queryOptions({
    queryKey: campaignQueryKeys.slug(slug),
    queryFn: ({ signal }) => campaignService.getCampaignBySlug(slug, { signal }),
    enabled: Boolean(slug),
  });
}

export function getCampaignIdeasQueryOptions(
  id: string,
  params?: Record<string, unknown>,
) {
  return queryOptions({
    queryKey: campaignQueryKeys.ideas(id, params),
    queryFn: ({ signal }) => campaignService.getCampaignIdeas(id, { params, signal }),
    enabled: Boolean(id),
  });
}

export function useCampaignsQuery(params?: Record<string, unknown>) {
  return useQuery(getCampaignsQueryOptions(params));
}

export function useCampaignByIdQuery(id: string) {
  return useQuery(getCampaignByIdQueryOptions(id));
}

export function useCampaignBySlugQuery(slug: string) {
  return useQuery(getCampaignBySlugQueryOptions(slug));
}

export function useCampaignIdeasQuery(id: string, params?: Record<string, unknown>) {
  return useQuery(getCampaignIdeasQueryOptions(id, params));
}

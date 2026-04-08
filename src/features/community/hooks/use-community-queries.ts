import { queryOptions, useQuery } from "@tanstack/react-query";
import { communityService } from "@/services/community.service";

export const communityQueryKeys = {
  all: ["community"] as const,
  experienceReports: (params?: Record<string, unknown>) =>
    [...communityQueryKeys.all, "experience-reports", params ?? {}] as const,
  experienceReport: (id: string) =>
    [...communityQueryKeys.all, "experience-report", id] as const,
  ideaExperienceReports: (ideaId: string, params?: Record<string, unknown>) =>
    [...communityQueryKeys.all, "idea", ideaId, "experience-reports", params ?? {}] as const,
  notifications: (params?: Record<string, unknown>) =>
    [...communityQueryKeys.all, "notifications", params ?? {}] as const,
  notification: (id: string) => [...communityQueryKeys.all, "notification", id] as const,
  newsletterSubscriptions: (params?: Record<string, unknown>) =>
    [...communityQueryKeys.all, "newsletter", "subscriptions", params ?? {}] as const,
};

export function getExperienceReportsQueryOptions(params?: Record<string, unknown>) {
  return queryOptions({
    queryKey: communityQueryKeys.experienceReports(params),
    queryFn: ({ signal }) => communityService.getAllExperienceReports({ params, signal }),
  });
}

export function getExperienceReportByIdQueryOptions(id: string) {
  return queryOptions({
    queryKey: communityQueryKeys.experienceReport(id),
    queryFn: ({ signal }) => communityService.getSingleExperienceReport(id, { signal }),
    enabled: Boolean(id),
  });
}

export function getIdeaExperienceReportsQueryOptions(
  ideaId: string,
  params?: Record<string, unknown>,
) {
  return queryOptions({
    queryKey: communityQueryKeys.ideaExperienceReports(ideaId, params),
    queryFn: ({ signal }) =>
      communityService.getIdeaExperienceReports(ideaId, { params, signal }),
    enabled: Boolean(ideaId),
  });
}

export function getNotificationsQueryOptions(params?: Record<string, unknown>) {
  return queryOptions({
    queryKey: communityQueryKeys.notifications(params),
    queryFn: ({ signal }) => communityService.getMyNotifications({ params, signal }),
  });
}

export function getNotificationByIdQueryOptions(id: string) {
  return queryOptions({
    queryKey: communityQueryKeys.notification(id),
    queryFn: ({ signal }) => communityService.getSingleNotification(id, { signal }),
    enabled: Boolean(id),
  });
}

export function getNewsletterSubscriptionsQueryOptions(
  params?: Record<string, unknown>,
) {
  return queryOptions({
    queryKey: communityQueryKeys.newsletterSubscriptions(params),
    queryFn: ({ signal }) =>
      communityService.getNewsletterSubscriptions({ params, signal }),
  });
}

export function useExperienceReportsQuery(params?: Record<string, unknown>) {
  return useQuery(getExperienceReportsQueryOptions(params));
}

export function useExperienceReportByIdQuery(id: string) {
  return useQuery(getExperienceReportByIdQueryOptions(id));
}

export function useIdeaExperienceReportsQuery(
  ideaId: string,
  params?: Record<string, unknown>,
) {
  return useQuery(getIdeaExperienceReportsQueryOptions(ideaId, params));
}

export function useNotificationsQuery(params?: Record<string, unknown>) {
  return useQuery(getNotificationsQueryOptions(params));
}

export function useNotificationByIdQuery(id: string) {
  return useQuery(getNotificationByIdQueryOptions(id));
}

export function useNewsletterSubscriptionsQuery(params?: Record<string, unknown>) {
  return useQuery(getNewsletterSubscriptionsQueryOptions(params));
}

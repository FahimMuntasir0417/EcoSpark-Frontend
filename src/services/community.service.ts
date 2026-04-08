import { z } from "zod";
import { httpClient } from "@/lib/axios/httpClient";
import { parseApiData, parseApiPayload } from "@/lib/api/parse";
import {
  createExperienceReportInputSchema,
  experienceReportSchema,
  newsletterSubscribeInputSchema,
  newsletterSubscriptionSchema,
  newsletterUnsubscribeInputSchema,
  notificationSchema,
  updateExperienceReportInputSchema,
} from "@/contracts/community.contract";
import { nullSchema } from "@/contracts/common";
import type {
  CreateExperienceReportInput,
  ExperienceReport,
  NewsletterSubscribeInput,
  NewsletterSubscription,
  NewsletterUnsubscribeInput,
  Notification,
  UpdateExperienceReportInput,
} from "@/contracts/community.contract";

export type {
  CreateExperienceReportInput,
  ExperienceReport,
  NewsletterSubscribeInput,
  NewsletterSubscription,
  NewsletterUnsubscribeInput,
  Notification,
  UpdateExperienceReportInput,
};

export type CommunityQueryOptions = {
  params?: Record<string, unknown>;
  signal?: AbortSignal;
};

const experienceReportListSchema = z.array(experienceReportSchema);
const notificationListSchema = z.array(notificationSchema);
const newsletterSubscriptionListSchema = z.array(newsletterSubscriptionSchema);
const actionResultSchema = z.record(z.string(), z.unknown());

export const communityService = {
  async createExperienceReport(payload: CreateExperienceReportInput) {
    const parsedPayload = parseApiPayload(payload, createExperienceReportInputSchema);
    const response = await httpClient.post<unknown>("/community/experience-reports", parsedPayload);
    return parseApiData(response, experienceReportSchema);
  },

  async getAllExperienceReports(options: CommunityQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/community/experience-reports", {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, experienceReportListSchema);
  },

  async getSingleExperienceReport(id: string, options: CommunityQueryOptions = {}) {
    const response = await httpClient.get<unknown>(
      `/community/experience-reports/${encodeURIComponent(id)}`,
      {
        params: options.params,
        signal: options.signal,
      },
    );
    return parseApiData(response, experienceReportSchema);
  },

  async getIdeaExperienceReports(ideaId: string, options: CommunityQueryOptions = {}) {
    const response = await httpClient.get<unknown>(
      `/community/ideas/${encodeURIComponent(ideaId)}/experience-reports`,
      {
        params: options.params,
        signal: options.signal,
      },
    );
    return parseApiData(response, experienceReportListSchema);
  },

  async updateExperienceReport(id: string, payload: UpdateExperienceReportInput) {
    const parsedPayload = parseApiPayload(payload, updateExperienceReportInputSchema);
    const response = await httpClient.patch<unknown>(
      `/community/experience-reports/${encodeURIComponent(id)}`,
      parsedPayload,
    );
    return parseApiData(response, experienceReportSchema);
  },

  async deleteExperienceReport(id: string) {
    const response = await httpClient.delete<unknown>(`/community/experience-reports/${encodeURIComponent(id)}`);
    return parseApiData(response, nullSchema);
  },

  async approveExperienceReport(id: string) {
    const response = await httpClient.patch<unknown>(
      `/community/experience-reports/${encodeURIComponent(id)}/approve`,
      {},
    );
    return parseApiData(response, experienceReportSchema);
  },

  async rejectExperienceReport(id: string) {
    const response = await httpClient.patch<unknown>(
      `/community/experience-reports/${encodeURIComponent(id)}/reject`,
      {},
    );
    return parseApiData(response, experienceReportSchema);
  },

  async featureExperienceReport(id: string) {
    const response = await httpClient.patch<unknown>(
      `/community/experience-reports/${encodeURIComponent(id)}/feature`,
      {},
    );
    return parseApiData(response, experienceReportSchema);
  },

  async getMyNotifications(options: CommunityQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/community/notifications", {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, notificationListSchema);
  },

  async getSingleNotification(id: string, options: CommunityQueryOptions = {}) {
    const response = await httpClient.get<unknown>(`/community/notifications/${encodeURIComponent(id)}`, {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, notificationSchema);
  },

  async markNotificationRead(id: string) {
    const response = await httpClient.patch<unknown>(
      `/community/notifications/${encodeURIComponent(id)}/read`,
      {},
    );
    return parseApiData(response, notificationSchema);
  },

  async markAllNotificationsRead() {
    const response = await httpClient.patch<unknown>(
      "/community/notifications/read-all",
      {},
    );
    return parseApiData(response, actionResultSchema);
  },

  async deleteNotification(id: string) {
    const response = await httpClient.delete<unknown>(`/community/notifications/${encodeURIComponent(id)}`);
    return parseApiData(response, nullSchema);
  },

  async subscribeNewsletter(payload: NewsletterSubscribeInput) {
    const parsedPayload = parseApiPayload(payload, newsletterSubscribeInputSchema);
    const response = await httpClient.post<unknown>(
      "/community/newsletter/subscribe",
      parsedPayload,
    );
    return parseApiData(response, newsletterSubscriptionSchema);
  },

  async unsubscribeNewsletter(payload: NewsletterUnsubscribeInput) {
    const parsedPayload = parseApiPayload(payload, newsletterUnsubscribeInputSchema);
    const response = await httpClient.post<unknown>(
      "/community/newsletter/unsubscribe",
      parsedPayload,
    );
    return parseApiData(response, actionResultSchema);
  },

  async getNewsletterSubscriptions(options: CommunityQueryOptions = {}) {
    const response = await httpClient.get<unknown>(
      "/community/newsletter/subscriptions",
      {
        params: options.params,
        signal: options.signal,
      },
    );
    return parseApiData(response, newsletterSubscriptionListSchema);
  },
};

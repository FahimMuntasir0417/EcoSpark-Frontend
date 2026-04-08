import { z } from "zod";
import { httpClient } from "@/lib/axios/httpClient";
import { parseApiData, parseApiPayload } from "@/lib/api/parse";
import {
  paymentWebhookInputSchema,
  purchaseIdeaInputSchema,
  purchaseSchema,
  refundPurchaseInputSchema,
  transactionSchema,
} from "@/contracts/commerce.contract";
import type {
  PaymentWebhookInput,
  Purchase,
  PurchaseIdeaInput,
  RefundPurchaseInput,
  Transaction,
} from "@/contracts/commerce.contract";

export type {
  PaymentWebhookInput,
  Purchase,
  PurchaseIdeaInput,
  RefundPurchaseInput,
  Transaction,
};

export type CommerceQueryOptions = {
  params?: Record<string, unknown>;
  signal?: AbortSignal;
};

const purchaseListSchema = z.array(purchaseSchema);
const transactionListSchema = z.array(transactionSchema);
const webhookResultSchema = z.record(z.string(), z.unknown());

export const commerceService = {
  async purchaseIdea(ideaId: string, payload: PurchaseIdeaInput) {
    const parsedPayload = parseApiPayload(payload, purchaseIdeaInputSchema);
    const response = await httpClient.post<unknown>(
      `/commerce/ideas/${encodeURIComponent(ideaId)}/purchase`,
      parsedPayload,
    );
    return parseApiData(response, purchaseSchema);
  },

  async getAllPurchases(options: CommerceQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/commerce/purchases", {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, purchaseListSchema);
  },

  async getSinglePurchase(id: string, options: CommerceQueryOptions = {}) {
    const response = await httpClient.get<unknown>(`/commerce/purchases/${encodeURIComponent(id)}`, {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, purchaseSchema);
  },

  async getMyPurchases(options: CommerceQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/commerce/users/me/purchases", {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, purchaseListSchema);
  },

  async refundPurchase(id: string, payload: RefundPurchaseInput) {
    const parsedPayload = parseApiPayload(payload, refundPurchaseInputSchema);
    const response = await httpClient.patch<unknown>(
      `/commerce/purchases/${encodeURIComponent(id)}/refund`,
      parsedPayload,
    );
    return parseApiData(response, purchaseSchema);
  },

  async cancelPurchase(id: string) {
    const response = await httpClient.patch<unknown>(
      `/commerce/purchases/${encodeURIComponent(id)}/cancel`,
      {},
    );
    return parseApiData(response, purchaseSchema);
  },

  async getAllTransactions(options: CommerceQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/commerce/transactions", {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, transactionListSchema);
  },

  async getSingleTransaction(id: string, options: CommerceQueryOptions = {}) {
    const response = await httpClient.get<unknown>(
      `/commerce/transactions/${encodeURIComponent(id)}`,
      {
        params: options.params,
        signal: options.signal,
      },
    );
    return parseApiData(response, transactionSchema);
  },

  async paymentWebhook(payload: PaymentWebhookInput) {
    const parsedPayload = parseApiPayload(payload, paymentWebhookInputSchema);
    const response = await httpClient.post<unknown>(
      "/commerce/payments/webhook",
      parsedPayload,
    );
    return parseApiData(response, webhookResultSchema);
  },
};

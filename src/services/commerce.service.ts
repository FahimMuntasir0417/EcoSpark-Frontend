import { z } from "zod";
import { httpClient } from "@/lib/axios/httpClient";
import { parseApiData, parseApiPayload } from "@/lib/api/parse";
import {
  checkoutSessionSchema,
  createCheckoutSessionInputSchema,
  purchaseSchema,
  refundPurchaseInputSchema,
  transactionSchema,
} from "@/contracts/commerce.contract";
import type {
  CheckoutSession,
  CreateCheckoutSessionInput,
  Purchase,
  RefundPurchaseInput,
  Transaction,
} from "@/contracts/commerce.contract";

export type {
  CheckoutSession,
  CreateCheckoutSessionInput,
  Purchase,
  RefundPurchaseInput,
  Transaction,
};

export type CommerceQueryOptions = {
  params?: Record<string, unknown>;
  signal?: AbortSignal;
};

const purchaseListSchema = z.array(purchaseSchema);
const transactionListSchema = z.array(transactionSchema);

export const commerceService = {
  async createCheckoutSession(
    ideaId: string,
    payload: CreateCheckoutSessionInput = {},
  ) {
    const parsedPayload = parseApiPayload(payload, createCheckoutSessionInputSchema);
    const response = await httpClient.post<unknown>(
      `/commerce/ideas/${encodeURIComponent(ideaId)}/checkout-session`,
      parsedPayload,
    );
    return parseApiData(response, checkoutSessionSchema);
  },

  async getAllPurchases(options: CommerceQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/commerce/purchases", {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, purchaseListSchema);
  },

  async getSinglePurchase(id: string, options: CommerceQueryOptions = {}) {
    const response = await httpClient.get<unknown>(
      `/commerce/purchases/${encodeURIComponent(id)}`,
      {
        params: options.params,
        signal: options.signal,
      },
    );
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
};

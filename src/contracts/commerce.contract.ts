import { z } from "zod";
import { idSchema } from "./common";

export const purchaseSchema = z
  .object({
    id: idSchema,
    ideaId: z.string().optional(),
    status: z.string().optional(),
    amount: z.number().optional(),
    currency: z.string().optional(),
  })
  .passthrough();

export const transactionSchema = z
  .object({
    id: idSchema,
    purchaseId: z.string().optional(),
    status: z.string().optional(),
    amount: z.number().optional(),
    currency: z.string().optional(),
  })
  .passthrough();

export const purchaseIdeaInputSchema = z
  .object({
    paymentProvider: z.string().min(1),
    currency: z.string().optional(),
  })
  .passthrough();

export const refundPurchaseInputSchema = z
  .object({
    reason: z.string().optional(),
  })
  .passthrough();

export const paymentWebhookInputSchema = z
  .object({
    purchaseId: z.string().optional(),
    transactionId: z.string().optional(),
    provider: z.string().optional(),
    status: z.string().optional(),
    amount: z.number().optional(),
    currency: z.string().optional(),
    providerPaymentId: z.string().optional(),
    gatewayResponse: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export type Purchase = z.infer<typeof purchaseSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type PurchaseIdeaInput = z.infer<typeof purchaseIdeaInputSchema>;
export type RefundPurchaseInput = z.infer<typeof refundPurchaseInputSchema>;
export type PaymentWebhookInput = z.infer<typeof paymentWebhookInputSchema>;

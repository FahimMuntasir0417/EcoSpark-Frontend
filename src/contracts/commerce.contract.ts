import { z } from "zod";
import { idSchema } from "./common";

export const purchaseStatusSchema = z.enum([
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
]);

const purchaseIdeaSummarySchema = z
  .object({
    id: idSchema,
    title: z.string().optional(),
    slug: z.string().optional(),
  })
  .passthrough();

export const purchaseSchema = z
  .object({
    id: idSchema,
    ideaId: z.string().optional(),
    status: z.union([purchaseStatusSchema, z.string()]).optional(),
    amount: z.union([z.number(), z.string()]).optional(),
    currency: z.string().optional(),
    paidAt: z.string().nullable().optional(),
    refundedAt: z.string().nullable().optional(),
    idea: purchaseIdeaSummarySchema.nullable().optional(),
  })
  .passthrough();

export const transactionSchema = z
  .object({
    id: idSchema,
    purchaseId: z.string().optional(),
    status: z.union([purchaseStatusSchema, z.string()]).optional(),
    amount: z.union([z.number(), z.string()]).optional(),
    currency: z.string().optional(),
  })
  .passthrough();

export const createCheckoutSessionInputSchema = z
  .object({
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
  })
  .passthrough();

export const checkoutSessionSchema = z
  .object({
    purchaseId: idSchema,
    checkoutUrl: z.string().url(),
    sessionId: z.string().min(1),
    publishableKey: z.string().nullable().optional(),
  })
  .passthrough();

export const refundPurchaseInputSchema = z
  .object({
    reason: z.string().optional(),
  })
  .passthrough();

export type PurchaseStatus = z.infer<typeof purchaseStatusSchema>;
export type Purchase = z.infer<typeof purchaseSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionInputSchema>;
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;
export type RefundPurchaseInput = z.infer<typeof refundPurchaseInputSchema>;

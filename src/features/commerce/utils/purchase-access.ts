import type { Purchase } from "@/services/commerce.service";

export function isPaidIdeaAccessType(accessType?: string | null) {
  return accessType?.trim().toUpperCase() === "PAID";
}

export function getPurchaseIdeaId(purchase: Purchase) {
  const record = purchase as unknown as Record<string, unknown>;
  const nestedIdea =
    record.idea && typeof record.idea === "object"
      ? (record.idea as Record<string, unknown>)
      : null;

  return (
    (typeof purchase.ideaId === "string" && purchase.ideaId) ||
    (nestedIdea && typeof nestedIdea.id === "string" && nestedIdea.id) ||
    ""
  );
}

export function getCurrentPurchaseForIdea(
  purchases: Purchase[],
  ideaId: string,
) {
  const relatedPurchases = purchases.filter(
    (purchase) => getPurchaseIdeaId(purchase) === ideaId,
  );

  return (
    relatedPurchases.find((purchase) => purchase.status === "PAID") ??
    relatedPurchases.find((purchase) => purchase.status === "PENDING") ??
    relatedPurchases[0] ??
    null
  );
}

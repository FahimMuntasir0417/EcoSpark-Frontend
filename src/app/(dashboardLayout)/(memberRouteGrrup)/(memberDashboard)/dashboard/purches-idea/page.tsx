"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCancelPurchaseMutation,
  useMyPurchasesQuery,
  usePurchaseIdeaMutation,
} from "@/features/commerce";
import { useIdeasQuery } from "@/features/idea";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import type { Idea } from "@/services/idea.service";

type Feedback = {
  type: "success" | "error";
  text: string;
} | null;

function getIdeaTitle(idea: Idea) {
  return typeof idea.title === "string" && idea.title.trim()
    ? idea.title
    : "Untitled idea";
}

function getIdeaPrice(idea: Idea) {
  if (typeof idea.price === "number") {
    return idea.price;
  }

  if (typeof idea.price === "string") {
    const parsed = Number(idea.price);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function formatCurrency(amount: number | null, currency?: string | null) {
  if (amount === null) {
    return "Price unavailable";
  }

  return `${amount} ${currency || "USD"}`;
}

function formatLabel(value?: string | null, fallback = "N/A") {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function PurchesIdeaPage() {
  const purchasesQuery = useMyPurchasesQuery();
  const ideasQuery = useIdeasQuery();
  const purchaseIdeaMutation = usePurchaseIdeaMutation();
  const cancelPurchaseMutation = useCancelPurchaseMutation();

  const [paymentProvider, setPaymentProvider] = useState("STRIPE");
  const [currency, setCurrency] = useState("USD");
  const [feedback, setFeedback] = useState<Feedback>(null);

  if (purchasesQuery.isPending || ideasQuery.isPending) {
    return (
      <LoadingState
        title="Loading purchases"
        description="Fetching your purchases and available ideas."
      />
    );
  }

  if (purchasesQuery.isError || ideasQuery.isError) {
    return (
      <ErrorState
        title="Could not load purchases"
        description={getApiErrorMessage(purchasesQuery.error ?? ideasQuery.error)}
        onRetry={() => {
          void purchasesQuery.refetch();
          void ideasQuery.refetch();
        }}
      />
    );
  }

  const purchases = purchasesQuery.data?.data ?? [];
  const ideas = ideasQuery.data?.data ?? [];
  const ideaMap = new Map(ideas.map((idea) => [idea.id, idea]));

  const onPurchase = async (ideaId: string) => {
    setFeedback(null);

    try {
      const response = await purchaseIdeaMutation.mutateAsync({
        ideaId,
        payload: {
          paymentProvider: paymentProvider.trim() || "STRIPE",
          currency: currency.trim() || undefined,
        },
      });

      setFeedback({
        type: "success",
        text: response.message || "Purchase request created successfully.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(error),
      });
    }
  };

  const onCancelPurchase = async (purchaseId: string) => {
    setFeedback(null);

    try {
      const response = await cancelPurchaseMutation.mutateAsync({ id: purchaseId });
      setFeedback({
        type: "success",
        text: response.message || "Purchase cancelled successfully.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(error),
      });
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Purchase Ideas</h2>
        <p className="text-sm text-muted-foreground">
          Configure a provider, purchase an idea, and review your purchase history.
        </p>
      </div>

      {feedback ? (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            feedback.type === "success"
              ? "border-green-300 text-green-700"
              : "border-red-300 text-red-700"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}

      <form
        className="grid gap-3 rounded-xl border bg-background p-4 md:max-w-xl md:grid-cols-2"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
        }}
      >
        <Input
          placeholder="Payment provider"
          value={paymentProvider}
          onChange={(event) => setPaymentProvider(event.target.value)}
        />
        <Input
          placeholder="Currency"
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}
        />
      </form>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Available Ideas</h3>

        {ideas.length === 0 ? (
          <EmptyState title="No ideas available for purchase" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Idea</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ideas.map((idea) => {
                const isPurchasing =
                  purchaseIdeaMutation.isPending &&
                  purchaseIdeaMutation.variables?.ideaId === idea.id;

                return (
                  <TableRow key={idea.id}>
                    <TableCell className="min-w-72">
                      <div className="space-y-1">
                        <p className="font-medium text-slate-950">{getIdeaTitle(idea)}</p>
                        <p className="text-sm text-slate-600">
                          {idea.excerpt ?? idea.description ?? "No summary available."}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatLabel(idea.status, "Unknown")}</TableCell>
                    <TableCell>{formatLabel(idea.accessType, "Unknown")}</TableCell>
                    <TableCell>{formatCurrency(getIdeaPrice(idea), idea.currency)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/idea/${idea.id}`}
                          className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                        >
                          View
                        </Link>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isPurchasing || !paymentProvider.trim()}
                          onClick={() => {
                            void onPurchase(idea.id);
                          }}
                        >
                          {isPurchasing ? "Purchasing..." : "Purchase"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">My Purchases</h3>

        {purchases.length === 0 ? (
          <EmptyState title="No purchases yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Idea</TableHead>
                <TableHead>Purchase ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => {
                const idea = typeof purchase.ideaId === "string" ? ideaMap.get(purchase.ideaId) : undefined;
                const isCancelling =
                  cancelPurchaseMutation.isPending &&
                  cancelPurchaseMutation.variables?.id === purchase.id;
                const purchaseStatus = typeof purchase.status === "string" ? purchase.status : "UNKNOWN";
                const canCancel = !purchaseStatus.toLowerCase().includes("cancel");

                return (
                  <TableRow key={purchase.id}>
                    <TableCell className="min-w-72">
                      <div className="space-y-1">
                        <p className="font-medium text-slate-950">
                          {idea ? getIdeaTitle(idea) : purchase.ideaId ?? "Purchase"}
                        </p>
                        {idea?.description ? (
                          <p className="text-sm text-slate-600">{idea.description}</p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{purchase.id}</TableCell>
                    <TableCell>{formatLabel(purchaseStatus, "Unknown")}</TableCell>
                    <TableCell>{formatCurrency(purchase.amount ?? null, purchase.currency)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {purchase.ideaId ? (
                          <Link
                            href={`/idea/${purchase.ideaId}`}
                            className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                          >
                            View
                          </Link>
                        ) : null}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isCancelling || !canCancel}
                          onClick={() => {
                            void onCancelPurchase(purchase.id);
                          }}
                        >
                          {isCancelling ? "Cancelling..." : canCancel ? "Cancel" : "Locked"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>
    </section>
  );
}

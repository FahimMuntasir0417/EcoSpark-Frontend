"use client";

import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import {
  getMyPurchasesQueryOptions,
  useCreateCheckoutSessionMutation,
} from "@/features/commerce";
import {
  getCurrentPurchaseForIdea,
  isPaidIdeaAccessType,
} from "@/features/commerce/utils/purchase-access";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import type { Idea } from "@/services/idea.service";

type Feedback = {
  type: "success" | "error";
  text: string;
} | null;

type IdeaPurchasePanelProps = {
  idea: Idea;
  isAuthenticated: boolean;
  hasBrowserAuthIssue: boolean;
};

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function formatBadgeLabel(value?: string | null) {
  if (!hasText(value)) {
    return "Unknown";
  }

  return value!
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

  const resolvedCurrency = hasText(currency) ? currency!.trim().toUpperCase() : "USD";
  return `${amount.toLocaleString()} ${resolvedCurrency}`;
}

function FeedbackBanner({ feedback }: { feedback: Feedback }) {
  if (!feedback) {
    return null;
  }

  return (
    <p
      className={
        feedback.type === "success"
          ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          : "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      }
    >
      {feedback.text}
    </p>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function GuestPrompt({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

export function IdeaPurchasePanel({
  idea,
  isAuthenticated,
  hasBrowserAuthIssue,
}: IdeaPurchasePanelProps) {
  const searchParams = useSearchParams();
  const purchasesQuery = useQuery({
    ...getMyPurchasesQueryOptions(),
    enabled: isAuthenticated,
  });
  const createCheckoutSessionMutation = useCreateCheckoutSessionMutation();
  const [feedback, setFeedback] = useState<Feedback>(null);

  const checkoutState = searchParams.get("checkout");
  const isPaidIdea = isPaidIdeaAccessType(idea.accessType);
  const ideaPrice = getIdeaPrice(idea);
  const purchases = purchasesQuery.data?.data ?? [];
  const currentPurchase = getCurrentPurchaseForIdea(purchases, idea.id);
  const purchaseStatus = typeof currentPurchase?.status === "string" ? currentPurchase.status : null;
  const isPurchased = purchaseStatus === "PAID";
  const hasPendingCheckout = purchaseStatus === "PENDING";
  const isCheckoutBusy = createCheckoutSessionMutation.isPending;
  const purchaseStatusHref = currentPurchase
    ? `/payments/success?purchaseId=${encodeURIComponent(currentPurchase.id)}`
    : null;

  if (!isPaidIdea) {
    return null;
  }

  const startCheckout = async () => {
    setFeedback(null);

    if (hasBrowserAuthIssue) {
      setFeedback({
        type: "error",
        text: "Your browser session is out of sync. Log out and sign in again before starting checkout.",
      });
      return;
    }

    if (!isAuthenticated) {
      setFeedback({
        type: "error",
        text: "Log in before purchasing paid ideas.",
      });
      return;
    }

    if (isPurchased) {
      setFeedback({
        type: "success",
        text: "You already purchased this idea.",
      });
      return;
    }

    if (hasPendingCheckout) {
      setFeedback({
        type: "error",
        text: "A Stripe checkout session is already pending for this idea. Open the payment status page instead of creating another one.",
      });
      return;
    }

    try {
      const response = await createCheckoutSessionMutation.mutateAsync({
        ideaId: idea.id,
        payload: {},
      });

      window.location.assign(response.data.checkoutUrl);
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(error),
      });
    }
  };

  return (
    <section className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Purchase Access</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
            This idea uses paid access. Start a Stripe checkout session to unlock it.
          </p>
        </div>
        <span
          className={
            isPurchased
              ? "inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800"
              : "inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800"
          }
        >
          {isPurchased ? "Purchased" : "Paid idea"}
        </span>
      </div>

      {checkoutState === "cancelled" ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Stripe checkout was cancelled before payment completed.
        </p>
      ) : null}

      <FeedbackBanner feedback={feedback} />

      {isAuthenticated && purchasesQuery.isPending ? (
        <LoadingState
          rows={2}
          title="Loading purchase status"
          description="Checking whether you already purchased this idea."
        />
      ) : null}

      {isAuthenticated && purchasesQuery.isError ? (
        <ErrorState
          title="Could not load your purchase status"
          description={getApiErrorMessage(purchasesQuery.error)}
          onRetry={() => {
            void purchasesQuery.refetch();
          }}
        />
      ) : null}

      {!isAuthenticated || !purchasesQuery.isError ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Access summary
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">
                {hasText(idea.title) ? idea.title : "Paid idea"}
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Complete checkout to purchase access. After Stripe redirects back, the frontend will verify the purchase state against the backend.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Access" value={formatBadgeLabel(idea.accessType)} />
              <StatCard label="Price" value={formatCurrency(ideaPrice, idea.currency)} />
              <StatCard
                label="Status"
                value={purchaseStatus ? formatBadgeLabel(purchaseStatus) : "Not purchased"}
              />
            </div>

            {hasPendingCheckout && purchaseStatusHref ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                <p className="font-semibold">A checkout is already pending</p>
                <p className="mt-2">
                  If you already completed payment, open the payment status page and wait for the webhook to update the purchase.
                </p>
                <Link
                  href={purchaseStatusHref}
                  className="mt-3 inline-flex text-sm font-medium text-amber-900 underline underline-offset-4"
                >
                  View payment status
                </Link>
              </div>
            ) : null}

            {isPurchased ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                <p className="font-semibold">You already purchased this idea</p>
                <p className="mt-2">
                  Your payment has been recorded as paid. You can reopen the payment status page if you need the purchase reference.
                </p>
              </div>
            ) : null}
          </div>

          <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <CreditCard className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Stripe checkout</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Redirect to Stripe&apos;s hosted checkout page and verify the purchase after redirect.
                </p>
              </div>
            </div>

            {!isAuthenticated ? (
              <GuestPrompt
                title="Sign in to purchase"
                description="Paid ideas require a signed-in account so the completed purchase can be attached to your profile."
              />
            ) : (
              <>
                {hasBrowserAuthIssue ? (
                  <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Your page session is active, but browser API auth is missing. Log out and sign in again before starting checkout.
                  </p>
                ) : null}

                <Button
                  type="button"
                  disabled={
                    isCheckoutBusy ||
                    purchasesQuery.isPending ||
                    hasBrowserAuthIssue ||
                    isPurchased ||
                    hasPendingCheckout
                  }
                  onClick={() => {
                    void startCheckout();
                  }}
                >
                  <CreditCard className="size-4" />
                  {isPurchased
                    ? "Purchased"
                    : hasPendingCheckout
                      ? "Checkout pending"
                      : isCheckoutBusy
                        ? "Redirecting..."
                        : "Buy with Stripe"}
                </Button>

                {purchaseStatusHref ? (
                  <Link
                    href={purchaseStatusHref}
                    className="inline-flex text-sm font-medium text-slate-700 underline underline-offset-4 hover:text-slate-950"
                  >
                    Open payment status page
                  </Link>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

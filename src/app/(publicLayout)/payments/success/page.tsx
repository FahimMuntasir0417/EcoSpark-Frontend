"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { commerceService } from "@/services/commerce.service";

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function formatLabel(value?: string | null) {
  if (!hasText(value)) {
    return "Unknown";
  }

  return value!
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value?: string | null) {
  if (!hasText(value)) {
    return "Not recorded";
  }

  const parsed = new Date(value!);

  if (Number.isNaN(parsed.getTime())) {
    return "Invalid date";
  }

  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const purchaseId = searchParams.get("purchaseId") ?? "";
  const sessionId = searchParams.get("session_id") ?? "";

  const purchaseQuery = useQuery({
    queryKey: ["commerce", "payment-status", purchaseId],
    queryFn: ({ signal }) => commerceService.getSinglePurchase(purchaseId, { signal }),
    enabled: Boolean(purchaseId),
    retry: false,
    refetchInterval: (query) => {
      const status =
        query.state.data && typeof query.state.data.data?.status === "string"
          ? query.state.data.data.status
          : "";

      return status === "PENDING" ? 2500 : false;
    },
  });

  if (!purchaseId) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <EmptyState
          title="Missing purchase reference"
          description="No purchaseId was found in the redirect URL. Start checkout again from the idea page."
        />
      </main>
    );
  }

  if (purchaseQuery.isPending) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <LoadingState
          rows={3}
          title="Verifying payment"
          description="Checking the purchase status returned by the backend."
        />
      </main>
    );
  }

  if (purchaseQuery.isError) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <ErrorState
          title="Could not verify payment"
          description={getApiErrorMessage(purchaseQuery.error)}
          onRetry={() => {
            void purchaseQuery.refetch();
          }}
        />
      </main>
    );
  }

  const purchase = purchaseQuery.data?.data;

  if (!purchase) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <EmptyState
          title="Purchase not found"
          description="The backend returned an empty purchase payload for this purchase ID."
        />
      </main>
    );
  }

  const status = typeof purchase.status === "string" ? purchase.status : "UNKNOWN";
  const ideaId =
    purchase.idea && typeof purchase.idea.id === "string"
      ? purchase.idea.id
      : typeof purchase.ideaId === "string"
        ? purchase.ideaId
        : "";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Stripe payment status
          </p>
          <h1 className="text-3xl font-semibold text-slate-950">Payment verification</h1>
          <p className="text-sm leading-7 text-slate-600">
            This page confirms the final purchase state from the backend after Stripe redirects back to the frontend.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Purchase ID</p>
            <p className="mt-2 break-all text-sm font-medium text-slate-950">{purchase.id}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{formatLabel(status)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Idea</p>
            <p className="mt-2 text-sm font-medium text-slate-950">
              {typeof purchase.idea?.title === "string" && purchase.idea.title.trim()
                ? purchase.idea.title
                : ideaId || "Unavailable"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Paid at</p>
            <p className="mt-2 text-sm font-medium text-slate-950">{formatDate(purchase.paidAt ?? null)}</p>
          </div>
        </div>

        {sessionId ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Stripe session</p>
            <p className="mt-2 break-all text-sm font-medium text-slate-950">{sessionId}</p>
          </div>
        ) : null}

        {status === "PAID" ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Payment successful. Your purchase is marked as paid.
          </p>
        ) : null}

        {status === "PENDING" ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Payment is still pending. This page will keep polling the backend while the purchase remains pending.
          </p>
        ) : null}

        {status === "FAILED" ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Payment failed. Return to the idea page and start a new checkout session.
          </p>
        ) : null}

        {status === "CANCELLED" ? (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            This purchase was cancelled before payment completed.
          </p>
        ) : null}

        {status === "REFUNDED" ? (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            This purchase has been refunded.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {ideaId ? (
            <Link href={`/idea/${ideaId}`}>
              <Button type="button" variant="outline">Return to idea</Button>
            </Link>
          ) : null}
          <Link href="/dashboard/purches-idea">
            <Button type="button" variant="outline">Open purchases dashboard</Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

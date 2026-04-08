import {
  MutationCache,
  QueryCache,
  QueryClient,
  type DefaultError,
} from "@tanstack/react-query";
import { normalizeApiError } from "@/lib/errors/api-error";

function shouldRetryQuery(failureCount: number, error: DefaultError) {
  const normalized = normalizeApiError(error);
  const statusCode = normalized.statusCode;

  if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
    return false;
  }

  return failureCount < 2;
}

function reportClientError(source: "query" | "mutation", error: unknown) {
  const normalized = normalizeApiError(error);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("api:error", {
        detail: {
          source,
          ...normalized,
        },
      }),
    );
  }
}

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        reportClientError("query", error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        reportClientError("mutation", error);
      },
    }),
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        staleTime: 60_000,
        gcTime: 5 * 60_000,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

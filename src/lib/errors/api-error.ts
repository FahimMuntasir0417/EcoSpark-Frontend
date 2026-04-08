import { isAxiosError } from "axios";
import { ZodError } from "zod";
import type { ApiErrorResponse } from "@/types/api";

export type NormalizedApiError = {
  message: string;
  statusCode?: number;
  errors?: { path?: string; message: string }[];
};

export class ApiClientError extends Error {
  statusCode?: number;
  errors?: { path?: string; message: string }[];
  causeError?: unknown;

  constructor(
    message: string,
    options?: Omit<NormalizedApiError, "message"> & { causeError?: unknown },
  ) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = options?.statusCode;
    this.errors = options?.errors;
    this.causeError = options?.causeError;
  }
}

const GENERIC_REQUEST_ERROR_MESSAGE = "Something went wrong. Please try again.";
const GENERIC_SERVER_ERROR_MESSAGE = "Service temporarily unavailable. Please try again soon.";

function getNetworkErrorMessage() {
  return "Network error: cannot reach API. Check backend, CORS, and NEXT_PUBLIC_API_BASE_URL.";
}

function looksSensitiveBackendMessage(message: string) {
  return [
    /prisma\./i,
    /invalid\s+`?prisma/i,
    /can't reach database server/i,
    /database server/i,
    /query engine/i,
    /pooler\./i,
    /\bP10\d{2}\b/i,
    /stack trace/i,
  ].some((pattern) => pattern.test(message));
}

function sanitizeApiMessage(message: string | undefined, statusCode?: number) {
  if (!message || message.trim().length === 0) {
    return statusCode && statusCode >= 500 ? GENERIC_SERVER_ERROR_MESSAGE : GENERIC_REQUEST_ERROR_MESSAGE;
  }

  if (looksSensitiveBackendMessage(message)) {
    return GENERIC_SERVER_ERROR_MESSAGE;
  }

  if (statusCode && statusCode >= 500) {
    return GENERIC_SERVER_ERROR_MESSAGE;
  }

  return message;
}

function toErrorItem(candidate: unknown): { path?: string; message: string } | null {
  if (typeof candidate === "string" && candidate.trim().length > 0) {
    return { message: candidate };
  }

  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const record = candidate as Record<string, unknown>;
  const message =
    (typeof record.message === "string" && record.message.trim()) ||
    (typeof record.msg === "string" && record.msg.trim()) ||
    null;

  if (!message) {
    return null;
  }

  const rawPath = record.path;

  if (typeof rawPath === "string" && rawPath.trim().length > 0) {
    return { path: rawPath, message };
  }

  if (Array.isArray(rawPath)) {
    const path = rawPath
      .map((part) =>
        typeof part === "string" || typeof part === "number"
          ? String(part).trim()
          : "",
      )
      .filter(Boolean)
      .join(".");

    return path ? { path, message } : { message };
  }

  return { message };
}

function extractApiErrorItems(data: unknown): { path?: string; message: string }[] | undefined {
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const record = data as Record<string, unknown>;
  const candidates = [record.errors, record.error, record.issues];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) {
      continue;
    }

    const normalized = candidate
      .map((item) => toErrorItem(item))
      .filter((item): item is { path?: string; message: string } => Boolean(item));

    if (normalized.length > 0) {
      return normalized;
    }
  }

  return undefined;
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (error instanceof ApiClientError) {
    return {
      message: sanitizeApiMessage(error.message, error.statusCode),
      statusCode: error.statusCode,
      errors: error.errors,
    };
  }

  if (error instanceof ZodError) {
    return {
      message:
        error.issues[0]?.message ??
        "Unexpected API response shape. Please check frontend contract and backend response.",
    };
  }

  if (isAxiosError<ApiErrorResponse>(error)) {
    if (!error.response) {
      return {
        message: getNetworkErrorMessage(),
      };
    }

    const statusCode = error.response.data?.statusCode ?? error.response.status;
    const rawMessage = error.response.data?.message ?? error.message ?? "Request failed";

    return {
      message: sanitizeApiMessage(rawMessage, statusCode),
      statusCode,
      errors: extractApiErrorItems(error.response.data),
    };
  }

  if (error instanceof Error) {
    return { message: sanitizeApiMessage(error.message) };
  }

  return { message: GENERIC_REQUEST_ERROR_MESSAGE };
}

export function toApiClientError(error: unknown, fallbackMessage: string): ApiClientError {
  const normalized = normalizeApiError(error);
  return new ApiClientError(normalized.message || fallbackMessage, {
    statusCode: normalized.statusCode,
    errors: normalized.errors,
    causeError: error,
  });
}

export function getApiErrorMessage(error: unknown): string {
  return normalizeApiError(error).message;
}

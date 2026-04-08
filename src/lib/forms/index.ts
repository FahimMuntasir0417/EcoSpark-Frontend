import type { z } from "zod";
import { getApiErrorMessage as getSharedApiErrorMessage } from "@/lib/errors/api-error";

export type FormFeedback = {
  type: "success" | "error";
  text: string;
};

export const getApiErrorMessage = getSharedApiErrorMessage;

function resolveErrorMessage(error: unknown): string | null {
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  if (Array.isArray(error)) {
    for (const nestedError of error) {
      const message = resolveErrorMessage(nestedError);
      if (message) {
        return message;
      }
    }

    return null;
  }

  if (error && typeof error === "object") {
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }

    if ("issues" in error && Array.isArray(error.issues)) {
      for (const issue of error.issues) {
        if (issue && typeof issue === "object" && "message" in issue) {
          const message = issue.message;
          if (typeof message === "string" && message.trim().length > 0) {
            return message;
          }
        }
      }
    }
  }

  return null;
}

export function getFieldErrorMessage(errors: unknown[] | undefined): string | null {
  if (!errors || errors.length === 0) {
    return null;
  }

  for (const error of errors) {
    const message = resolveErrorMessage(error);
    if (message) {
      return message;
    }
  }

  return null;
}

export function createZodFieldValidator<T>(schema: z.ZodType<T>) {
  return ({ value }: { value: T }) => {
    const result = schema.safeParse(value);

    if (result.success) {
      return undefined;
    }

    return result.error.issues[0]?.message ?? "Invalid value";
  };
}

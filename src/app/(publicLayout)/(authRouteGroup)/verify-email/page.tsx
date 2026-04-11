"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AuthFeedback,
  AuthFormField,
  LOGIN_NOTICE_KEY,
  PENDING_VERIFY_EMAIL_KEY,
  VERIFY_EMAIL_COMPLETE_NOTICE,
  VERIFY_EMAIL_NOTICE_KEY,
  authFieldSchemas,
  createZodFieldValidator,
  getApiErrorMessage,
  getFieldErrorMessage,
  useVerifyEmailMutation,
  verifyEmailFormSchema,
} from "@/features/auth";
import type { FormFeedback } from "@/features/auth";
import type { VerifyEmailInput } from "@/services/auth.service";
type VerifyFormValues = {
  otp: string;
};

const initialFormState: VerifyFormValues = {
  otp: "",
};

function subscribeToStorageValue() {
  return () => {};
}

function getSessionStorageValue(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.sessionStorage.getItem(key)?.trim() ?? "";
  return value || null;
}

function getLocalStorageValue(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(key)?.trim() ?? "";
  return value || null;
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifyEmailMutation = useVerifyEmailMutation();
  const [feedback, setFeedback] = useState<FormFeedback | null>(null);
  const [hasDismissedSavedNotice, setHasDismissedSavedNotice] = useState(false);
  const emailFromQuery = searchParams.get("email")?.trim() ?? "";
  const otpFromQuery = searchParams.get("otp") ?? searchParams.get("token") ?? "";

  const savedEmail = useSyncExternalStore(
    subscribeToStorageValue,
    () => getLocalStorageValue(PENDING_VERIFY_EMAIL_KEY),
    () => null,
  );
  const savedNotice = useSyncExternalStore(
    subscribeToStorageValue,
    () => getSessionStorageValue(VERIFY_EMAIL_NOTICE_KEY),
    () => null,
  );
  const resolvedEmail = emailFromQuery || savedEmail || "";
  const resolvedFeedback =
    feedback ??
    (!hasDismissedSavedNotice && savedNotice
      ? { type: "error" as const, text: savedNotice }
      : null);

  const form = useForm({
    defaultValues: {
      ...initialFormState,
      otp: otpFromQuery ?? "",
    },
    validators: {
      onSubmit: verifyEmailFormSchema,
    },
    onSubmit: async ({ value }) => {
      setHasDismissedSavedNotice(true);
      setFeedback(null);

      try {
        const parsed = verifyEmailFormSchema.parse(value);
        const email = resolvedEmail.trim();

        if (!email) {
          setFeedback({
            type: "error",
            text: "Email context not found. Please register again or open verify link from email.",
          });
          return;
        }

        const payload: VerifyEmailInput = {
          email,
          otp: parsed.otp,
        };

        const response = await verifyEmailMutation.mutateAsync(payload);

        if (typeof window !== "undefined") {
          window.localStorage.removeItem(PENDING_VERIFY_EMAIL_KEY);
          window.sessionStorage.removeItem(VERIFY_EMAIL_NOTICE_KEY);
          window.sessionStorage.setItem(
            LOGIN_NOTICE_KEY,
            VERIFY_EMAIL_COMPLETE_NOTICE,
          );
        }

        router.replace("/login");
        return response;
      } catch (error) {
        setFeedback({ type: "error", text: getApiErrorMessage(error) });
      }
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (emailFromQuery) {
      window.localStorage.setItem(PENDING_VERIFY_EMAIL_KEY, emailFromQuery);
    }

    if (savedNotice) {
      window.sessionStorage.removeItem(VERIFY_EMAIL_NOTICE_KEY);
    }
  }, [emailFromQuery, savedNotice]);

  const emailHint = resolvedEmail
    ? `Using email: ${resolvedEmail}`
    : "No email context found yet.";

  return (
    <main className="mx-auto w-full max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Verify Email</h1>
      <p className="text-sm text-muted-foreground">{emailHint}</p>

      <AuthFeedback feedback={resolvedFeedback} />

      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field
          name="otp"
          validators={{
            onBlur: createZodFieldValidator(authFieldSchemas.otp),
            onChange: createZodFieldValidator(authFieldSchemas.otp),
          }}
        >
          {(field) => {
            const fieldError = field.state.meta.isTouched
              ? getFieldErrorMessage(field.state.meta.errors)
              : null;

            return (
              <AuthFormField id={field.name} label="OTP" error={fieldError}>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="OTP"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </AuthFormField>
            );
          }}
        </form.Field>

        <Button type="submit" disabled={verifyEmailMutation.isPending}>
          {verifyEmailMutation.isPending ? "Verifying..." : "Verify Email"}
        </Button>
      </form>
    </main>
  );
}

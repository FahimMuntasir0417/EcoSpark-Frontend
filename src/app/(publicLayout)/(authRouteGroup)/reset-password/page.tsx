"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  AuthFeedback,
  AuthFormField,
  LOGIN_NOTICE_KEY,
  PASSWORD_RESET_COMPLETE_NOTICE,
  PASSWORD_RESET_NOTICE_KEY,
  PENDING_PASSWORD_RESET_EMAIL_KEY,
  type ResetPasswordFormValues,
  authFieldSchemas,
  createZodFieldValidator,
  getApiErrorMessage,
  getFieldErrorMessage,
  resetPasswordFormSchema,
  useResetPasswordMutation,
} from "@/features/auth";
import type { FormFeedback } from "@/features/auth";
import type { ResetPasswordInput } from "@/services/auth.service";

const initialFormState: ResetPasswordFormValues = {
  otp: "",
  newPassword: "",
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetPasswordMutation = useResetPasswordMutation();
  const [feedback, setFeedback] = useState<FormFeedback | null>(null);
  const emailFromQuery = searchParams.get("email")?.trim() ?? "";
  const otpFromQuery = searchParams.get("otp") ?? searchParams.get("token") ?? "";

  const savedEmail = useSyncExternalStore(
    subscribeToStorageValue,
    () => getLocalStorageValue(PENDING_PASSWORD_RESET_EMAIL_KEY),
    () => null,
  );
  const savedNotice = useSyncExternalStore(
    subscribeToStorageValue,
    () => getSessionStorageValue(PASSWORD_RESET_NOTICE_KEY),
    () => null,
  );
  const resolvedEmail = emailFromQuery || savedEmail || "";
  const resolvedFeedback =
    feedback ??
    (savedNotice
      ? { type: "success" as const, text: savedNotice }
      : null);

  const form = useForm({
    defaultValues: {
      ...initialFormState,
      otp: otpFromQuery ?? "",
    },
    validators: {
      onSubmit: resetPasswordFormSchema,
    },
    onSubmit: async ({ value }) => {
      setFeedback(null);

      try {
        const parsed = resetPasswordFormSchema.parse(value);
        const email = resolvedEmail.trim();

        if (!email) {
          setFeedback({
            type: "error",
            text: "Email context not found. Start from forgot password and request a new OTP.",
          });
          return;
        }

        const payload: ResetPasswordInput = {
          email,
          otp: parsed.otp,
          newPassword: parsed.newPassword,
        };

        const response = await resetPasswordMutation.mutateAsync(payload);

        form.reset();

        if (typeof window !== "undefined") {
          window.localStorage.removeItem(PENDING_PASSWORD_RESET_EMAIL_KEY);
          window.sessionStorage.removeItem(PASSWORD_RESET_NOTICE_KEY);
          window.sessionStorage.setItem(
            LOGIN_NOTICE_KEY,
            response.message || PASSWORD_RESET_COMPLETE_NOTICE,
          );
        }

        router.replace("/login");
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
      window.localStorage.setItem(PENDING_PASSWORD_RESET_EMAIL_KEY, emailFromQuery);
    }

    if (savedNotice) {
      window.sessionStorage.removeItem(PASSWORD_RESET_NOTICE_KEY);
    }
  }, [emailFromQuery, savedNotice]);

  const emailHint = resolvedEmail
    ? `Resetting password for: ${resolvedEmail}`
    : "No reset email found yet. Start from forgot password to receive an OTP.";

  return (
    <main className="mx-auto w-full max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Reset Password</h1>
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
              <AuthFormField
                id={field.name}
                label="OTP"
                error={fieldError}
              >
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="Enter OTP"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </AuthFormField>
            );
          }}
        </form.Field>

        <form.Field
          name="newPassword"
          validators={{
            onBlur: createZodFieldValidator(authFieldSchemas.securePassword),
            onChange: createZodFieldValidator(authFieldSchemas.securePassword),
          }}
        >
          {(field) => {
            const fieldError = field.state.meta.isTouched
              ? getFieldErrorMessage(field.state.meta.errors)
              : null;

            return (
              <AuthFormField
                id={field.name}
                label="New Password"
                error={fieldError}
              >
                <PasswordInput
                  id={field.name}
                  name={field.name}
                  placeholder="New password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </AuthFormField>
            );
          }}
        </form.Field>

        <Button type="submit" disabled={resetPasswordMutation.isPending}>
          {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
        </Button>

        {!resolvedEmail ? (
          <Link
            href="/forgot-password"
            className={buttonVariants({ variant: "outline" })}
          >
            Back to Forgot Password
          </Link>
        ) : null}
      </form>
    </main>
  );
}

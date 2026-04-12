"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
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

  return (
    <main className="public-page-shell justify-center py-10 sm:py-12 lg:py-16">
      <section className="surface-card mx-auto w-full max-w-lg p-6 sm:p-8">
        <div className="space-y-3">
          <p className="section-kicker">Reset Password</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Set a new password
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            Enter the reset code from your email and choose a new password for
            your account.
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Email
          </p>
          <p className="mt-1 break-all text-sm font-medium text-slate-900">
            {resolvedEmail || "No reset email found yet."}
          </p>
        </div>

        <div className="mt-5">
          <AuthFeedback feedback={resolvedFeedback} />
        </div>

        <form
          className="mt-6 grid gap-5"
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
                <AuthFormField id={field.name} label="Verification code" error={fieldError}>
                  <div className="pt-1">
                    <InputOTP
                      id={field.name}
                      name={field.name}
                      maxLength={6}
                      inputMode="numeric"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(value) => field.handleChange(value)}
                      containerClassName="justify-center"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
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
                <AuthFormField id={field.name} label="New password" error={fieldError}>
                  <PasswordInput
                    id={field.name}
                    name={field.name}
                    placeholder="Create a new password"
                    className="h-11 rounded-xl border-slate-200 bg-white/85"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </AuthFormField>
              );
            }}
          </form.Field>

          <p className="text-sm leading-6 text-slate-500">
            Use the most recent OTP from your inbox. Paste works in the code field.
          </p>

          <Button
            type="submit"
            size="lg"
            className="h-11 rounded-xl bg-slate-950 text-white hover:bg-slate-800"
            disabled={resetPasswordMutation.isPending}
          >
            {resetPasswordMutation.isPending ? "Resetting..." : "Reset password"}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between gap-4 text-sm">
          <Link
            href="/login"
            className="font-medium text-slate-700 transition-colors hover:text-slate-950"
          >
            Back to sign in
          </Link>
          <Link
            href="/forgot-password"
            className="font-medium text-slate-700 transition-colors hover:text-slate-950"
          >
            Request new code
          </Link>
        </div>
      </section>
    </main>
  );
}

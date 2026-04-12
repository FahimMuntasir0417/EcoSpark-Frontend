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

  return (
    <main className="public-page-shell justify-center py-10 sm:py-12 lg:py-16">
      <section className="surface-card mx-auto w-full max-w-lg p-6 sm:p-8">
        <div className="space-y-3">
          <p className="section-kicker">Verify Email</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Enter your verification code
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            Use the 6-digit code from your email to finish setup and continue to
            sign in.
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Email
          </p>
          <p className="mt-1 break-all text-sm font-medium text-slate-900">
            {resolvedEmail || "No email context found yet."}
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

          <p className="text-center text-sm leading-6 text-slate-500">
            Paste works here too. If the email is missing, restart from registration.
          </p>

          <Button
            type="submit"
            size="lg"
            className="h-11 rounded-xl bg-slate-950 text-white hover:bg-slate-800"
            disabled={verifyEmailMutation.isPending}
          >
            {verifyEmailMutation.isPending ? "Verifying..." : "Verify email"}
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
            href="/register"
            className="font-medium text-slate-700 transition-colors hover:text-slate-950"
          >
            Register again
          </Link>
        </div>
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AuthFeedback,
  AuthFormField,
  PASSWORD_RESET_NOTICE_KEY,
  PASSWORD_RESET_SENT_NOTICE,
  PENDING_PASSWORD_RESET_EMAIL_KEY,
  authFieldSchemas,
  createZodFieldValidator,
  forgotPasswordFormSchema,
  getApiErrorMessage,
  getFieldErrorMessage,
  useForgetPasswordMutation,
} from "@/features/auth";
import type { FormFeedback } from "@/features/auth";
import type { ForgetPasswordInput } from "@/services/auth.service";

const initialFormState: ForgetPasswordInput = {
  email: "",
};

export default function ForgotPasswordPage() {
  const forgetPasswordMutation = useForgetPasswordMutation();
  const router = useRouter();
  const [feedback, setFeedback] = useState<FormFeedback | null>(null);

  const form = useForm({
    defaultValues: initialFormState,
    validators: {
      onSubmit: forgotPasswordFormSchema,
    },
    onSubmit: async ({ value }) => {
      setFeedback(null);

      try {
        const payload: ForgetPasswordInput = forgotPasswordFormSchema.parse(value);
        const response = await forgetPasswordMutation.mutateAsync(payload);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(PENDING_PASSWORD_RESET_EMAIL_KEY, payload.email);
          window.sessionStorage.setItem(
            PASSWORD_RESET_NOTICE_KEY,
            response.message || PASSWORD_RESET_SENT_NOTICE,
          );
        }

        router.replace(`/reset-password?email=${encodeURIComponent(payload.email)}`);
      } catch (error) {
        setFeedback({ type: "error", text: getApiErrorMessage(error) });
      }
    },
  });

  return (
    <main className="public-page-shell justify-center py-10 sm:py-12 lg:py-16">
      <section className="surface-card mx-auto w-full max-w-lg p-6 sm:p-8">
        <div className="space-y-3">
          <p className="section-kicker">Forgot Password</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Request a reset code
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            Enter your account email and we&apos;ll send a one-time code for the
            password reset step.
          </p>
        </div>

        <div className="mt-5">
          <AuthFeedback feedback={feedback} />
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
            name="email"
            validators={{
              onBlur: createZodFieldValidator(authFieldSchemas.email),
              onChange: createZodFieldValidator(authFieldSchemas.email),
            }}
          >
            {(field) => {
              const fieldError = field.state.meta.isTouched
                ? getFieldErrorMessage(field.state.meta.errors)
                : null;

              return (
                <AuthFormField id={field.name} label="Email address" error={fieldError}>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    placeholder="you@organization.com"
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
            After sending the code, you&apos;ll move directly to the reset screen.
          </p>

          <Button
            type="submit"
            size="lg"
            className="h-11 rounded-xl bg-slate-950 text-white hover:bg-slate-800"
            disabled={forgetPasswordMutation.isPending}
          >
            {forgetPasswordMutation.isPending ? "Sending..." : "Send OTP"}
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
            Create account
          </Link>
        </div>
      </section>
    </main>
  );
}

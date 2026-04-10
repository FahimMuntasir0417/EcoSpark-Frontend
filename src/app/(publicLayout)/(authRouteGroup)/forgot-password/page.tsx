"use client";

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
    <main className="mx-auto w-full max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Forgot Password</h1>
      <p className="text-sm text-muted-foreground">
        Enter your email and we will send an OTP, then move you directly to the reset step.
      </p>

      <AuthFeedback feedback={feedback} />

      <form
        className="grid gap-3"
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
              <AuthFormField id={field.name} label="Email" error={fieldError}>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  placeholder="Email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </AuthFormField>
            );
          }}
        </form.Field>

        <Button type="submit" disabled={forgetPasswordMutation.isPending}>
          {forgetPasswordMutation.isPending ? "Sending..." : "Send OTP"}
        </Button>
      </form>
    </main>
  );
}

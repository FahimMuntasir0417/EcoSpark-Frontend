"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AuthFeedback,
  AuthFormField,
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

        setFeedback({
          type: "success",
          text: response.message || "Password reset link sent.",
        });
      } catch (error) {
        setFeedback({ type: "error", text: getApiErrorMessage(error) });
      }
    },
  });

  return (
    <main className="mx-auto w-full max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Forgot Password</h1>

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
          {forgetPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AuthFeedback,
  AuthFormField,
  authFieldSchemas,
  createZodFieldValidator,
  getApiErrorMessage,
  getFieldErrorMessage,
  resetPasswordFormSchema,
  useResetPasswordMutation,
} from "@/features/auth";
import type { FormFeedback } from "@/features/auth";
import type { ResetPasswordInput } from "@/services/auth.service";

const initialFormState: ResetPasswordInput = {
  token: "",
  password: "",
};

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const resetPasswordMutation = useResetPasswordMutation();
  const [feedback, setFeedback] = useState<FormFeedback | null>(null);

  const form = useForm({
    defaultValues: initialFormState,
    validators: {
      onSubmit: resetPasswordFormSchema,
    },
    onSubmit: async ({ value }) => {
      setFeedback(null);

      try {
        const payload: ResetPasswordInput = resetPasswordFormSchema.parse(value);
        const response = await resetPasswordMutation.mutateAsync(payload);

        form.setFieldValue("password", "");
        setFeedback({
          type: "success",
          text: response.message || "Password reset successful.",
        });
      } catch (error) {
        setFeedback({ type: "error", text: getApiErrorMessage(error) });
      }
    },
  });

  useEffect(() => {
    const tokenFromQuery = searchParams.get("token");

    if (tokenFromQuery && tokenFromQuery !== form.state.values.token) {
      form.setFieldValue("token", tokenFromQuery);
    }
  }, [form, searchParams]);

  return (
    <main className="mx-auto w-full max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Reset Password</h1>

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
          name="token"
          validators={{
            onBlur: createZodFieldValidator(authFieldSchemas.token),
            onChange: createZodFieldValidator(authFieldSchemas.token),
          }}
        >
          {(field) => {
            const fieldError = field.state.meta.isTouched
              ? getFieldErrorMessage(field.state.meta.errors)
              : null;

            return (
              <AuthFormField
                id={field.name}
                label="Reset Token"
                error={fieldError}
              >
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="Reset token"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </AuthFormField>
            );
          }}
        </form.Field>

        <form.Field
          name="password"
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
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
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
      </form>
    </main>
  );
}

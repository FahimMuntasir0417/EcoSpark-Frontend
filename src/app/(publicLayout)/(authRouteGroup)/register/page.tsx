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
  getApiErrorMessage,
  getFieldErrorMessage,
  registerFormSchema,
  useRegisterMutation,
} from "@/features/auth";
import type { FormFeedback } from "@/features/auth";
import type { RegisterInput } from "@/services/auth.service";

const initialFormState: RegisterInput = {
  name: "",
  email: "",
  password: "",
};

const PENDING_VERIFY_EMAIL_KEY = "eco_spark_pending_verify_email";

export default function RegisterPage() {
  const registerMutation = useRegisterMutation();
  const [feedback, setFeedback] = useState<FormFeedback | null>(null);

  const form = useForm({
    defaultValues: initialFormState,
    validators: {
      onSubmit: registerFormSchema,
    },
    onSubmit: async ({ value }) => {
      setFeedback(null);

      try {
        const payload: RegisterInput = registerFormSchema.parse(value);
        const response = await registerMutation.mutateAsync(payload);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(PENDING_VERIFY_EMAIL_KEY, payload.email);
        }

        form.reset();
        setFeedback({
          type: "success",
          text: response.message || "Registration successful.",
        });
      } catch (error) {
        setFeedback({ type: "error", text: getApiErrorMessage(error) });
      }
    },
  });

  return (
    <main className="mx-auto w-full max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Register</h1>

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
          name="name"
          validators={{
            onBlur: createZodFieldValidator(authFieldSchemas.name),
            onChange: createZodFieldValidator(authFieldSchemas.name),
          }}
        >
          {(field) => {
            const fieldError = field.state.meta.isTouched
              ? getFieldErrorMessage(field.state.meta.errors)
              : null;

            return (
              <AuthFormField id={field.name} label="Name" error={fieldError}>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="Name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </AuthFormField>
            );
          }}
        </form.Field>

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
                label="Password"
                error={fieldError}
              >
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  placeholder="Password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </AuthFormField>
            );
          }}
        </form.Field>

        <Button type="submit" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? "Registering..." : "Register"}
        </Button>
      </form>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AuthFeedback,
  AuthFormField,
  authFieldSchemas,
  createZodFieldValidator,
  getApiErrorMessage,
  getFieldErrorMessage,
  loginFormSchema,
  useLoginMutation,
} from "@/features/auth";
import { getUserRole, syncRoleFromAccessToken } from "@/lib/auth/session";
import { resolvePostLoginTarget } from "@/lib/navigation/redirect-policy";
import type { FormFeedback } from "@/features/auth";
import type { LoginInput } from "@/services/auth.service";

const POST_LOGIN_REDIRECT_PATH = "/dashboard";

const initialFormState: LoginInput = {
  email: "",
  password: "",
};

export default function LoginPage() {
  const loginMutation = useLoginMutation();
  const router = useRouter();
  const [feedback, setFeedback] = useState<FormFeedback | null>(null);

  const form = useForm({
    defaultValues: initialFormState,
    validators: {
      onSubmit: loginFormSchema,
    },
    onSubmit: async ({ value }) => {
      setFeedback(null);

      try {
        const payload: LoginInput = loginFormSchema.parse(value);
        await loginMutation.mutateAsync(payload);

        const role = getUserRole() ?? syncRoleFromAccessToken();
        const target = resolvePostLoginTarget(POST_LOGIN_REDIRECT_PATH, role);

        router.replace(target);
        router.refresh();
      } catch (error) {
        setFeedback({ type: "error", text: getApiErrorMessage(error) });
      }
    },
  });

  return (
    <main className="mx-auto w-full max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Login</h1>

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

        <form.Field
          name="password"
          validators={{
            onBlur: createZodFieldValidator(authFieldSchemas.loginPassword),
            onChange: createZodFieldValidator(authFieldSchemas.loginPassword),
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

        <Button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Logging in..." : "Login"}
        </Button>
      </form>
    </main>
  );
}

"use client";

import {
  ArrowRight,
  CheckCircle2,
  Leaf,
  MailCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  AuthFeedback,
  AuthFormField,
  PENDING_VERIFY_EMAIL_KEY,
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
const onboardingHighlights = [
  {
    title: "Submission-ready profile",
    description:
      "Create one account to submit ideas, review campaigns, and move work through the platform cleanly.",
  },
  {
    title: "Verified account flow",
    description:
      "Email verification protects access and prepares your account for secure recovery and moderation actions.",
  },
  {
    title: "Team-friendly onboarding",
    description:
      "Members, scientists, and admins can enter the same product with role-specific workflows after approval.",
  },
];

const trustSignals = [
  {
    icon: ShieldCheck,
    label: "Protected registration",
  },
  {
    icon: MailCheck,
    label: "Email verification included",
  },
  {
    icon: Leaf,
    label: "Built for sustainability teams",
  },
];

export default function RegisterPage() {
  const registerMutation = useRegisterMutation();
  const router = useRouter();
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
        await registerMutation.mutateAsync(payload);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(PENDING_VERIFY_EMAIL_KEY, payload.email);
        }

        router.replace(
          `/verify-email?email=${encodeURIComponent(payload.email)}`,
        );
      } catch (error) {
        setFeedback({ type: "error", text: getApiErrorMessage(error) });
      }
    },
  });

  return (
    <main className="public-page-shell justify-center py-10 sm:py-12 lg:py-16">
      <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.03fr)_30rem] xl:grid-cols-[minmax(0,1.05fr)_32rem]">
        <article className="relative overflow-hidden rounded-[2rem] border border-slate-200/90 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(240,253,250,0.92)_48%,rgba(248,250,252,0.96)_100%)] p-6 shadow-[0_26px_70px_-42px_rgba(15,23,42,0.38)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -left-16 top-8 size-52 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.18),rgba(16,185,129,0)_72%)]" />
          <div className="pointer-events-none absolute right-[-3rem] top-16 size-48 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.15),rgba(14,165,233,0)_74%)]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-[linear-gradient(90deg,transparent,rgba(16,185,129,0.9),rgba(14,165,233,0.9),transparent)]" />

          <div className="relative flex h-full flex-col gap-8">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                <Sparkles className="size-3.5" />
                Account Creation
              </span>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl xl:text-[4rem] xl:leading-[0.97]">
                  Create a professional Eco Spark workspace in one clean step.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  Set up your account to submit ideas, participate in campaigns,
                  and work through sustainability programs with a verified
                  identity and clearer operational control.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {onboardingHighlights.map((highlight) => (
                <div
                  key={highlight.title}
                  className="rounded-[1.4rem] border border-white/70 bg-white/80 p-4 backdrop-blur"
                >
                  <p className="text-sm font-semibold text-slate-950">
                    {highlight.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {highlight.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 rounded-[1.6rem] border border-slate-900 bg-[linear-gradient(160deg,#022c22_0%,#064e3b_55%,#0f172a_100%)] p-5 text-white shadow-[0_22px_45px_-28px_rgba(2,6,23,0.95)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/80">
                    Registration Standard
                  </p>
                  <p className="mt-2 text-xl font-semibold">
                    Verified accounts, cleaner handoffs, stronger auditability.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                  <ArrowRight className="size-5 text-emerald-300" />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                {trustSignals.map((signal) => (
                  <div
                    key={signal.label}
                    className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-3 py-3 text-sm text-slate-100"
                  >
                    <signal.icon className="size-4 text-emerald-300" />
                    <span>{signal.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <div className="grid gap-4">
          <article className="surface-card relative overflow-hidden p-6 sm:p-8 lg:p-9">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(14,165,233,0.85),rgba(16,185,129,0.85),transparent)]" />

            <div className="relative space-y-6">
              <div className="space-y-3">
                <span className="section-kicker">Create Account</span>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                  Register to continue
                </h2>
                <p className="text-sm leading-6 text-slate-600 sm:text-[15px]">
                  Use your primary name, email, and a secure password to create a
                  verified Eco Spark account.
                </p>
              </div>

              <AuthFeedback feedback={feedback} />

              <form
                className="grid gap-5"
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
                      <AuthFormField
                        id={field.name}
                        label="Full name"
                        error={fieldError}
                      >
                        <Input
                          id={field.name}
                          name={field.name}
                          placeholder="Enter your full name"
                          className="h-11 rounded-xl border-slate-200 bg-white/80"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
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
                      <AuthFormField
                        id={field.name}
                        label="Work email"
                        error={fieldError}
                      >
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          placeholder="you@organization.com"
                          className="h-11 rounded-xl border-slate-200 bg-white/80"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                        />
                      </AuthFormField>
                    );
                  }}
                </form.Field>

                <form.Field
                  name="password"
                  validators={{
                    onBlur: createZodFieldValidator(
                      authFieldSchemas.securePassword,
                    ),
                    onChange: createZodFieldValidator(
                      authFieldSchemas.securePassword,
                    ),
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
                        <PasswordInput
                          id={field.name}
                          name={field.name}
                          placeholder="Create a secure password"
                          className="h-11 rounded-xl border-slate-200 bg-white/80"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                        />
                      </AuthFormField>
                    );
                  }}
                </form.Field>

                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/85 px-4 py-3 text-sm text-slate-600">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>
                    Verification continues on the next screen after account
                    creation.
                  </span>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="h-11 rounded-xl bg-slate-950 text-white shadow-[0_16px_35px_-22px_rgba(15,23,42,0.78)] hover:bg-slate-800"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending
                    ? "Creating account..."
                    : "Create account"}
                </Button>
              </form>
            </div>
          </article>

          <article className="surface-card p-5">
            <p className="section-kicker">Existing Account</p>
            <div className="mt-3 flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-slate-950">
                  Already registered?
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Sign in with your existing Eco Spark account to continue your
                  workflow.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
              >
                Sign in
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

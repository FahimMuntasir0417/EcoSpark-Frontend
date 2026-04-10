"use client";

import {
  ArrowRight,
  BadgeCheck,
  Building2,
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
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

const setupChecklist = [
  {
    icon: BadgeCheck,
    title: "Use your real name",
    description: "This keeps review, moderation, and collaboration records consistent.",
  },
  {
    icon: Building2,
    title: "Register with your working email",
    description: "Your verification code and future account recovery details go there.",
  },
  {
    icon: Sparkles,
    title: "Set a secure password",
    description: "Use at least 6 characters before moving to the verification step.",
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

        router.replace(`/verify-email?email=${encodeURIComponent(payload.email)}`);
      } catch (error) {
        setFeedback({ type: "error", text: getApiErrorMessage(error) });
      }
    },
  });

  return (
    <main className="public-page-shell justify-center py-10 sm:py-12 lg:py-16">
      <section className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.06fr)_32rem]">
        <article className="relative overflow-hidden rounded-[2rem] border border-slate-200/90 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(240,253,250,0.92)_48%,rgba(248,250,252,0.96)_100%)] p-6 shadow-[0_26px_70px_-42px_rgba(15,23,42,0.38)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -left-16 top-8 size-52 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.18),rgba(16,185,129,0)_72%)]" />
          <div className="pointer-events-none absolute right-[-3rem] top-16 size-48 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.15),rgba(14,165,233,0)_74%)]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-[linear-gradient(90deg,transparent,rgba(16,185,129,0.9),rgba(14,165,233,0.9),transparent)]" />

          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                <Sparkles className="size-3.5" />
                Account Creation
              </span>

              <div className="space-y-4">
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Create a professional Eco Spark workspace in one clean step.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Set up your account to submit ideas, participate in campaigns, and work
                  through sustainability programs with a verified identity and clearer
                  operational control.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {onboardingHighlights.map((highlight) => (
                  <div
                    key={highlight.title}
                    className="rounded-[1.4rem] border border-white/70 bg-white/80 p-4 backdrop-blur"
                  >
                    <p className="text-sm font-semibold text-slate-950">{highlight.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {highlight.description}
                    </p>
                  </div>
                ))}
              </div>
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

        <article className="surface-card flex flex-col justify-center p-6 sm:p-8 lg:p-9">
          <div className="space-y-2">
            <p className="section-kicker">Create Account</p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Register to continue
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Use your primary name, email, and a secure password to create a verified
              Eco Spark account.
            </p>
          </div>

          <div className="mt-6">
            <AuthFeedback feedback={feedback} />
          </div>

          <div className="mt-6 rounded-[1.4rem] border border-emerald-100 bg-[linear-gradient(180deg,rgba(236,253,245,0.95),rgba(240,253,250,0.7))] p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-900">What happens next</p>
            </div>
            <div className="mt-3 grid gap-3">
              {setupChecklist.map((item) => (
                <div key={item.title} className="flex gap-3 rounded-2xl bg-white/80 p-3">
                  <div className="mt-0.5 rounded-xl border border-emerald-100 bg-emerald-50 p-2">
                    <item.icon className="size-4 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
                  <AuthFormField id={field.name} label="Full name" error={fieldError}>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder="Enter your full name"
                      className="h-11 rounded-xl border-slate-200 bg-white/80"
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
                  <AuthFormField id={field.name} label="Work email" error={fieldError}>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      placeholder="you@organization.com"
                      className="h-11 rounded-xl border-slate-200 bg-white/80"
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
                  <AuthFormField id={field.name} label="Password" error={fieldError}>
                    <PasswordInput
                      id={field.name}
                      name={field.name}
                      placeholder="Create a secure password"
                      className="h-11 rounded-xl border-slate-200 bg-white/80"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                  </AuthFormField>
                );
              }}
            </form.Field>

            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-slate-500">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Minimum 6 characters for account security
              </p>
              <p className="text-slate-500">You will verify this account by email next.</p>
            </div>

            <Button
              type="submit"
              size="lg"
              className="h-11 rounded-xl bg-slate-950 text-white shadow-[0_16px_35px_-22px_rgba(15,23,42,0.78)] hover:bg-slate-800"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="mt-6 grid gap-3">
            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-sm font-medium text-slate-950">Already registered?</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Sign in with your existing Eco Spark account to continue working across
                submissions, purchases, and moderation flows.
              </p>
            </div>

            <Link
              href="/login"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className:
                  "h-11 rounded-xl border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
              })}
            >
              Go to sign in
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}

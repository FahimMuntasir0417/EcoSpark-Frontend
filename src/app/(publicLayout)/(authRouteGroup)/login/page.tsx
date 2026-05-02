"use client";

import { isAxiosError } from "axios";
import {
  ArrowRight,
  CheckCircle2,
  Chrome,
  FlaskConical,
  Leaf,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  AuthFeedback,
  AuthFormField,
  LOGIN_NOTICE_KEY,
  PENDING_VERIFY_EMAIL_KEY,
  VERIFY_EMAIL_NOTICE_KEY,
  VERIFY_EMAIL_REQUIRED_NOTICE,
  authFieldSchemas,
  createZodFieldValidator,
  getApiErrorMessage,
  getFieldErrorMessage,
  loginFormSchema,
  useLoginMutation,
} from "@/features/auth";
import {
  getUserRole,
  persistAuthSession,
  syncRoleFromAccessToken,
} from "@/lib/auth/session";
import { ApiClientError, normalizeApiError } from "@/lib/errors/api-error";
import { resolvePostLoginTarget } from "@/lib/navigation/redirect-policy";
import { sanitizeLoginRedirectPath } from "./_redirect";
import type { FormFeedback } from "@/features/auth";
import type { LoginInput } from "@/services/auth.service";
import type { ApiErrorResponse } from "@/types/api";

const DEFAULT_AUTH_REDIRECT_PATH = "/dashboard";
const EMAIL_VERIFICATION_REQUIRED_PATTERN =
  /\bEMAIL_NOT_VERIFIED\b|email\s+(is\s+)?not\s+verified|verify\s+your\s+email|email\s+verification(?:\s+required)?|account\s+not\s+verified|unverified/i;

const oauthErrorMessages: Record<string, string> = {
  access_denied: "Google sign-in was cancelled before access was granted.",
  no_callback_url: "Google sign-in could not finish because the callback URL is missing.",
  no_session_found: "Google sign-in completed, but the backend did not create a session.",
  oauth_missing_token: "Google sign-in completed, but the login token was missing.",
  oauth_failed: "Google sign-in could not be completed. Please try again.",
  state_not_found: "Google sign-in expired before it completed. Please start again.",
};

const googleAuthEndpoint =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL?.trim() ||
  "/api/v1/auth/login/google";

const initialFormState: LoginInput = {
  email: "",
  password: "",
};

type DemoAccount = {
  role: string;
  email: string;
  password: string;
  description: string;
  icon: LucideIcon;
};

const demoAccounts: DemoAccount[] = [
  {
    role: "Admin",
    email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL ?? "admin@ecospark.local",
    password: process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD ?? "Admin12345",
    description: "Moderation, users, taxonomy, and campaigns",
    icon: ShieldCheck,
  },
  {
    role: "Scientist",
    email:
      process.env.NEXT_PUBLIC_DEMO_SCIENTIST_EMAIL ??
      "muntasirbejoy66@gmail.com",
    password:
      process.env.NEXT_PUBLIC_DEMO_SCIENTIST_PASSWORD ?? "StrongPass123!",
    description: "Idea creation, drafts, attachments, and submissions",
    icon: FlaskConical,
  },
];

const platformHighlights = [
  {
    title: "Role-aware workspaces",
    description:
      "Scientists, members, and admins land in the right workflow immediately after sign-in.",
  },
  {
    title: "Structured idea pipeline",
    description:
      "Track submissions, moderation, and adoption from one controlled system.",
  },
  {
    title: "Protected session flow",
    description:
      "Token refresh and access recovery keep teams moving without unnecessary friction.",
  },
];

const trustSignals = [
  {
    icon: ShieldCheck,
    label: "Protected account access",
  },
  {
    icon: Sparkles,
    label: "Cleaner review handoffs",
  },
  {
    icon: Leaf,
    label: "Built for sustainability teams",
  },
];

function appendCandidate(candidates: string[], value: unknown) {
  if (typeof value !== "string") {
    return;
  }

  const normalized = value.trim();

  if (normalized) {
    candidates.push(normalized);
  }
}

function appendErrorItems(candidates: string[], value: unknown) {
  if (!Array.isArray(value)) {
    return;
  }

  for (const item of value) {
    if (typeof item === "string") {
      appendCandidate(candidates, item);
      continue;
    }

    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as Record<string, unknown>;
    appendCandidate(candidates, record.message);
    appendCandidate(candidates, record.code);
    appendCandidate(candidates, record.type);
  }
}

function appendAxiosErrorCandidates(candidates: string[], error: unknown) {
  if (!isAxiosError<ApiErrorResponse & Record<string, unknown>>(error)) {
    return;
  }

  appendCandidate(candidates, error.message);
  appendCandidate(candidates, error.code);

  const payload = error.response?.data;

  if (!payload) {
    return;
  }

  if (typeof payload === "string") {
    appendCandidate(candidates, payload);
    return;
  }

  appendCandidate(candidates, payload.message);
  appendCandidate(candidates, payload.code);
  appendCandidate(candidates, payload.error);
  appendErrorItems(candidates, payload.errors);
  appendErrorItems(candidates, payload.issues);
  appendErrorItems(candidates, payload.details);

  if (!payload.error || typeof payload.error !== "object") {
    return;
  }

  const nestedError = payload.error as Record<string, unknown>;
  appendCandidate(candidates, nestedError.message);
  appendCandidate(candidates, nestedError.code);
  appendErrorItems(candidates, nestedError.errors);
}

function buildVerifyEmailHref(email: string) {
  return `/verify-email?email=${encodeURIComponent(email)}`;
}

function getOAuthErrorFeedback(errorCode: string | null): FormFeedback | null {
  if (!errorCode) {
    return null;
  }

  const normalizedCode = errorCode.trim();

  if (!normalizedCode) {
    return null;
  }

  return {
    type: "error",
    text:
      oauthErrorMessages[normalizedCode] ??
      `Google sign-in failed: ${normalizedCode.replaceAll("_", " ")}`,
  };
}

function getOAuthHashPayload() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawHash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;

  if (!rawHash) {
    return null;
  }

  const params = new URLSearchParams(rawHash);

  if (params.get("oauth") !== "success") {
    return null;
  }

  const accessToken = params.get("accessToken")?.trim();

  if (!accessToken) {
    return {
      accessToken: null,
      refreshToken: null,
      redirectPath: sanitizeLoginRedirectPath(params.get("redirect")),
    };
  }

  return {
    accessToken,
    refreshToken: params.get("refreshToken")?.trim() || null,
    redirectPath: sanitizeLoginRedirectPath(params.get("redirect")),
  };
}

function removeLocationHash() {
  if (typeof window === "undefined" || !window.location.hash) {
    return;
  }

  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`,
  );
}

function isEmailVerificationRequired(error: unknown) {
  const normalized = normalizeApiError(error);
  const candidates = [
    normalized.message,
    ...(normalized.errors?.map((item) => item.message) ?? []),
  ];

  if (error instanceof ApiClientError) {
    appendCandidate(candidates, error.message);
    appendErrorItems(candidates, error.errors);
    appendAxiosErrorCandidates(candidates, error.causeError);
  }

  appendAxiosErrorCandidates(candidates, error);

  return candidates.some((candidate) =>
    EMAIL_VERIFICATION_REQUIRED_PATTERN.test(candidate),
  );
}

export default function LoginPage() {
  const loginMutation = useLoginMutation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeDemoRole, setActiveDemoRole] = useState<string | null>(null);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const [feedback, setFeedback] = useState<FormFeedback | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const savedNotice = window.sessionStorage.getItem(LOGIN_NOTICE_KEY)?.trim() ?? "";

    return savedNotice ? { type: "success", text: savedNotice } : null;
  });
  const [verificationEmail, setVerificationEmail] = useState("");

  const requestedRedirect = sanitizeLoginRedirectPath(
    searchParams.get("redirect"),
  );
  const oauthError = searchParams.get("error");

  async function submitLogin(value: LoginInput) {
    setFeedback(null);
    setVerificationEmail("");

    try {
      const payload: LoginInput = loginFormSchema.parse(value);
      await loginMutation.mutateAsync(payload);

      const role = getUserRole() ?? syncRoleFromAccessToken();
      const target = resolvePostLoginTarget(requestedRedirect, role);

      router.replace(target);
      router.refresh();
    } catch (error) {
      const submittedEmail = value.email.trim();

      if (submittedEmail && isEmailVerificationRequired(error)) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(PENDING_VERIFY_EMAIL_KEY, submittedEmail);
          window.sessionStorage.setItem(
            VERIFY_EMAIL_NOTICE_KEY,
            VERIFY_EMAIL_REQUIRED_NOTICE,
          );
        }

        setVerificationEmail(submittedEmail);
        setFeedback({
          type: "error",
          text: VERIFY_EMAIL_REQUIRED_NOTICE,
        });
        router.replace(buildVerifyEmailHref(submittedEmail));
        return;
      }

      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.removeItem(LOGIN_NOTICE_KEY);
  }, []);

  useEffect(() => {
    const oauthFeedback = getOAuthErrorFeedback(oauthError);

    if (!oauthFeedback) {
      return;
    }

    setIsGooglePending(false);
    setFeedback(oauthFeedback);
  }, [oauthError]);

  useEffect(() => {
    const oauthPayload = getOAuthHashPayload();

    if (!oauthPayload) {
      return;
    }

    removeLocationHash();

    if (!oauthPayload.accessToken) {
      setFeedback(getOAuthErrorFeedback("oauth_missing_token"));
      setIsGooglePending(false);
      return;
    }

    persistAuthSession({
      accessToken: oauthPayload.accessToken,
      refreshToken: oauthPayload.refreshToken ?? undefined,
    });

    const role = getUserRole() ?? syncRoleFromAccessToken();
    const target = resolvePostLoginTarget(
      oauthPayload.redirectPath || requestedRedirect,
      role,
    );

    setIsGooglePending(false);
    router.replace(target);
    router.refresh();
  }, [requestedRedirect, router]);

  const form = useForm({
    defaultValues: initialFormState,
    validators: {
      onSubmit: loginFormSchema,
    },
    onSubmit: async ({ value }) => {
      setActiveDemoRole(null);
      await submitLogin(value);
    },
  });

  async function handleDemoLogin(account: DemoAccount) {
    setActiveDemoRole(account.role);
    form.setFieldValue("email", account.email);
    form.setFieldValue("password", account.password);

    try {
      await submitLogin({
        email: account.email,
        password: account.password,
      });
    } finally {
      setActiveDemoRole(null);
    }
  }

  function handleGoogleLogin() {
    setFeedback(null);
    setVerificationEmail("");
    setActiveDemoRole(null);
    setIsGooglePending(true);

    try {
      const googleLoginUrl = new URL(googleAuthEndpoint, window.location.origin);
      googleLoginUrl.searchParams.set(
        "redirect",
        requestedRedirect || DEFAULT_AUTH_REDIRECT_PATH,
      );

      window.location.assign(googleLoginUrl.toString());
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Google sign-in could not be started.",
      });
      setIsGooglePending(false);
    }
  }

  return (
    <main className="public-page-shell justify-center py-10 sm:py-12 lg:py-16">
      <section className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.08fr)_30rem]">
        <article className="relative overflow-hidden rounded-[2rem] border border-slate-200/90 bg-[linear-gradient(160deg,rgba(255,255,255,0.97),rgba(248,250,252,0.94))] p-6 shadow-[0_26px_70px_-42px_rgba(15,23,42,0.38)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -left-16 top-10 size-48 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.16),rgba(14,165,233,0)_72%)]" />
          <div className="pointer-events-none absolute right-0 top-0 h-px w-full bg-[linear-gradient(90deg,transparent,rgba(14,165,233,0.9),rgba(16,185,129,0.9),transparent)]" />
          <div className="pointer-events-none absolute -bottom-20 right-[-2rem] size-64 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.14),rgba(16,185,129,0)_72%)]" />

          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                <Sparkles className="size-3.5" />
                Eco Spark Access
              </span>

              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Welcome back to a cleaner innovation workspace.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Sign in to review ideas, manage submissions, and move sustainability
                  programs from proposal to adoption with clearer operational control.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {platformHighlights.map((highlight) => (
                  <div
                    key={highlight.title}
                    className="rounded-[1.4rem] border border-slate-200/90 bg-white/75 p-4 backdrop-blur"
                  >
                    <p className="text-sm font-semibold text-slate-950">{highlight.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {highlight.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.6rem] border border-slate-900 bg-[linear-gradient(160deg,#020617_0%,#0f172a_52%,#1e293b_100%)] p-5 text-white shadow-[0_22px_45px_-28px_rgba(2,6,23,0.95)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                    Session Standard
                  </p>
                  <p className="mt-2 text-xl font-semibold">
                    One account, multiple role-specific workflows.
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
            <p className="section-kicker">Account Login</p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Sign in to continue
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Use your registered email and password to access dashboards,
              submissions, purchases, and moderation tools.
            </p>
          </div>

          <div className="mt-6">
            <AuthFeedback feedback={feedback} />
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="mt-4 h-11 w-full rounded-xl border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50"
            disabled={loginMutation.isPending || isGooglePending}
            onClick={() => {
              void handleGoogleLogin();
            }}
          >
            <Chrome className="size-4 text-slate-700" />
            {isGooglePending ? "Starting Google..." : "Continue with Google"}
          </Button>

          <div className="mt-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              or
            </span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="mt-4 grid gap-3 rounded-[1.4rem] border border-emerald-200 bg-emerald-50/75 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Demo login
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Use a prepared account to preview the deployed dashboard.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {demoAccounts.map((account) => (
                <Button
                  key={account.role}
                  type="button"
                  variant="outline"
                  className="h-auto min-h-16 w-full justify-start gap-3 whitespace-normal rounded-xl border-emerald-200 bg-white p-3 text-left hover:bg-emerald-50"
                  disabled={loginMutation.isPending}
                  onClick={() => {
                    void handleDemoLogin(account);
                  }}
                >
                  <account.icon className="size-5 shrink-0 text-emerald-700" />
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="text-sm font-semibold text-slate-950">
                      {activeDemoRole === account.role
                        ? "Signing in..."
                        : `${account.role} demo`}
                    </span>
                    <span className="truncate text-xs font-normal text-slate-500">
                      {account.email}
                    </span>
                    <span className="text-xs font-normal leading-5 text-slate-600">
                      {account.description}
                    </span>
                  </span>
                  <ArrowRight className="ml-auto size-4 shrink-0 text-emerald-700" />
                </Button>
              ))}
            </div>
          </div>

          {verificationEmail ? (
            <div className="mt-4 rounded-[1.4rem] border border-amber-200 bg-amber-50/80 p-4">
              <p className="text-sm font-semibold text-slate-950">
                Email verification required
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Use the OTP sent to <span className="font-medium text-slate-900">{verificationEmail}</span>{" "}
                to verify your account before signing in.
              </p>
              <Link
                href={buildVerifyEmailHref(verificationEmail)}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className:
                    "mt-4 h-10 rounded-xl border-amber-200 bg-white text-slate-900 hover:bg-amber-100/60",
                })}
              >
                Go to verify email
              </Link>
            </div>
          ) : null}

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
                    <PasswordInput
                      id={field.name}
                      name={field.name}
                      placeholder="Enter your password"
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
                Secure access with session recovery
              </p>
              <Link
                href="/forgot-password"
                className="font-medium text-slate-700 underline-offset-4 transition-colors hover:text-slate-950 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              className="h-11 rounded-xl bg-slate-950 text-white shadow-[0_16px_35px_-22px_rgba(15,23,42,0.78)] hover:bg-slate-800"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 grid gap-3">
            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-sm font-medium text-slate-950">Need a new account?</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Create an Eco Spark profile to submit ideas, explore campaigns, and
                collaborate across the platform.
              </p>
            </div>

            <Link
              href="/register"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className:
                  "h-11 rounded-xl border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
              })}
            >
              Create account
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}

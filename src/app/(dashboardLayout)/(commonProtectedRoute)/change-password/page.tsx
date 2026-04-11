"use client";

import { type FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { useChangePasswordMutation } from "@/features/auth";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";

type Feedback =
  | {
      type: "success" | "error";
      text: string;
    }
  | null;

type ChangePasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const initialForm: ChangePasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const passwordTips = [
  "Use a password you do not reuse in other apps or services.",
  "Mix a phrase you can remember with numbers or symbols you can verify quickly.",
  "Store it in a password manager if you want stronger randomness without extra friction.",
];

function ChecklistItem({
  title,
  description,
  met,
}: {
  title: string;
  description: string;
  met: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 transition-colors",
        met
          ? "border-emerald-200 bg-emerald-50/80"
          : "border-slate-200 bg-slate-50/80",
      )}
    >
      <div className="flex items-start gap-3">
        {met ? (
          <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
        ) : (
          <span className="mt-1 size-3 rounded-full border border-slate-300 bg-white" />
        )}

        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-950">{title}</p>
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  const changePasswordMutation = useChangePasswordMutation();
  const [form, setForm] = useState<ChangePasswordForm>(initialForm);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const checklist = [
    {
      title: "Current password entered",
      description: "Required to confirm the update belongs to the active account.",
      met: Boolean(form.currentPassword.trim()),
    },
    {
      title: "New password is long enough",
      description: "The new password must contain at least 6 characters.",
      met: form.newPassword.length >= 6,
    },
    {
      title: "Confirmation matches",
      description: "Confirm the new password exactly before submitting the form.",
      met:
        Boolean(form.confirmPassword) && form.newPassword === form.confirmPassword,
    },
  ];

  const completedChecks = checklist.filter((item) => item.met).length;
  const progressValue = Math.round((completedChecks / checklist.length) * 100);
  const isReadyToSubmit = checklist.every((item) => item.met);

  const statusTitle = changePasswordMutation.isPending
    ? "Updating password"
    : isReadyToSubmit
      ? "Ready to submit"
      : completedChecks === 0
        ? "Security setup pending"
        : completedChecks === checklist.length - 1
          ? "One final check left"
          : "Progress underway";

  const statusDescription = changePasswordMutation.isPending
    ? "Your new password is being sent securely right now."
    : isReadyToSubmit
      ? "All visible client-side checks are complete."
      : completedChecks === 0
        ? "Start by filling in the three password fields below."
        : `${completedChecks} of ${checklist.length} checks are already complete.`;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!form.currentPassword.trim() || !form.newPassword.trim()) {
      setFeedback({
        type: "error",
        text: "Current password and new password are required.",
      });
      return;
    }

    if (form.newPassword.length < 6) {
      setFeedback({
        type: "error",
        text: "New password must be at least 6 characters long.",
      });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setFeedback({
        type: "error",
        text: "New password and confirm password must match.",
      });
      return;
    }

    try {
      const response = await changePasswordMutation.mutateAsync({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setForm(initialForm);
      setFeedback({
        type: "success",
        text:
          (response && typeof response === "object" && "message" in response
            ? String(response.message)
            : "") || "Password changed successfully.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(error),
      });
    }
  };

  return (
    <section className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.96)_48%,rgba(236,253,245,0.94)_100%)] shadow-sm">
        <div className="pointer-events-none absolute -left-14 top-10 size-44 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.18),rgba(56,189,248,0)_72%)]" />
        <div className="pointer-events-none absolute bottom-0 right-[-2rem] size-64 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.16),rgba(16,185,129,0)_72%)]" />
        <div className="pointer-events-none absolute right-0 top-0 h-px w-full bg-[linear-gradient(90deg,transparent,rgba(14,165,233,0.9),rgba(16,185,129,0.8),transparent)]" />

        <div className="relative grid gap-6 px-6 py-7 md:px-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:items-end">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 shadow-sm">
                <ShieldCheck className="size-3.5" />
                Account Security
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 shadow-sm">
                <Sparkles className="size-3.5" />
                {completedChecks} of {checklist.length} checks complete
              </span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Refresh your password from a cleaner, clearer security workspace.
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                Update the credentials for your current account without hunting
                through settings. The page keeps the required checks visible while
                you type so the final submit feels deliberate instead of guesswork.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Current status
                </p>
                <p className="mt-1 text-sm font-medium text-slate-950">{statusTitle}</p>
                <p className="text-xs text-slate-500">{statusDescription}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Password guidance
                </p>
                <p className="mt-1 text-sm font-medium text-slate-950">
                  Use a fresh password you can verify quickly.
                </p>
                <p className="text-xs text-slate-500">
                  Visible rules stay on the page while you update.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[1.4rem] border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Completion
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {progressValue}%
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Client-side requirements satisfied before submission.
              </p>
            </div>

            <div className="rounded-[1.4rem] border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Next step
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-950">
                {isReadyToSubmit ? "Submit the update" : "Complete the remaining checks"}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {isReadyToSubmit
                  ? "Everything visible on this page is ready."
                  : "The checklist and progress bar will react as each field improves."}
              </p>
            </div>

            <div className="rounded-[1.4rem] border border-slate-900 bg-[linear-gradient(160deg,#020617_0%,#0f172a_52%,#1e293b_100%)] p-4 text-white shadow-[0_20px_40px_-26px_rgba(2,6,23,0.95)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                    Protected flow
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    Current password plus confirmation helps reduce accidental changes.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                  <ArrowRight className="size-4 text-emerald-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Password Update
              </p>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                Replace the current password with something stronger and easier to trust
              </h3>
              <p className="text-sm leading-6 text-slate-600">
                Enter the existing password first, then confirm the new password before
                sending the change.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Submission state
              </p>
              <p className="mt-1 text-sm font-medium text-slate-950">{statusTitle}</p>
              <p className="text-xs text-slate-500">
                {changePasswordMutation.isPending
                  ? "Please wait while the request completes."
                  : "The button becomes most useful once all checks are green."}
              </p>
            </div>
          </div>

          {feedback ? (
            <div
              role="status"
              className={cn(
                "mt-6 rounded-2xl border px-4 py-3 text-sm shadow-sm",
                feedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700",
              )}
            >
              {feedback.text}
            </div>
          ) : null}

          <form className="mt-6 grid gap-5" onSubmit={onSubmit}>
            <div className="grid gap-1.5">
              <label
                htmlFor="currentPassword"
                className="text-sm font-medium text-slate-900"
              >
                Current password
              </label>
              <PasswordInput
                id="currentPassword"
                name="currentPassword"
                placeholder="Enter your current password"
                autoComplete="current-password"
                className="h-11 rounded-xl border-slate-200 bg-slate-50/80 focus-visible:border-sky-400 focus-visible:bg-white"
                value={form.currentPassword}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, currentPassword: event.target.value }))
                }
              />
              <p className="text-xs text-slate-500">
                This verifies that the update is being made by the active account holder.
              </p>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="newPassword" className="text-sm font-medium text-slate-900">
                New password
              </label>
              <PasswordInput
                id="newPassword"
                name="newPassword"
                placeholder="Create a new password"
                autoComplete="new-password"
                className="h-11 rounded-xl border-slate-200 bg-slate-50/80 focus-visible:border-sky-400 focus-visible:bg-white"
                value={form.newPassword}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, newPassword: event.target.value }))
                }
              />
              <p className="text-xs text-slate-500">
                Minimum length on this page is 6 characters. Longer, unique passwords are safer.
              </p>
            </div>

            <div className="grid gap-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-slate-900"
              >
                Confirm new password
              </label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Re-enter the new password"
                autoComplete="new-password"
                className="h-11 rounded-xl border-slate-200 bg-slate-50/80 focus-visible:border-sky-400 focus-visible:bg-white"
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                }
              />
              <p className="text-xs text-slate-500">
                Matching both entries reduces lockouts caused by typing mistakes.
              </p>
            </div>

            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Password progress
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-950">{statusTitle}</p>
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm">
                  {completedChecks}/{checklist.length} complete
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-300",
                    progressValue === 100
                      ? "bg-emerald-500"
                      : progressValue >= 67
                        ? "bg-sky-500"
                        : progressValue >= 34
                          ? "bg-amber-400"
                          : "bg-slate-300",
                  )}
                  style={{ width: `${progressValue}%` }}
                />
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {checklist.map((item) => (
                  <div
                    key={item.title}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm transition-colors",
                      item.met
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600",
                    )}
                  >
                    {item.title}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <ShieldCheck className="size-4 text-emerald-600" />
                Changes apply to the current account as soon as the request succeeds.
              </p>

              <Button
                type="submit"
                size="lg"
                className="h-11 rounded-xl bg-slate-950 text-white shadow-[0_16px_35px_-22px_rgba(15,23,42,0.78)] hover:bg-slate-800 sm:min-w-52"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? "Updating..." : "Update password"}
              </Button>
            </div>
          </form>
        </section>

        <aside className="grid gap-4 self-start">
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Visible Checklist
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              Keep the validation rules in view while you type
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              These are the same checks the form uses before sending the password update.
            </p>

            <div className="mt-4 grid gap-3">
              {checklist.map((item) => (
                <ChecklistItem
                  key={item.title}
                  title={item.title}
                  description={item.description}
                  met={item.met}
                />
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-900 bg-[linear-gradient(160deg,#020617_0%,#0f172a_52%,#1e293b_100%)] p-5 text-white shadow-[0_22px_45px_-28px_rgba(2,6,23,0.95)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
              Better Passwords
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">
              Make the new password worth the switch
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              A polished form helps, but stronger password habits do more of the long-term
              security work.
            </p>

            <div className="mt-4 grid gap-3">
              {passwordTips.map((tip) => (
                <div
                  key={tip}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm text-slate-100"
                >
                  <Sparkles className="mt-0.5 size-4 text-emerald-300" />
                  <span className="leading-6">{tip}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

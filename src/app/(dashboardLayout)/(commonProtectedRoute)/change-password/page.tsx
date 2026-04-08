"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChangePasswordMutation } from "@/features/auth";
import { getApiErrorMessage } from "@/lib/errors/api-error";

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

export default function ChangePasswordPage() {
  const changePasswordMutation = useChangePasswordMutation();
  const [form, setForm] = useState<ChangePasswordForm>(initialForm);
  const [feedback, setFeedback] = useState<Feedback>(null);

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
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Change Password</h2>
        <p className="text-sm text-muted-foreground">
          Update your password for the current account.
        </p>
      </div>

      {feedback ? (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            feedback.type === "success"
              ? "border-green-300 text-green-700"
              : "border-red-300 text-red-700"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}

      <form className="max-w-xl space-y-4 rounded-xl border bg-background p-4" onSubmit={onSubmit}>
        <Input
          type="password"
          placeholder="Current password"
          value={form.currentPassword}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, currentPassword: event.target.value }))
          }
        />
        <Input
          type="password"
          placeholder="New password"
          value={form.newPassword}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, newPassword: event.target.value }))
          }
        />
        <Input
          type="password"
          placeholder="Confirm new password"
          value={form.confirmPassword}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
          }
        />

        <Button type="submit" variant="outline" disabled={changePasswordMutation.isPending}>
          {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </section>
  );
}

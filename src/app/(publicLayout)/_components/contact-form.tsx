"use client";

import { CheckCircle2, ExternalLink, Loader2, Send } from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().email("Enter a valid email address."),
  topic: z.enum(["Product support", "Backend setup", "Account access", "Partnership"]),
  message: z
    .string()
    .trim()
    .min(20, "Add at least 20 characters so the request has enough context."),
});

type ContactFormState = z.infer<typeof contactSchema>;
type ContactFormErrors = Partial<Record<keyof ContactFormState, string>>;

const initialState: ContactFormState = {
  name: "",
  email: "",
  topic: "Product support",
  message: "",
};

const issueBaseUrl =
  "https://github.com/FahimMuntasir0417/EcoSpark-Frontend/issues/new";

function getIssueUrl(values: ContactFormState) {
  const title = `[${values.topic}] ${values.name}`;
  const body = [
    "## Contact request",
    "",
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    `Topic: ${values.topic}`,
    "",
    "## Message",
    "",
    values.message,
  ].join("\n");

  return `${issueBaseUrl}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

export function ContactForm() {
  const [values, setValues] = useState<ContactFormState>(initialState);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const issueUrl = useMemo(() => getIssueUrl(values), [values]);

  const updateValue = <Field extends keyof ContactFormState>(
    field: Field,
    value: ContactFormState[Field],
  ) => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
    setSuccessUrl(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessUrl(null);

    const parsed = contactSchema.safeParse(values);

    if (!parsed.success) {
      const nextErrors: ContactFormErrors = {};

      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];

        if (
          field === "name" ||
          field === "email" ||
          field === "topic" ||
          field === "message"
        ) {
          nextErrors[field] = issue.message;
        }
      });

      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    window.setTimeout(() => {
      setIsSubmitting(false);
      setSuccessUrl(getIssueUrl(parsed.data));
    }, 650);
  };

  return (
    <form onSubmit={handleSubmit} className="surface-card grid gap-5 p-5">
      <div className="grid gap-2">
        <label className="text-sm font-semibold" htmlFor="contact-name">
          Name
        </label>
        <input
          id="contact-name"
          name="name"
          value={values.name}
          onChange={(event) => {
            updateValue("name", event.target.value);
          }}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
          className={cn(
            "h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35",
            errors.name && "border-destructive focus-visible:ring-destructive/30",
          )}
          placeholder="Your name"
        />
        {errors.name ? (
          <p id="contact-name-error" className="text-sm text-destructive">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold" htmlFor="contact-email">
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          value={values.email}
          onChange={(event) => {
            updateValue("email", event.target.value);
          }}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "contact-email-error" : undefined}
          className={cn(
            "h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35",
            errors.email && "border-destructive focus-visible:ring-destructive/30",
          )}
          placeholder="you@organization.com"
        />
        {errors.email ? (
          <p id="contact-email-error" className="text-sm text-destructive">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold" htmlFor="contact-topic">
          Topic
        </label>
        <select
          id="contact-topic"
          name="topic"
          value={values.topic}
          onChange={(event) => {
            updateValue("topic", event.target.value as ContactFormState["topic"]);
          }}
          aria-invalid={Boolean(errors.topic)}
          aria-describedby={errors.topic ? "contact-topic-error" : undefined}
          className={cn(
            "h-11 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35",
            errors.topic && "border-destructive focus-visible:ring-destructive/30",
          )}
        >
          <option>Product support</option>
          <option>Backend setup</option>
          <option>Account access</option>
          <option>Partnership</option>
        </select>
        {errors.topic ? (
          <p id="contact-topic-error" className="text-sm text-destructive">
            {errors.topic}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold" htmlFor="contact-message">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          value={values.message}
          onChange={(event) => {
            updateValue("message", event.target.value);
          }}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={
            errors.message ? "contact-message-error" : undefined
          }
          className={cn(
            "min-h-36 resize-y rounded-md border border-input bg-background px-3 py-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35",
            errors.message &&
              "border-destructive focus-visible:ring-destructive/30",
          )}
          placeholder="Describe the request, account issue, or setup blocker."
        />
        {errors.message ? (
          <p id="contact-message-error" className="text-sm text-destructive">
            {errors.message}
          </p>
        ) : null}
      </div>

      {successUrl ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-foreground">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold">Request prepared successfully.</p>
              <a
                href={successUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Open prepared GitHub request
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          {isSubmitting ? "Preparing..." : "Prepare request"}
        </button>

        <a
          href={issueUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Issue tracker
          <ExternalLink className="size-4" />
        </a>
      </div>
    </form>
  );
}

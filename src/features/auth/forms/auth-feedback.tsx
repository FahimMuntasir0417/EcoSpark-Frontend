import { cn } from "@/lib/utils";
import type { FormFeedback } from "./form-utils";

type AuthFeedbackProps = {
  feedback: FormFeedback | null;
};

export function AuthFeedback({ feedback }: AuthFeedbackProps) {
  if (!feedback) {
    return null;
  }

  return (
    <p
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        feedback.type === "success"
          ? "border-green-300 text-green-700"
          : "border-red-300 text-red-700"
      )}
    >
      {feedback.text}
    </p>
  );
}

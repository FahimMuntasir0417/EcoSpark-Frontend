"use client";

import { Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAiIdeaFormSuggestionsMutation } from "@/features/ai";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import type {
  AiIdeaFormSuggestion,
  AiIdeaFormSuggestionInput,
} from "@/services/ai.service";

type SmartIdeaFormAssistantProps = {
  values: AiIdeaFormSuggestionInput;
  onApply: (suggestions: AiIdeaFormSuggestion["suggestions"]) => void;
};

function hasSuggestions(suggestions?: AiIdeaFormSuggestion["suggestions"]) {
  if (!suggestions) {
    return false;
  }

  return Object.values(suggestions).some((value) =>
    Array.isArray(value) ? value.length > 0 : typeof value === "string" && value.trim().length > 0,
  );
}

export function SmartIdeaFormAssistant({
  values,
  onApply,
}: SmartIdeaFormAssistantProps) {
  const mutation = useAiIdeaFormSuggestionsMutation();
  const suggestions = mutation.data?.data.suggestions;

  return (
    <section className="rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="size-4" />
            Smart idea autofill
          </p>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Generate a stronger summary, solution, implementation steps, benefits,
            risks, resources, and tag suggestions from the fields already entered.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => {
              mutation.mutate(values);
            }}
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Suggest with AI
          </Button>

          {hasSuggestions(suggestions) ? (
            <Button
              type="button"
              onClick={() => {
                if (suggestions) {
                  onApply(suggestions);
                }
              }}
            >
              <Check className="size-4" />
              Apply suggestions
            </Button>
          ) : null}
        </div>
      </div>

      {mutation.isError ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {getApiErrorMessage(mutation.error)}
        </p>
      ) : null}

      {hasSuggestions(suggestions) ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {suggestions?.excerpt ? (
            <PreviewItem label="Excerpt" value={suggestions.excerpt} />
          ) : null}
          {suggestions?.proposedSolution ? (
            <PreviewItem label="Solution" value={suggestions.proposedSolution} />
          ) : null}
          {suggestions?.implementationSteps ? (
            <PreviewItem label="Steps" value={suggestions.implementationSteps} />
          ) : null}
          {suggestions?.expectedBenefits ? (
            <PreviewItem label="Benefits" value={suggestions.expectedBenefits} />
          ) : null}
          {suggestions?.suggestedTags && suggestions.suggestedTags.length > 0 ? (
            <PreviewItem
              label="Suggested tags"
              value={suggestions.suggestedTags.join(", ")}
            />
          ) : null}
          {suggestions?.suggestedCategoryName ? (
            <PreviewItem label="Suggested category" value={suggestions.suggestedCategoryName} />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 line-clamp-4 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

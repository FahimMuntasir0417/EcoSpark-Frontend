"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  className?: string;
  title?: string;
  description?: string;
  rows?: number;
};

type EmptyStateProps = {
  className?: string;
  title?: string;
  description?: string;
};

type ErrorStateProps = {
  className?: string;
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function LoadingState({
  className,
  title = "Loading",
  description = "Please wait while data is being fetched.",
  rows = 3,
}: LoadingStateProps) {
  return (
    <div className={cn("space-y-3 rounded-md border p-4", className)}>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="h-4 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  className,
  title = "No data found",
  description = "There is nothing to display yet.",
}: EmptyStateProps) {
  return (
    <div className={cn("rounded-md border p-4", className)}>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function ErrorState({
  className,
  title = "Something went wrong",
  description = "Unable to load this section.",
  retryLabel = "Try again",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={cn("space-y-3 rounded-md border border-destructive/30 p-4", className)}>
      <div>
        <p className="text-sm font-medium text-destructive">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

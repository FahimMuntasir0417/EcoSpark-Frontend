"use client";

import { Link2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import type {
  DirectoryField,
  PaginationPageItem,
} from "../_lib/public-directory";

type BadgeTone = "neutral" | "accent" | "success";

export function DirectoryBadge({
  icon: Icon,
  label,
  tone = "neutral",
  className,
}: {
  icon?: LucideIcon;
  label: string;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        tone === "accent" && "border border-sky-200 bg-sky-50 text-sky-700",
        tone === "success" &&
          "border border-emerald-200 bg-emerald-50 text-emerald-700",
        tone === "neutral" &&
          "border border-slate-200 bg-slate-50 text-slate-700",
        className,
      )}
    >
      {Icon ? <Icon className="size-3.5" /> : null}
      {label}
    </span>
  );
}

export function DirectorySummaryCard({
  label,
  value,
  caption,
  inverse = false,
  className,
}: {
  label: string;
  value: string;
  caption: string;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "rounded-2xl p-4",
        inverse
          ? "border border-white/10 bg-white/10"
          : "border border-slate-200 bg-slate-50/85",
        className,
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.22em]",
          inverse ? "text-slate-400" : "text-slate-500",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-3 text-2xl font-semibold tracking-tight",
          inverse ? "text-white" : "text-slate-950",
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          "mt-1 text-sm",
          inverse ? "text-slate-300" : "text-slate-600",
        )}
      >
        {caption}
      </p>
    </article>
  );
}

export function DirectoryDetailCard({
  icon: Icon,
  label,
  value,
  href,
  className,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
  href?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-slate-50/85 p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 inline-flex rounded-full bg-white p-2 text-slate-500 shadow-sm">
            <Icon className="size-4" />
          </span>
        ) : null}

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          {href ? (
            <div className="mt-2 space-y-2">
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 transition-colors hover:text-sky-800"
              >
                <Link2 className="size-4" />
                Open link
              </a>
              <p className="break-all text-xs leading-5 text-slate-500">{value}</p>
            </div>
          ) : (
            <p className="mt-2 break-words text-sm font-medium leading-6 text-slate-900">
              {value}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function DirectoryFieldGrid({
  title,
  fields,
  emptyText = "No additional fields are available.",
}: {
  title: string;
  fields: DirectoryField[];
  emptyText?: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="section-kicker">{title}</p>
        <p className="text-xs text-slate-500">{fields.length} fields</p>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/85 p-4 text-sm text-slate-600">
          {emptyText}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {fields.map((field) => (
            <DirectoryDetailCard
              key={field.key}
              label={field.label}
              value={field.value}
              href={field.href}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function DirectoryPaginationSection({
  currentPage,
  totalPages,
  paginationItems,
  onPageChange,
  disablePrevious,
  disableNext,
  description,
}: {
  currentPage: number;
  totalPages: number;
  paginationItems: PaginationPageItem[];
  onPageChange: (page: number) => void;
  disablePrevious?: boolean;
  disableNext?: boolean;
  description: string;
}) {
  return (
    <section className="surface-card grid gap-3 p-4">
      <Pagination aria-label={`pagination, page ${currentPage} of ${totalPages}`}>
        <PaginationContent className="flex-wrap items-center justify-center gap-2">
          <PaginationItem>
            <PaginationPrevious
              href="#"
              className={cn(disablePrevious && "pointer-events-none opacity-50")}
              onClick={(event) => {
                event.preventDefault();

                if (disablePrevious) {
                  return;
                }

                onPageChange(currentPage - 1);
              }}
            />
          </PaginationItem>

          {paginationItems.map((item, index) => {
            if (item === "ellipsis") {
              return (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }

            const isActivePage = item === currentPage;

            return (
              <PaginationItem key={`page-${item}`}>
                <PaginationLink
                  href="#"
                  isActive={isActivePage}
                  className={cn(isActivePage && "pointer-events-none")}
                  onClick={(event) => {
                    event.preventDefault();

                    if (isActivePage) {
                      return;
                    }

                    onPageChange(item);
                  }}
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          <PaginationItem>
            <PaginationNext
              href="#"
              className={cn(disableNext && "pointer-events-none opacity-50")}
              onClick={(event) => {
                event.preventDefault();

                if (disableNext) {
                  return;
                }

                onPageChange(currentPage + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <p className="text-center text-sm text-slate-600">{description}</p>
    </section>
  );
}

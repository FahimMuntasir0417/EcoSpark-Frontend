"use client";

import { CheckCircle2, CircleSlash, FolderTree, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { useCategoriesQuery } from "@/features/category/hooks/use-categories-query";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import type { Category } from "@/services/category.service";

type StatusFilter = "all" | "active" | "inactive";

function hasText(value?: string | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeHexColor(value?: string | null) {
  if (!hasText(value)) {
    return null;
  }

  const color = value.trim();

  if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }

  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color;
  }

  return null;
}

function formatDate(value?: string) {
  if (!hasText(value)) {
    return "N/A";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isCategoryActive(category: Category) {
  return category.isActive !== false;
}

function getCategoryToken(category: Category) {
  if (hasText(category.icon) && category.icon.trim().length <= 2) {
    return category.icon.trim().toUpperCase();
  }

  const compactName = category.name.trim();
  return compactName.slice(0, 2).toUpperCase() || "CT";
}

const statusFilterOptions: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

export default function CategoryComponent() {
  const categoriesQuery = useCategoriesQuery();
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const categories = useMemo(
    () =>
      [...(categoriesQuery.data?.data ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [categoriesQuery.data?.data],
  );

  const activeCount = useMemo(
    () => categories.filter((category) => isCategoryActive(category)).length,
    [categories],
  );

  const inactiveCount = categories.length - activeCount;

  const filteredCategories = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return categories.filter((category) => {
      const active = isCategoryActive(category);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && active) ||
        (statusFilter === "inactive" && !active);

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableValue = [
        category.name,
        category.slug,
        category.description,
      ]
        .join(" ")
        .toLowerCase();

      return searchableValue.includes(normalizedSearch);
    });
  }, [categories, searchValue, statusFilter]);

  if (categoriesQuery.isPending) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.45)] sm:p-7">
        <LoadingState
          rows={5}
          title="Loading categories"
          description="Building your category workspace."
        />
      </section>
    );
  }

  if (categoriesQuery.isError) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.45)] sm:p-7">
        <ErrorState
          title="Could not load categories"
          description={getApiErrorMessage(categoriesQuery.error)}
          onRetry={() => {
            void categoriesQuery.refetch();
          }}
        />
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-38px_rgba(15,23,42,0.35)] sm:p-7">
      <div className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.2),rgba(14,165,233,0)_70%)]" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 size-72 rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.15),rgba(34,197,94,0)_70%)]" />

      <div className="relative space-y-7">
        <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-800">
              <FolderTree className="size-3.5" />
              Category Explorer
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Organize ideas with clear, discoverable category cards.
            </h2>
            <p className="text-sm leading-6 text-slate-600 sm:text-base">
              Filter by status, search by keyword, and scan key metadata in one
              compact workspace.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-3xl bg-slate-950 p-3 text-white sm:p-4">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">
                Total
              </p>
              <p className="mt-2 text-xl font-semibold">{categories.length}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">
                Active
              </p>
              <p className="mt-2 text-xl font-semibold">{activeCount}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">
                Inactive
              </p>
              <p className="mt-2 text-xl font-semibold">{inactiveCount}</p>
            </div>
          </div>
        </header>

        <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50/75 p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
              }}
              placeholder="Search by name, slug, or description"
              className="h-10 border-slate-200 bg-white pl-9"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {statusFilterOptions.map((option) => (
              <Button
                key={option.key}
                type="button"
                size="sm"
                variant={statusFilter === option.key ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter(option.key);
                }}
                className={cn(
                  "rounded-full px-4",
                  statusFilter === option.key &&
                    "bg-slate-950 text-white hover:bg-slate-800",
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <EmptyState
            title={
              categories.length === 0
                ? "No categories available"
                : "No categories match your filters"
            }
            description={
              categories.length === 0
                ? "Create your first category to start organizing ideas."
                : "Try another keyword or switch the status filter."
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCategories.map((category) => {
              const active = isCategoryActive(category);
              const accentColor = normalizeHexColor(category.color);

              return (
                <article
                  key={category.id}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_38px_-28px_rgba(15,23,42,0.5)] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div
                    className={cn(
                      "absolute inset-x-0 top-0 h-1",
                      accentColor
                        ? ""
                        : "bg-gradient-to-r from-sky-500 to-emerald-500",
                    )}
                    style={
                      accentColor ? { backgroundColor: accentColor } : undefined
                    }
                  />

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold",
                          accentColor
                            ? ""
                            : "bg-slate-100 text-slate-700 group-hover:bg-slate-200",
                        )}
                        style={
                          accentColor
                            ? {
                                backgroundColor: `${accentColor}1A`,
                                color: accentColor,
                              }
                            : undefined
                        }
                      >
                        {getCategoryToken(category)}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-slate-950">
                          {category.name}
                        </h3>
                        <p className="truncate text-xs text-slate-500">
                          /{category.slug}
                        </p>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                        active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-700",
                      )}
                    >
                      {active ? (
                        <CheckCircle2 className="size-3.5" />
                      ) : (
                        <CircleSlash className="size-3.5" />
                      )}
                      {active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {hasText(category.description)
                      ? category.description.trim()
                      : "No description has been added for this category yet."}
                  </p>

                  <div className="mt-5 grid gap-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
                    <p className="flex items-center justify-between gap-3">
                      <span>Created</span>
                      <span className="font-medium text-slate-700">
                        {formatDate(category.createdAt)}
                      </span>
                    </p>
                    <p className="flex items-center justify-between gap-3">
                      <span>Updated</span>
                      <span className="font-medium text-slate-700">
                        {formatDate(category.updatedAt)}
                      </span>
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

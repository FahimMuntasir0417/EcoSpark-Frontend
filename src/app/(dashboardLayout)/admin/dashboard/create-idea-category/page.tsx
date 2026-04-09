"use client";

import {
  type FormEvent,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { createCategoryInputSchema } from "@/contracts/category.contract";
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from "@/features/category";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import type {
  Category,
  CreateCategoryInput,
} from "@/services/category.service";

type Feedback = {
  type: "success" | "error";
  text: string;
};

type CategoryFormValues = {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
};

type CategoryFormErrors = Partial<
  Record<"name" | "slug" | "description", string>
>;

type PaginationPageItem = number | "ellipsis";

const CATEGORIES_PER_PAGE = 3;

const initialFormState: CategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  isActive: true,
};

const textareaClassName =
  "min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(value?: string | null) {
  if (!value) {
    return "N/A";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "N/A";
  }

  return parsed.toLocaleString();
}

function getCategoryDescription(value?: string | null) {
  return hasText(value) ? value!.trim() : "No description added yet.";
}

function getCategorySearchText(category: Category) {
  return [
    category.name,
    category.slug,
    category.description,
    category.isActive === false ? "inactive" : "active",
  ]
    .filter(hasText)
    .join(" ")
    .toLowerCase();
}

function normalizeCategoryPayload(
  values: CategoryFormValues,
): CreateCategoryInput {
  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    description: values.description.trim(),
    isActive: values.isActive,
  };
}

function validateCategoryPayload(values: CategoryFormValues) {
  const parsed = createCategoryInputSchema.safeParse(
    normalizeCategoryPayload(values),
  );

  if (parsed.success) {
    return {
      success: true as const,
      data: parsed.data,
      errors: {} as CategoryFormErrors,
    };
  }

  const errors: CategoryFormErrors = {};

  for (const issue of parsed.error.issues) {
    const field = issue.path[0];

    if (
      typeof field === "string" &&
      (field === "name" || field === "slug" || field === "description") &&
      !errors[field]
    ) {
      errors[field] = issue.message;
    }
  }

  return {
    success: false as const,
    errors,
    message: parsed.error.issues[0]?.message ?? "Invalid category input",
  };
}

function getPaginationItems(
  totalPages: number,
  currentPage: number,
): PaginationPageItem[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([
    1,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    totalPages,
  ]);

  const sortedPages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items: PaginationPageItem[] = [];

  for (const page of sortedPages) {
    const previousPage = items[items.length - 1];

    if (typeof previousPage === "number" && page - previousPage > 1) {
      items.push("ellipsis");
    }

    items.push(page);
  }

  return items;
}

function SummaryCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <article className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-600">{caption}</p>
    </article>
  );
}

export default function CreateIdeaCategoryPage() {
  const categoriesQuery = useCategoriesQuery();
  // const { data, isPending, isError, error, refetch } = useCategoriesQuery();
  const createCategoryMutation = useCreateCategoryMutation();
  const updateCategoryMutation = useUpdateCategoryMutation();
  const deleteCategoryMutation = useDeleteCategoryMutation();

  const [createForm, setCreateForm] =
    useState<CategoryFormValues>(initialFormState);
  const [createErrors, setCreateErrors] = useState<CategoryFormErrors>({});
  const [createSlugTouched, setCreateSlugTouched] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editForm, setEditForm] =
    useState<CategoryFormValues>(initialFormState);
  const [editErrors, setEditErrors] = useState<CategoryFormErrors>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const categories = useMemo(
    () =>
      [...(categoriesQuery.data?.data ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [categoriesQuery.data?.data],
  );

  const activeCategoryCount = useMemo(
    () => categories.filter((category) => category.isActive !== false).length,
    [categories],
  );

  const inactiveCategoryCount = categories.length - activeCategoryCount;

  const filteredCategories = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return categories;
    }

    return categories.filter((category) =>
      getCategorySearchText(category).includes(normalizedQuery),
    );
  }, [categories, deferredSearchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / CATEGORIES_PER_PAGE),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchQuery]);

  useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

  const currentPageCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * CATEGORIES_PER_PAGE;

    return filteredCategories.slice(
      startIndex,
      startIndex + CATEGORIES_PER_PAGE,
    );
  }, [currentPage, filteredCategories]);

  const paginationItems = useMemo(
    () => getPaginationItems(totalPages, currentPage),
    [currentPage, totalPages],
  );

  const visibleFrom =
    filteredCategories.length === 0
      ? 0
      : (currentPage - 1) * CATEGORIES_PER_PAGE + 1;
  const visibleTo = Math.min(
    currentPage * CATEGORIES_PER_PAGE,
    filteredCategories.length,
  );

  const onCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const validation = validateCategoryPayload(createForm);
    setCreateErrors(validation.errors);

    if (!validation.success) {
      setFeedback({ type: "error", text: validation.message });
      return;
    }

    try {
      const response = await createCategoryMutation.mutateAsync(
        validation.data,
      );
      setCreateForm(initialFormState);
      setCreateErrors({});
      setCreateSlugTouched(false);
      setFeedback({
        type: "success",
        text: response.message || "Category created successfully.",
      });
    } catch (mutationError) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(mutationError),
      });
    }
  };

  const startEditing = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      isActive: category.isActive ?? true,
    });
    setEditErrors({});
    setFeedback(null);
  };

  const cancelEditing = () => {
    setEditingCategoryId(null);
    setEditForm(initialFormState);
    setEditErrors({});
  };

  const onUpdateSubmit = async (
    event: FormEvent<HTMLFormElement>,
    categoryId: string,
  ) => {
    event.preventDefault();
    setFeedback(null);

    const validation = validateCategoryPayload(editForm);
    setEditErrors(validation.errors);

    if (!validation.success) {
      setFeedback({ type: "error", text: validation.message });
      return;
    }

    try {
      const response = await updateCategoryMutation.mutateAsync({
        id: categoryId,
        payload: validation.data,
      });
      cancelEditing();
      setFeedback({
        type: "success",
        text: response.message || "Category updated successfully.",
      });
    } catch (mutationError) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(mutationError),
      });
    }
  };

  const onDelete = async (category: Category) => {
    const shouldDelete = window.confirm(
      `Delete category "${category.name}"? This action cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    setFeedback(null);

    try {
      const response = await deleteCategoryMutation.mutateAsync({
        id: category.id,
      });

      if (editingCategoryId === category.id) {
        cancelEditing();
      }

      setFeedback({
        type: "success",
        text: response.message || "Category deleted successfully.",
      });
    } catch (mutationError) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(mutationError),
      });
    }
  };

  if (categoriesQuery.isPending) {
    return (
      <LoadingState
        title="Loading categories"
        description="Fetching categories from the backend."
      />
    );
  }

  if (categoriesQuery.isError) {
    return (
      <ErrorState
        title="Could not load categories"
        description={getApiErrorMessage(categoriesQuery.error)}
        onRetry={() => {
          void categoriesQuery.refetch();
        }}
      />
    );
  }

  return (
    <section className="space-y-8">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-slate-50 shadow-sm">
        <div className="grid gap-6 px-6 py-7 md:px-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] xl:items-end">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-emerald-200 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700 shadow-sm">
              Admin Workspace
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Category management with cleaner oversight
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                Create, organize, search, and maintain idea categories from one
                professional dashboard. The workspace surfaces active status,
                recent updates, and quick inline editing without losing
                context.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryCard
              label="Total"
              value={categories.length.toLocaleString()}
              caption="All registered categories"
            />
            <SummaryCard
              label="Active"
              value={activeCategoryCount.toLocaleString()}
              caption="Currently visible for ideas"
            />
            <SummaryCard
              label="Inactive"
              value={inactiveCategoryCount.toLocaleString()}
              caption="Hidden from active selection"
            />
            <SummaryCard
              label="Visible now"
              value={filteredCategories.length.toLocaleString()}
              caption="Results after search filtering"
            />
          </div>
        </div>
      </section>

      {feedback ? (
        <div
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm shadow-sm",
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {feedback.text}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(340px,390px)_minmax(0,1fr)]">
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Create Category
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              Add a new idea category
            </h3>
            <p className="text-sm leading-6 text-slate-600">
              Use a clear name, a unique slug, and a concise description so the
              category is easy to understand and maintain.
            </p>
          </div>

          <form className="mt-6 space-y-5" onSubmit={onCreateSubmit}>
            <fieldset
              disabled={createCategoryMutation.isPending}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="create-category-name"
                  className="text-sm font-medium text-slate-800"
                >
                  Category name
                </Label>
                <Input
                  id="create-category-name"
                  placeholder="Renewable Energy"
                  className="h-12 rounded-2xl border-slate-200 bg-white shadow-sm"
                  value={createForm.name}
                  onChange={(event) => {
                    const nextName = event.target.value;

                    setCreateForm((prev) => ({
                      ...prev,
                      name: nextName,
                      slug: createSlugTouched ? prev.slug : toSlug(nextName),
                    }));
                  }}
                />
                {createErrors.name ? (
                  <p className="text-xs text-red-600">{createErrors.name}</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Use a title that reads well in dashboards and filters.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="create-category-slug"
                  className="text-sm font-medium text-slate-800"
                >
                  Slug
                </Label>
                <Input
                  id="create-category-slug"
                  placeholder="renewable-energy"
                  className="h-12 rounded-2xl border-slate-200 bg-white shadow-sm"
                  value={createForm.slug}
                  onChange={(event) => {
                    setCreateSlugTouched(true);
                    setCreateForm((prev) => ({
                      ...prev,
                      slug: event.target.value,
                    }));
                  }}
                />
                {createErrors.slug ? (
                  <p className="text-xs text-red-600">{createErrors.slug}</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Used in URLs like{" "}
                    <span className="font-medium">
                      /categories/renewable-energy
                    </span>
                    .
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="create-category-description"
                  className="text-sm font-medium text-slate-800"
                >
                  Description
                </Label>
                <textarea
                  id="create-category-description"
                  className={textareaClassName}
                  placeholder="Describe what kinds of ideas belong in this category."
                  value={createForm.description}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
                {createErrors.description ? (
                  <p className="text-xs text-red-600">
                    {createErrors.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Keep it specific enough for reviewers and contributors.
                  </p>
                )}
              </div>

              <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Publish as active
                  </p>
                  <p className="text-xs text-slate-500">
                    Active categories remain available for idea assignment.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={createForm.isActive}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      isActive: event.target.checked,
                    }))
                  }
                  className="size-4 rounded border border-slate-300"
                />
              </label>
            </fieldset>

            <Button type="submit" className="h-11 w-full rounded-2xl text-sm">
              {createCategoryMutation.isPending
                ? "Creating category..."
                : "Create category"}
            </Button>
          </form>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Category Directory
              </p>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                Review and maintain existing categories
              </h3>
              <p className="text-sm leading-6 text-slate-600">
                Search by name, slug, or description, then edit or remove
                categories directly from the current page.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Page Status
              </p>
              <p className="mt-2 text-sm font-medium text-slate-800">
                Page {currentPage.toLocaleString()} of{" "}
                {totalPages.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">3 categories per page</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name, slug, or description"
                className="h-12 rounded-2xl border-slate-200 bg-white pl-11 shadow-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-700">
                Showing {visibleFrom}-{visibleTo} of{" "}
                {filteredCategories.length}
              </span>
              {searchQuery.trim() ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full px-4"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {categories.length === 0 ? (
              <EmptyState title="No categories found" />
            ) : filteredCategories.length === 0 ? (
              <EmptyState
                title="No matching categories"
                description="Try a different keyword or clear the search field."
              />
            ) : (
              <>
                <ul className="space-y-4">
                  {currentPageCategories.map((category) => {
                    const isEditing = editingCategoryId === category.id;
                    const isUpdatingCurrent =
                      updateCategoryMutation.isPending &&
                      updateCategoryMutation.variables?.id === category.id;
                    const isDeletingCurrent =
                      deleteCategoryMutation.isPending &&
                      deleteCategoryMutation.variables?.id === category.id;

                    return (
                      <li
                        key={category.id}
                        className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm transition-colors hover:border-slate-300 hover:bg-white"
                      >
                        {isEditing ? (
                          <form
                            className="space-y-5"
                            onSubmit={(event) =>
                              onUpdateSubmit(event, category.id)
                            }
                          >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                            Editing category
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            Update the content and save the changes for{" "}
                            <span className="font-semibold text-slate-900">
                              {category.name}
                            </span>
                            .
                          </p>
                        </div>
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          Draft mode
                        </span>
                      </div>

                      <fieldset
                        disabled={isUpdatingCurrent}
                        className="grid gap-4 md:grid-cols-2"
                      >
                        <div className="space-y-2">
                          <Label htmlFor={`edit-name-${category.id}`}>
                            Name
                          </Label>
                          <Input
                            id={`edit-name-${category.id}`}
                            className="h-11 rounded-2xl border-slate-200 bg-white shadow-sm"
                            value={editForm.name}
                            onChange={(event) =>
                              setEditForm((prev) => ({
                                ...prev,
                                name: event.target.value,
                              }))
                            }
                          />
                          {editErrors.name ? (
                            <p className="text-xs text-red-600">
                              {editErrors.name}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`edit-slug-${category.id}`}>
                            Slug
                          </Label>
                          <Input
                            id={`edit-slug-${category.id}`}
                            className="h-11 rounded-2xl border-slate-200 bg-white shadow-sm"
                            value={editForm.slug}
                            onChange={(event) =>
                              setEditForm((prev) => ({
                                ...prev,
                                slug: event.target.value,
                              }))
                            }
                          />
                          {editErrors.slug ? (
                            <p className="text-xs text-red-600">
                              {editErrors.slug}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`edit-description-${category.id}`}>
                            Description
                          </Label>
                          <textarea
                            id={`edit-description-${category.id}`}
                            className={textareaClassName}
                            value={editForm.description}
                            onChange={(event) =>
                              setEditForm((prev) => ({
                                ...prev,
                                description: event.target.value,
                              }))
                            }
                          />
                          {editErrors.description ? (
                            <p className="text-xs text-red-600">
                              {editErrors.description}
                            </p>
                          ) : null}
                        </div>

                        <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 md:col-span-2">
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              Category status
                            </p>
                            <p className="text-xs text-slate-500">
                              Toggle whether the category is active for use.
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={editForm.isActive}
                            onChange={(event) =>
                              setEditForm((prev) => ({
                                ...prev,
                                isActive: event.target.checked,
                              }))
                            }
                            className="size-4 rounded border border-slate-300"
                          />
                        </label>
                      </fieldset>

                      <div className="flex flex-wrap gap-3">
                        <Button
                          type="submit"
                          disabled={isUpdatingCurrent}
                          className="rounded-2xl"
                        >
                          {isUpdatingCurrent
                            ? "Saving changes..."
                            : "Save changes"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="rounded-2xl"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                        ) : (
                          <div className="space-y-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-semibold text-slate-950">
                              {category.name}
                            </h4>
                            <span
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-semibold",
                                category.isActive === false
                                  ? "bg-slate-200 text-slate-700"
                                  : "bg-emerald-100 text-emerald-700",
                              )}
                            >
                              {category.isActive === false
                                ? "Inactive"
                                : "Active"}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700">
                              Slug: {category.slug}
                            </span>
                            <span>Updated {formatDate(category.updatedAt)}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-2xl"
                            onClick={() => startEditing(category)}
                            disabled={
                              deleteCategoryMutation.isPending ||
                              updateCategoryMutation.isPending
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            className="rounded-2xl"
                            onClick={() => {
                              void onDelete(category);
                            }}
                            disabled={isDeletingCurrent}
                          >
                            {isDeletingCurrent ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                        {getCategoryDescription(category.description)}
                      </div>

                      <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                            Created
                          </p>
                          <p className="mt-2 font-medium text-slate-800">
                            {formatDate(category.createdAt)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                            Last updated
                          </p>
                          <p className="mt-2 font-medium text-slate-800">
                            {formatDate(category.updatedAt)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                            Visibility
                          </p>
                          <p className="mt-2 font-medium text-slate-800">
                            {category.isActive === false
                              ? "Inactive category"
                              : "Ready for use"}
                          </p>
                        </div>
                      </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {totalPages > 1 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5">
                    <Pagination>
                      <PaginationContent className="flex-wrap items-center justify-center gap-2">
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            className={cn(
                              currentPage <= 1 &&
                                "pointer-events-none opacity-50",
                            )}
                            onClick={(event) => {
                              event.preventDefault();

                              if (currentPage <= 1) {
                                return;
                              }

                              setCurrentPage(currentPage - 1);
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

                          return (
                            <PaginationItem key={`page-${item}`}>
                              <PaginationLink
                                href="#"
                                isActive={item === currentPage}
                                className={cn(
                                  item === currentPage &&
                                    "pointer-events-none",
                                )}
                                onClick={(event) => {
                                  event.preventDefault();
                                  setCurrentPage(item);
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
                            className={cn(
                              currentPage >= totalPages &&
                                "pointer-events-none opacity-50",
                            )}
                            onClick={(event) => {
                              event.preventDefault();

                              if (currentPage >= totalPages) {
                                return;
                              }

                              setCurrentPage(currentPage + 1);
                            }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>

                    <p className="mt-3 text-center text-sm text-slate-500">
                      Page {currentPage.toLocaleString()} of{" "}
                      {totalPages.toLocaleString()}. Three categories are shown
                      per page.
                    </p>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

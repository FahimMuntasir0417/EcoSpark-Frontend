"use client";

import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategoryInputSchema } from "@/contracts/category.contract";
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from "@/features/category";
import { getApiErrorMessage } from "@/lib/errors/api-error";
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

const initialFormState: CategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  isActive: true,
};

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

  const categories = useMemo(
    () =>
      [...(categoriesQuery.data?.data ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [categoriesQuery.data?.data],
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
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Category Management</h2>
          <p className="text-sm text-muted-foreground">
            Create, update, activate, and delete idea categories from one
            workspace.
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
          Total Categories: {categories.length}
        </div>
      </div>

      {feedback ? (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            feedback.type === "success"
              ? "border-green-300 bg-green-50 text-green-700"
              : "border-red-300 bg-red-50 text-red-700"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}

      <section className="rounded-xl border bg-background p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Create Category</h3>
          <p className="text-sm text-muted-foreground">
            Slug should be unique and URL-friendly. Name and description are
            required.
          </p>
        </div>

        <form className="space-y-4" onSubmit={onCreateSubmit}>
          <fieldset
            disabled={createCategoryMutation.isPending}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="create-category-name">Name</Label>
              <Input
                id="create-category-name"
                placeholder="Renewable Energy"
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
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-category-slug">Slug</Label>
              <Input
                id="create-category-slug"
                placeholder="renewable-energy"
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
                <p className="text-xs text-muted-foreground">
                  Used in URLs like /categories/renewable-energy.
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="create-category-description">Description</Label>
              <textarea
                id="create-category-description"
                className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                placeholder="Describe what ideas belong in this category."
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
              ) : null}
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-foreground md:col-span-2">
              <input
                type="checkbox"
                checked={createForm.isActive}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    isActive: event.target.checked,
                  }))
                }
                className="size-4 rounded border border-input"
              />
              Category is active
            </label>
          </fieldset>

          <div className="flex justify-end">
            <Button type="submit" variant="outline">
              {createCategoryMutation.isPending
                ? "Creating..."
                : "Create Category"}
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold">Existing Categories</h3>

        {categories.length === 0 ? (
          <EmptyState title="No categories found" />
        ) : (
          <ul className="space-y-3">
            {categories.map((category) => {
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
                  className="rounded-xl border bg-background p-4"
                >
                  {isEditing ? (
                    <form
                      className="space-y-4"
                      onSubmit={(event) => onUpdateSubmit(event, category.id)}
                    >
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
                            className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                            rows={3}
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

                        <label className="inline-flex items-center gap-2 text-sm text-foreground md:col-span-2">
                          <input
                            type="checkbox"
                            checked={editForm.isActive}
                            onChange={(event) =>
                              setEditForm((prev) => ({
                                ...prev,
                                isActive: event.target.checked,
                              }))
                            }
                            className="size-4 rounded border border-input"
                          />
                          Category is active
                        </label>
                      </fieldset>

                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          variant="outline"
                          disabled={isUpdatingCurrent}
                        >
                          {isUpdatingCurrent ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{category.name}</p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              category.isActive === false
                                ? "bg-slate-200 text-slate-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {category.isActive === false
                              ? "Inactive"
                              : "Active"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Slug: {category.slug}
                        </p>
                        <p className="text-sm">{category.description}</p>
                        <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                          <p>Created: {formatDate(category.createdAt)}</p>
                          <p>Updated: {formatDate(category.updatedAt)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
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
                          onClick={() => {
                            void onDelete(category);
                          }}
                          disabled={isDeletingCurrent}
                        >
                          {isDeletingCurrent ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </section>
  );
}

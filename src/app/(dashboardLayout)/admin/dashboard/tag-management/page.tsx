"use client";

import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTagInputSchema } from "@/contracts/tag.contract";
import {
  useCreateTagMutation,
  useDeleteTagMutation,
  useTagsQuery,
  useUpdateTagMutation,
} from "@/features/tag";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import type { CreateTagInput, Tag } from "@/services/tag.service";

type Feedback = {
  type: "success" | "error";
  text: string;
};

type TagFormValues = {
  name: string;
  slug: string;
};

type TagFormErrors = Partial<Record<"name" | "slug", string>>;

const initialFormState: TagFormValues = {
  name: "",
  slug: "",
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

function normalizeTagPayload(values: TagFormValues): CreateTagInput {
  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
  };
}

function validateTagPayload(values: TagFormValues) {
  const parsed = createTagInputSchema.safeParse(normalizeTagPayload(values));

  if (parsed.success) {
    return {
      success: true as const,
      data: parsed.data,
      errors: {} as TagFormErrors,
    };
  }

  const errors: TagFormErrors = {};

  for (const issue of parsed.error.issues) {
    const field = issue.path[0];

    if (typeof field === "string" && (field === "name" || field === "slug") && !errors[field]) {
      errors[field] = issue.message;
    }
  }

  return {
    success: false as const,
    errors,
    message: parsed.error.issues[0]?.message ?? "Invalid tag input",
  };
}

export default function TagManagementPage() {
  const tagsQuery = useTagsQuery();
  const createTagMutation = useCreateTagMutation();
  const updateTagMutation = useUpdateTagMutation();
  const deleteTagMutation = useDeleteTagMutation();

  const [createForm, setCreateForm] = useState<TagFormValues>(initialFormState);
  const [createErrors, setCreateErrors] = useState<TagFormErrors>({});
  const [createSlugTouched, setCreateSlugTouched] = useState(false);

  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TagFormValues>(initialFormState);
  const [editErrors, setEditErrors] = useState<TagFormErrors>({});

  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const tags = useMemo(
    () => [...(tagsQuery.data?.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [tagsQuery.data?.data],
  );

  const onCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const validation = validateTagPayload(createForm);
    setCreateErrors(validation.errors);

    if (!validation.success) {
      setFeedback({ type: "error", text: validation.message });
      return;
    }

    try {
      const response = await createTagMutation.mutateAsync(validation.data);
      setCreateForm(initialFormState);
      setCreateErrors({});
      setCreateSlugTouched(false);
      setFeedback({
        type: "success",
        text: response.message || "Tag created successfully.",
      });
    } catch (mutationError) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(mutationError),
      });
    }
  };

  const startEditing = (tag: Tag) => {
    setEditingTagId(tag.id);
    setEditForm({
      name: tag.name,
      slug: tag.slug,
    });
    setEditErrors({});
    setFeedback(null);
  };

  const cancelEditing = () => {
    setEditingTagId(null);
    setEditForm(initialFormState);
    setEditErrors({});
  };

  const onUpdateSubmit = async (event: FormEvent<HTMLFormElement>, tagId: string) => {
    event.preventDefault();
    setFeedback(null);

    const validation = validateTagPayload(editForm);
    setEditErrors(validation.errors);

    if (!validation.success) {
      setFeedback({ type: "error", text: validation.message });
      return;
    }

    try {
      const response = await updateTagMutation.mutateAsync({
        id: tagId,
        payload: validation.data,
      });
      cancelEditing();
      setFeedback({
        type: "success",
        text: response.message || "Tag updated successfully.",
      });
    } catch (mutationError) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(mutationError),
      });
    }
  };

  const onDelete = async (tag: Tag) => {
    const shouldDelete = window.confirm(
      `Delete tag "${tag.name}"? This action cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    setFeedback(null);

    try {
      const response = await deleteTagMutation.mutateAsync({ id: tag.id });

      if (editingTagId === tag.id) {
        cancelEditing();
      }

      setFeedback({
        type: "success",
        text: response.message || "Tag deleted successfully.",
      });
    } catch (mutationError) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(mutationError),
      });
    }
  };

  if (tagsQuery.isPending) {
    return (
      <LoadingState
        title="Loading tags"
        description="Fetching tag definitions from the backend."
      />
    );
  }

  if (tagsQuery.isError) {
    return (
      <ErrorState
        title="Could not load tags"
        description={getApiErrorMessage(tagsQuery.error)}
        onRetry={() => {
          void tagsQuery.refetch();
        }}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Tag Management</h2>
          <p className="text-sm text-muted-foreground">
            Create, update, and delete idea tags used for classification and discovery.
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
          Total Tags: {tags.length}
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
          <h3 className="text-lg font-semibold">Create Tag</h3>
          <p className="text-sm text-muted-foreground">
            Keep slugs short and unique for predictable API and URL usage.
          </p>
        </div>

        <form className="space-y-4" onSubmit={onCreateSubmit}>
          <fieldset
            disabled={createTagMutation.isPending}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="create-tag-name">Name</Label>
              <Input
                id="create-tag-name"
                placeholder="Solar"
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
              <Label htmlFor="create-tag-slug">Slug</Label>
              <Input
                id="create-tag-slug"
                placeholder="solar"
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
                <p className="text-xs text-muted-foreground">Used in `/tags/slug/:slug`.</p>
              )}
            </div>
          </fieldset>

          <div className="flex justify-end">
            <Button type="submit" variant="outline">
              {createTagMutation.isPending ? "Creating..." : "Create Tag"}
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold">Existing Tags</h3>

        {tags.length === 0 ? (
          <EmptyState
            title="No tags found"
            description="Create your first tag to start classifying ideas."
          />
        ) : (
          <ul className="space-y-3">
            {tags.map((tag) => {
              const isEditing = editingTagId === tag.id;
              const isUpdatingCurrent =
                updateTagMutation.isPending && updateTagMutation.variables?.id === tag.id;
              const isDeletingCurrent =
                deleteTagMutation.isPending && deleteTagMutation.variables?.id === tag.id;

              return (
                <li key={tag.id} className="rounded-xl border bg-background p-4">
                  {isEditing ? (
                    <form
                      className="space-y-4"
                      onSubmit={(event) => onUpdateSubmit(event, tag.id)}
                    >
                      <fieldset
                        disabled={isUpdatingCurrent}
                        className="grid gap-4 md:grid-cols-2"
                      >
                        <div className="space-y-2">
                          <Label htmlFor={`edit-tag-name-${tag.id}`}>Name</Label>
                          <Input
                            id={`edit-tag-name-${tag.id}`}
                            value={editForm.name}
                            onChange={(event) =>
                              setEditForm((prev) => ({
                                ...prev,
                                name: event.target.value,
                              }))
                            }
                          />
                          {editErrors.name ? (
                            <p className="text-xs text-red-600">{editErrors.name}</p>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`edit-tag-slug-${tag.id}`}>Slug</Label>
                          <Input
                            id={`edit-tag-slug-${tag.id}`}
                            value={editForm.slug}
                            onChange={(event) =>
                              setEditForm((prev) => ({
                                ...prev,
                                slug: event.target.value,
                              }))
                            }
                          />
                          {editErrors.slug ? (
                            <p className="text-xs text-red-600">{editErrors.slug}</p>
                          ) : null}
                        </div>
                      </fieldset>

                      <div className="flex gap-2">
                        <Button type="submit" variant="outline" disabled={isUpdatingCurrent}>
                          {isUpdatingCurrent ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button type="button" variant="ghost" onClick={cancelEditing}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{tag.name}</p>
                        <p className="text-sm text-muted-foreground">Slug: {tag.slug}</p>
                        <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                          <p>Created: {formatDate(tag.createdAt)}</p>
                          <p>Updated: {formatDate(tag.updatedAt)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => startEditing(tag)}
                          disabled={updateTagMutation.isPending || deleteTagMutation.isPending}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            void onDelete(tag);
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

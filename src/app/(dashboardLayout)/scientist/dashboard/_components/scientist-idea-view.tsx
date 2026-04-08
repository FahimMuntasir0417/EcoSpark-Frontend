"use client";

import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { createIdeaInputSchema } from "@/contracts/idea.contract";
import { useCategoriesQuery } from "@/features/category";
import {
  useCreateIdeaMutation,
  useDeleteIdeaMutation,
  useIdeasQuery,
  useSubmitIdeaMutation,
  useUpdateIdeaMutation,
} from "@/features/idea";
import { useScientistByUserIdQuery } from "@/features/scientist";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import type { Category } from "@/services/category.service";
import type { Idea } from "@/services/idea.service";
import { userService } from "@/services/user.service";

export type ScientistIdeaViewMode =
  | "overview"
  | "create"
  | "my-ideas"
  | "draft-ideas"
  | "submitted-ideas";

type ScientistIdeaViewProps = {
  mode?: ScientistIdeaViewMode;
};

type Feedback = {
  type: "success" | "error";
  text: string;
};

type IdeaForm = {
  title: string;
  slug: string;
  categoryId: string;
  description: string;
};

type ViewCopy = {
  title: string;
  description: string;
  createTitle: string;
  listTitle: string;
  emptyTitle: string;
};

const initialForm: IdeaForm = {
  title: "",
  slug: "",
  categoryId: "",
  description: "",
};

function getIdeaTitle(idea: Idea) {
  return typeof idea.title === "string" && idea.title.trim()
    ? idea.title
    : "Untitled Idea";
}

function getIdeaSlug(idea: Idea) {
  return typeof idea.slug === "string" ? idea.slug : "-";
}

function getIdeaCategoryId(idea: Idea) {
  return typeof idea.categoryId === "string" ? idea.categoryId : "";
}

function getIdeaOwnerId(idea: Idea) {
  return (
    (typeof idea.authorId === "string" && idea.authorId) ||
    (typeof idea.author?.id === "string" && idea.author.id) ||
    null
  );
}

function getCategoryName(categoryId: string, categories: Category[]) {
  if (!categoryId) {
    return "";
  }

  const category = categories.find((item) => item.id === categoryId);

  return category?.name ?? categoryId;
}

function getIdeaDescription(idea: Idea) {
  return typeof idea.description === "string" && idea.description.trim()
    ? idea.description
    : "No description";
}

function getIdeaStatus(idea: Idea) {
  return typeof idea.status === "string" && idea.status.trim()
    ? idea.status
    : "draft";
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

function isDraftIdea(idea: Idea) {
  return getIdeaStatus(idea).toLowerCase().includes("draft");
}

function normalizeIdeaPayload(form: IdeaForm) {
  return {
    title: form.title.trim(),
    slug: form.slug.trim(),
    categoryId: form.categoryId.trim(),
    description: form.description.trim(),
  };
}

function validateIdeaPayload(form: IdeaForm) {
  const parsed = createIdeaInputSchema.safeParse(normalizeIdeaPayload(form));

  if (parsed.success) {
    return { success: true as const, data: parsed.data };
  }

  return {
    success: false as const,
    message: parsed.error.issues[0]?.message ?? "Invalid idea input",
  };
}

function getVisibleIdeas(ideas: Idea[], mode: ScientistIdeaViewMode) {
  if (mode === "draft-ideas") {
    return ideas.filter(isDraftIdea);
  }

  if (mode === "submitted-ideas") {
    return ideas.filter((idea) => !isDraftIdea(idea));
  }

  return ideas;
}

function getViewCopy(mode: ScientistIdeaViewMode): ViewCopy {
  switch (mode) {
    case "create":
      return {
        title: "Create Idea",
        description:
          "Draft a new idea and assign it to a category before submission.",
        createTitle: "Create Idea",
        listTitle: "My Ideas",
        emptyTitle: "No ideas found yet",
      };
    case "draft-ideas":
      return {
        title: "Draft Ideas",
        description:
          "Continue editing drafts that have not been submitted for review yet.",
        createTitle: "Create Another Draft",
        listTitle: "Draft Ideas",
        emptyTitle: "No draft ideas found",
      };
    case "submitted-ideas":
      return {
        title: "Submitted Ideas",
        description:
          "Review ideas that have already been sent into the moderation flow.",
        createTitle: "Create Idea",
        listTitle: "Submitted Ideas",
        emptyTitle: "No submitted ideas found",
      };
    case "my-ideas":
      return {
        title: "My Ideas",
        description:
          "Manage the ideas currently associated with your workspace.",
        createTitle: "Create Idea",
        listTitle: "My Ideas",
        emptyTitle: "No ideas found yet",
      };
    default:
      return {
        title: "Scientist Dashboard",
        description: "Create, update, and submit ideas from one place.",
        createTitle: "Create Idea",
        listTitle: "My Ideas",
        emptyTitle: "No ideas found yet",
      };
  }
}

export function ScientistIdeaView({
  mode = "overview",
}: Readonly<ScientistIdeaViewProps>) {
  const meQuery = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => userService.getMe(),
  });
  const userId = meQuery.data?.data?.id ?? "";

  const scientistQuery = useScientistByUserIdQuery(userId);
  const ideasQuery = useIdeasQuery();
  const categoriesQuery = useCategoriesQuery();

  const createIdeaMutation = useCreateIdeaMutation();
  const updateIdeaMutation = useUpdateIdeaMutation();
  const deleteIdeaMutation = useDeleteIdeaMutation();
  const submitIdeaMutation = useSubmitIdeaMutation();

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [createForm, setCreateForm] = useState<IdeaForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<IdeaForm>(initialForm);

  const ideas = ideasQuery.data?.data ?? [];
  const categories = categoriesQuery.data?.data ?? [];
  const scientistId = scientistQuery.data?.data?.id ?? "";
  const ownerIds = new Set([userId, scientistId].filter(Boolean));
  const ideasWithOwnerMetadata = ideas.filter((idea) => getIdeaOwnerId(idea));
  const ownershipMetadataMissing =
    ideas.length > 0 && ideasWithOwnerMetadata.length === 0;
  const filteredIdeas =
    ownerIds.size > 0 && ideasWithOwnerMetadata.length > 0
      ? ideas.filter((idea) => {
          const ownerId = getIdeaOwnerId(idea);
          return ownerId ? ownerIds.has(ownerId) : false;
        })
      : ideas;
  const ownershipScopeMismatch =
    ownerIds.size > 0 &&
    ideas.length > 0 &&
    ideasWithOwnerMetadata.length > 0 &&
    filteredIdeas.length === 0;
  const scopedIdeas = ownershipScopeMismatch ? ideas : filteredIdeas;
  const hasCategories = categories.length > 0;
  const visibleIdeas = getVisibleIdeas(scopedIdeas, mode);
  const viewCopy = getViewCopy(mode);
  const showCreateSection = mode === "overview" || mode === "create";
  const showIdeasSection = mode !== "create";

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const validation = validateIdeaPayload(createForm);

    if (!validation.success) {
      setFeedback({ type: "error", text: validation.message });
      return;
    }

    try {
      const response = await createIdeaMutation.mutateAsync(validation.data);
      setCreateForm(initialForm);
      setFeedback({
        type: "success",
        text: response.message || "Idea created successfully.",
      });
    } catch (mutationError) {
      setFeedback({ type: "error", text: getApiErrorMessage(mutationError) });
    }
  };

  const startEdit = (idea: Idea) => {
    setEditingId(idea.id);
    setEditForm({
      title: getIdeaTitle(idea),
      slug: getIdeaSlug(idea),
      categoryId: getIdeaCategoryId(idea),
      description: getIdeaDescription(idea),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(initialForm);
  };

  const onUpdate = async (
    event: FormEvent<HTMLFormElement>,
    ideaId: string,
  ) => {
    event.preventDefault();
    setFeedback(null);

    const validation = validateIdeaPayload(editForm);

    if (!validation.success) {
      setFeedback({ type: "error", text: validation.message });
      return;
    }

    try {
      const response = await updateIdeaMutation.mutateAsync({
        id: ideaId,
        payload: validation.data,
      });
      cancelEdit();
      setFeedback({
        type: "success",
        text: response.message || "Idea updated successfully.",
      });
    } catch (mutationError) {
      setFeedback({ type: "error", text: getApiErrorMessage(mutationError) });
    }
  };

  const onSubmitIdea = async (idea: Idea) => {
    setFeedback(null);

    try {
      const response = await submitIdeaMutation.mutateAsync({ id: idea.id });
      setFeedback({
        type: "success",
        text: response.message || "Idea submitted for review.",
      });
    } catch (mutationError) {
      setFeedback({ type: "error", text: getApiErrorMessage(mutationError) });
    }
  };

  const onDeleteIdea = async (idea: Idea) => {
    const confirmed = window.confirm(`Delete idea "${getIdeaTitle(idea)}"?`);

    if (!confirmed) {
      return;
    }

    setFeedback(null);

    try {
      const response = await deleteIdeaMutation.mutateAsync({ id: idea.id });

      if (editingId === idea.id) {
        cancelEdit();
      }

      setFeedback({
        type: "success",
        text: response.message || "Idea deleted successfully.",
      });
    } catch (mutationError) {
      setFeedback({ type: "error", text: getApiErrorMessage(mutationError) });
    }
  };

  const scientistContextPending = Boolean(userId) && scientistQuery.isPending;

  if (
    meQuery.isPending ||
    scientistContextPending ||
    ideasQuery.isPending ||
    categoriesQuery.isPending
  ) {
    return (
      <LoadingState
        title="Loading dashboard"
        description="Fetching your ideas and categories from the backend."
      />
    );
  }

  if (meQuery.isError || ideasQuery.isError || categoriesQuery.isError) {
    return (
      <ErrorState
        title="Could not load dashboard"
        description={getApiErrorMessage(
          meQuery.error ?? ideasQuery.error ?? categoriesQuery.error,
        )}
        onRetry={() => {
          void meQuery.refetch();
          void ideasQuery.refetch();
          void categoriesQuery.refetch();
        }}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{viewCopy.title}</h2>
        <p className="text-sm text-muted-foreground">{viewCopy.description}</p>
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

      {ownershipMetadataMissing || ownershipScopeMismatch ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          The ideas API does not expose enough ownership detail to guarantee a
          strict my ideas scope, so this page is falling back to the shared idea
          list.
        </p>
      ) : null}

      {showCreateSection ? (
        <section className="rounded-md border p-4">
          <h3 className="text-lg font-semibold">{viewCopy.createTitle}</h3>

          <form className="mt-3 grid gap-3" onSubmit={onCreate}>
            <Input
              placeholder="Title"
              value={createForm.title}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  title: event.target.value,
                }))
              }
            />
            <Input
              placeholder="Slug"
              value={createForm.slug}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, slug: event.target.value }))
              }
            />
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={createForm.categoryId}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  categoryId: event.target.value,
                }))
              }
              disabled={!hasCategories}
            >
              <option value="">
                {hasCategories
                  ? "Select a category"
                  : "No categories available"}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <textarea
              className="rounded-md border px-3 py-2 text-sm"
              rows={3}
              placeholder="Description"
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />

            {!hasCategories ? (
              <p className="text-sm text-muted-foreground">
                Create at least one category before creating an idea.
              </p>
            ) : null}

            <Button
              className="w-fit"
              variant="outline"
              type="submit"
              disabled={createIdeaMutation.isPending || !hasCategories}
            >
              {createIdeaMutation.isPending ? "Creating..." : "Create Idea"}
            </Button>
          </form>
        </section>
      ) : null}

      {showIdeasSection ? (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">{viewCopy.listTitle}</h3>

          {visibleIdeas.length === 0 ? (
            <EmptyState title={viewCopy.emptyTitle} />
          ) : (
            <ul className="space-y-3">
              {visibleIdeas.map((idea) => {
                const isEditing = editingId === idea.id;
                const canSubmit = isDraftIdea(idea);
                const isUpdating =
                  updateIdeaMutation.isPending &&
                  updateIdeaMutation.variables?.id === idea.id;
                const isSubmitting =
                  submitIdeaMutation.isPending &&
                  submitIdeaMutation.variables?.id === idea.id;
                const isDeleting =
                  deleteIdeaMutation.isPending &&
                  deleteIdeaMutation.variables?.id === idea.id;

                return (
                  <li
                    key={idea.id}
                    className="rounded-xl border bg-background p-4"
                  >
                    {isEditing ? (
                      <form
                        className="grid gap-3"
                        onSubmit={(event) => onUpdate(event, idea.id)}
                      >
                        <Input
                          value={editForm.title}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              title: event.target.value,
                            }))
                          }
                        />
                        <Input
                          value={editForm.slug}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              slug: event.target.value,
                            }))
                          }
                        />
                        <select
                          className="rounded-md border px-3 py-2 text-sm"
                          value={editForm.categoryId}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              categoryId: event.target.value,
                            }))
                          }
                          disabled={!hasCategories}
                        >
                          <option value="">
                            {hasCategories
                              ? "Select a category"
                              : "No categories available"}
                          </option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <textarea
                          className="rounded-md border px-3 py-2 text-sm"
                          rows={3}
                          value={editForm.description}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              description: event.target.value,
                            }))
                          }
                        />

                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            variant="outline"
                            disabled={isUpdating || !hasCategories}
                          >
                            {isUpdating ? "Updating..." : "Update"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={cancelEdit}
                            disabled={isUpdating}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium">{getIdeaTitle(idea)}</p>
                          <p className="text-sm text-muted-foreground">
                            Slug: {getIdeaSlug(idea)}
                          </p>
                        </div>

                        <div className="grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
                          <p>
                            Category:{" "}
                            {getCategoryName(
                              getIdeaCategoryId(idea),
                              categories,
                            ) || "N/A"}
                          </p>
                          <p>Status: {getIdeaStatus(idea)}</p>
                          <p>Created: {formatDate(idea.createdAt)}</p>
                          <p>Updated: {formatDate(idea.updatedAt)}</p>
                        </div>

                        <p className="text-sm">{getIdeaDescription(idea)}</p>

                        {!canSubmit ? (
                          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            This idea has already moved beyond draft status.
                          </p>
                        ) : null}

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            type="button"
                            onClick={() => startEdit(idea)}
                            disabled={isDeleting || isSubmitting}
                          >
                            Edit
                          </Button>
                          {canSubmit ? (
                            <Button
                              variant="secondary"
                              type="button"
                              onClick={() => {
                                void onSubmitIdea(idea);
                              }}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? "Submitting..." : "Submit"}
                            </Button>
                          ) : null}
                          <Button
                            variant="destructive"
                            type="button"
                            onClick={() => {
                              void onDeleteIdea(idea);
                            }}
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
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
      ) : null}
    </section>
  );
}

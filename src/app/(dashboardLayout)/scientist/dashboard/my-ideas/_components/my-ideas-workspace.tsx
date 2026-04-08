"use client";

import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateIdeaInputSchema } from "@/contracts/idea.contract";
import {
  useDeleteIdeaMutation,
  useIdeaByIdQuery,
  useIdeasQuery,
  useSubmitIdeaMutation,
  useUpdateIdeaMutation,
} from "@/features/idea";
import { useScientistByUserIdQuery } from "@/features/scientist";
import { getApiErrorMessage, normalizeApiError } from "@/lib/errors/api-error";
import type { Idea, UpdateIdeaInput } from "@/services/idea.service";
import { userService } from "@/services/user.service";

type Feedback = {
  type: "success" | "error";
  text: string;
};

type IdeaEditForm = {
  title: string;
  description: string;
  expectedBenefits: string;
  accessType: string;
  price: string;
  adminNote: string;
};

type IdeaEditFormErrors = Partial<Record<keyof IdeaEditForm, string>>;

type ValidationResult =
  | {
      success: true;
      data: UpdateIdeaInput;
      errors: IdeaEditFormErrors;
    }
  | {
      success: false;
      message: string;
      errors: IdeaEditFormErrors;
    };

const ACCESS_TYPE_OPTIONS = ["FREE", "PAID"] as const;

const textareaClassName =
  "min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50";

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function trimToUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
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

function getIdeaTitle(idea: Idea) {
  return hasText(idea.title) ? idea.title!.trim() : "Untitled idea";
}

function getIdeaStatus(idea: Idea) {
  return hasText(idea.status) ? idea.status!.trim() : "draft";
}

function getIdeaDescription(idea: Idea) {
  return hasText(idea.description) ? idea.description!.trim() : "No description";
}

function getIdeaOwnerId(idea: Idea) {
  return (
    (typeof idea.authorId === "string" && idea.authorId) ||
    (typeof idea.author?.id === "string" && idea.author.id) ||
    null
  );
}

function isDraftIdea(idea: Idea) {
  return getIdeaStatus(idea).toLowerCase().includes("draft");
}

function getInitialEditForm(idea: Idea): IdeaEditForm {
  const rawPrice = idea.price;
  const normalizedPrice =
    typeof rawPrice === "number"
      ? String(rawPrice)
      : typeof rawPrice === "string"
        ? rawPrice
        : "";
  const normalizedAccessType =
    typeof idea.accessType === "string" && idea.accessType.trim()
      ? idea.accessType.toUpperCase()
      : "FREE";

  return {
    title: hasText(idea.title) ? idea.title!.trim() : "",
    description: hasText(idea.description) ? idea.description!.trim() : "",
    expectedBenefits: hasText(idea.expectedBenefits)
      ? idea.expectedBenefits!.trim()
      : "",
    accessType: normalizedAccessType,
    price: normalizedAccessType === "FREE" ? "0" : normalizedPrice,
    adminNote: hasText(idea.adminNote) ? idea.adminNote!.trim() : "",
  };
}

function normalizeUpdatePayload(form: IdeaEditForm): UpdateIdeaInput {
  const payload: Record<string, unknown> = {
    title: form.title.trim(),
  };

  const description = trimToUndefined(form.description);
  const expectedBenefits = trimToUndefined(form.expectedBenefits);
  const accessType = trimToUndefined(form.accessType)?.toUpperCase();
  const adminNote = trimToUndefined(form.adminNote);
  const price = parseOptionalNumber(form.price);

  if (description) {
    payload.description = description;
  }

  if (expectedBenefits) {
    payload.expectedBenefits = expectedBenefits;
  }

  if (accessType) {
    payload.accessType = accessType;
  }

  if (accessType === "FREE") {
    payload.price = 0;
  } else if (typeof price === "number") {
    payload.price = price;
  }

  if (adminNote) {
    payload.adminNote = adminNote;
  }

  return payload as UpdateIdeaInput;
}

function validateUpdatePayload(form: IdeaEditForm): ValidationResult {
  const errors: IdeaEditFormErrors = {};
  const accessType = form.accessType.trim().toUpperCase();

  if (!form.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!accessType) {
    errors.accessType = "Access type is required.";
  }

  if (
    accessType &&
    !ACCESS_TYPE_OPTIONS.includes(accessType as (typeof ACCESS_TYPE_OPTIONS)[number])
  ) {
    errors.accessType = "Access type must be FREE or PAID.";
  }

  if (accessType === "PAID" && !form.price.trim()) {
    errors.price = "Price is required for PAID ideas.";
  }

  if (form.price.trim()) {
    const parsedPrice = Number(form.price.trim());

    if (!Number.isFinite(parsedPrice)) {
      errors.price = "Price must be a valid number.";
    } else if (parsedPrice < 0) {
      errors.price = "Price cannot be negative.";
    }
  }

  const normalized = normalizeUpdatePayload(form);
  const schemaValidation = updateIdeaInputSchema.safeParse(normalized);

  if (!schemaValidation.success) {
    for (const issue of schemaValidation.error.issues) {
      const field = issue.path[0];

      if (typeof field !== "string") {
        continue;
      }

      if (
        (field === "title" ||
          field === "description" ||
          field === "expectedBenefits" ||
          field === "accessType" ||
          field === "price" ||
          field === "adminNote") &&
        !errors[field]
      ) {
        errors[field] = issue.message;
      }
    }
  }

  if (Object.keys(errors).length > 0 || !schemaValidation.success) {
    const fallbackIssue = !schemaValidation.success
      ? schemaValidation.error.issues[0]?.message
      : undefined;

    return {
      success: false,
      message: Object.values(errors)[0] ?? fallbackIssue ?? "Invalid update payload.",
      errors,
    };
  }

  return {
    success: true,
    data: schemaValidation.data,
    errors: {},
  };
}

function formatPrice(idea: Idea) {
  const accessType =
    typeof idea.accessType === "string" ? idea.accessType.toUpperCase() : "";

  if (accessType === "FREE") {
    return "Free";
  }

  const rawPrice = idea.price;

  if (rawPrice === null || rawPrice === undefined || rawPrice === "") {
    return "N/A";
  }

  const price =
    typeof rawPrice === "number" ? rawPrice : Number.parseFloat(String(rawPrice));

  if (Number.isNaN(price)) {
    return String(rawPrice);
  }

  return price.toLocaleString(undefined, {
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function FieldError({ message }: Readonly<{ message?: string }>) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-red-600">{message}</p>;
}

export function MyIdeasWorkspace() {
  const meQuery = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => userService.getMe(),
  });
  const userId = meQuery.data?.data?.id ?? "";

  const scientistQuery = useScientistByUserIdQuery(userId);
  const ideasQuery = useIdeasQuery();
  const updateIdeaMutation = useUpdateIdeaMutation();
  const deleteIdeaMutation = useDeleteIdeaMutation();
  const submitIdeaMutation = useSubmitIdeaMutation();

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<IdeaEditForm>({
    title: "",
    description: "",
    expectedBenefits: "",
    accessType: "FREE",
    price: "0",
    adminNote: "",
  });
  const [editErrors, setEditErrors] = useState<IdeaEditFormErrors>({});

  const detailsQuery = useIdeaByIdQuery(selectedIdeaId);
  const meNormalizedError = meQuery.error ? normalizeApiError(meQuery.error) : null;
  const profileEndpointUnavailable = meNormalizedError?.statusCode === 404;

  const ideas = ideasQuery.data?.data ?? [];
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

  const sortedIdeas = useMemo(
    () =>
      [...scopedIdeas].sort((a, b) => {
        const aTime = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        const bTime = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        return bTime - aTime;
      }),
    [scopedIdeas],
  );

  const scientistContextPending = Boolean(userId) && scientistQuery.isPending;

  const detailsIdea = detailsQuery.data?.data ?? null;

  const startEdit = (idea: Idea) => {
    setEditingId(idea.id);
    setEditForm(getInitialEditForm(idea));
    setEditErrors({});
    setFeedback(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditErrors({});
  };

  const onUpdate = async (event: FormEvent<HTMLFormElement>, ideaId: string) => {
    event.preventDefault();
    setFeedback(null);

    const validation = validateUpdatePayload(editForm);
    setEditErrors(validation.errors);

    if (!validation.success) {
      setFeedback({ type: "error", text: validation.message });
      return;
    }

    try {
      const response = await updateIdeaMutation.mutateAsync({
        id: ideaId,
        payload: validation.data,
      });
      setFeedback({
        type: "success",
        text: response.message || "Idea updated successfully.",
      });
      cancelEdit();
    } catch (mutationError) {
      setFeedback({ type: "error", text: getApiErrorMessage(mutationError) });
    }
  };

  const onDelete = async (idea: Idea) => {
    const confirmed = window.confirm(
      `Delete idea "${getIdeaTitle(idea)}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setFeedback(null);

    try {
      const response = await deleteIdeaMutation.mutateAsync({ id: idea.id });

      if (editingId === idea.id) {
        cancelEdit();
      }

      if (selectedIdeaId === idea.id) {
        setSelectedIdeaId("");
      }

      setFeedback({
        type: "success",
        text: response.message || "Idea deleted successfully.",
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

  if (meQuery.isPending || scientistContextPending || ideasQuery.isPending) {
    return (
      <LoadingState
        title="Loading My Ideas"
        description="Fetching your ideas and workspace permissions."
        rows={6}
      />
    );
  }

  if (ideasQuery.isError || (meQuery.isError && !profileEndpointUnavailable)) {
    return (
      <ErrorState
        title="Could not load My Ideas"
        description={getApiErrorMessage(ideasQuery.error ?? meQuery.error)}
        onRetry={() => {
          void meQuery.refetch();
          void ideasQuery.refetch();
        }}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">My Ideas Workspace</h2>
          <p className="text-sm text-muted-foreground">
            Review all your ideas, inspect a single idea, then update, submit, or delete.
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
          Total Ideas: {sortedIdeas.length}
        </div>
      </div>

      <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
        Endpoints in use: GET `/api/v1/ideas`, GET `/api/v1/ideas/:id`, PATCH
        `/api/v1/ideas/:id`, PATCH `/api/v1/ideas/:id/submit`, DELETE
        `/api/v1/ideas/:id`
      </p>

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

      {profileEndpointUnavailable ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          User profile endpoint is not available on your backend. Ownership filtering
          may be limited, so this page is using the shared ideas list fallback.
        </p>
      ) : null}

      {ownershipMetadataMissing || ownershipScopeMismatch ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          The ideas API does not expose enough ownership metadata for strict scoping.
          This page is showing the shared list as fallback.
        </p>
      ) : null}

      <section className="rounded-xl border bg-background p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Single Idea Details</h3>
          <div className="w-full max-w-md">
            <select
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
              value={selectedIdeaId}
              onChange={(event) => {
                setSelectedIdeaId(event.target.value);
              }}
            >
              <option value="">Select an idea to load details</option>
              {sortedIdeas.map((idea) => (
                <option key={idea.id} value={idea.id}>
                  {getIdeaTitle(idea)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!selectedIdeaId ? (
          <p className="text-sm text-muted-foreground">
            Choose an idea from the list to call GET `/api/v1/ideas/:id`.
          </p>
        ) : detailsQuery.isPending ? (
          <LoadingState
            title="Loading idea details"
            description="Fetching full idea payload."
            rows={4}
          />
        ) : detailsQuery.isError ? (
          <ErrorState
            title="Could not load idea details"
            description={getApiErrorMessage(detailsQuery.error)}
            onRetry={() => {
              void detailsQuery.refetch();
            }}
          />
        ) : detailsIdea ? (
          <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
            <p>
              <span className="font-medium">Title:</span> {getIdeaTitle(detailsIdea)}
            </p>
            <p>
              <span className="font-medium">Status:</span> {getIdeaStatus(detailsIdea)}
            </p>
            <p>
              <span className="font-medium">Slug:</span> {detailsIdea.slug}
            </p>
            <p>
              <span className="font-medium">Category:</span>{" "}
              {detailsIdea.category?.name ?? detailsIdea.categoryId ?? "N/A"}
            </p>
            <p>
              <span className="font-medium">Access Type:</span>{" "}
              {detailsIdea.accessType ?? "N/A"}
            </p>
            <p>
              <span className="font-medium">Price:</span> {formatPrice(detailsIdea)}
            </p>
            <p>
              <span className="font-medium">Created:</span>{" "}
              {formatDate(detailsIdea.createdAt)}
            </p>
            <p>
              <span className="font-medium">Updated:</span>{" "}
              {formatDate(detailsIdea.updatedAt)}
            </p>
            <p className="md:col-span-2">
              <span className="font-medium">Description:</span>{" "}
              {getIdeaDescription(detailsIdea)}
            </p>
            {hasText(detailsIdea.expectedBenefits) ? (
              <p className="md:col-span-2">
                <span className="font-medium">Expected Benefits:</span>{" "}
                {detailsIdea.expectedBenefits}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No detail payload returned.</p>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold">All Ideas</h3>

        {sortedIdeas.length === 0 ? (
          <EmptyState
            title="No ideas found"
            description="You have not created any ideas yet."
          />
        ) : (
          <ul className="space-y-3">
            {sortedIdeas.map((idea) => {
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
                <li key={idea.id} className="rounded-xl border bg-background p-4">
                  {isEditing ? (
                    <form
                      className="space-y-4"
                      onSubmit={(event) => {
                        void onUpdate(event, idea.id);
                      }}
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`edit-title-${idea.id}`}>Title *</Label>
                          <Input
                            id={`edit-title-${idea.id}`}
                            value={editForm.title}
                            onChange={(event) =>
                              setEditForm((previous) => ({
                                ...previous,
                                title: event.target.value,
                              }))
                            }
                          />
                          <FieldError message={editErrors.title} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`edit-access-type-${idea.id}`}>
                            Access Type
                          </Label>
                          <select
                            id={`edit-access-type-${idea.id}`}
                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                            value={editForm.accessType}
                            onChange={(event) =>
                              setEditForm((previous) => ({
                                ...previous,
                                accessType: event.target.value,
                                price:
                                  event.target.value.toUpperCase() === "FREE"
                                    ? "0"
                                    : previous.price === "0"
                                      ? ""
                                      : previous.price,
                              }))
                            }
                          >
                            {ACCESS_TYPE_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <FieldError message={editErrors.accessType} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`edit-price-${idea.id}`}>Price</Label>
                          <Input
                            id={`edit-price-${idea.id}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.price}
                            disabled={editForm.accessType.toUpperCase() === "FREE"}
                            onChange={(event) =>
                              setEditForm((previous) => ({
                                ...previous,
                                price: event.target.value,
                              }))
                            }
                          />
                          <FieldError message={editErrors.price} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`edit-admin-note-${idea.id}`}>
                            Admin Note
                          </Label>
                          <Input
                            id={`edit-admin-note-${idea.id}`}
                            placeholder="Updated after reviewer feedback"
                            value={editForm.adminNote}
                            onChange={(event) =>
                              setEditForm((previous) => ({
                                ...previous,
                                adminNote: event.target.value,
                              }))
                            }
                          />
                          <FieldError message={editErrors.adminNote} />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`edit-description-${idea.id}`}>
                            Description
                          </Label>
                          <textarea
                            id={`edit-description-${idea.id}`}
                            rows={4}
                            className={textareaClassName}
                            value={editForm.description}
                            onChange={(event) =>
                              setEditForm((previous) => ({
                                ...previous,
                                description: event.target.value,
                              }))
                            }
                          />
                          <FieldError message={editErrors.description} />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`edit-expected-benefits-${idea.id}`}>
                            Expected Benefits
                          </Label>
                          <textarea
                            id={`edit-expected-benefits-${idea.id}`}
                            rows={3}
                            className={textareaClassName}
                            value={editForm.expectedBenefits}
                            onChange={(event) =>
                              setEditForm((previous) => ({
                                ...previous,
                                expectedBenefits: event.target.value,
                              }))
                            }
                          />
                          <FieldError message={editErrors.expectedBenefits} />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" variant="outline" disabled={isUpdating}>
                          {isUpdating ? "Saving..." : "Save Update"}
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
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{getIdeaTitle(idea)}</p>
                          <p className="text-sm text-muted-foreground">
                            ID: {idea.id}
                          </p>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                          {getIdeaStatus(idea)}
                        </span>
                      </div>

                      <div className="grid gap-1 text-xs text-muted-foreground md:grid-cols-3">
                        <p>Slug: {idea.slug}</p>
                        <p>
                          Access: {idea.accessType ?? "N/A"} | Price:{" "}
                          {formatPrice(idea)}
                        </p>
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
                          type="button"
                          variant="outline"
                          onClick={() => setSelectedIdeaId(idea.id)}
                          disabled={isUpdating || isDeleting || isSubmitting}
                        >
                          View Details
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => startEdit(idea)}
                          disabled={isDeleting || isSubmitting}
                        >
                          Edit
                        </Button>
                        {canSubmit ? (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              void onSubmitIdea(idea);
                            }}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Submitting..." : "Submit"}
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            void onDelete(idea);
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
    </section>
  );
}

"use client";

import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSpecialtyInputSchema } from "@/contracts/specialty.contract";
import {
  useCreateSpecialtyMutation,
  useDeleteSpecialtyMutation,
  useSpecialtiesQuery,
  useUpdateSpecialtyMutation,
} from "@/features/specialty";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import type { CreateSpecialtyInput, Specialty } from "@/services/specialty.service";

type Feedback = {
  type: "success" | "error";
  text: string;
};

type SpecialtyFormValues = {
  title: string;
  description: string;
  icon: string;
};

type SpecialtyFormErrors = Partial<Record<keyof SpecialtyFormValues, string>>;

const initialFormState: SpecialtyFormValues = {
  title: "",
  description: "",
  icon: "",
};

function getSpecialtyTitle(specialty: Specialty) {
  const record = specialty as unknown as Record<string, unknown>;

  return (
    (typeof record.title === "string" && record.title.trim()) ||
    (typeof record.name === "string" && record.name.trim()) ||
    "Untitled specialty"
  );
}

function getSpecialtyDescription(specialty: Specialty) {
  const record = specialty as unknown as Record<string, unknown>;
  return typeof record.description === "string" ? record.description : "";
}

function getSpecialtyIcon(specialty: Specialty) {
  const record = specialty as unknown as Record<string, unknown>;
  return typeof record.icon === "string" ? record.icon : "";
}

function getSpecialtyDate(specialty: Specialty, key: "createdAt" | "updatedAt") {
  const record = specialty as unknown as Record<string, unknown>;
  return typeof record[key] === "string" ? record[key] : "";
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

function normalizeSpecialtyPayload(values: SpecialtyFormValues): CreateSpecialtyInput {
  return {
    title: values.title.trim(),
    description: values.description.trim() || undefined,
    icon: values.icon.trim() || undefined,
  };
}

function validateSpecialtyPayload(values: SpecialtyFormValues) {
  const parsed = createSpecialtyInputSchema.safeParse(normalizeSpecialtyPayload(values));

  if (parsed.success) {
    return {
      success: true as const,
      data: parsed.data,
      errors: {} as SpecialtyFormErrors,
    };
  }

  const errors: SpecialtyFormErrors = {};

  for (const issue of parsed.error.issues) {
    const field = issue.path[0];

    if (
      typeof field === "string" &&
      (field === "title" || field === "description" || field === "icon") &&
      !errors[field]
    ) {
      errors[field] = issue.message;
    }
  }

  return {
    success: false as const,
    errors,
    message: parsed.error.issues[0]?.message ?? "Invalid specialty input",
  };
}

export default function SpecialtyManagementPage() {
  const specialtiesQuery = useSpecialtiesQuery();
  const createSpecialtyMutation = useCreateSpecialtyMutation();
  const updateSpecialtyMutation = useUpdateSpecialtyMutation();
  const deleteSpecialtyMutation = useDeleteSpecialtyMutation();

  const [createForm, setCreateForm] = useState<SpecialtyFormValues>(initialFormState);
  const [createErrors, setCreateErrors] = useState<SpecialtyFormErrors>({});

  const [editingSpecialtyId, setEditingSpecialtyId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SpecialtyFormValues>(initialFormState);
  const [editErrors, setEditErrors] = useState<SpecialtyFormErrors>({});

  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const specialties = useMemo(
    () =>
      [...(specialtiesQuery.data?.data ?? [])].sort((a, b) =>
        getSpecialtyTitle(a).localeCompare(getSpecialtyTitle(b)),
      ),
    [specialtiesQuery.data?.data],
  );

  const onCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const validation = validateSpecialtyPayload(createForm);
    setCreateErrors(validation.errors);

    if (!validation.success) {
      setFeedback({ type: "error", text: validation.message });
      return;
    }

    try {
      const response = await createSpecialtyMutation.mutateAsync(validation.data);
      setCreateForm(initialFormState);
      setCreateErrors({});
      setFeedback({
        type: "success",
        text: response.message || "Specialty created successfully.",
      });
    } catch (mutationError) {
      setFeedback({ type: "error", text: getApiErrorMessage(mutationError) });
    }
  };

  const startEditing = (specialty: Specialty) => {
    setEditingSpecialtyId(specialty.id);
    setEditForm({
      title: getSpecialtyTitle(specialty),
      description: getSpecialtyDescription(specialty),
      icon: getSpecialtyIcon(specialty),
    });
    setEditErrors({});
    setFeedback(null);
  };

  const cancelEditing = () => {
    setEditingSpecialtyId(null);
    setEditForm(initialFormState);
    setEditErrors({});
  };

  const onUpdateSubmit = async (event: FormEvent<HTMLFormElement>, specialtyId: string) => {
    event.preventDefault();
    setFeedback(null);

    const validation = validateSpecialtyPayload(editForm);
    setEditErrors(validation.errors);

    if (!validation.success) {
      setFeedback({ type: "error", text: validation.message });
      return;
    }

    try {
      const response = await updateSpecialtyMutation.mutateAsync({
        id: specialtyId,
        payload: validation.data,
      });
      cancelEditing();
      setFeedback({
        type: "success",
        text: response.message || "Specialty updated successfully.",
      });
    } catch (mutationError) {
      setFeedback({ type: "error", text: getApiErrorMessage(mutationError) });
    }
  };

  const onDelete = async (specialty: Specialty) => {
    const shouldDelete = window.confirm(
      `Delete specialty "${getSpecialtyTitle(specialty)}"? This action cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    setFeedback(null);

    try {
      const response = await deleteSpecialtyMutation.mutateAsync({ id: specialty.id });

      if (editingSpecialtyId === specialty.id) {
        cancelEditing();
      }

      setFeedback({
        type: "success",
        text: response.message || "Specialty deleted successfully.",
      });
    } catch (mutationError) {
      setFeedback({ type: "error", text: getApiErrorMessage(mutationError) });
    }
  };

  if (specialtiesQuery.isPending) {
    return (
      <LoadingState
        title="Loading specialties"
        description="Fetching specialty definitions from the backend."
      />
    );
  }

  if (specialtiesQuery.isError) {
    return (
      <ErrorState
        title="Could not load specialties"
        description={getApiErrorMessage(specialtiesQuery.error)}
        onRetry={() => {
          void specialtiesQuery.refetch();
        }}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Specialty Management</h2>
          <p className="text-sm text-muted-foreground">
            Create, update, and delete scientist specialties used for profile classification.
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
          Total Specialties: {specialties.length}
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
          <h3 className="text-lg font-semibold">Create Specialty</h3>
          <p className="text-sm text-muted-foreground">
            Use consistent naming and icon keywords for a clean taxonomy.
          </p>
        </div>

        <form className="space-y-4" onSubmit={onCreateSubmit}>
          <fieldset
            disabled={createSpecialtyMutation.isPending}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="create-specialty-title">Title</Label>
              <Input
                id="create-specialty-title"
                placeholder="Cardiology"
                value={createForm.title}
                onChange={(event) => {
                  setCreateForm((prev) => ({ ...prev, title: event.target.value }));
                  if (createErrors.title) {
                    setCreateErrors((prev) => ({ ...prev, title: undefined }));
                  }
                }}
              />
              {createErrors.title ? (
                <p className="text-xs text-red-600">{createErrors.title}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-specialty-icon">Icon</Label>
              <Input
                id="create-specialty-icon"
                placeholder="heart"
                value={createForm.icon}
                onChange={(event) => {
                  setCreateForm((prev) => ({ ...prev, icon: event.target.value }));
                  if (createErrors.icon) {
                    setCreateErrors((prev) => ({ ...prev, icon: undefined }));
                  }
                }}
              />
              {createErrors.icon ? (
                <p className="text-xs text-red-600">{createErrors.icon}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Example: `heart`, `brain`</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="create-specialty-description">Description</Label>
              <textarea
                id="create-specialty-description"
                rows={4}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                placeholder="Heart and cardiovascular system specialty"
                value={createForm.description}
                onChange={(event) => {
                  setCreateForm((prev) => ({ ...prev, description: event.target.value }));
                  if (createErrors.description) {
                    setCreateErrors((prev) => ({ ...prev, description: undefined }));
                  }
                }}
              />
              {createErrors.description ? (
                <p className="text-xs text-red-600">{createErrors.description}</p>
              ) : null}
            </div>
          </fieldset>

          <div className="flex justify-end">
            <Button type="submit" variant="outline" disabled={createSpecialtyMutation.isPending}>
              {createSpecialtyMutation.isPending ? "Creating..." : "Create Specialty"}
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold">Existing Specialties</h3>

        {specialties.length === 0 ? (
          <EmptyState
            title="No specialties found"
            description="Create your first specialty to classify scientist expertise."
          />
        ) : (
          <ul className="space-y-3">
            {specialties.map((specialty) => {
              const isEditing = editingSpecialtyId === specialty.id;
              const isUpdatingCurrent =
                updateSpecialtyMutation.isPending &&
                updateSpecialtyMutation.variables?.id === specialty.id;
              const isDeletingCurrent =
                deleteSpecialtyMutation.isPending &&
                deleteSpecialtyMutation.variables?.id === specialty.id;

              return (
                <li key={specialty.id} className="rounded-xl border bg-background p-4">
                  {isEditing ? (
                    <form
                      className="space-y-4"
                      onSubmit={(event) => onUpdateSubmit(event, specialty.id)}
                    >
                      <fieldset
                        disabled={isUpdatingCurrent}
                        className="grid gap-4 md:grid-cols-2"
                      >
                        <div className="space-y-2">
                          <Label htmlFor={`edit-specialty-title-${specialty.id}`}>Title</Label>
                          <Input
                            id={`edit-specialty-title-${specialty.id}`}
                            value={editForm.title}
                            onChange={(event) =>
                              setEditForm((prev) => ({ ...prev, title: event.target.value }))
                            }
                          />
                          {editErrors.title ? (
                            <p className="text-xs text-red-600">{editErrors.title}</p>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`edit-specialty-icon-${specialty.id}`}>Icon</Label>
                          <Input
                            id={`edit-specialty-icon-${specialty.id}`}
                            value={editForm.icon}
                            onChange={(event) =>
                              setEditForm((prev) => ({ ...prev, icon: event.target.value }))
                            }
                          />
                          {editErrors.icon ? (
                            <p className="text-xs text-red-600">{editErrors.icon}</p>
                          ) : null}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`edit-specialty-description-${specialty.id}`}>
                            Description
                          </Label>
                          <textarea
                            id={`edit-specialty-description-${specialty.id}`}
                            rows={4}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                            value={editForm.description}
                            onChange={(event) =>
                              setEditForm((prev) => ({
                                ...prev,
                                description: event.target.value,
                              }))
                            }
                          />
                          {editErrors.description ? (
                            <p className="text-xs text-red-600">{editErrors.description}</p>
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
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{getSpecialtyTitle(specialty)}</p>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700">
                            {getSpecialtyIcon(specialty) || "no-icon"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getSpecialtyDescription(specialty) || "No description"}
                        </p>
                        <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                          <p>ID: {specialty.id}</p>
                          <p>Created: {formatDate(getSpecialtyDate(specialty, "createdAt"))}</p>
                          <p>Updated: {formatDate(getSpecialtyDate(specialty, "updatedAt"))}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => startEditing(specialty)}
                          disabled={updateSpecialtyMutation.isPending || deleteSpecialtyMutation.isPending}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            void onDelete(specialty);
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

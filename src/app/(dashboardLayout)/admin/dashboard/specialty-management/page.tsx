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
import { createSpecialtyInputSchema } from "@/contracts/specialty.contract";
import {
  useCreateSpecialtyMutation,
  useDeleteSpecialtyMutation,
  useSpecialtiesQuery,
  useUpdateSpecialtyMutation,
} from "@/features/specialty";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import type {
  CreateSpecialtyInput,
  Specialty,
} from "@/services/specialty.service";

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

type PaginationPageItem = number | "ellipsis";

const SPECIALTIES_PER_PAGE = 3;

const initialFormState: SpecialtyFormValues = {
  title: "",
  description: "",
  icon: "",
};

const textareaClassName =
  "min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

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
  return typeof record.description === "string" ? record.description.trim() : "";
}

function getSpecialtyIcon(specialty: Specialty) {
  const record = specialty as unknown as Record<string, unknown>;
  return typeof record.icon === "string" ? record.icon.trim() : "";
}

function getSpecialtySlug(specialty: Specialty) {
  const record = specialty as unknown as Record<string, unknown>;
  return typeof record.slug === "string" ? record.slug.trim() : "";
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

function getSpecialtySummary(specialty: Specialty) {
  return getSpecialtyDescription(specialty) || "No description added yet.";
}

function getSpecialtySearchText(specialty: Specialty) {
  return [
    specialty.id,
    getSpecialtyTitle(specialty),
    getSpecialtyDescription(specialty),
    getSpecialtyIcon(specialty),
    getSpecialtySlug(specialty),
  ]
    .filter(hasText)
    .join(" ")
    .toLowerCase();
}

function normalizeSpecialtyPayload(
  values: SpecialtyFormValues,
): CreateSpecialtyInput {
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

export default function SpecialtyManagementPage() {
  const specialtiesQuery = useSpecialtiesQuery();
  const createSpecialtyMutation = useCreateSpecialtyMutation();
  const updateSpecialtyMutation = useUpdateSpecialtyMutation();
  const deleteSpecialtyMutation = useDeleteSpecialtyMutation();

  const [createForm, setCreateForm] =
    useState<SpecialtyFormValues>(initialFormState);
  const [createErrors, setCreateErrors] = useState<SpecialtyFormErrors>({});
  const [editingSpecialtyId, setEditingSpecialtyId] = useState<string | null>(
    null,
  );
  const [editForm, setEditForm] =
    useState<SpecialtyFormValues>(initialFormState);
  const [editErrors, setEditErrors] = useState<SpecialtyFormErrors>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const specialties = useMemo(
    () =>
      [...(specialtiesQuery.data?.data ?? [])].sort((a, b) =>
        getSpecialtyTitle(a).localeCompare(getSpecialtyTitle(b)),
      ),
    [specialtiesQuery.data?.data],
  );

  const specialtiesWithDescription = useMemo(
    () =>
      specialties.filter((specialty) =>
        hasText(getSpecialtyDescription(specialty)),
      ).length,
    [specialties],
  );

  const specialtiesWithIcon = useMemo(
    () =>
      specialties.filter((specialty) => hasText(getSpecialtyIcon(specialty)))
        .length,
    [specialties],
  );

  const filteredSpecialties = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return specialties;
    }

    return specialties.filter((specialty) =>
      getSpecialtySearchText(specialty).includes(normalizedQuery),
    );
  }, [deferredSearchQuery, specialties]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSpecialties.length / SPECIALTIES_PER_PAGE),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchQuery]);

  useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

  const currentPageSpecialties = useMemo(() => {
    const startIndex = (currentPage - 1) * SPECIALTIES_PER_PAGE;

    return filteredSpecialties.slice(
      startIndex,
      startIndex + SPECIALTIES_PER_PAGE,
    );
  }, [currentPage, filteredSpecialties]);

  const paginationItems = useMemo(
    () => getPaginationItems(totalPages, currentPage),
    [currentPage, totalPages],
  );

  const visibleFrom =
    filteredSpecialties.length === 0
      ? 0
      : (currentPage - 1) * SPECIALTIES_PER_PAGE + 1;
  const visibleTo = Math.min(
    currentPage * SPECIALTIES_PER_PAGE,
    filteredSpecialties.length,
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
    <section className="space-y-8">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-slate-50 shadow-sm">
        <div className="grid gap-6 px-6 py-7 md:px-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] xl:items-end">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-emerald-200 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700 shadow-sm">
              Admin Workspace
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Specialty taxonomy with cleaner governance
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                Maintain scientist specialties from one professional dashboard.
                Review naming quality, searchable metadata, and update history
                while keeping editing and cleanup actions close to the data.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryCard
              label="Total"
              value={specialties.length.toLocaleString()}
              caption="All registered specialties"
            />
            <SummaryCard
              label="With Summary"
              value={specialtiesWithDescription.toLocaleString()}
              caption="Entries with descriptions"
            />
            <SummaryCard
              label="With Icon"
              value={specialtiesWithIcon.toLocaleString()}
              caption="Configured icon keywords"
            />
            <SummaryCard
              label="Visible now"
              value={filteredSpecialties.length.toLocaleString()}
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
              Create Specialty
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              Add a new scientist specialty
            </h3>
            <p className="text-sm leading-6 text-slate-600">
              Use a consistent title, a practical icon keyword, and a short
              explanation so specialties stay clear across scientist profiles.
            </p>
          </div>

          <form className="mt-6 space-y-5" onSubmit={onCreateSubmit}>
            <fieldset
              disabled={createSpecialtyMutation.isPending}
              className="space-y-5"
            >
            <div className="space-y-2">
              <Label
                htmlFor="create-specialty-title"
                className="text-sm font-medium text-slate-800"
              >
                Specialty title
              </Label>
              <Input
                id="create-specialty-title"
                placeholder="Cardiology"
                className="h-12 rounded-2xl border-slate-200 bg-white shadow-sm"
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
              ) : (
                <p className="text-xs text-slate-500">
                  Use the name administrators and scientists will search.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="create-specialty-icon"
                className="text-sm font-medium text-slate-800"
              >
                Icon keyword
              </Label>
              <Input
                id="create-specialty-icon"
                placeholder="heart"
                className="h-12 rounded-2xl border-slate-200 bg-white shadow-sm"
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
                <p className="text-xs text-slate-500">
                  Example keywords: <span className="font-medium">heart</span>,{" "}
                  <span className="font-medium">brain</span>,{" "}
                  <span className="font-medium">microscope</span>.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="create-specialty-description"
                className="text-sm font-medium text-slate-800"
              >
                Description
              </Label>
              <textarea
                id="create-specialty-description"
                className={textareaClassName}
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
              ) : (
                <p className="text-xs text-slate-500">
                  Keep the explanation short and useful for admin review.
                </p>
              )}
            </div>
          </fieldset>

          <Button
            type="submit"
            className="h-11 w-full rounded-2xl text-sm"
            disabled={createSpecialtyMutation.isPending}
          >
            {createSpecialtyMutation.isPending
              ? "Creating specialty..."
              : "Create specialty"}
          </Button>
        </form>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Specialty Directory
              </p>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                Review and maintain existing specialties
              </h3>
              <p className="text-sm leading-6 text-slate-600">
                Search by title, description, slug, or icon keyword, then edit
                or delete specialties from the current page.
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
              <p className="text-xs text-slate-500">3 specialties per page</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by title, description, slug, or icon"
                className="h-12 rounded-2xl border-slate-200 bg-white pl-11 shadow-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-700">
                Showing {visibleFrom}-{visibleTo} of{" "}
                {filteredSpecialties.length}
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
            {specialties.length === 0 ? (
              <EmptyState
                title="No specialties found"
                description="Create your first specialty to classify scientist expertise."
              />
            ) : filteredSpecialties.length === 0 ? (
              <EmptyState
                title="No matching specialties"
                description="Try a different keyword or clear the search field."
              />
            ) : (
              <>
                <ul className="space-y-4">
                  {currentPageSpecialties.map((specialty) => {
                    const isEditing = editingSpecialtyId === specialty.id;
                    const isUpdatingCurrent =
                      updateSpecialtyMutation.isPending &&
                      updateSpecialtyMutation.variables?.id === specialty.id;
                    const isDeletingCurrent =
                      deleteSpecialtyMutation.isPending &&
                      deleteSpecialtyMutation.variables?.id === specialty.id;

                    return (
                      <li
                        key={specialty.id}
                        className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm transition-colors hover:border-slate-300 hover:bg-white"
                      >
                        {isEditing ? (
                          <form
                            className="space-y-5"
                            onSubmit={(event) =>
                              onUpdateSubmit(event, specialty.id)
                            }
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                                  Editing specialty
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                  Refine the taxonomy entry for{" "}
                                  <span className="font-semibold text-slate-900">
                                    {getSpecialtyTitle(specialty)}
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
                                <Label
                                  htmlFor={`edit-specialty-title-${specialty.id}`}
                                >
                                  Title
                                </Label>
                                <Input
                                  id={`edit-specialty-title-${specialty.id}`}
                                  className="h-11 rounded-2xl border-slate-200 bg-white shadow-sm"
                                  value={editForm.title}
                                  onChange={(event) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      title: event.target.value,
                                    }))
                                  }
                                />
                                {editErrors.title ? (
                                  <p className="text-xs text-red-600">
                                    {editErrors.title}
                                  </p>
                                ) : null}
                              </div>

                              <div className="space-y-2">
                                <Label
                                  htmlFor={`edit-specialty-icon-${specialty.id}`}
                                >
                                  Icon
                                </Label>
                                <Input
                                  id={`edit-specialty-icon-${specialty.id}`}
                                  className="h-11 rounded-2xl border-slate-200 bg-white shadow-sm"
                                  value={editForm.icon}
                                  onChange={(event) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      icon: event.target.value,
                                    }))
                                  }
                                />
                                {editErrors.icon ? (
                                  <p className="text-xs text-red-600">
                                    {editErrors.icon}
                                  </p>
                                ) : null}
                              </div>

                              <div className="space-y-2 md:col-span-2">
                                <Label
                                  htmlFor={`edit-specialty-description-${specialty.id}`}
                                >
                                  Description
                                </Label>
                                <textarea
                                  id={`edit-specialty-description-${specialty.id}`}
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
                            </fieldset>

                            <div className="flex flex-wrap gap-3">
                              <Button
                                type="submit"
                                className="rounded-2xl"
                                disabled={isUpdatingCurrent}
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
                                    {getSpecialtyTitle(specialty)}
                                  </h4>
                                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                                    {getSpecialtyIcon(specialty) || "no-icon"}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700">
                                    ID: {specialty.id}
                                  </span>
                                  {hasText(getSpecialtySlug(specialty)) ? (
                                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700">
                                      Slug: {getSpecialtySlug(specialty)}
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="rounded-2xl"
                                  onClick={() => startEditing(specialty)}
                                  disabled={
                                    updateSpecialtyMutation.isPending ||
                                    deleteSpecialtyMutation.isPending
                                  }
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  className="rounded-2xl"
                                  onClick={() => {
                                    void onDelete(specialty);
                                  }}
                                  disabled={isDeletingCurrent}
                                >
                                  {isDeletingCurrent
                                    ? "Deleting..."
                                    : "Delete"}
                                </Button>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                              {getSpecialtySummary(specialty)}
                            </div>

                            <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-3">
                              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                                  Created
                                </p>
                                <p className="mt-2 font-medium text-slate-800">
                                  {formatDate(
                                    getSpecialtyDate(specialty, "createdAt"),
                                  )}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                                  Last updated
                                </p>
                                <p className="mt-2 font-medium text-slate-800">
                                  {formatDate(
                                    getSpecialtyDate(specialty, "updatedAt"),
                                  )}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                                  Icon reference
                                </p>
                                <p className="mt-2 font-medium text-slate-800">
                                  {getSpecialtyIcon(specialty) ||
                                    "Not provided"}
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
                      {totalPages.toLocaleString()}. Three specialties are shown
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

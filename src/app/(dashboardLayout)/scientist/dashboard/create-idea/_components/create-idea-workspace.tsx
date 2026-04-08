"use client";

import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createIdeaInputSchema } from "@/contracts/idea.contract";
import { useCampaignsQuery } from "@/features/campaign";
import { useCategoriesQuery } from "@/features/category";
import { useCreateIdeaMutation } from "@/features/idea";
import { useTagsQuery } from "@/features/tag";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import type { Campaign } from "@/services/campaign.service";
import type { Category } from "@/services/category.service";
import type { CreateIdeaInput } from "@/services/idea.service";
import type { Tag } from "@/services/tag.service";

type Feedback = {
  type: "success" | "error";
  text: string;
};

type CreateIdeaFormValues = {
  title: string;
  slug: string;
  excerpt: string;
  problemStatement: string;
  proposedSolution: string;
  description: string;
  implementationSteps: string;
  risksAndChallenges: string;
  requiredResources: string;
  expectedBenefits: string;
  targetAudience: string;
  coverImageUrl: string;
  videoUrl: string;
  categoryId: string;
  campaignId: string;
  visibility: string;
  accessType: string;
  price: string;
  currency: string;
  estimatedCost: string;
  implementationEffort: string;
  expectedImpact: string;
  timeToImplementDays: string;
  resourceAvailability: string;
  innovationLevel: string;
  scalabilityScore: string;
  feasibilityScore: string;
  impactScore: string;
  ecoScore: string;
  estimatedWasteReductionKgMonth: string;
  estimatedCo2ReductionKgMonth: string;
  estimatedCostSavingsMonth: string;
  estimatedWaterSavedLitersMonth: string;
  estimatedEnergySavedKwhMonth: string;
  seoTitle: string;
  seoDescription: string;
};

type IdeaFormError = Partial<Record<keyof CreateIdeaFormValues | "tagIds", string>>;

const CAMPAIGNS_QUERY_PARAMS: Record<string, unknown> = { page: 1, limit: 100 };
const TAGS_QUERY_PARAMS: Record<string, unknown> = { page: 1, limit: 200 };

const selectClassName =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50";
const textareaClassName =
  "min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50";

const initialFormState: CreateIdeaFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  problemStatement: "",
  proposedSolution: "",
  description: "",
  implementationSteps: "",
  risksAndChallenges: "",
  requiredResources: "",
  expectedBenefits: "",
  targetAudience: "",
  coverImageUrl: "",
  videoUrl: "",
  categoryId: "",
  campaignId: "",
  visibility: "PUBLIC",
  accessType: "FREE",
  price: "0",
  currency: "USD",
  estimatedCost: "",
  implementationEffort: "",
  expectedImpact: "",
  timeToImplementDays: "",
  resourceAvailability: "",
  innovationLevel: "",
  scalabilityScore: "",
  feasibilityScore: "",
  impactScore: "",
  ecoScore: "",
  estimatedWasteReductionKgMonth: "",
  estimatedCo2ReductionKgMonth: "",
  estimatedCostSavingsMonth: "",
  estimatedWaterSavedLitersMonth: "",
  estimatedEnergySavedKwhMonth: "",
  seoTitle: "",
  seoDescription: "",
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function parseManualTagIds(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function getCategoryLabel(category: Category) {
  if (typeof category.name === "string" && category.name.trim()) {
    return category.name;
  }

  if (typeof category.slug === "string" && category.slug.trim()) {
    return category.slug;
  }

  return category.id;
}

function getCampaignLabel(campaign: Campaign) {
  if (typeof campaign.title === "string" && campaign.title.trim()) {
    return campaign.title;
  }

  if (typeof campaign.slug === "string" && campaign.slug.trim()) {
    return campaign.slug;
  }

  return campaign.id;
}

function getTagLabel(tag: Tag) {
  if (typeof tag.name === "string" && tag.name.trim()) {
    return tag.name;
  }

  if (typeof tag.slug === "string" && tag.slug.trim()) {
    return tag.slug;
  }

  return tag.id;
}

type ValidationResult =
  | { success: true; data: CreateIdeaInput; errors: IdeaFormError }
  | { success: false; message: string; errors: IdeaFormError };

function normalizeIdeaPayload(values: CreateIdeaFormValues, tagIds: string[]): CreateIdeaInput {
  const payload: Record<string, unknown> = {
    title: values.title.trim(),
    slug: values.slug.trim(),
    categoryId: values.categoryId.trim(),
  };

  const stringFields: Array<keyof CreateIdeaFormValues> = [
    "excerpt",
    "problemStatement",
    "proposedSolution",
    "description",
    "implementationSteps",
    "risksAndChallenges",
    "requiredResources",
    "expectedBenefits",
    "targetAudience",
    "coverImageUrl",
    "videoUrl",
    "campaignId",
    "seoTitle",
    "seoDescription",
  ];

  for (const field of stringFields) {
    const value = trimToUndefined(values[field]);

    if (value) {
      payload[field] = value;
    }
  }

  const visibility = trimToUndefined(values.visibility)?.toUpperCase();
  const accessType = trimToUndefined(values.accessType)?.toUpperCase();
  const currency = trimToUndefined(values.currency)?.toUpperCase();

  if (visibility) {
    payload.visibility = visibility;
  }

  if (accessType) {
    payload.accessType = accessType;
  }

  if (currency) {
    payload.currency = currency;
  }

  const price = parseOptionalNumber(values.price);

  if (accessType === "FREE") {
    payload.price = 0;
  } else if (typeof price === "number") {
    payload.price = price;
  }

  const numericFields: Array<keyof CreateIdeaFormValues> = [
    "estimatedCost",
    "implementationEffort",
    "expectedImpact",
    "timeToImplementDays",
    "resourceAvailability",
    "innovationLevel",
    "scalabilityScore",
    "feasibilityScore",
    "impactScore",
    "ecoScore",
    "estimatedWasteReductionKgMonth",
    "estimatedCo2ReductionKgMonth",
    "estimatedCostSavingsMonth",
    "estimatedWaterSavedLitersMonth",
    "estimatedEnergySavedKwhMonth",
  ];

  for (const field of numericFields) {
    const value = parseOptionalNumber(values[field]);

    if (typeof value === "number") {
      payload[field] = value;
    }
  }

  if (tagIds.length > 0) {
    payload.tagIds = tagIds;
  }

  return payload as CreateIdeaInput;
}

function validateIdeaPayload(values: CreateIdeaFormValues, tagIds: string[]): ValidationResult {
  const errors: IdeaFormError = {};
  const accessType = values.accessType.trim().toUpperCase();

  if (!values.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!values.slug.trim()) {
    errors.slug = "Slug is required.";
  }

  if (!values.categoryId.trim()) {
    errors.categoryId = "Category is required.";
  }

  if (!values.visibility.trim()) {
    errors.visibility = "Visibility is required.";
  }

  if (!values.accessType.trim()) {
    errors.accessType = "Access type is required.";
  }

  if (accessType === "PAID" && !values.price.trim()) {
    errors.price = "Price is required for paid ideas.";
  }

  if (values.currency.trim() && !/^[A-Za-z]{3}$/.test(values.currency.trim())) {
    errors.currency = "Currency must be a 3-letter ISO code.";
  }

  const nonNegativeNumberFields: Array<{ field: keyof CreateIdeaFormValues; label: string }> = [
    { field: "price", label: "Price" },
    { field: "estimatedCost", label: "Estimated Cost" },
    { field: "implementationEffort", label: "Implementation Effort" },
    { field: "expectedImpact", label: "Expected Impact" },
    { field: "timeToImplementDays", label: "Time to Implement" },
    { field: "resourceAvailability", label: "Resource Availability" },
    { field: "innovationLevel", label: "Innovation Level" },
    { field: "scalabilityScore", label: "Scalability Score" },
    { field: "feasibilityScore", label: "Feasibility Score" },
    { field: "impactScore", label: "Impact Score" },
    { field: "ecoScore", label: "Eco Score" },
    { field: "estimatedWasteReductionKgMonth", label: "Waste Reduction" },
    { field: "estimatedCo2ReductionKgMonth", label: "CO2 Reduction" },
    { field: "estimatedCostSavingsMonth", label: "Cost Savings" },
    { field: "estimatedWaterSavedLitersMonth", label: "Water Saved" },
    { field: "estimatedEnergySavedKwhMonth", label: "Energy Saved" },
  ];

  for (const config of nonNegativeNumberFields) {
    const rawValue = values[config.field].trim();

    if (!rawValue) {
      continue;
    }

    const parsed = Number(rawValue);

    if (!Number.isFinite(parsed)) {
      errors[config.field] = `${config.label} must be a valid number.`;
      continue;
    }

    if (parsed < 0) {
      errors[config.field] = `${config.label} cannot be negative.`;
    }
  }

  if (tagIds.some((id) => !id.trim())) {
    errors.tagIds = "Tag IDs must be non-empty values.";
  }

  const normalized = normalizeIdeaPayload(values, tagIds);
  const schemaValidation = createIdeaInputSchema.safeParse(normalized);

  if (!schemaValidation.success) {
    for (const issue of schemaValidation.error.issues) {
      const field = issue.path[0];

      if (typeof field !== "string") {
        continue;
      }

      if (field in initialFormState && !errors[field as keyof CreateIdeaFormValues]) {
        errors[field as keyof CreateIdeaFormValues] = issue.message;
      }

      if (field === "tagIds" && !errors.tagIds) {
        errors.tagIds = issue.message;
      }
    }
  }

  if (Object.keys(errors).length > 0 || !schemaValidation.success) {
    const fallbackIssue = !schemaValidation.success
      ? schemaValidation.error.issues[0]?.message
      : undefined;

    return {
      success: false,
      message: Object.values(errors)[0] ?? fallbackIssue ?? "Invalid idea payload.",
      errors,
    };
  }

  return {
    success: true,
    data: schemaValidation.data,
    errors: {},
  };
}

function FieldError({ message }: Readonly<{ message?: string }>) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-red-600">{message}</p>;
}

export function CreateIdeaWorkspace() {
  const categoriesQuery = useCategoriesQuery();
  const campaignsQuery = useCampaignsQuery(CAMPAIGNS_QUERY_PARAMS);
  const tagsQuery = useTagsQuery(TAGS_QUERY_PARAMS);
  const createIdeaMutation = useCreateIdeaMutation();

  const [form, setForm] = useState<CreateIdeaFormValues>(initialFormState);
  const [errors, setErrors] = useState<IdeaFormError>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [manualTagIds, setManualTagIds] = useState("");

  const categories = useMemo(
    () =>
      [...(categoriesQuery.data?.data ?? [])].sort((a, b) =>
        getCategoryLabel(a).localeCompare(getCategoryLabel(b)),
      ),
    [categoriesQuery.data?.data],
  );

  const campaigns = useMemo(
    () =>
      [...(campaignsQuery.data?.data ?? [])].sort((a, b) =>
        getCampaignLabel(a).localeCompare(getCampaignLabel(b)),
      ),
    [campaignsQuery.data?.data],
  );

  const tags = useMemo(
    () =>
      [...(tagsQuery.data?.data ?? [])].sort((a, b) =>
        getTagLabel(a).localeCompare(getTagLabel(b)),
      ),
    [tagsQuery.data?.data],
  );

  const hasCategories = categories.length > 0;
  const usingManualTags = tagsQuery.isError;
  const tagIds = usingManualTags ? parseManualTagIds(manualTagIds) : selectedTagIds;
  const isFreeIdea = form.accessType.trim().toUpperCase() === "FREE";

  const updateField = (field: keyof CreateIdeaFormValues, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));

    setErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }

      const next = { ...previous };
      delete next[field];
      return next;
    });

    if (feedback) {
      setFeedback(null);
    }
  };

  const onTitleChange = (title: string) => {
    setForm((previous) => ({
      ...previous,
      title,
      slug: slugTouched ? previous.slug : toSlug(title),
    }));

    setErrors((previous) => {
      const next = { ...previous };
      delete next.title;

      if (!slugTouched) {
        delete next.slug;
      }

      return next;
    });

    if (feedback) {
      setFeedback(null);
    }
  };

  const onSlugChange = (slug: string) => {
    setSlugTouched(true);
    updateField("slug", slug);
  };

  const onAccessTypeChange = (accessType: string) => {
    setForm((previous) => ({
      ...previous,
      accessType,
      price: accessType.toUpperCase() === "FREE" ? "0" : previous.price === "0" ? "" : previous.price,
    }));

    setErrors((previous) => {
      const next = { ...previous };
      delete next.accessType;
      delete next.price;
      return next;
    });

    if (feedback) {
      setFeedback(null);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((previous) =>
      previous.includes(tagId)
        ? previous.filter((id) => id !== tagId)
        : [...previous, tagId],
    );

    setErrors((previous) => {
      if (!previous.tagIds) {
        return previous;
      }

      const next = { ...previous };
      delete next.tagIds;
      return next;
    });

    if (feedback) {
      setFeedback(null);
    }
  };

  const resetForm = () => {
    setForm(initialFormState);
    setErrors({});
    setFeedback(null);
    setSlugTouched(false);
    setSelectedTagIds([]);
    setManualTagIds("");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const validation = validateIdeaPayload(form, tagIds);
    setErrors(validation.errors);

    if (!validation.success) {
      setFeedback({ type: "error", text: validation.message });
      return;
    }

    try {
      const response = await createIdeaMutation.mutateAsync(validation.data);
      resetForm();
      setFeedback({
        type: "success",
        text: response.message || "Idea created successfully.",
      });
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  if (categoriesQuery.isPending) {
    return (
      <LoadingState
        title="Loading create workspace"
        description="Fetching categories, campaigns, and tags from the backend."
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
          void campaignsQuery.refetch();
          void tagsQuery.refetch();
        }}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Create Idea</h2>
          <p className="text-sm text-muted-foreground">
            Professional submission form aligned with the full `POST /api/v1/ideas` payload.
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
          Endpoint: POST /api/v1/ideas
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

      {!hasCategories ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No categories available. Create at least one category before submitting ideas.
        </p>
      ) : null}

      {campaignsQuery.isError ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Campaign list unavailable. You can still submit by entering a campaign ID manually.
        </p>
      ) : null}

      {tagsQuery.isError ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Tags could not be loaded. Enter comma-separated tag IDs manually if needed.
        </p>
      ) : null}

      <form className="space-y-6" onSubmit={onSubmit}>
        <fieldset disabled={createIdeaMutation.isPending} className="space-y-6">
          <section className="rounded-xl border bg-background p-5">
            <div className="mb-4 space-y-1">
              <h3 className="text-lg font-semibold">Core Information</h3>
              <p className="text-sm text-muted-foreground">
                Capture title, category, and detailed narrative for reviewers.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="idea-title">Title *</Label>
                <Input
                  id="idea-title"
                  placeholder="Solar Water Purifier"
                  value={form.title}
                  onChange={(event) => onTitleChange(event.target.value)}
                />
                <FieldError message={errors.title} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idea-slug">Slug *</Label>
                <Input
                  id="idea-slug"
                  placeholder="solar-water-purifier"
                  value={form.slug}
                  onChange={(event) => onSlugChange(event.target.value)}
                />
                <FieldError message={errors.slug} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idea-category">Category *</Label>
                <select
                  id="idea-category"
                  className={selectClassName}
                  value={form.categoryId}
                  onChange={(event) => updateField("categoryId", event.target.value)}
                >
                  <option value="">
                    {hasCategories ? "Select a category" : "No categories available"}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {getCategoryLabel(category)}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.categoryId} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idea-campaign">Campaign (optional)</Label>
                {campaignsQuery.isError ? (
                  <Input
                    id="idea-campaign"
                    placeholder="cm_campaign_id"
                    value={form.campaignId}
                    onChange={(event) => updateField("campaignId", event.target.value)}
                  />
                ) : (
                  <select
                    id="idea-campaign"
                    className={selectClassName}
                    value={form.campaignId}
                    onChange={(event) => updateField("campaignId", event.target.value)}
                  >
                    <option value="">No campaign</option>
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {getCampaignLabel(campaign)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="idea-excerpt">Excerpt</Label>
                <textarea
                  id="idea-excerpt"
                  rows={3}
                  className={textareaClassName}
                  placeholder="Affordable eco-friendly water purification concept"
                  value={form.excerpt}
                  onChange={(event) => updateField("excerpt", event.target.value)}
                />
                <FieldError message={errors.excerpt} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="idea-description">Description</Label>
                <textarea
                  id="idea-description"
                  rows={4}
                  className={textareaClassName}
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                />
                <FieldError message={errors.description} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idea-problem">Problem Statement</Label>
                <textarea
                  id="idea-problem"
                  rows={4}
                  className={textareaClassName}
                  value={form.problemStatement}
                  onChange={(event) => updateField("problemStatement", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idea-solution">Proposed Solution</Label>
                <textarea
                  id="idea-solution"
                  rows={4}
                  className={textareaClassName}
                  value={form.proposedSolution}
                  onChange={(event) => updateField("proposedSolution", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idea-steps">Implementation Steps</Label>
                <textarea
                  id="idea-steps"
                  rows={4}
                  className={textareaClassName}
                  value={form.implementationSteps}
                  onChange={(event) => updateField("implementationSteps", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idea-risks">Risks and Challenges</Label>
                <textarea
                  id="idea-risks"
                  rows={4}
                  className={textareaClassName}
                  value={form.risksAndChallenges}
                  onChange={(event) => updateField("risksAndChallenges", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idea-resources">Required Resources</Label>
                <textarea
                  id="idea-resources"
                  rows={4}
                  className={textareaClassName}
                  value={form.requiredResources}
                  onChange={(event) => updateField("requiredResources", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idea-benefits">Expected Benefits</Label>
                <textarea
                  id="idea-benefits"
                  rows={4}
                  className={textareaClassName}
                  value={form.expectedBenefits}
                  onChange={(event) => updateField("expectedBenefits", event.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="idea-audience">Target Audience</Label>
                <Input
                  id="idea-audience"
                  placeholder="Remote communities"
                  value={form.targetAudience}
                  onChange={(event) => updateField("targetAudience", event.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-background p-5">
            <div className="mb-4 space-y-1">
              <h3 className="text-lg font-semibold">Publishing and Access</h3>
              <p className="text-sm text-muted-foreground">
                Configure visibility, access type, pricing, and media links.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="idea-visibility">Visibility *</Label>
                <select
                  id="idea-visibility"
                  className={selectClassName}
                  value={form.visibility}
                  onChange={(event) => updateField("visibility", event.target.value)}
                >
                  <option value="PUBLIC">PUBLIC</option>
                  <option value="PRIVATE">PRIVATE</option>
                </select>
                <FieldError message={errors.visibility} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idea-access">Access Type *</Label>
                <select
                  id="idea-access"
                  className={selectClassName}
                  value={form.accessType}
                  onChange={(event) => onAccessTypeChange(event.target.value)}
                >
                  <option value="FREE">FREE</option>
                  <option value="PAID">PAID</option>
                </select>
                <FieldError message={errors.accessType} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idea-price">Price</Label>
                <Input
                  id="idea-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  disabled={isFreeIdea}
                  onChange={(event) => updateField("price", event.target.value)}
                />
                {isFreeIdea ? (
                  <p className="text-xs text-muted-foreground">
                    FREE access automatically uses price 0.
                  </p>
                ) : null}
                <FieldError message={errors.price} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idea-currency">Currency</Label>
                <Input
                  id="idea-currency"
                  maxLength={3}
                  value={form.currency}
                  onChange={(event) => updateField("currency", event.target.value.toUpperCase())}
                />
                <FieldError message={errors.currency} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="idea-cover">Cover Image URL</Label>
                <Input
                  id="idea-cover"
                  type="url"
                  placeholder="https://example.com/cover.jpg"
                  value={form.coverImageUrl}
                  onChange={(event) => updateField("coverImageUrl", event.target.value)}
                />
                <FieldError message={errors.coverImageUrl} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="idea-video">Video URL</Label>
                <Input
                  id="idea-video"
                  type="url"
                  placeholder="https://example.com/demo.mp4"
                  value={form.videoUrl}
                  onChange={(event) => updateField("videoUrl", event.target.value)}
                />
                <FieldError message={errors.videoUrl} />
              </div>
            </div>
          </section>
          <section className="rounded-xl border bg-background p-5">
            <div className="mb-4 space-y-1">
              <h3 className="text-lg font-semibold">Assessment and Sustainability Metrics</h3>
              <p className="text-sm text-muted-foreground">
                Optional numeric fields for feasibility, impact, and environmental outcomes.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2"><Label htmlFor="estimated-cost">Estimated Cost</Label><Input id="estimated-cost" type="number" min="0" step="0.01" value={form.estimatedCost} onChange={(event) => updateField("estimatedCost", event.target.value)} /><FieldError message={errors.estimatedCost} /></div>
              <div className="space-y-2"><Label htmlFor="implementation-effort">Implementation Effort</Label><Input id="implementation-effort" type="number" min="0" step="1" value={form.implementationEffort} onChange={(event) => updateField("implementationEffort", event.target.value)} /><FieldError message={errors.implementationEffort} /></div>
              <div className="space-y-2"><Label htmlFor="expected-impact">Expected Impact</Label><Input id="expected-impact" type="number" min="0" step="1" value={form.expectedImpact} onChange={(event) => updateField("expectedImpact", event.target.value)} /><FieldError message={errors.expectedImpact} /></div>
              <div className="space-y-2"><Label htmlFor="time-to-implement">Time to Implement (days)</Label><Input id="time-to-implement" type="number" min="0" step="1" value={form.timeToImplementDays} onChange={(event) => updateField("timeToImplementDays", event.target.value)} /><FieldError message={errors.timeToImplementDays} /></div>
              <div className="space-y-2"><Label htmlFor="resource-availability">Resource Availability</Label><Input id="resource-availability" type="number" min="0" step="1" value={form.resourceAvailability} onChange={(event) => updateField("resourceAvailability", event.target.value)} /><FieldError message={errors.resourceAvailability} /></div>
              <div className="space-y-2"><Label htmlFor="innovation-level">Innovation Level</Label><Input id="innovation-level" type="number" min="0" step="1" value={form.innovationLevel} onChange={(event) => updateField("innovationLevel", event.target.value)} /><FieldError message={errors.innovationLevel} /></div>
              <div className="space-y-2"><Label htmlFor="scalability-score">Scalability Score</Label><Input id="scalability-score" type="number" min="0" step="1" value={form.scalabilityScore} onChange={(event) => updateField("scalabilityScore", event.target.value)} /><FieldError message={errors.scalabilityScore} /></div>
              <div className="space-y-2"><Label htmlFor="feasibility-score">Feasibility Score</Label><Input id="feasibility-score" type="number" min="0" step="0.1" value={form.feasibilityScore} onChange={(event) => updateField("feasibilityScore", event.target.value)} /><FieldError message={errors.feasibilityScore} /></div>
              <div className="space-y-2"><Label htmlFor="impact-score">Impact Score</Label><Input id="impact-score" type="number" min="0" step="0.1" value={form.impactScore} onChange={(event) => updateField("impactScore", event.target.value)} /><FieldError message={errors.impactScore} /></div>
              <div className="space-y-2"><Label htmlFor="eco-score">Eco Score</Label><Input id="eco-score" type="number" min="0" step="0.1" value={form.ecoScore} onChange={(event) => updateField("ecoScore", event.target.value)} /><FieldError message={errors.ecoScore} /></div>
              <div className="space-y-2"><Label htmlFor="waste-reduction">Waste Reduction (kg/month)</Label><Input id="waste-reduction" type="number" min="0" step="0.01" value={form.estimatedWasteReductionKgMonth} onChange={(event) => updateField("estimatedWasteReductionKgMonth", event.target.value)} /><FieldError message={errors.estimatedWasteReductionKgMonth} /></div>
              <div className="space-y-2"><Label htmlFor="co2-reduction">CO2 Reduction (kg/month)</Label><Input id="co2-reduction" type="number" min="0" step="0.01" value={form.estimatedCo2ReductionKgMonth} onChange={(event) => updateField("estimatedCo2ReductionKgMonth", event.target.value)} /><FieldError message={errors.estimatedCo2ReductionKgMonth} /></div>
              <div className="space-y-2"><Label htmlFor="cost-savings">Cost Savings (monthly)</Label><Input id="cost-savings" type="number" min="0" step="0.01" value={form.estimatedCostSavingsMonth} onChange={(event) => updateField("estimatedCostSavingsMonth", event.target.value)} /><FieldError message={errors.estimatedCostSavingsMonth} /></div>
              <div className="space-y-2"><Label htmlFor="water-saved">Water Saved (liters/month)</Label><Input id="water-saved" type="number" min="0" step="0.01" value={form.estimatedWaterSavedLitersMonth} onChange={(event) => updateField("estimatedWaterSavedLitersMonth", event.target.value)} /><FieldError message={errors.estimatedWaterSavedLitersMonth} /></div>
              <div className="space-y-2"><Label htmlFor="energy-saved">Energy Saved (kWh/month)</Label><Input id="energy-saved" type="number" min="0" step="0.01" value={form.estimatedEnergySavedKwhMonth} onChange={(event) => updateField("estimatedEnergySavedKwhMonth", event.target.value)} /><FieldError message={errors.estimatedEnergySavedKwhMonth} /></div>
            </div>
          </section>

          <section className="rounded-xl border bg-background p-5">
            <div className="mb-4 space-y-1">
              <h3 className="text-lg font-semibold">SEO and Tags</h3>
              <p className="text-sm text-muted-foreground">
                Improve discoverability and thematic classification.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="idea-seo-title">SEO Title</Label>
                <Input id="idea-seo-title" value={form.seoTitle} onChange={(event) => updateField("seoTitle", event.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idea-seo-description">SEO Description</Label>
                <Input id="idea-seo-description" value={form.seoDescription} onChange={(event) => updateField("seoDescription", event.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Tags</Label>
                {tagsQuery.isPending ? (
                  <p className="text-sm text-muted-foreground">Loading tags...</p>
                ) : tagsQuery.isError ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="cm_tag_id_1, cm_tag_id_2"
                      value={manualTagIds}
                      onChange={(event) => {
                        setManualTagIds(event.target.value);

                        setErrors((previous) => {
                          if (!previous.tagIds) {
                            return previous;
                          }

                          const next = { ...previous };
                          delete next.tagIds;
                          return next;
                        });

                        if (feedback) {
                          setFeedback(null);
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter comma-separated tag IDs.
                    </p>
                  </div>
                ) : tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tags found. Submit without tags or add tags from admin panel.</p>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2">
                    {tags.map((tag) => (
                      <label
                        key={tag.id}
                        htmlFor={`tag-${tag.id}`}
                        className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <input
                          id={`tag-${tag.id}`}
                          type="checkbox"
                          className="mt-0.5 size-4 rounded border-slate-300"
                          checked={selectedTagIds.includes(tag.id)}
                          onChange={() => toggleTag(tag.id)}
                        />
                        <span className="space-y-1">
                          <span className="block font-medium">{getTagLabel(tag)}</span>
                          <span className="block text-xs text-muted-foreground">{tag.id}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                <FieldError message={errors.tagIds} />
              </div>
            </div>
          </section>
        </fieldset>

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={resetForm}
            disabled={createIdeaMutation.isPending}
          >
            Reset
          </Button>
          <Button
            type="submit"
            variant="outline"
            disabled={createIdeaMutation.isPending || !hasCategories}
          >
            {createIdeaMutation.isPending ? "Creating..." : "Create Idea"}
          </Button>
        </div>
      </form>
    </section>
  );
}

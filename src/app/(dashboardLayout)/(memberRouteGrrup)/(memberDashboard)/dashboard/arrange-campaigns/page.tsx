"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  CalendarClock,
  CircleCheckBig,
  CircleOff,
  FileText,
  Filter,
  Globe2,
  ImageIcon,
  Layers3,
  PencilLine,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Target,
  Trash2,
  Waypoints,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useState, type FormEvent } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
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
import {
  getCampaignsQueryOptions,
  useCreateCampaignMutation,
  useDeleteCampaignMutation,
  useUpdateCampaignMutation,
} from "@/features/campaign";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import type { Campaign, CreateCampaignPayload } from "@/services/campaign.service";

const PAGE_SIZE = 2;

const textareaClassName =
  "min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50";
const checkboxClassName =
  "size-4 rounded border border-slate-300 accent-slate-950 outline-none focus-visible:ring-3 focus-visible:ring-ring/40";

type CampaignStatusFilter = "all" | "active" | "inactive";
type PaginationEntry = number | "ellipsis-left" | "ellipsis-right";

type Feedback =
  | {
      type: "success" | "error";
      text: string;
    }
  | null;

type CampaignFormValues = {
  title: string;
  slug: string;
  description: string;
  bannerImage: string;
  bannerImageFile: File | null;
  startDate: string;
  endDate: string;
  goalText: string;
  seoTitle: string;
  seoDescription: string;
  isActive: boolean;
  isPublic: boolean;
};

type CampaignFormErrors = Partial<Record<keyof CampaignFormValues, string>>;

const STATUS_FILTERS: Array<{
  value: CampaignStatusFilter;
  label: string;
  caption: string;
}> = [
  {
    value: "all",
    label: "All records",
    caption: "Browse every campaign available to this workspace.",
  },
  {
    value: "active",
    label: "Active only",
    caption: "Focus on campaigns that are currently marked as live.",
  },
  {
    value: "inactive",
    label: "Inactive only",
    caption: "Review draft, paused, scheduled, or archived campaign records.",
  },
];

const initialFormState: CampaignFormValues = {
  title: "",
  slug: "",
  description: "",
  bannerImage: "",
  bannerImageFile: null,
  startDate: "",
  endDate: "",
  goalText: "",
  seoTitle: "",
  seoDescription: "",
  isActive: true,
  isPublic: true,
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  caption,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  caption: string;
  tone: "slate" | "sky" | "emerald" | "amber";
}) {
  return (
    <article className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-sm text-slate-600">{caption}</p>
        </div>

        <div
          className={cn(
            "rounded-2xl border p-3 shadow-sm",
            tone === "slate" && "border-slate-200 bg-slate-50 text-slate-700",
            tone === "sky" && "border-sky-200 bg-sky-50 text-sky-700",
            tone === "emerald" && "border-emerald-200 bg-emerald-50 text-emerald-700",
            tone === "amber" && "border-amber-200 bg-amber-50 text-amber-700",
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </article>
  );
}

function DetailCard({
  icon: Icon,
  label,
  value,
  tone,
  mono = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "slate" | "sky" | "emerald" | "amber";
  mono?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-4 shadow-sm",
        tone === "slate" && "border-slate-200 bg-slate-50/85",
        tone === "sky" && "border-sky-200 bg-sky-50/85",
        tone === "emerald" && "border-emerald-200 bg-emerald-50/85",
        tone === "amber" && "border-amber-200 bg-amber-50/85",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "rounded-2xl border bg-white p-3 shadow-sm",
            tone === "slate" && "border-slate-200 text-slate-700",
            tone === "sky" && "border-sky-200 text-sky-700",
            tone === "emerald" && "border-emerald-200 text-emerald-700",
            tone === "amber" && "border-amber-200 text-amber-700",
          )}
        >
          <Icon className="size-5" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {label}
          </p>
          <p
            className={cn(
              "mt-2 text-sm leading-6 text-slate-900",
              mono && "break-all font-mono text-xs",
            )}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function FieldError({ message }: Readonly<{ message?: string }>) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-red-600">{message}</p>;
}

function buildPaginationEntries(
  currentPage: number,
  totalPages: number,
): PaginationEntry[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const entries: PaginationEntry[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    entries.push("ellipsis-left");
  }

  for (let page = start; page <= end; page += 1) {
    entries.push(page);
  }

  if (end < totalPages - 1) {
    entries.push("ellipsis-right");
  }

  entries.push(totalPages);

  return entries;
}

function hasText(value?: string | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function trimToUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(value?: string | null, fallback = "Not scheduled") {
  if (!hasText(value)) {
    return fallback;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function toDateTimeInputValue(value?: string | null) {
  if (!hasText(value)) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const timezoneOffset = parsed.getTimezoneOffset() * 60_000;
  return new Date(parsed.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function toIsoDateTime(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getCampaignTitle(campaign: Campaign) {
  if (hasText(campaign.title)) {
    return campaign.title.trim();
  }

  if (hasText(campaign.slug)) {
    return campaign.slug.trim();
  }

  return "Untitled campaign";
}

function getCampaignDescription(campaign: Campaign) {
  if (hasText(campaign.description)) {
    return campaign.description.trim();
  }

  return "No campaign brief has been published for this record yet.";
}

function getCampaignGoalText(campaign: Campaign) {
  return hasText(campaign.goalText) ? campaign.goalText.trim() : null;
}

function getCampaignSeoTitle(campaign: Campaign) {
  return hasText(campaign.seoTitle) ? campaign.seoTitle.trim() : null;
}

function getCampaignSeoDescription(campaign: Campaign) {
  return hasText(campaign.seoDescription) ? campaign.seoDescription.trim() : null;
}

function getCampaignBannerImage(campaign: Campaign) {
  return hasText(campaign.bannerImage) ? campaign.bannerImage.trim() : null;
}

function getCampaignSlug(campaign: Campaign) {
  return hasText(campaign.slug) ? campaign.slug.trim() : "Slug not configured";
}

function getCampaignTimeline(campaign: Campaign) {
  const hasStart = hasText(campaign.startDate);
  const hasEnd = hasText(campaign.endDate);

  if (!hasStart && !hasEnd) {
    return "Timeline not configured";
  }

  return `${formatDate(campaign.startDate, "Start not set")} to ${formatDate(
    campaign.endDate,
    "End not set",
  )}`;
}

function getCampaignVisibility(campaign: Campaign) {
  return campaign.isPublic === true
    ? "Public listing"
    : "Private or limited-access record";
}

function getCampaignOperationalState(campaign: Campaign) {
  if (campaign.isActive === true && campaign.isPublic === true) {
    return "Live and publicly visible";
  }

  if (campaign.isActive === true) {
    return "Live but kept private";
  }

  if (hasText(campaign.startDate) || hasText(campaign.endDate)) {
    return "Scheduled, paused, or archived";
  }

  return "Draft or inactive setup";
}

function getCampaignMomentum(campaign: Campaign) {
  if (campaign.isActive === true && campaign.isPublic === true) {
    return "This campaign is active and visible to broader audiences.";
  }

  if (campaign.isActive === true) {
    return "This campaign is running, but visibility is still restricted.";
  }

  if (campaign.isPublic === true) {
    return "This campaign remains visible even though it is not currently active.";
  }

  return "This record is still internal, limited, or waiting for activation.";
}

function buildCampaignFormValues(campaign: Campaign): CampaignFormValues {
  return {
    title: campaign.title ?? "",
    slug: campaign.slug ?? "",
    description: campaign.description ?? "",
    bannerImage: campaign.bannerImage ?? "",
    bannerImageFile: null,
    startDate: toDateTimeInputValue(campaign.startDate),
    endDate: toDateTimeInputValue(campaign.endDate),
    goalText: campaign.goalText ?? "",
    seoTitle: campaign.seoTitle ?? "",
    seoDescription: campaign.seoDescription ?? "",
    isActive: campaign.isActive === true,
    isPublic: campaign.isPublic === true,
  };
}

function buildCampaignPayload(form: CampaignFormValues): CreateCampaignPayload {
  const payload: CreateCampaignPayload = {
    title: form.title.trim(),
    slug: form.slug.trim(),
    isActive: form.isActive,
    isPublic: form.isPublic,
  };

  const description = trimToUndefined(form.description);
  const bannerImage = trimToUndefined(form.bannerImage);
  const startDate = toIsoDateTime(form.startDate);
  const endDate = toIsoDateTime(form.endDate);
  const goalText = trimToUndefined(form.goalText);
  const seoTitle = trimToUndefined(form.seoTitle);
  const seoDescription = trimToUndefined(form.seoDescription);

  if (description) {
    payload.description = description;
  }

  if (bannerImage && !form.bannerImageFile) {
    payload.bannerImage = bannerImage;
  }

  if (form.bannerImageFile) {
    payload.bannerImageFile = form.bannerImageFile;
  }

  if (startDate) {
    payload.startDate = startDate;
  }

  if (endDate) {
    payload.endDate = endDate;
  }

  if (goalText) {
    payload.goalText = goalText;
  }

  if (seoTitle) {
    payload.seoTitle = seoTitle;
  }

  if (seoDescription) {
    payload.seoDescription = seoDescription;
  }

  return payload;
}

function validateCampaignForm(form: CampaignFormValues) {
  const errors: CampaignFormErrors = {};

  if (!form.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!form.slug.trim()) {
    errors.slug = "Slug is required.";
  }

  if (
    form.bannerImage.trim() &&
    !form.bannerImageFile &&
    !isValidHttpUrl(form.bannerImage.trim())
  ) {
    errors.bannerImage = "Banner image must be a valid http or https URL.";
  }

  const startDate = form.startDate.trim();
  const endDate = form.endDate.trim();
  const startIso = toIsoDateTime(startDate);
  const endIso = toIsoDateTime(endDate);

  if (startDate && !startIso) {
    errors.startDate = "Start date must be a valid date and time.";
  }

  if (endDate && !endIso) {
    errors.endDate = "End date must be a valid date and time.";
  }

  if (startIso && endIso && new Date(endIso).getTime() < new Date(startIso).getTime()) {
    errors.endDate = "End date must be after the start date.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    message:
      Object.values(errors)[0] ?? "Please review the campaign fields before submitting.",
  };
}

export default function ArrangeCampaignsPage() {
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatusFilter>("all");
  const [form, setForm] = useState<CampaignFormValues>(initialFormState);
  const [formErrors, setFormErrors] = useState<CampaignFormErrors>({});
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [bannerFileInputKey, setBannerFileInputKey] = useState(0);
  const deferredSearchValue = useDeferredValue(searchValue);
  const activeSearch = deferredSearchValue.trim();

  const queryParams: Record<string, unknown> = {
    page,
    limit: PAGE_SIZE,
  };

  if (activeSearch) {
    queryParams.searchTerm = activeSearch;
  }

  if (statusFilter !== "all") {
    queryParams.isActive = statusFilter === "active";
  }

  const campaignsQuery = useQuery({
    ...getCampaignsQueryOptions(queryParams),
    placeholderData: (previousData) => previousData,
  });
  const createCampaignMutation = useCreateCampaignMutation();
  const updateCampaignMutation = useUpdateCampaignMutation();
  const deleteCampaignMutation = useDeleteCampaignMutation();

  const campaigns = campaignsQuery.data?.data ?? [];
  const meta = campaignsQuery.data?.meta;
  const visiblePage = meta?.page ?? page;
  const totalPages = Math.max(meta?.totalPage ?? meta?.totalPages ?? 1, 1);
  const totalCampaigns = meta?.total ?? campaigns.length;
  const itemsPerPage = meta?.limit ?? PAGE_SIZE;
  const firstVisibleItem =
    totalCampaigns === 0 ? 0 : (visiblePage - 1) * itemsPerPage + 1;
  const lastVisibleItem =
    totalCampaigns === 0
      ? 0
      : Math.min((visiblePage - 1) * itemsPerPage + campaigns.length, totalCampaigns);
  const activeOnPage = campaigns.filter((campaign) => campaign.isActive === true).length;
  const publicOnPage = campaigns.filter((campaign) => campaign.isPublic === true).length;
  const scheduledOnPage = campaigns.filter(
    (campaign) => hasText(campaign.startDate) || hasText(campaign.endDate),
  ).length;
  const paginationEntries = buildPaginationEntries(visiblePage, totalPages);
  const hasActiveFilters = Boolean(searchValue.trim()) || statusFilter !== "all";
  const isSubmitting =
    createCampaignMutation.isPending || updateCampaignMutation.isPending;
  const liveStatus = campaignsQuery.isFetching
    ? "Synchronizing campaign data"
    : "Campaign list is up to date";
  const resultDescription = activeSearch
    ? `Results filtered by "${activeSearch}".`
    : statusFilter === "active"
      ? "Showing campaigns currently marked as active."
      : statusFilter === "inactive"
        ? "Showing campaigns currently marked as inactive."
        : "Showing every campaign record available to this member workspace.";

  if (campaignsQuery.isPending && !campaignsQuery.data) {
    return (
      <LoadingState
        title="Loading campaigns"
        description="Preparing the campaign arrangement workspace."
        rows={6}
      />
    );
  }

  if (campaignsQuery.isError && !campaignsQuery.data) {
    return (
      <ErrorState
        title="Could not load campaigns"
        description={getApiErrorMessage(campaignsQuery.error)}
        onRetry={() => {
          void campaignsQuery.refetch();
        }}
      />
    );
  }

  const resetEditor = () => {
    setEditingCampaignId(null);
    setForm(initialFormState);
    setFormErrors({});
    setSlugTouched(false);
    setBannerFileInputKey((previous) => previous + 1);
  };

  const scrollToEditor = () => {
    if (typeof document === "undefined") {
      return;
    }

    document.getElementById("campaign-editor")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const updateFormField = <K extends keyof CampaignFormValues>(
    field: K,
    value: CampaignFormValues[K],
  ) => {
    setForm((previous) => ({ ...previous, [field]: value }));

    setFormErrors((previous) => {
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

  const clearSelectedBannerFile = () => {
    updateFormField("bannerImageFile", null);
    setBannerFileInputKey((previous) => previous + 1);
  };

  const handleTitleChange = (value: string) => {
    setForm((previous) => ({
      ...previous,
      title: value,
      slug: slugTouched ? previous.slug : toSlug(value),
    }));

    setFormErrors((previous) => {
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

  const handleStartCreate = () => {
    resetEditor();
    setFeedback(null);
    scrollToEditor();
  };

  const handleStartEdit = (campaign: Campaign) => {
    setEditingCampaignId(campaign.id);
    setForm(buildCampaignFormValues(campaign));
    setFormErrors({});
    setFeedback(null);
    setSlugTouched(true);
    setBannerFileInputKey((previous) => previous + 1);
    scrollToEditor();
  };

  const handlePageChange = (nextPage: number) => {
    if (
      nextPage === visiblePage ||
      nextPage < 1 ||
      nextPage > totalPages ||
      campaignsQuery.isFetching
    ) {
      return;
    }

    setPage(nextPage);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const validation = validateCampaignForm(form);
    setFormErrors(validation.errors);

    if (!validation.valid) {
      setFeedback({ type: "error", text: validation.message });
      return;
    }

    const payload = buildCampaignPayload(form);

    try {
      if (editingCampaignId) {
        const response = await updateCampaignMutation.mutateAsync({
          id: editingCampaignId,
          payload,
        });

        await campaignsQuery.refetch();
        resetEditor();
        setFeedback({
          type: "success",
          text: response.message || "Campaign updated successfully.",
        });
        return;
      }

      const response = await createCampaignMutation.mutateAsync(payload);

      if (page !== 1) {
        setPage(1);
      } else {
        await campaignsQuery.refetch();
      }

      resetEditor();
      setFeedback({
        type: "success",
        text: response.message || "Campaign created successfully.",
      });
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  const handleDeleteCampaign = async (campaign: Campaign) => {
    const campaignTitle = getCampaignTitle(campaign);
    const confirmed = window.confirm(`Delete campaign "${campaignTitle}"?`);

    if (!confirmed) {
      return;
    }

    setFeedback(null);

    try {
      await deleteCampaignMutation.mutateAsync({ id: campaign.id });

      if (editingCampaignId === campaign.id) {
        resetEditor();
      }

      if (campaigns.length === 1 && visiblePage > 1) {
        setPage(visiblePage - 1);
      } else {
        await campaignsQuery.refetch();
      }

      setFeedback({
        type: "success",
        text: `Campaign "${campaignTitle}" deleted successfully.`,
      });
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  const editorTitle = editingCampaignId
    ? "Update campaign details and publishing state"
    : "Create a new campaign record";
  const editorDescription = editingCampaignId
    ? "Edit the selected campaign and send either JSON updates or a multipart banner replacement back to the backend."
    : "Submit a new campaign with either a hosted banner URL or a multipart image upload using the campaign API.";
  const submitLabel = editingCampaignId ? "Save changes" : "Create campaign";
  const submitPendingLabel = editingCampaignId ? "Saving..." : "Creating...";
  const editorEndpoint = editingCampaignId
    ? `PATCH /api/v1/campaigns/${editingCampaignId}`
    : "POST /api/v1/campaigns";

  return (
    <section className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 shadow-sm">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top_right,_rgba(52,211,153,0.16),_transparent_55%)]" />
        <div className="absolute -left-10 top-14 h-36 w-36 rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="absolute bottom-0 right-12 h-28 w-28 rounded-full bg-sky-200/40 blur-3xl" />

        <div className="relative grid gap-6 px-6 py-7 md:px-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] xl:items-end">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700 shadow-sm">
                <Sparkles className="size-3.5" />
                Campaign Workspace
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 shadow-sm">
                <Layers3 className="size-3.5" />
                Page {visiblePage} of {totalPages}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                Arrange campaigns with create, update, and delete controls in one place
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                This workspace now supports full campaign CRUD while keeping the
                review flow limited to two campaigns per page for easier scanning.
              </p>
              {campaignsQuery.data?.message ? (
                <p className="text-sm text-slate-500">{campaignsQuery.data.message}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl bg-white/90"
                onClick={() => {
                  void campaignsQuery.refetch();
                }}
                disabled={campaignsQuery.isFetching}
              >
                <RefreshCw
                  className={cn(
                    "size-4",
                    campaignsQuery.isFetching && "animate-spin",
                  )}
                />
                {campaignsQuery.isFetching ? "Refreshing..." : "Refresh campaigns"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="rounded-2xl bg-white/90"
                onClick={handleStartCreate}
                disabled={isSubmitting}
              >
                <Plus className="size-4" />
                New campaign
              </Button>

              <Link
                href="/campaigns"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "rounded-2xl bg-white/90",
                )}
              >
                Open public directory
                <ArrowUpRight className="size-4" />
              </Link>

              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Visible range
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {firstVisibleItem} to {lastVisibleItem} of {totalCampaigns}
                </p>
                <p className="text-xs text-slate-500">
                  {itemsPerPage} campaigns per page
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryCard
              icon={Layers3}
              label="Matching"
              value={totalCampaigns.toLocaleString()}
              caption="Campaigns in the current result set"
              tone="slate"
            />
            <SummaryCard
              icon={Sparkles}
              label="Visible"
              value={campaigns.length.toLocaleString()}
              caption="Campaigns rendered on this page"
              tone="sky"
            />
            <SummaryCard
              icon={CircleCheckBig}
              label="Active"
              value={activeOnPage.toLocaleString()}
              caption="Active campaigns on this page"
              tone="emerald"
            />
            <SummaryCard
              icon={CalendarClock}
              label="Scheduled"
              value={scheduledOnPage.toLocaleString()}
              caption={`${publicOnPage.toLocaleString()} public records on this page`}
              tone="amber"
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

      {campaignsQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          The latest refresh failed. Showing the most recent campaign data that was
          already available. {getApiErrorMessage(campaignsQuery.error)}
        </div>
      ) : null}

      <section
        id="campaign-editor"
        className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Campaign Editor
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              {editorTitle}
            </h3>
            <p className="text-sm leading-6 text-slate-600">{editorDescription}</p>
            <p className="text-xs text-slate-500">
              Banner uploads now follow the API contract: send the file in the
              `bannerImage` field and the rest of the campaign payload in the `data`
              JSON field.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right shadow-sm lg:max-w-xs">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Active endpoint
            </p>
            <p className="mt-1 break-all font-mono text-xs text-slate-900">{editorEndpoint}</p>
            <p className="mt-1 text-xs text-slate-500">
              {editingCampaignId ? "Editing an existing campaign" : "Creating a new campaign"}
            </p>
          </div>
        </div>

        <form
          className="mt-6 space-y-6"
          encType="multipart/form-data"
          onSubmit={handleSubmit}
        >
          <fieldset disabled={isSubmitting} className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
              <div className="mb-4 space-y-1">
                <h4 className="text-lg font-semibold text-slate-950">Core details</h4>
                <p className="text-sm text-slate-600">
                  Set the main campaign title, slug, description, timeline, and banner
                  source.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="campaign-title">Title *</Label>
                  <Input
                    id="campaign-title"
                    placeholder="Green Innovation Sprint"
                    value={form.title}
                    onChange={(event) => {
                      handleTitleChange(event.target.value);
                    }}
                  />
                  <FieldError message={formErrors.title} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-slug">Slug *</Label>
                  <Input
                    id="campaign-slug"
                    placeholder="green-innovation-sprint"
                    value={form.slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      updateFormField("slug", event.target.value);
                    }}
                  />
                  <FieldError message={formErrors.slug} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="campaign-description">Description</Label>
                  <textarea
                    id="campaign-description"
                    rows={4}
                    className={textareaClassName}
                    placeholder="A campaign for eco-friendly idea submissions."
                    value={form.description}
                    onChange={(event) => {
                      updateFormField("description", event.target.value);
                    }}
                  />
                  <FieldError message={formErrors.description} />
                </div>

                <div className="space-y-4 md:col-span-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-950">Banner asset</p>
                      <p className="text-xs leading-5 text-slate-500">
                        Upload an image file to send `multipart/form-data`. If no file is
                        selected, the hosted URL below is used instead.
                      </p>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="campaign-banner-file">Banner Image File</Label>
                        <Input
                          key={bannerFileInputKey}
                          id="campaign-banner-file"
                          type="file"
                          accept="image/*"
                          className="cursor-pointer file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
                          onChange={(event) => {
                            updateFormField(
                              "bannerImageFile",
                              event.target.files?.[0] ?? null,
                            );
                          }}
                        />
                        <p className="text-xs text-slate-500">
                          Uses the `bannerImage` multer field from the campaign API.
                        </p>

                        {form.bannerImageFile ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                              {form.bannerImageFile.name}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={clearSelectedBannerFile}
                            >
                              <X className="size-4" />
                              Remove file
                            </Button>
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="campaign-banner">Banner Image URL</Label>
                        <Input
                          id="campaign-banner"
                          type="url"
                          placeholder="https://example.com/campaigns/green-sprint.jpg"
                          value={form.bannerImage}
                          onChange={(event) => {
                            updateFormField("bannerImage", event.target.value);
                          }}
                        />
                        <p className="text-xs text-slate-500">
                          Used only when no file is selected. If both are provided, the
                          uploaded file takes precedence.
                        </p>
                        <FieldError message={formErrors.bannerImage} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-start-date">Start Date</Label>
                  <Input
                    id="campaign-start-date"
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(event) => {
                      updateFormField("startDate", event.target.value);
                    }}
                  />
                  <FieldError message={formErrors.startDate} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-end-date">End Date</Label>
                  <Input
                    id="campaign-end-date"
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(event) => {
                      updateFormField("endDate", event.target.value);
                    }}
                  />
                  <FieldError message={formErrors.endDate} />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
              <div className="mb-4 space-y-1">
                <h4 className="text-lg font-semibold text-slate-950">
                  Goal and SEO metadata
                </h4>
                <p className="text-sm text-slate-600">
                  Add optional campaign messaging for goals, search snippets, and previews.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="campaign-goal">Goal Text</Label>
                  <textarea
                    id="campaign-goal"
                    rows={3}
                    className={textareaClassName}
                    placeholder="Collect 100 sustainability ideas."
                    value={form.goalText}
                    onChange={(event) => {
                      updateFormField("goalText", event.target.value);
                    }}
                  />
                  <FieldError message={formErrors.goalText} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-seo-title">SEO Title</Label>
                  <Input
                    id="campaign-seo-title"
                    placeholder="Green Innovation Sprint"
                    value={form.seoTitle}
                    onChange={(event) => {
                      updateFormField("seoTitle", event.target.value);
                    }}
                  />
                  <FieldError message={formErrors.seoTitle} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="campaign-seo-description">SEO Description</Label>
                  <textarea
                    id="campaign-seo-description"
                    rows={3}
                    className={textareaClassName}
                    placeholder="Public campaign for sustainability ideas."
                    value={form.seoDescription}
                    onChange={(event) => {
                      updateFormField("seoDescription", event.target.value);
                    }}
                  />
                  <FieldError message={formErrors.seoDescription} />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
              <div className="mb-4 space-y-1">
                <h4 className="text-lg font-semibold text-slate-950">
                  Publishing controls
                </h4>
                <p className="text-sm text-slate-600">
                  Choose whether the campaign is active and whether it is visible to the public.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    className={checkboxClassName}
                    onChange={(event) => {
                      updateFormField("isActive", event.target.checked);
                    }}
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-900">Active campaign</p>
                    <p className="text-xs leading-5 text-slate-500">
                      Active campaigns appear as live records in operational views.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    className={checkboxClassName}
                    onChange={(event) => {
                      updateFormField("isPublic", event.target.checked);
                    }}
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-900">Public campaign</p>
                    <p className="text-xs leading-5 text-slate-500">
                      Public campaigns can be surfaced in broader member or public-facing views.
                    </p>
                  </div>
                </label>
              </div>
            </section>
          </fieldset>

          <div className="flex flex-wrap justify-end gap-2">
            {editingCampaignId ? (
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={() => {
                  resetEditor();
                  setFeedback(null);
                }}
                disabled={isSubmitting}
              >
                <X className="size-4" />
                Cancel edit
              </Button>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => {
                resetEditor();
                setFeedback(null);
              }}
              disabled={isSubmitting}
            >
              <RefreshCw className="size-4" />
              Clear form
            </Button>

            <Button
              type="submit"
              variant="outline"
              className="rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Save className="size-4 animate-pulse" />
              ) : editingCampaignId ? (
                <Save className="size-4" />
              ) : (
                <Plus className="size-4" />
              )}
              {isSubmitting ? submitPendingLabel : submitLabel}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Directory Controls
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
              Filter campaigns by keyword and activation state
            </h3>
            <p className="text-sm leading-6 text-slate-600">
              Search by campaign title, slug, or description and keep pagination locked
              to two records per page.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Live status
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">{liveStatus}</p>
            <p className="text-xs text-slate-500">{resultDescription}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
                setPage(1);
              }}
              placeholder="Search by title, slug, or description"
              className="h-11 rounded-2xl border-slate-200 bg-white pl-9 shadow-sm"
            />
          </label>

          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-2xl border-slate-200 px-5 text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setSearchValue("");
              setStatusFilter("all");
              setPage(1);
            }}
            disabled={!hasActiveFilters}
          >
            Reset filters
          </Button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {STATUS_FILTERS.map((filterOption) => {
            const isActiveFilter = filterOption.value === statusFilter;

            return (
              <button
                key={filterOption.value}
                type="button"
                className={cn(
                  "rounded-2xl border px-4 py-4 text-left shadow-sm transition-colors",
                  isActiveFilter
                    ? "border-sky-300 bg-sky-50 text-sky-900"
                    : "border-slate-200 bg-slate-50/80 text-slate-600 hover:border-slate-300 hover:bg-white",
                )}
                onClick={() => {
                  setStatusFilter(filterOption.value);
                  setPage(1);
                }}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Filter className="size-4" />
                  {filterOption.label}
                </div>
                <p className="mt-2 text-xs leading-5">{filterOption.caption}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <p>
            Showing{" "}
            <span className="font-medium text-slate-900">{firstVisibleItem}</span> to{" "}
            <span className="font-medium text-slate-900">{lastVisibleItem}</span> of{" "}
            <span className="font-medium text-slate-900">{totalCampaigns}</span> campaigns
          </p>
          <p>{resultDescription}</p>
        </div>
      </section>

      {totalCampaigns === 0 ? (
        <EmptyState
          title="No campaigns found"
          description={
            hasActiveFilters
              ? "Try a different keyword or reset the filters to widen the result set."
              : "Campaigns will appear here once records are available from the backend."
          }
          className="rounded-[24px] border-slate-200 bg-white p-6 shadow-sm"
        />
      ) : (
        <section className="space-y-5">
          {campaigns.map((campaign) => {
            const goalText = getCampaignGoalText(campaign);
            const seoTitle = getCampaignSeoTitle(campaign);
            const seoDescription = getCampaignSeoDescription(campaign);
            const bannerImage = getCampaignBannerImage(campaign);
            const isEditingThisCampaign = editingCampaignId === campaign.id;
            const isDeletingThisCampaign =
              deleteCampaignMutation.isPending &&
              deleteCampaignMutation.variables?.id === campaign.id;
            const isUpdatingThisCampaign =
              updateCampaignMutation.isPending &&
              updateCampaignMutation.variables?.id === campaign.id;

            return (
              <article
                key={campaign.id}
                className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(224,242,254,0.92),rgba(255,255,255,1))] px-6 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                            campaign.isActive === true
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-700",
                          )}
                        >
                          {campaign.isActive === true ? (
                            <CircleCheckBig className="size-3.5" />
                          ) : (
                            <CircleOff className="size-3.5" />
                          )}
                          {campaign.isActive === true ? "Active" : "Inactive"}
                        </span>

                        <span
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                            campaign.isPublic === true
                              ? "border-sky-200 bg-sky-50 text-sky-700"
                              : "border-amber-200 bg-amber-50 text-amber-700",
                          )}
                        >
                          <Globe2 className="size-3.5" />
                          {campaign.isPublic === true ? "Public" : "Private"}
                        </span>

                        {isEditingThisCampaign ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                            <PencilLine className="size-3.5" />
                            Editing in form
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Campaign Record
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                          {getCampaignTitle(campaign)}
                        </h3>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                          {getCampaignDescription(campaign)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 lg:max-w-xs">
                      <div className="rounded-2xl border border-emerald-200 bg-white/90 px-4 py-3 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Operational State
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          {getCampaignOperationalState(campaign)}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {getCampaignMomentum(campaign)}
                        </p>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => {
                            handleStartEdit(campaign);
                          }}
                          disabled={isSubmitting || isDeletingThisCampaign}
                        >
                          <PencilLine className="size-4" />
                          {isUpdatingThisCampaign ? "Saving..." : "Edit"}
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="rounded-xl"
                          onClick={() => {
                            void handleDeleteCampaign(campaign);
                          }}
                          disabled={isDeletingThisCampaign || isSubmitting}
                        >
                          <Trash2 className="size-4" />
                          {isDeletingThisCampaign ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
                  <div className="space-y-4">
                    {goalText ? (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl border border-emerald-200 bg-white p-3 text-emerald-700 shadow-sm">
                            <Target className="size-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                              Campaign Goal
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-700">{goalText}</p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 shadow-sm">
                          <Waypoints className="size-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Review Note
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {campaign.isPublic === true
                              ? "This campaign is configured for broader visibility and can be reviewed as a public-facing record."
                              : "This campaign remains private, making it better suited for internal review before wider exposure."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {seoTitle || seoDescription ? (
                      <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl border border-sky-200 bg-white p-3 text-sky-700 shadow-sm">
                            <FileText className="size-5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                              SEO Summary
                            </p>
                            {seoTitle ? (
                              <p className="mt-2 text-sm font-medium text-slate-900">{seoTitle}</p>
                            ) : null}
                            {seoDescription ? (
                              <p className="mt-1 text-sm leading-6 text-slate-700">
                                {seoDescription}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {bannerImage ? (
                      <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl border border-amber-200 bg-white p-3 text-amber-700 shadow-sm">
                            <ImageIcon className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                              Banner Image
                            </p>
                            <a
                              href={bannerImage}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex break-all text-sm text-slate-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-slate-950"
                            >
                              {bannerImage}
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-3">
                    <DetailCard
                      icon={CalendarClock}
                      label="Timeline"
                      value={getCampaignTimeline(campaign)}
                      tone="emerald"
                    />
                    <DetailCard
                      icon={Waypoints}
                      label="Slug"
                      value={getCampaignSlug(campaign)}
                      tone="sky"
                    />
                    <DetailCard
                      icon={Globe2}
                      label="Visibility"
                      value={getCampaignVisibility(campaign)}
                      tone="amber"
                    />
                    <DetailCard
                      icon={Layers3}
                      label="Campaign ID"
                      value={campaign.id}
                      tone="slate"
                      mono
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {totalPages > 1 ? (
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Pagination
              </p>
              <p className="text-sm text-slate-600">
                Page <span className="font-medium text-slate-900">{visiblePage}</span> of{" "}
                <span className="font-medium text-slate-900">{totalPages}</span> with{" "}
                <span className="font-medium text-slate-900">{itemsPerPage}</span> campaigns per
                page.
              </p>
            </div>

            <Pagination className="mx-0 w-auto justify-start lg:justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    className={cn(
                      (visiblePage === 1 || campaignsQuery.isFetching) &&
                        "pointer-events-none opacity-50",
                    )}
                    onClick={(event) => {
                      event.preventDefault();
                      handlePageChange(visiblePage - 1);
                    }}
                  />
                </PaginationItem>

                {paginationEntries.map((entry) => (
                  <PaginationItem key={String(entry)}>
                    {typeof entry === "number" ? (
                      <PaginationLink
                        href="#"
                        isActive={entry === visiblePage}
                        onClick={(event) => {
                          event.preventDefault();
                          handlePageChange(entry);
                        }}
                        className={cn(campaignsQuery.isFetching && "pointer-events-none")}
                      >
                        {entry}
                      </PaginationLink>
                    ) : (
                      <PaginationEllipsis />
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    className={cn(
                      (visiblePage === totalPages || campaignsQuery.isFetching) &&
                        "pointer-events-none opacity-50",
                    )}
                    onClick={(event) => {
                      event.preventDefault();
                      handlePageChange(visiblePage + 1);
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </section>
      ) : null}
    </section>
  );
}

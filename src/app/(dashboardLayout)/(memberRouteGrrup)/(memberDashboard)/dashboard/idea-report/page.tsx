"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ImageIcon,
  Link2,
  MapPin,
  RefreshCw,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIdeaExperienceReportsQuery } from "@/features/community";
import { useIdeaByIdQuery, useIdeasQuery } from "@/features/idea";
import { httpClient } from "@/lib/axios/httpClient";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import type { ExperienceReport } from "@/services/community.service";
import type { Idea } from "@/services/idea.service";

type Feedback =
  | {
      type: "success" | "error";
      text: string;
    }
  | null;

type ImageMode = "upload" | "url";

type ExperienceReportFormState = {
  ideaId: string;
  title: string;
  summary: string;
  outcome: string;
  challenges: string;
  measurableResult: string;
  adoptedScale: string;
  location: string;
  effectivenessRating: string;
  imageMode: ImageMode;
  beforeImage: File | null;
  afterImage: File | null;
  beforeImageUrl: string;
  afterImageUrl: string;
};

const selectClassName =
  "h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-emerald-500 focus-visible:ring-3 focus-visible:ring-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50";

const textareaClassName =
  "min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-xs outline-none transition-colors placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-3 focus-visible:ring-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50";

const cardClassName =
  "rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_70px_-48px_rgba(15,23,42,0.38)]";

const initialFormState: ExperienceReportFormState = {
  ideaId: "",
  title: "",
  summary: "",
  outcome: "",
  challenges: "",
  measurableResult: "",
  adoptedScale: "",
  location: "",
  effectivenessRating: "8",
  imageMode: "upload",
  beforeImage: null,
  afterImage: null,
  beforeImageUrl: "",
  afterImageUrl: "",
};

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getIdeaTitle(idea: Idea) {
  return hasText(idea.title) ? idea.title.trim() : "Untitled idea";
}

function getIdeaSummary(idea: Idea) {
  if (hasText(idea.excerpt)) return idea.excerpt!.trim();
  if (hasText(idea.description)) return idea.description!.trim();
  return "No summary is available for this idea yet.";
}

function formatLabel(value: unknown, fallback = "N/A") {
  if (!hasText(value)) return fallback;

  return value
    .trim()
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: unknown) {
  if (!hasText(value)) return "N/A";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleString();
}

function getExperienceReportTitle(report: ExperienceReport) {
  return hasText(report.title) ? report.title!.trim() : "Untitled report";
}

function sortIdeas(a: Idea, b: Idea) {
  return getIdeaTitle(a).localeCompare(getIdeaTitle(b));
}

function sortReports(a: ExperienceReport, b: ExperienceReport) {
  const aDate = hasText(a.createdAt) ? new Date(a.createdAt!).getTime() : 0;
  const bDate = hasText(b.createdAt) ? new Date(b.createdAt!).getTime() : 0;
  return bDate - aDate;
}

function ImagePreviewCard({
  label,
  hint,
  source,
  fileLabel,
}: Readonly<{
  label: string;
  hint: string;
  source: string | null;
  fileLabel?: string;
}>) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/85 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>
        </div>
        <span className="inline-flex rounded-full bg-white p-2 text-emerald-600 shadow-sm">
          <ImageIcon className="size-4" />
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200 bg-white">
        {source ? (
          <img src={source} alt={label} className="h-44 w-full object-cover" />
        ) : (
          <div className="flex h-44 items-center justify-center bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.1),rgba(255,255,255,1)_65%)] px-4 text-center">
            <div>
              <p className="text-sm font-medium text-slate-700">
                Preview unavailable
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Add an image file or hosted URL to preview this panel.
              </p>
            </div>
          </div>
        )}
      </div>

      {fileLabel ? (
        <p className="mt-3 truncate text-xs text-slate-500">{fileLabel}</p>
      ) : null}
    </div>
  );
}

export default function IdeaReportPage() {
  const queryClient = useQueryClient();
  const ideasQuery = useIdeasQuery();

  const [form, setForm] = useState(initialFormState);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [beforeInputKey, setBeforeInputKey] = useState(0);
  const [afterInputKey, setAfterInputKey] = useState(0);
  const [beforePreviewUrl, setBeforePreviewUrl] = useState<string | null>(null);
  const [afterPreviewUrl, setAfterPreviewUrl] = useState<string | null>(null);

  const selectedIdeaId = form.ideaId.trim();
  const detailsQuery = useIdeaByIdQuery(selectedIdeaId);
  const reportsQuery = useIdeaExperienceReportsQuery(selectedIdeaId);

  useEffect(() => {
    if (!form.beforeImage) {
      setBeforePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(form.beforeImage);
    setBeforePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [form.beforeImage]);

  useEffect(() => {
    if (!form.afterImage) {
      setAfterPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(form.afterImage);
    setAfterPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [form.afterImage]);

  const ideas = useMemo(
    () => [...(ideasQuery.data?.data ?? [])].sort(sortIdeas),
    [ideasQuery.data?.data],
  );

  const selectedIdea =
    detailsQuery.data?.data ??
    ideas.find((idea) => idea.id === selectedIdeaId) ??
    null;

  const recentReports = useMemo(
    () => [...(reportsQuery.data?.data ?? [])].sort(sortReports),
    [reportsQuery.data?.data],
  );

  const beforePreviewSource =
    form.imageMode === "upload"
      ? beforePreviewUrl
      : hasText(form.beforeImageUrl)
        ? form.beforeImageUrl.trim()
        : null;

  const afterPreviewSource =
    form.imageMode === "upload"
      ? afterPreviewUrl
      : hasText(form.afterImageUrl)
        ? form.afterImageUrl.trim()
        : null;

  const updateField = <TKey extends keyof ExperienceReportFormState>(
    key: TKey,
    value: ExperienceReportFormState[TKey],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const resetForm = ({
    keepIdeaId = true,
    keepMode = true,
  }: {
    keepIdeaId?: boolean;
    keepMode?: boolean;
  } = {}) => {
    setForm((previous) => ({
      ...initialFormState,
      ideaId: keepIdeaId ? previous.ideaId : "",
      imageMode: keepMode ? previous.imageMode : initialFormState.imageMode,
    }));
    setBeforeInputKey((value) => value + 1);
    setAfterInputKey((value) => value + 1);
  };

  const onFileChange =
    (field: "beforeImage" | "afterImage") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      updateField(field, event.target.files?.[0] ?? null);
    };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!selectedIdeaId) {
      setFeedback({
        type: "error",
        text: "Select an idea before creating an experience report.",
      });
      return;
    }

    if (!hasText(form.title) || !hasText(form.summary)) {
      setFeedback({
        type: "error",
        text: "Title and summary are required fields.",
      });
      return;
    }

    const parsedRating = Number(form.effectivenessRating);

    if (
      !Number.isFinite(parsedRating) ||
      parsedRating < 0 ||
      parsedRating > 10
    ) {
      setFeedback({
        type: "error",
        text: "Effectiveness rating must be a number between 0 and 10.",
      });
      return;
    }

    const payload = {
      ideaId: selectedIdeaId,
      title: form.title.trim(),
      summary: form.summary.trim(),
      ...(hasText(form.outcome) ? { outcome: form.outcome.trim() } : {}),
      ...(hasText(form.challenges)
        ? { challenges: form.challenges.trim() }
        : {}),
      ...(hasText(form.measurableResult)
        ? { measurableResult: form.measurableResult.trim() }
        : {}),
      ...(hasText(form.adoptedScale)
        ? { adoptedScale: form.adoptedScale.trim() }
        : {}),
      ...(hasText(form.location) ? { location: form.location.trim() } : {}),
      effectivenessRating: parsedRating,
    };

    if (form.imageMode === "upload") {
      if (!form.beforeImage || !form.afterImage) {
        setFeedback({
          type: "error",
          text: "Upload both before and after images, or switch to hosted URLs.",
        });
        return;
      }
    } else if (!hasText(form.beforeImageUrl) || !hasText(form.afterImageUrl)) {
      setFeedback({
        type: "error",
        text: "Hosted image mode requires both before and after image URLs.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response =
        form.imageMode === "upload"
          ? await httpClient.post<unknown>(
              "/community/experience-reports",
              (() => {
                const formData = new FormData();
                formData.append("beforeImage", form.beforeImage!);
                formData.append("afterImage", form.afterImage!);
                formData.append("data", JSON.stringify(payload));
                return formData;
              })(),
            )
          : await httpClient.post<unknown>("/community/experience-reports", {
              ...payload,
              beforeImageUrl: form.beforeImageUrl.trim(),
              afterImageUrl: form.afterImageUrl.trim(),
            });

      setFeedback({
        type: "success",
        text:
          response.message ||
          "Experience report submitted successfully and sent for review.",
      });
      resetForm();

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["community"] }),
        queryClient.invalidateQueries({ queryKey: ["ideas"] }),
      ]);
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (ideasQuery.isPending) {
    return (
      <LoadingState
        title="Loading reporting workspace"
        description="Fetching ideas so you can attach an experience report to the right record."
        rows={4}
      />
    );
  }

  if (ideasQuery.isError) {
    return (
      <ErrorState
        title="Could not load reporting workspace"
        description={getApiErrorMessage(ideasQuery.error)}
        onRetry={() => {
          void ideasQuery.refetch();
        }}
      />
    );
  }

  if (ideas.length === 0) {
    return (
      <EmptyState
        title="No ideas available"
        description="Ideas need to exist before members can submit community experience reports."
      />
    );
  }

  return (
    <section className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-[linear-gradient(135deg,rgba(236,253,245,0.96),rgba(255,251,235,0.97),rgba(255,255,255,1))] shadow-[0_30px_90px_-60px_rgba(5,150,105,0.65)]">
        <div className="grid gap-6 px-6 py-7 lg:grid-cols-[minmax(0,1.2fr)_19rem] lg:px-8 lg:py-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              <Sparkles className="size-4" />
              Experience Reporting
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950">
                Create a member-facing report that documents what changed before
                and after an idea reached the community.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                Use this workspace to connect a real-world result to an idea,
                capture challenges and measurable outcomes, and submit visual
                proof using either image uploads or hosted URLs.
              </p>
              {ideasQuery.data?.message ? (
                <p className="text-sm text-slate-500">{ideasQuery.data.message}</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-emerald-200 bg-white/80 p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Workspace Snapshot
            </p>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-700">
                  Ideas Available
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">
                  {ideas.length}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-700">
                  Selected Idea Reports
                </p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">
                  {selectedIdeaId ? recentReports.length : 0}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/85 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  Submission Mode
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {form.imageMode === "upload"
                    ? "Multipart upload"
                    : "Hosted image URLs"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {feedback ? (
        <div
          aria-live="polite"
          className={`flex items-start gap-3 rounded-[24px] border px-5 py-4 text-sm shadow-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50/90 text-emerald-800"
              : "border-red-200 bg-red-50/90 text-red-700"
          }`}
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <p>{feedback.text}</p>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <section className={`${cardClassName} p-5 sm:p-6`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Report Form
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Submit a new experience report
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Required fields are limited to the reporting essentials. The
                extra fields help reviewers understand scale, friction, and
                measurable value faster.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-slate-200"
              onClick={() => {
                resetForm({ keepIdeaId: false, keepMode: false });
                setFeedback(null);
              }}
            >
              Reset all
            </Button>
          </div>

          <form className="mt-6 space-y-6" onSubmit={(event) => void onSubmit(event)}>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_13rem]">
              <div className="space-y-2">
                <Label htmlFor="ideaId">Idea</Label>
                <select
                  id="ideaId"
                  className={selectClassName}
                  value={form.ideaId}
                  onChange={(event) => {
                    updateField("ideaId", event.target.value);
                    setFeedback(null);
                  }}
                >
                  <option value="">Select an idea</option>
                  {ideas.map((idea) => (
                    <option key={idea.id} value={idea.id}>
                      {getIdeaTitle(idea)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  placeholder="Dhaka"
                  className="h-11 rounded-2xl border-slate-200"
                  onChange={(event) => updateField("location", event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Report title</Label>
                <Input
                  id="title"
                  value={form.title}
                  placeholder="Community Composting Pilot"
                  className="h-11 rounded-2xl border-slate-200"
                  onChange={(event) => updateField("title", event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adoptedScale">Adopted scale</Label>
                <Input
                  id="adoptedScale"
                  value={form.adoptedScale}
                  placeholder="Neighborhood"
                  className="h-11 rounded-2xl border-slate-200"
                  onChange={(event) =>
                    updateField("adoptedScale", event.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <textarea
                id="summary"
                className={textareaClassName}
                placeholder="A short summary of the experience, who participated, and what changed."
                value={form.summary}
                onChange={(event) => updateField("summary", event.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="outcome">Outcome</Label>
                <textarea
                  id="outcome"
                  className={textareaClassName}
                  placeholder="Reduced organic waste by 30 percent"
                  value={form.outcome}
                  onChange={(event) => updateField("outcome", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="challenges">Challenges</Label>
                <textarea
                  id="challenges"
                  className={textareaClassName}
                  placeholder="Initial volunteer shortage"
                  value={form.challenges}
                  onChange={(event) =>
                    updateField("challenges", event.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_13rem]">
              <div className="space-y-2">
                <Label htmlFor="measurableResult">Measurable result</Label>
                <Input
                  id="measurableResult"
                  value={form.measurableResult}
                  placeholder="120kg waste diverted per month"
                  className="h-11 rounded-2xl border-slate-200"
                  onChange={(event) =>
                    updateField("measurableResult", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="effectivenessRating">Effectiveness rating</Label>
                <Input
                  id="effectivenessRating"
                  type="number"
                  min="0"
                  max="10"
                  step="1"
                  value={form.effectivenessRating}
                  className="h-11 rounded-2xl border-slate-200"
                  onChange={(event) =>
                    updateField("effectivenessRating", event.target.value)
                  }
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-emerald-100 bg-[linear-gradient(135deg,rgba(236,253,245,0.75),rgba(255,255,255,1))] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Effectiveness signal
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Give reviewers a quick 0-10 score for how effective the idea
                    felt in practice.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">
                    Current score
                  </p>
                  <p className="text-3xl font-semibold text-slate-950">
                    {form.effectivenessRating || "0"}
                  </p>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={form.effectivenessRating || "0"}
                className="mt-5 h-2 w-full cursor-pointer accent-emerald-600"
                onChange={(event) =>
                  updateField("effectivenessRating", event.target.value)
                }
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-950">
                  Before / after image source
                </p>
                <p className="text-sm text-slate-600">
                  Upload two image files for a multipart submission, or switch
                  to hosted URLs if the images are already published elsewhere.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  aria-pressed={form.imageMode === "upload"}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    form.imageMode === "upload"
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
                  }`}
                  onClick={() => updateField("imageMode", "upload")}
                >
                  <UploadCloud className="size-4" />
                  Upload files
                </button>

                <button
                  type="button"
                  aria-pressed={form.imageMode === "url"}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    form.imageMode === "url"
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
                  }`}
                  onClick={() => updateField("imageMode", "url")}
                >
                  <Link2 className="size-4" />
                  Hosted URLs
                </button>
              </div>

              {form.imageMode === "upload" ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                    <div className="space-y-1">
                      <Label htmlFor="beforeImage">Before image</Label>
                      <p className="text-xs text-slate-500">
                        Show the original condition before the idea was adopted.
                      </p>
                    </div>
                    <Input
                      key={beforeInputKey}
                      id="beforeImage"
                      type="file"
                      accept="image/*"
                      className="h-auto rounded-2xl border-dashed border-slate-300 bg-white py-3"
                      onChange={onFileChange("beforeImage")}
                    />
                    <ImagePreviewCard
                      label="Before"
                      hint="Image preview for the initial state"
                      source={beforePreviewSource}
                      fileLabel={form.beforeImage?.name}
                    />
                  </div>

                  <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                    <div className="space-y-1">
                      <Label htmlFor="afterImage">After image</Label>
                      <p className="text-xs text-slate-500">
                        Show the visible outcome after the implementation phase.
                      </p>
                    </div>
                    <Input
                      key={afterInputKey}
                      id="afterImage"
                      type="file"
                      accept="image/*"
                      className="h-auto rounded-2xl border-dashed border-slate-300 bg-white py-3"
                      onChange={onFileChange("afterImage")}
                    />
                    <ImagePreviewCard
                      label="After"
                      hint="Image preview for the resulting state"
                      source={afterPreviewSource}
                      fileLabel={form.afterImage?.name}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                    <div className="space-y-1">
                      <Label htmlFor="beforeImageUrl">Before image URL</Label>
                      <p className="text-xs text-slate-500">
                        Paste the hosted image URL for the pre-adoption state.
                      </p>
                    </div>
                    <Input
                      id="beforeImageUrl"
                      type="url"
                      value={form.beforeImageUrl}
                      placeholder="https://example.com/reports/before.jpg"
                      className="h-11 rounded-2xl border-slate-200 bg-white"
                      onChange={(event) =>
                        updateField("beforeImageUrl", event.target.value)
                      }
                    />
                    <ImagePreviewCard
                      label="Before"
                      hint="URL-based preview for the initial state"
                      source={beforePreviewSource}
                    />
                  </div>

                  <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                    <div className="space-y-1">
                      <Label htmlFor="afterImageUrl">After image URL</Label>
                      <p className="text-xs text-slate-500">
                        Paste the hosted image URL for the post-adoption state.
                      </p>
                    </div>
                    <Input
                      id="afterImageUrl"
                      type="url"
                      value={form.afterImageUrl}
                      placeholder="https://example.com/reports/after.jpg"
                      className="h-11 rounded-2xl border-slate-200 bg-white"
                      onChange={(event) =>
                        updateField("afterImageUrl", event.target.value)
                      }
                    />
                    <ImagePreviewCard
                      label="After"
                      hint="URL-based preview for the resulting state"
                      source={afterPreviewSource}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-slate-500">
                File mode sends multipart data with `beforeImage`, `afterImage`,
                and a JSON `data` field. URL mode sends a regular JSON request.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl border-slate-200"
                  onClick={() => {
                    resetForm();
                    setFeedback(null);
                  }}
                >
                  Clear fields
                </Button>
                <Button
                  type="submit"
                  className="rounded-2xl bg-emerald-600 px-5 text-white hover:bg-emerald-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Create experience report"}
                </Button>
              </div>
            </div>
          </form>
        </section>

        <div className="space-y-6">
          <section className={`${cardClassName} p-5 sm:p-6`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Selected Idea
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                  Context before submission
                </h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full border-slate-200"
                onClick={() => {
                  void detailsQuery.refetch();
                  void reportsQuery.refetch();
                }}
                disabled={!selectedIdeaId}
              >
                <RefreshCw className="size-4" />
                Refresh
              </Button>
            </div>

            {!selectedIdeaId ? (
              <div className="mt-5 rounded-[24px] border border-dashed border-slate-300 bg-slate-50/80 p-5">
                <p className="text-sm font-medium text-slate-800">No idea selected yet</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Pick an idea from the form to view its summary and any
                  existing community reports tied to it.
                </p>
              </div>
            ) : detailsQuery.isPending && !selectedIdea ? (
              <LoadingState
                className="mt-5 rounded-[24px] border-slate-200"
                title="Loading selected idea"
                description="Fetching the latest idea details."
                rows={3}
              />
            ) : detailsQuery.isError && !selectedIdea ? (
              <ErrorState
                className="mt-5 rounded-[24px]"
                title="Could not load selected idea"
                description={getApiErrorMessage(detailsQuery.error)}
                onRetry={() => {
                  void detailsQuery.refetch();
                }}
              />
            ) : selectedIdea ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {getIdeaTitle(selectedIdea)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {getIdeaSummary(selectedIdea)}
                      </p>
                    </div>
                    <span className="rounded-full border border-white bg-white px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm">
                      {formatLabel(selectedIdea.status, "Unknown")}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/85 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Category
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {selectedIdea.category?.name ?? "Uncategorized"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/85 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Access Type
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {formatLabel(selectedIdea.accessType, "Unknown")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/85 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Author
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {selectedIdea.author?.name ?? "Unknown"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/85 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Updated
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {formatDate(selectedIdea.updatedAt)}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/idea/${selectedIdea.id}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-800"
                >
                  <MapPin className="size-4" />
                  Open this idea in the public view
                </Link>
              </div>
            ) : null}
          </section>

          <section className={`${cardClassName} p-5 sm:p-6`}>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Existing Reports
              </p>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                Recent experience reports for this idea
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Reviewing the latest submissions helps avoid duplicate titles and
                gives you a sense of what community evidence already exists.
              </p>
            </div>

            {!selectedIdeaId ? (
              <div className="mt-5 rounded-[24px] border border-dashed border-slate-300 bg-slate-50/80 p-5">
                <p className="text-sm text-slate-600">
                  Choose an idea to view related experience reports.
                </p>
              </div>
            ) : reportsQuery.isPending ? (
              <LoadingState
                className="mt-5 rounded-[24px] border-slate-200"
                title="Loading related reports"
                description="Fetching report history for the selected idea."
                rows={3}
              />
            ) : reportsQuery.isError ? (
              <ErrorState
                className="mt-5 rounded-[24px]"
                title="Could not load related reports"
                description={getApiErrorMessage(reportsQuery.error)}
                onRetry={() => {
                  void reportsQuery.refetch();
                }}
              />
            ) : recentReports.length === 0 ? (
              <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50/80 p-5">
                <p className="text-sm font-medium text-amber-900">
                  No experience reports found for this idea yet.
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-800/80">
                  Your submission will become the first community report linked
                  to this idea after review.
                </p>
              </div>
            ) : (
              <ul className="mt-5 space-y-3">
                {recentReports.slice(0, 4).map((report) => (
                  <li
                    key={report.id}
                    className="rounded-[24px] border border-slate-200 bg-slate-50/85 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {getExperienceReportTitle(report)}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {hasText(report.summary)
                            ? report.summary!.trim()
                            : "No summary was provided for this report."}
                        </p>
                      </div>
                      <span className="rounded-full border border-white bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                        {formatLabel(report.status, "Needs review")}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">
                        Created {formatDate(report.createdAt)}
                      </span>
                      {report.isFeatured === true ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">
                          Featured
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`${cardClassName} overflow-hidden`}>
            <div className="border-b border-emerald-100 bg-[linear-gradient(135deg,rgba(236,253,245,0.8),rgba(255,255,255,1))] px-5 py-4 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Submission Checklist
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                What reviewers expect
              </h2>
            </div>

            <div className="space-y-3 px-5 py-5 sm:px-6">
              {[
                "Pick the exact idea record the report belongs to before filling the rest of the form.",
                "Use a concrete summary, outcome, and measurable result so the report is reviewable without follow-up.",
                "Keep the before and after images visually comparable when you use multipart upload mode.",
                "Use hosted image URLs only when the files are already published and stable.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex rounded-full bg-emerald-100 p-1 text-emerald-700">
                    <CheckCircle2 className="size-3.5" />
                  </span>
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

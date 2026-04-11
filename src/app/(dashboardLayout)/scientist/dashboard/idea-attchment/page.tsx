"use client";

import { useQuery } from "@tanstack/react-query";
import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIdeaByIdQuery, useIdeasQuery } from "@/features/idea";
import { httpClient } from "@/lib/axios/httpClient";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import type { Idea } from "@/services/idea.service";
import { userService } from "@/services/user.service";

type Feedback = {
  type: "success" | "error";
  text: string;
};

type Mode = "upload" | "manage";

type AttachmentFormState = {
  file: File | null;
  title: string;
};

type MediaFormState = {
  mode: "file" | "url";
  file: File | null;
  url: string;
  type: "IMAGE" | "VIDEO";
  altText: string;
  caption: string;
  sortOrder: string;
  isPrimary: boolean;
};

type AttachmentItem = {
  id: string;
  title?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSizeBytes?: number;
  createdAt?: string;
};

type MediaItem = {
  id: string;
  url: string;
  type?: string;
  altText?: string;
  caption?: string;
  sortOrder?: number;
  isPrimary?: boolean;
  createdAt?: string;
};

const textareaClassName =
  "min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50";

const initialAttachmentForm: AttachmentFormState = {
  file: null,
  title: "",
};

const initialMediaForm: MediaFormState = {
  mode: "file",
  file: null,
  url: "",
  type: "IMAGE",
  altText: "",
  caption: "",
  sortOrder: "0",
  isPrimary: false,
};

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toStringValue(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
}

function toNumberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toBooleanValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function getIdeaTitle(idea: Idea) {
  return hasText(idea.title) ? idea.title!.trim() : "Untitled idea";
}

function formatDate(value?: string) {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleString();
}

function formatBytes(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return "N/A";
  }

  if (value < 1024) return `${value} B`;
  const kb = value / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function parseSortOrder(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 0) return null;

  return parsed;
}

function extractAttachments(idea: Idea | null): AttachmentItem[] {
  if (!idea) return [];

  const raw = (idea as { attachments?: unknown }).attachments;
  if (!Array.isArray(raw)) return [];

  return raw.reduce<AttachmentItem[]>((items, entry) => {
      const record = toRecord(entry);
      if (!record) return items;

      const id = toStringValue(record.id);
      if (!id) return items;

      items.push({
        id,
        title: toStringValue(record.title),
        fileUrl: toStringValue(record.fileUrl),
        fileName: toStringValue(record.fileName),
        fileType: toStringValue(record.fileType),
        fileSizeBytes: toNumberValue(record.fileSizeBytes),
        createdAt: toStringValue(record.createdAt),
      });

      return items;
    }, []);
}

function extractMedia(idea: Idea | null): MediaItem[] {
  if (!idea) return [];

  const raw = (idea as { media?: unknown }).media;
  if (!Array.isArray(raw)) return [];

  return raw.reduce<MediaItem[]>((items, entry) => {
      const record = toRecord(entry);
      if (!record) return items;

      const id = toStringValue(record.id);
      const url = toStringValue(record.url);
      if (!id || !url) return items;

      items.push({
        id,
        url,
        type: toStringValue(record.type),
        altText: toStringValue(record.altText),
        caption: toStringValue(record.caption),
        sortOrder: toNumberValue(record.sortOrder),
        isPrimary: toBooleanValue(record.isPrimary),
        createdAt: toStringValue(record.createdAt),
      });

      return items;
    }, []);
}

export default function IdeaAttachmentPage() {
  const meQuery = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => userService.getMe(),
  });
  const ideasQuery = useIdeasQuery();

  const [mode, setMode] = useState<Mode>("upload");
  const [selectedIdeaId, setSelectedIdeaId] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [attachmentForm, setAttachmentForm] = useState(initialAttachmentForm);
  const [mediaForm, setMediaForm] = useState(initialMediaForm);
  const [attachmentInputKey, setAttachmentInputKey] = useState(0);
  const [mediaInputKey, setMediaInputKey] = useState(0);

  const [isAttachmentSubmitting, setIsAttachmentSubmitting] = useState(false);
  const [isMediaSubmitting, setIsMediaSubmitting] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(
    null,
  );
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);

  const detailsQuery = useIdeaByIdQuery(selectedIdeaId);

  const userId = meQuery.data?.data?.id ?? "";
  const ideas = ideasQuery.data?.data ?? [];
  const selectedIdea = detailsQuery.data?.data ?? null;

  const scopedIdeas = useMemo(() => {
    if (!userId) return ideas;

    const ownedIdeas = ideas.filter(
      (idea) => idea.authorId === userId || idea.author?.id === userId,
    );

    return ownedIdeas.length > 0 ? ownedIdeas : ideas;
  }, [ideas, userId]);

  const attachments = useMemo(() => extractAttachments(selectedIdea), [selectedIdea]);
  const mediaItems = useMemo(() => extractMedia(selectedIdea), [selectedIdea]);

  const onMediaFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setMediaForm((previous) => ({
      ...previous,
      file,
    }));
  };

  const refreshIdeaData = async () => {
    await Promise.all([
      ideasQuery.refetch(),
      selectedIdeaId ? detailsQuery.refetch() : Promise.resolve(),
    ]);
  };

  const onAttachmentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!selectedIdeaId) {
      setFeedback({ type: "error", text: "Select an idea first." });
      return;
    }

    if (!attachmentForm.file) {
      setFeedback({ type: "error", text: "Select an attachment file first." });
      return;
    }

    const formData = new FormData();
    formData.append("file", attachmentForm.file);
    if (hasText(attachmentForm.title)) {
      formData.append("title", attachmentForm.title.trim());
    }

    setIsAttachmentSubmitting(true);

    try {
      const response = await httpClient.post<unknown>(
        `/ideas/${encodeURIComponent(selectedIdeaId)}/attachments`,
        formData,
      );

      setFeedback({
        type: "success",
        text: response.message || "Attachment uploaded successfully.",
      });
      setAttachmentForm(initialAttachmentForm);
      setAttachmentInputKey((previous) => previous + 1);
      await refreshIdeaData();
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsAttachmentSubmitting(false);
    }
  };

  const onMediaSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!selectedIdeaId) {
      setFeedback({ type: "error", text: "Select an idea first." });
      return;
    }

    const sortOrder = parseSortOrder(mediaForm.sortOrder);

    if (sortOrder === null) {
      setFeedback({
        type: "error",
        text: "sortOrder must be a non-negative integer.",
      });
      return;
    }

    const optionalData: Record<string, unknown> = {};

    if (hasText(mediaForm.altText)) optionalData.altText = mediaForm.altText.trim();
    if (hasText(mediaForm.caption)) optionalData.caption = mediaForm.caption.trim();
    if (typeof sortOrder === "number") optionalData.sortOrder = sortOrder;
    if (mediaForm.isPrimary) optionalData.isPrimary = true;

    setIsMediaSubmitting(true);

    try {
      if (mediaForm.mode === "file") {
        if (!mediaForm.file) {
          throw new Error("Select a media file first.");
        }

        const formData = new FormData();
        formData.append("file", mediaForm.file);
        formData.append("data", JSON.stringify(optionalData));

        await httpClient.post<unknown>(
          `/ideas/${encodeURIComponent(selectedIdeaId)}/media`,
          formData,
        );
      } else {
        if (!hasText(mediaForm.url)) {
          throw new Error("URL is required for media URL flow.");
        }

        await httpClient.post<unknown>(
          `/ideas/${encodeURIComponent(selectedIdeaId)}/media`,
          {
            url: mediaForm.url.trim(),
            type: mediaForm.type,
            ...optionalData,
          },
        );
      }

      setFeedback({ type: "success", text: "Media uploaded successfully." });
      setMediaForm((previous) => ({ ...initialMediaForm, mode: previous.mode }));
      setMediaInputKey((previous) => previous + 1);
      await refreshIdeaData();
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsMediaSubmitting(false);
    }
  };

  const onDeleteAttachment = async (attachmentId: string) => {
    if (!selectedIdeaId) {
      setFeedback({ type: "error", text: "Select an idea first." });
      return;
    }

    if (!window.confirm("Delete this attachment?")) return;

    setDeletingAttachmentId(attachmentId);
    setFeedback(null);

    try {
      const response = await httpClient.delete<unknown>(
        `/ideas/${encodeURIComponent(selectedIdeaId)}/attachments/${encodeURIComponent(attachmentId)}`,
      );

      setFeedback({
        type: "success",
        text: response.message || "Attachment deleted successfully.",
      });
      await refreshIdeaData();
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  const onDeleteMedia = async (mediaId: string) => {
    if (!selectedIdeaId) {
      setFeedback({ type: "error", text: "Select an idea first." });
      return;
    }

    if (!window.confirm("Delete this media item?")) return;

    setDeletingMediaId(mediaId);
    setFeedback(null);

    try {
      const response = await httpClient.delete<unknown>(
        `/ideas/${encodeURIComponent(selectedIdeaId)}/media/${encodeURIComponent(mediaId)}`,
      );

      setFeedback({
        type: "success",
        text: response.message || "Media deleted successfully.",
      });
      await refreshIdeaData();
    } catch (error) {
      setFeedback({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setDeletingMediaId(null);
    }
  };

  if (meQuery.isPending || ideasQuery.isPending) {
    return (
      <LoadingState
        title="Loading Attachment Workspace"
        description="Fetching ideas and profile context."
        rows={4}
      />
    );
  }

  if (meQuery.isError || ideasQuery.isError) {
    return (
      <ErrorState
        title="Could not load attachment workspace"
        description={getApiErrorMessage(meQuery.error ?? ideasQuery.error)}
        onRetry={() => {
          void meQuery.refetch();
          void ideasQuery.refetch();
        }}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Idea Attachment & Media Workspace</h2>
        <p className="text-sm text-muted-foreground">
          Upload or manage attachment/media items for selected ideas.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-md border px-3 py-1.5 text-sm ${
            mode === "upload"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-white text-slate-700"
          }`}
          onClick={() => setMode("upload")}
        >
          Upload Mode
        </button>
        <button
          type="button"
          className={`rounded-md border px-3 py-1.5 text-sm ${
            mode === "manage"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-white text-slate-700"
          }`}
          onClick={() => setMode("manage")}
        >
          Manage Mode
        </button>
        <Button type="button" variant="outline" onClick={() => void refreshIdeaData()}>
          Refresh
        </Button>
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

      {scopedIdeas.length === 0 ? (
        <EmptyState
          title="No ideas found"
          description="Create an idea first, then upload files or media."
        />
      ) : (
        <>
          <section className="rounded-xl border bg-background p-5">
            <div className="space-y-2">
              <Label htmlFor="ideaId">Idea</Label>
              <select
                id="ideaId"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                value={selectedIdeaId}
                onChange={(event) => {
                  setSelectedIdeaId(event.target.value);
                  setFeedback(null);
                }}
              >
                <option value="">Select an idea</option>
                {scopedIdeas.map((idea) => (
                  <option key={idea.id} value={idea.id}>
                    {getIdeaTitle(idea)}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {mode === "upload" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-xl border bg-background p-5">
                <h3 className="mb-3 text-lg font-semibold">Add Attachment</h3>
                <form className="space-y-4" onSubmit={(event) => void onAttachmentSubmit(event)}>
                  <div className="space-y-2">
                    <Label htmlFor="attachmentTitle">Title (optional)</Label>
                    <Input
                      id="attachmentTitle"
                      value={attachmentForm.title}
                      onChange={(event) =>
                        setAttachmentForm((previous) => ({
                          ...previous,
                          title: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attachmentFile">File</Label>
                    <Input
                      key={attachmentInputKey}
                      id="attachmentFile"
                      type="file"
                      onChange={(event) => {
                        const file = (event as ChangeEvent<HTMLInputElement>).target.files?.[0] ?? null;
                        setAttachmentForm((previous) => ({ ...previous, file }));
                      }}
                    />
                  </div>

                  <Button type="submit" disabled={isAttachmentSubmitting}>
                    {isAttachmentSubmitting ? "Uploading..." : "Upload Attachment"}
                  </Button>
                </form>
              </section>

              <section className="rounded-xl border bg-background p-5">
                <h3 className="mb-3 text-lg font-semibold">Add Media</h3>
                <form className="space-y-4" onSubmit={(event) => void onMediaSubmit(event)}>
                  <div className="space-y-2">
                    <Label htmlFor="mediaMode">Flow</Label>
                    <select
                      id="mediaMode"
                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none"
                      value={mediaForm.mode}
                      onChange={(event) =>
                        setMediaForm((previous) => ({
                          ...previous,
                          mode: event.target.value === "url" ? "url" : "file",
                        }))
                      }
                    >
                      <option value="file">File Upload (file + data)</option>
                      <option value="url">URL Upload (url + type)</option>
                    </select>
                  </div>

                  {mediaForm.mode === "file" ? (
                    <div className="space-y-2">
                      <Label htmlFor="mediaFile">File</Label>
                      <Input
                        key={mediaInputKey}
                        id="mediaFile"
                        type="file"
                        accept="image/*,video/*"
                        onChange={onMediaFileChange}
                      />
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        id="mediaUrl"
                        placeholder="https://example.com/image.jpg"
                        value={mediaForm.url}
                        onChange={(event) =>
                          setMediaForm((previous) => ({
                            ...previous,
                            url: event.target.value,
                          }))
                        }
                      />
                      <select
                        id="mediaType"
                        className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                        value={mediaForm.type}
                        onChange={(event) =>
                          setMediaForm((previous) => ({
                            ...previous,
                            type: event.target.value === "VIDEO" ? "VIDEO" : "IMAGE",
                          }))
                        }
                      >
                        <option value="IMAGE">IMAGE</option>
                        <option value="VIDEO">VIDEO</option>
                      </select>
                    </div>
                  )}

                  <Input
                    id="mediaAltText"
                    placeholder="Alt text"
                    value={mediaForm.altText}
                    onChange={(event) =>
                      setMediaForm((previous) => ({
                        ...previous,
                        altText: event.target.value,
                      }))
                    }
                  />

                  <textarea
                    id="mediaCaption"
                    rows={3}
                    className={textareaClassName}
                    placeholder="Caption"
                    value={mediaForm.caption}
                    onChange={(event) =>
                      setMediaForm((previous) => ({
                        ...previous,
                        caption: event.target.value,
                      }))
                    }
                  />

                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      id="mediaSortOrder"
                      type="number"
                      min="0"
                      step="1"
                      value={mediaForm.sortOrder}
                      onChange={(event) =>
                        setMediaForm((previous) => ({
                          ...previous,
                          sortOrder: event.target.value,
                        }))
                      }
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={mediaForm.isPrimary}
                        onChange={(event) =>
                          setMediaForm((previous) => ({
                            ...previous,
                            isPrimary: event.target.checked,
                          }))
                        }
                      />
                      Is primary
                    </label>
                  </div>

                  <Button type="submit" disabled={isMediaSubmitting}>
                    {isMediaSubmitting ? "Uploading..." : "Upload Media"}
                  </Button>
                </form>
              </section>
            </div>
          ) : (
            <section className="space-y-4 rounded-xl border bg-background p-5">
              {!selectedIdeaId ? (
                <p className="text-sm text-muted-foreground">
                  Select an idea first to manage attachment/media.
                </p>
              ) : detailsQuery.isPending ? (
                <LoadingState
                  title="Loading selected idea"
                  description="Fetching attachment/media list."
                  rows={3}
                />
              ) : detailsQuery.isError ? (
                <ErrorState
                  title="Could not load selected idea"
                  description={getApiErrorMessage(detailsQuery.error)}
                  onRetry={() => void detailsQuery.refetch()}
                />
              ) : (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border bg-slate-50 p-3 text-sm">
                      <p className="text-slate-600">Attachments</p>
                      <p className="text-xl font-semibold">{attachments.length}</p>
                    </div>
                    <div className="rounded-md border bg-slate-50 p-3 text-sm">
                      <p className="text-slate-600">Media</p>
                      <p className="text-xl font-semibold">{mediaItems.length}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Attachment List</h3>
                    {attachments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No attachments found.</p>
                    ) : (
                      <ul className="space-y-2">
                        {attachments.map((item) => (
                          <li key={item.id} className="rounded-md border p-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="space-y-1 text-sm">
                                <p className="font-medium">
                                  {item.title || item.fileName || "Attachment"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Type: {item.fileType ?? "N/A"} | Size: {formatBytes(item.fileSizeBytes)} | Added: {formatDate(item.createdAt)}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {item.fileUrl ? (
                                  <a
                                    href={item.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-md border px-2 py-1 text-xs"
                                  >
                                    Open
                                  </a>
                                ) : null}
                                <Button
                                  type="button"
                                  variant="destructive"
                                  disabled={deletingAttachmentId === item.id}
                                  onClick={() => void onDeleteAttachment(item.id)}
                                >
                                  {deletingAttachmentId === item.id ? "Deleting..." : "Delete"}
                                </Button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Media List</h3>
                    {mediaItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No media found.</p>
                    ) : (
                      <ul className="space-y-2">
                        {mediaItems.map((item) => (
                          <li key={item.id} className="rounded-md border p-3">
                            <div className="grid gap-3 md:grid-cols-[100px_1fr]">
                              <div className="overflow-hidden rounded-md border bg-slate-50">
                                {(item.type ?? "").toUpperCase() === "VIDEO" ? (
                                  <video className="h-20 w-full object-cover" src={item.url} />
                                ) : (
                                  <img
                                    className="h-20 w-full object-cover"
                                    src={item.url}
                                    alt={item.altText ?? "Idea media"}
                                  />
                                )}
                              </div>
                              <div className="space-y-1 text-sm">
                                <p className="font-medium">{item.caption || item.altText || "Media item"}</p>
                                <p className="text-xs text-muted-foreground">
                                  Type: {item.type ?? "N/A"} | Sort: {typeof item.sortOrder === "number" ? item.sortOrder : "N/A"} | Primary: {item.isPrimary ? "Yes" : "No"}
                                </p>
                                <p className="text-xs text-muted-foreground">Added: {formatDate(item.createdAt)}</p>
                                <div className="flex gap-2">
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-md border px-2 py-1 text-xs"
                                  >
                                    Open
                                  </a>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    disabled={deletingMediaId === item.id}
                                    onClick={() => void onDeleteMedia(item.id)}
                                  >
                                    {deletingMediaId === item.id ? "Deleting..." : "Delete"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </section>
          )}
        </>
      )}
    </section>
  );
}

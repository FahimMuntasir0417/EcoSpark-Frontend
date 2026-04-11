"use client";

import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  Bookmark,
  Lock,
  Pencil,
  Reply,
  Send,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/data-state";
import { getMyPurchasesQueryOptions } from "@/features/commerce";
import { useIdeaByIdQuery } from "@/features/idea";
import {
  getIdeaCommentsQueryOptions,
  getMyBookmarksQueryOptions,
  useBookmarkIdeaMutation,
  useCommentRepliesQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useRemoveBookmarkMutation,
  useRemoveVoteMutation,
  useReplyToCommentMutation,
  useUpdateCommentMutation,
  useUpdateVoteMutation,
  useVoteIdeaMutation,
} from "@/features/interaction";
import {
  getCurrentPurchaseForIdea,
  isPaidIdeaAccessType,
} from "@/features/commerce/utils/purchase-access";
import { normalizeUserRole, type UserRole } from "@/lib/authUtils";
import { getApiErrorMessage, normalizeApiError } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import type {
  Bookmark as BookmarkRecord,
  Comment,
} from "@/services/interaction.service";
import type { Idea } from "@/services/idea.service";
import { userService } from "@/services/user.service";
import { IdeaPurchasePanel } from "./idea-purchase-panel";

type VoteType = "UP" | "DOWN";

type Feedback = {
  type: "success" | "error";
  text: string;
} | null;

type IdeaDetailClientProps = {
  ideaId: string;
  isAuthenticated: boolean;
  role: UserRole | null;
};

type CommentThreadItemProps = {
  comment: Comment;
  viewerId: string;
  isAuthenticated: boolean;
  isIdeaInteractive: boolean;
  depth?: number;
  onFeedback: (feedback: Feedback) => void;
};

type FieldRecord = Record<string, unknown>;

const LONG_TEXT_FIELD_CONFIG = [
  { key: "excerpt", title: "Excerpt" },
  { key: "problemStatement", title: "Problem statement" },
  { key: "proposedSolution", title: "Proposed solution" },
  { key: "description", title: "Description" },
  { key: "implementationSteps", title: "Implementation steps" },
  { key: "risksAndChallenges", title: "Risks and challenges" },
  { key: "requiredResources", title: "Required resources" },
  { key: "expectedBenefits", title: "Expected benefits" },
  { key: "targetAudience", title: "Target audience" },
  { key: "rejectionFeedback", title: "Rejection feedback" },
  { key: "adminNote", title: "Admin note" },
  { key: "seoTitle", title: "SEO title" },
  { key: "seoDescription", title: "SEO description" },
] as const;

function hasText(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function formatText(value?: string | null, fallback = "Not provided") {
  return hasText(value) ? value!.trim() : fallback;
}

function formatDate(value?: string | null, fallback = "Not recorded") {
  if (!hasText(value)) {
    return fallback;
  }

  const parsed = new Date(value!);

  if (Number.isNaN(parsed.getTime())) {
    return "Invalid date";
  }

  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMetric(
  value: number | string | null | undefined,
  suffix = "",
  fallback = "N/A",
) {
  const numericValue =
    typeof value === "string" ? Number.parseFloat(value) : value;

  if (typeof numericValue !== "number" || !Number.isFinite(numericValue)) {
    return fallback;
  }

  return `${numericValue.toLocaleString()}${suffix}`;
}

function formatBoolean(value: boolean | null | undefined, fallback = "Not provided") {
  if (typeof value !== "boolean") {
    return fallback;
  }

  return value ? "Yes" : "No";
}

function formatCurrency(
  value: number | string | null | undefined,
  currency?: string | null,
  fallback = "Not provided",
) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numericValue =
    typeof value === "string" ? Number.parseFloat(value) : value;

  if (typeof numericValue !== "number" || !Number.isFinite(numericValue)) {
    return typeof value === "string" ? value : fallback;
  }

  const resolvedCurrency = hasText(currency) ? currency!.trim().toUpperCase() : "USD";

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: resolvedCurrency,
      maximumFractionDigits: 2,
    }).format(numericValue);
  } catch {
    return `${numericValue.toLocaleString()} ${resolvedCurrency}`;
  }
}

function formatFieldLabel(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function isDateFieldKey(key: string) {
  return /(?:^|_)(?:created|updated|submitted|reviewed|published|featured|archived|deleted|lastActivity)At$/i.test(
    key,
  );
}

function isUrlFieldKey(key: string) {
  return /(?:Url|Image)$/i.test(key);
}

function isHiddenFieldKey(key: string) {
  return key === "id" || key.endsWith("Id") || key === "createdAt";
}

function getObjectRecord(value: unknown): FieldRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as FieldRecord)
    : null;
}

function hasAvailableValue(value: unknown) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "boolean") {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "object") {
    return Object.keys(value as FieldRecord).length > 0;
  }

  return true;
}

function isDisplayableFieldValue(value: unknown) {
  return hasAvailableValue(value) && !Array.isArray(value) && typeof value !== "object";
}

function getRecordArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as FieldRecord[];
  }

  return value.filter(
    (item): item is FieldRecord =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function isImageUrl(
  key: string,
  value: string,
  record?: FieldRecord,
) {
  const mimeType =
    typeof record?.mimeType === "string" ? record.mimeType : "";
  const fileType =
    typeof record?.fileType === "string" ? record.fileType : "";
  const mediaType = typeof record?.type === "string" ? record.type : "";

  return (
    /image/i.test(key) ||
    /image/i.test(mimeType) ||
    /image/i.test(fileType) ||
    mediaType === "IMAGE" ||
    /\.(png|jpe?g|gif|webp|avif|svg)(?:[?#].*)?$/i.test(value)
  );
}

function isVideoUrl(
  key: string,
  value: string,
  record?: FieldRecord,
) {
  const mimeType =
    typeof record?.mimeType === "string" ? record.mimeType : "";
  const fileType =
    typeof record?.fileType === "string" ? record.fileType : "";
  const mediaType = typeof record?.type === "string" ? record.type : "";

  return (
    /video/i.test(key) ||
    /video/i.test(mimeType) ||
    /video/i.test(fileType) ||
    mediaType === "VIDEO" ||
    /\.(mp4|webm|ogg|mov|m4v)(?:[?#].*)?$/i.test(value)
  );
}

function getUrlLabel(key: string, record?: FieldRecord) {
  const candidates = [
    record?.title,
    record?.fileName,
    record?.caption,
    record?.altText,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return formatFieldLabel(key);
}

function renderFieldValue(
  key: string,
  value: unknown,
  record?: FieldRecord,
): ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400">Not provided</span>;
  }

  if (typeof value === "boolean") {
    return formatBoolean(value);
  }

  if (key === "price") {
    return formatCurrency(
      typeof value === "number" || typeof value === "string" ? value : null,
      typeof record?.currency === "string" ? record.currency : null,
    );
  }

  if (
    key === "status" ||
    key === "visibility" ||
    key === "accessType" ||
    key === "role"
  ) {
    return typeof value === "string" ? formatBadgeLabel(value) : String(value);
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toLocaleString() : String(value);
  }

  if (typeof value === "string") {
    if (isDateFieldKey(key)) {
      return formatDate(value);
    }

    if (isUrlFieldKey(key) && hasText(value)) {
      const label = getUrlLabel(key, record);

      if (isImageUrl(key, value, record)) {
        return (
          <div className="space-y-3">
            <img
              src={value}
              alt={label}
              className="h-48 w-full rounded-2xl border border-slate-200 object-cover"
            />
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
            >
              Open image
            </a>
          </div>
        );
      }

      if (isVideoUrl(key, value, record)) {
        return (
          <div className="space-y-3">
            <video
              controls
              src={value}
              className="h-48 w-full rounded-2xl border border-slate-200 bg-black object-cover"
            />
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
            >
              Open video
            </a>
          </div>
        );
      }

      return (
        <div className="space-y-3">
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
          >
            Open file
          </a>
          <p className="break-all text-sm text-slate-600">{value}</p>
        </div>
      );
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? JSON.stringify(value) : "[]";
  }

  return JSON.stringify(value);
}

function formatBadgeLabel(value?: string | null) {
  if (!hasText(value)) {
    return "Unknown";
  }

  return value!
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getIdeaTitle(idea: Idea) {
  return formatText(idea.title, "Untitled idea");
}

function getIdeaSummary(idea: Idea) {
  if (hasText(idea.excerpt)) {
    return idea.excerpt!.trim();
  }

  if (hasText(idea.description)) {
    return idea.description!.trim();
  }

  return "No summary has been added for this idea yet.";
}

function getIdeaAuthorId(idea: Idea) {
  const record = idea as unknown as Record<string, unknown>;
  const author =
    record.author && typeof record.author === "object"
      ? (record.author as Record<string, unknown>)
      : null;

  return (
    (typeof idea.authorId === "string" && idea.authorId) ||
    (author && typeof author.id === "string" && author.id) ||
    ""
  );
}

function extractCurrentVote(idea: Idea): VoteType | null {
  const record = idea as unknown as Record<string, unknown>;
  const nestedInteraction =
    record.interaction && typeof record.interaction === "object"
      ? (record.interaction as Record<string, unknown>)
      : null;
  const nestedVote =
    record.vote && typeof record.vote === "object"
      ? (record.vote as Record<string, unknown>)
      : null;

  const candidates = [
    record.myVote,
    record.userVote,
    record.viewerVote,
    record.currentUserVote,
    record.voteType,
    record.userVoteType,
    nestedInteraction?.myVote,
    nestedInteraction?.voteType,
    nestedVote?.type,
  ];

  for (const candidate of candidates) {
    if (candidate === "UP" || candidate === "DOWN") {
      return candidate;
    }
  }

  return null;
}

function getBookmarkIdeaId(bookmark: BookmarkRecord) {
  const record = bookmark as unknown as Record<string, unknown>;
  const nestedIdea =
    record.idea && typeof record.idea === "object"
      ? (record.idea as Record<string, unknown>)
      : null;

  return (
    (typeof bookmark.ideaId === "string" && bookmark.ideaId) ||
    (typeof record.ideaId === "string" && record.ideaId) ||
    (typeof record.idea_id === "string" && record.idea_id) ||
    (nestedIdea && typeof nestedIdea.id === "string" && nestedIdea.id) ||
    ""
  );
}

function getCommentOwnerId(comment: Comment) {
  const record = comment as unknown as Record<string, unknown>;
  const author =
    record.author && typeof record.author === "object"
      ? (record.author as Record<string, unknown>)
      : null;
  const user =
    record.user && typeof record.user === "object"
      ? (record.user as Record<string, unknown>)
      : null;

  return (
    (typeof record.authorId === "string" && record.authorId) ||
    (typeof record.userId === "string" && record.userId) ||
    (author && typeof author.id === "string" && author.id) ||
    (user && typeof user.id === "string" && user.id) ||
    ""
  );
}

function getCommentAuthorName(comment: Comment) {
  const record = comment as unknown as Record<string, unknown>;
  const author =
    record.author && typeof record.author === "object"
      ? (record.author as Record<string, unknown>)
      : null;
  const user =
    record.user && typeof record.user === "object"
      ? (record.user as Record<string, unknown>)
      : null;

  const candidates = [
    record.authorName,
    record.userName,
    author?.name,
    user?.name,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return "Anonymous user";
}

function getCommentTimestamp(comment: Comment) {
  const record = comment as unknown as Record<string, unknown>;
  const candidates = [record.updatedAt, record.createdAt, record.postedAt];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return formatDate(candidate);
    }
  }

  return "Time unavailable";
}

function isIdeaInteractiveStatus(
  _status?: string | null,
  _publishedAt?: string | null,
) {
  return true;
}

function getInteractionErrorMessage(
  error: unknown,
  ideaStatus?: string | null,
) {
  const normalized = normalizeApiError(error);

  if ((normalized.statusCode ?? 0) >= 500) {
    const statusCode = normalized.statusCode ?? 500;
    const statusText = hasText(ideaStatus)
      ? ` Idea status: ${formatBadgeLabel(ideaStatus)}.`
      : "";

    if (isAxiosError(error)) {
      const method =
        typeof error.config?.method === "string"
          ? error.config.method.toUpperCase()
          : "";
      const url = typeof error.config?.url === "string" ? error.config.url : "";
      const backendMessageSource = error.response?.data as
        | { message?: unknown }
        | undefined;
      const backendMessageValue = backendMessageSource?.message;
      const backendMessage = Array.isArray(backendMessageValue)
        ? backendMessageValue.join(", ")
        : typeof backendMessageValue === "string"
          ? backendMessageValue
          : "";
      const endpointText = method && url ? ` Endpoint: ${method} ${url}.` : "";
      const backendText = backendMessage ? ` Backend: ${backendMessage}.` : "";

      return `Interaction API failed (HTTP ${statusCode}).${statusText}${endpointText}${backendText} Check backend logs.`;
    }

    return `Interaction API failed (HTTP ${statusCode}).${statusText} Check backend logs.`;
  }

  return getApiErrorMessage(error);
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        tone === "accent" && "bg-sky-100 text-sky-800",
        tone === "success" && "bg-emerald-100 text-emerald-800",
        tone === "neutral" && "bg-slate-100 text-slate-700",
      )}
    >
      {children}
    </span>
  );
}

function FeedbackBanner({ feedback }: { feedback: Feedback }) {
  if (!feedback) {
    return null;
  }

  return (
    <p
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        feedback.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700",
      )}
    >
      {feedback.text}
    </p>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function DetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function FieldCard({
  fieldKey,
  value,
  record,
}: {
  fieldKey: string;
  value: unknown;
  record?: FieldRecord;
}) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {formatFieldLabel(fieldKey)}
      </p>
      <div className="mt-3 break-words whitespace-pre-wrap text-sm leading-7 text-slate-700">
        {renderFieldValue(fieldKey, value, record)}
      </div>
    </article>
  );
}

function FieldGrid({
  title,
  description,
  record,
  hiddenKeys = [],
}: {
  title: string;
  description?: string;
  record: FieldRecord;
  hiddenKeys?: string[];
}) {
  const hiddenKeySet = new Set(hiddenKeys);
  const entries = Object.entries(record).filter(
    ([key, value]) =>
      !hiddenKeySet.has(key) &&
      !isHiddenFieldKey(key) &&
      isDisplayableFieldValue(value),
  );

  if (entries.length === 0) {
    return null;
  }

  return (
    <DetailSection title={title} description={description}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {entries.map(([key, value]) => (
          <FieldCard
            key={key}
            fieldKey={key}
            value={value}
            record={record}
          />
        ))}
      </div>
    </DetailSection>
  );
}

function RecordCollectionSection({
  title,
  description,
  itemLabel,
  items,
}: {
  title: string;
  description?: string;
  itemLabel: string;
  items: FieldRecord[];
}) {
  const visibleItems = items
    .map((item) => ({
      item,
      entries: Object.entries(item).filter(
        ([key, value]) =>
          !isHiddenFieldKey(key) && isDisplayableFieldValue(value),
      ),
    }))
    .filter(({ entries }) => entries.length > 0);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <DetailSection title={title} description={description}>
      <div className="space-y-4">
        {visibleItems.map(({ item, entries }, index) => {
          const itemKey =
            typeof item.id === "string" && item.id
              ? item.id
              : `${itemLabel}-${index + 1}`;

          return (
            <article
              key={itemKey}
              className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-slate-950">
                  {itemLabel} {index + 1}
                </p>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {entries.map(([key, value]) => (
                  <FieldCard
                    key={key}
                    fieldKey={key}
                    value={value}
                    record={item}
                  />
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </DetailSection>
  );
}

function ActionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <Icon className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function GuestPrompt({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}
function CommentThreadItem({
  comment,
  viewerId,
  isAuthenticated,
  isIdeaInteractive,
  depth = 0,
  onFeedback,
}: CommentThreadItemProps) {
  const ownerId = getCommentOwnerId(comment);
  const isOwner = Boolean(viewerId && ownerId && viewerId === ownerId);
  const canReply = isIdeaInteractive && depth < 2;

  const [isEditing, setIsEditing] = useState(false);
  const [threadOpen, setThreadOpen] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState("");

  const updateCommentMutation = useUpdateCommentMutation();
  const deleteCommentMutation = useDeleteCommentMutation();
  const replyToCommentMutation = useReplyToCommentMutation();
  const repliesQuery = useCommentRepliesQuery(threadOpen ? comment.id : "");

  const replies = (repliesQuery.data?.data ?? []).filter(
    (reply) => reply.id !== comment.id,
  );

  const onSaveEdit = async () => {
    const content = editContent.trim();

    if (!content) {
      onFeedback({ type: "error", text: "Comment content cannot be empty." });
      return;
    }

    try {
      const response = await updateCommentMutation.mutateAsync({
        id: comment.id,
        payload: { content },
      });
      setIsEditing(false);
      setEditContent(response.data.content);
      onFeedback({
        type: "success",
        text: response.message || "Comment updated successfully.",
      });
    } catch (error) {
      onFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  const onDelete = async () => {
    const confirmed = window.confirm("Delete this comment?");

    if (!confirmed) {
      return;
    }

    try {
      const response = await deleteCommentMutation.mutateAsync({
        id: comment.id,
      });
      onFeedback({
        type: "success",
        text: response.message || "Comment deleted successfully.",
      });
    } catch (error) {
      onFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  const onReply = async () => {
    const content = replyContent.trim();

    if (!content) {
      onFeedback({ type: "error", text: "Reply content cannot be empty." });
      return;
    }

    try {
      const response = await replyToCommentMutation.mutateAsync({
        id: comment.id,
        payload: { content },
      });
      setReplyContent("");
      setThreadOpen(true);
      onFeedback({
        type: "success",
        text: response.message || "Reply submitted successfully.",
      });
    } catch (error) {
      onFeedback({ type: "error", text: getApiErrorMessage(error) });
    }
  };

  return (
    <article
      className={cn(
        "rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm",
        depth > 0 && "bg-slate-50/70",
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-950">
              {getCommentAuthorName(comment)}
            </p>
            <Badge>{depth === 0 ? "Comment" : "Reply"}</Badge>
            {isOwner ? <Badge tone="accent">Your comment</Badge> : null}
          </div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
            {getCommentTimestamp(comment)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isAuthenticated && canReply ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setThreadOpen((open) => !open)}
            >
              <Reply className="size-4" />
              {threadOpen ? "Hide thread" : "Reply"}
            </Button>
          ) : null}

          {isOwner ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (!isEditing) {
                    setEditContent(comment.content);
                  }
                  setIsEditing((editing) => !editing);
                }}
              >
                <Pencil className="size-4" />
                {isEditing ? "Cancel edit" : "Edit"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteCommentMutation.isPending}
                onClick={() => {
                  void onDelete();
                }}
              >
                <Trash2 className="size-4" />
                {deleteCommentMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {isEditing ? (
        <div className="mt-4 space-y-3">
          <textarea
            className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-slate-400"
            value={editContent}
            onChange={(event) => setEditContent(event.target.value)}
            placeholder="Update your comment"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={updateCommentMutation.isPending}
              onClick={() => {
                void onSaveEdit();
              }}
            >
              {updateCommentMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Close
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
          {comment.content}
        </p>
      )}

      {threadOpen ? (
        <div className="mt-5 space-y-4 border-t border-slate-200 pt-5">
          {isAuthenticated && canReply ? (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-sm font-semibold text-slate-950">
                Reply to this comment
              </p>
              <textarea
                className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-slate-400"
                value={replyContent}
                onChange={(event) => setReplyContent(event.target.value)}
                placeholder="Write your reply"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={replyToCommentMutation.isPending}
                  onClick={() => {
                    void onReply();
                  }}
                >
                  <Send className="size-4" />
                  {replyToCommentMutation.isPending
                    ? "Posting..."
                    : "Post reply"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setThreadOpen(false)}
                >
                  Hide thread
                </Button>
              </div>
            </div>
          ) : null}

          {repliesQuery.isPending ? (
            <LoadingState
              rows={2}
              title="Loading replies"
              description="Fetching this comment thread."
            />
          ) : repliesQuery.isError ? (
            <ErrorState
              title="Could not load replies"
              description={getApiErrorMessage(repliesQuery.error)}
              onRetry={() => {
                void repliesQuery.refetch();
              }}
            />
          ) : replies.length === 0 ? (
            <EmptyState
              title="No replies yet"
              description="This thread does not have any replies yet."
            />
          ) : (
            <div className="space-y-3">
              {replies.map((reply) => (
                <CommentThreadItem
                  key={reply.id}
                  comment={reply}
                  viewerId={viewerId}
                  isAuthenticated={isAuthenticated}
                  isIdeaInteractive={isIdeaInteractive}
                  depth={depth + 1}
                  onFeedback={onFeedback}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}

export function IdeaDetailClient({
  ideaId,
  isAuthenticated,
  role,
}: IdeaDetailClientProps) {
  const ideaQuery = useIdeaByIdQuery(ideaId);
  const idea = ideaQuery.data?.data;
  const isPaidIdea = isPaidIdeaAccessType(idea?.accessType);
  const viewerQuery = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => userService.getMe(),
    enabled: isAuthenticated,
    retry: false,
  });
  const purchasesQuery = useQuery({
    ...getMyPurchasesQueryOptions(),
    enabled: isAuthenticated && isPaidIdea,
    retry: false,
  });

  const viewerRole = normalizeUserRole(
    typeof viewerQuery.data?.data?.role === "string"
      ? viewerQuery.data.data.role
      : null,
  );
  const effectiveRole = viewerRole ?? role;
  const viewerId = viewerQuery.data?.data?.id ?? "";
  const viewerQueryError = viewerQuery.error
    ? normalizeApiError(viewerQuery.error)
    : null;
  const purchases = purchasesQuery.data?.data ?? [];
  const currentPurchase = idea
    ? getCurrentPurchaseForIdea(purchases, idea.id)
    : null;
  const purchaseStatus =
    typeof currentPurchase?.status === "string" ? currentPurchase.status : null;
  const isPurchased = purchaseStatus === "PAID";
  const hasPendingCheckout = purchaseStatus === "PENDING";
  const ideaAuthorId = idea ? getIdeaAuthorId(idea) : "";
  const isIdeaAuthor = Boolean(
    viewerId && ideaAuthorId && viewerId === ideaAuthorId,
  );
  const hasPrivilegedAccess =
    effectiveRole === "SUPER_ADMIN" ||
    effectiveRole === "ADMIN" ||
    isIdeaAuthor;
  const canLoadProtectedData =
    Boolean(idea?.id) && (!isPaidIdea || hasPrivilegedAccess || isPurchased);
  const bookmarksQuery = useQuery({
    ...getMyBookmarksQueryOptions(),
    enabled: isAuthenticated && canLoadProtectedData,
  });
  const commentsQuery = useQuery({
    ...getIdeaCommentsQueryOptions(ideaId),
    enabled: canLoadProtectedData,
  });

  const voteIdeaMutation = useVoteIdeaMutation();
  const updateVoteMutation = useUpdateVoteMutation();
  const removeVoteMutation = useRemoveVoteMutation();
  const bookmarkIdeaMutation = useBookmarkIdeaMutation();
  const removeBookmarkMutation = useRemoveBookmarkMutation();
  const createCommentMutation = useCreateCommentMutation();

  const [interactionFeedback, setInteractionFeedback] =
    useState<Feedback>(null);
  const [commentDraft, setCommentDraft] = useState("");

  const bookmarks = bookmarksQuery.data?.data ?? [];

  if (!ideaId) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState
          title="Idea not found"
          description="No idea identifier was provided in the route."
        />
      </main>
    );
  }

  if (ideaQuery.isPending) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <LoadingState
          rows={8}
          title="Loading idea"
          description="Fetching the full idea record from the backend."
        />
      </main>
    );
  }

  if (ideaQuery.isError) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <ErrorState
          title="Could not load this idea"
          description={getApiErrorMessage(ideaQuery.error)}
          onRetry={() => {
            void ideaQuery.refetch();
          }}
        />
      </main>
    );
  }

  if (!idea) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState
          title="Idea not found"
          description="The backend returned an empty idea payload."
        />
      </main>
    );
  }

  const detectedVote = extractCurrentVote(idea);
  const currentVote = detectedVote;
  const bookmarkIdeaIds = bookmarks.map((bookmark) =>
    getBookmarkIdeaId(bookmark),
  );
  const detectedBookmark = bookmarkIdeaIds.includes(idea.id);
  const isBookmarked = detectedBookmark;
  const isIdeaInteractive = isIdeaInteractiveStatus(
    idea.status,
    idea.publishedAt,
  );
  const hasBrowserAuthIssue = Boolean(
    isAuthenticated && viewerQueryError?.statusCode === 401,
  );
  const isPurchaseStatusPending =
    isPaidIdea && isAuthenticated && purchasesQuery.isPending;
  const shouldShowPurchasePanel = isPaidIdea && !hasPrivilegedAccess;
  const hasPaidIdeaAccess =
    !isPaidIdea ||
    hasPrivilegedAccess ||
    (!isPurchaseStatusPending && !purchasesQuery.isError && isPurchased);
  const isDetailLocked = isPaidIdea && !hasPaidIdeaAccess;

  const commentRecords = commentsQuery.data?.data ?? [];
  const topLevelComments = commentRecords.filter(
    (comment) => !comment.parentId,
  );
  const visibleComments =
    topLevelComments.length > 0 ? topLevelComments : commentRecords;

  const voteBusy =
    voteIdeaMutation.isPending ||
    updateVoteMutation.isPending ||
    removeVoteMutation.isPending;
  const bookmarkBusy =
    bookmarkIdeaMutation.isPending || removeBookmarkMutation.isPending;

  const submitVote = async (nextVote: VoteType) => {
    if (!isIdeaInteractive) {
      setInteractionFeedback({
        type: "error",
        text: "This idea is not in a published state. Voting is currently unavailable.",
      });
      return;
    }

    if (hasBrowserAuthIssue) {
      setInteractionFeedback({
        type: "error",
        text: "Your browser session is out of sync. Please log out and log in again.",
      });
      return;
    }

    if (!isAuthenticated) {
      setInteractionFeedback({
        type: "error",
        text: "Log in before you vote on an idea.",
      });
      return;
    }

    try {
      if (currentVote === nextVote) {
        const response = await removeVoteMutation.mutateAsync({
          ideaId: idea.id,
        });
        setInteractionFeedback({
          type: "success",
          text: response.message || "Vote removed successfully.",
        });
        return;
      }

      if (currentVote) {
        const response = await updateVoteMutation.mutateAsync({
          ideaId: idea.id,
          payload: { type: nextVote },
        });
        setInteractionFeedback({
          type: "success",
          text: response.message || `Vote updated to ${nextVote}.`,
        });
        return;
      }

      const response = await voteIdeaMutation.mutateAsync({
        ideaId: idea.id,
        payload: { type: nextVote },
      });
      setInteractionFeedback({
        type: "success",
        text: response.message || `${nextVote} vote submitted successfully.`,
      });
    } catch (error) {
      const normalizedCreateError = normalizeApiError(error);
      const shouldAttemptUpdateFallback =
        !currentVote &&
        normalizedCreateError.statusCode !== 401 &&
        normalizedCreateError.statusCode !== 403 &&
        normalizedCreateError.statusCode !== 404;

      if (shouldAttemptUpdateFallback) {
        try {
          const fallbackResponse = await updateVoteMutation.mutateAsync({
            ideaId: idea.id,
            payload: { type: nextVote },
          });
          setInteractionFeedback({
            type: "success",
            text: fallbackResponse.message || `Vote updated to ${nextVote}.`,
          });
          return;
        } catch (fallbackError) {
          setInteractionFeedback({
            type: "error",
            text: getInteractionErrorMessage(fallbackError, idea.status),
          });
          return;
        }
      }

      setInteractionFeedback({
        type: "error",
        text: getInteractionErrorMessage(error, idea.status),
      });
    }
  };

  const toggleBookmark = async () => {
    if (!isIdeaInteractive) {
      setInteractionFeedback({
        type: "error",
        text: "This idea is not in a published state. Saving is currently unavailable.",
      });
      return;
    }

    if (hasBrowserAuthIssue) {
      setInteractionFeedback({
        type: "error",
        text: "Your browser session is out of sync. Please log out and log in again.",
      });
      return;
    }

    if (!isAuthenticated) {
      setInteractionFeedback({
        type: "error",
        text: "Log in before you save ideas.",
      });
      return;
    }

    try {
      if (isBookmarked) {
        const response = await removeBookmarkMutation.mutateAsync({
          ideaId: idea.id,
        });
        setInteractionFeedback({
          type: "success",
          text: response.message || "Bookmark removed successfully.",
        });
        return;
      }

      const response = await bookmarkIdeaMutation.mutateAsync({
        ideaId: idea.id,
      });
      setInteractionFeedback({
        type: "success",
        text: response.message || "Idea bookmarked successfully.",
      });
    } catch (error) {
      const normalizedBookmarkError = normalizeApiError(error);
      const shouldAttemptRefetchFallback =
        normalizedBookmarkError.statusCode !== 401 &&
        normalizedBookmarkError.statusCode !== 403 &&
        normalizedBookmarkError.statusCode !== 404;

      if (shouldAttemptRefetchFallback) {
        try {
          const refetched = await bookmarksQuery.refetch();
          const refreshedBookmarks = refetched.data?.data ?? [];
          const refreshedIdeaIds = refreshedBookmarks.map((bookmark) =>
            getBookmarkIdeaId(bookmark),
          );

          if (refreshedIdeaIds.includes(idea.id)) {
            setInteractionFeedback({
              type: "success",
              text: "Idea is already bookmarked.",
            });
            return;
          }
        } catch {
          // Keep original error handling below.
        }
      }

      setInteractionFeedback({
        type: "error",
        text: getInteractionErrorMessage(error, idea.status),
      });
    }
  };

  const submitComment = async () => {
    if (!isIdeaInteractive) {
      setInteractionFeedback({
        type: "error",
        text: "This idea is not in a published state. Comments are currently unavailable.",
      });
      return;
    }

    if (hasBrowserAuthIssue) {
      setInteractionFeedback({
        type: "error",
        text: "Your browser session is out of sync. Please log out and log in again.",
      });
      return;
    }

    if (!isAuthenticated) {
      setInteractionFeedback({
        type: "error",
        text: "Log in before you comment.",
      });
      return;
    }

    const content = commentDraft.trim();

    if (!content) {
      setInteractionFeedback({
        type: "error",
        text: "Comment content cannot be empty.",
      });
      return;
    }

    try {
      const response = await createCommentMutation.mutateAsync({
        ideaId: idea.id,
        payload: { content },
      });
      setCommentDraft("");
      setInteractionFeedback({
        type: "success",
        text: response.message || "Comment posted successfully.",
      });
    } catch (error) {
      setInteractionFeedback({
        type: "error",
        text: getInteractionErrorMessage(error, idea.status),
      });
    }
  };

  const lockedDetailsTitle = isPurchaseStatusPending
    ? "Checking paid access"
    : "Purchase required";
  const lockedDetailsDescription = isPurchaseStatusPending
    ? "Loading your purchase status before protected idea details are shown."
    : hasBrowserAuthIssue
      ? "Your browser session is out of sync. Log out and sign in again before opening paid idea details."
      : !isAuthenticated
        ? "Sign in and complete the purchase before opening the protected idea workspace."
        : purchasesQuery.isError
          ? "We could not verify your purchase status. Retry the purchase lookup before protected details are shown."
          : hasPendingCheckout
            ? "Your checkout is still pending. Open the payment status page or finish the payment before the full idea becomes available."
            : "This paid idea stays locked until the purchase is marked as paid.";
  const lockedStatusLabel = hasPrivilegedAccess
    ? "Owner access"
    : isPurchaseStatusPending
      ? "Checking purchase"
      : purchaseStatus
        ? formatBadgeLabel(purchaseStatus)
        : isAuthenticated
          ? "Not purchased"
          : "Login required";
  const ideaRecord = idea as unknown as FieldRecord;
  const authorRecord = getObjectRecord(idea.author);
  const categoryRecord = getObjectRecord(idea.category);
  const campaignRecord = getObjectRecord(idea.campaign);
  const mediaRecords = getRecordArray(ideaRecord.media);
  const attachmentRecords = getRecordArray(ideaRecord.attachments);
  const purchaseRecords = getRecordArray(ideaRecord.purchases);
  const bookmarkRecords = getRecordArray(ideaRecord.bookmarks);
  const experienceReportRecords = getRecordArray(ideaRecord.experienceReports);
  const tagRecords = getRecordArray(ideaRecord.tags);
  const voteRecords = getRecordArray(ideaRecord.votes);
  const availableLongTextFields = LONG_TEXT_FIELD_CONFIG.filter(({ key }) =>
    hasAvailableValue(ideaRecord[key]),
  );
  const hiddenIdeaFieldKeys = [
    ...LONG_TEXT_FIELD_CONFIG.map((field) => field.key),
    "author",
    "category",
    "campaign",
    "media",
    "attachments",
    "purchases",
    "bookmarks",
    "experienceReports",
    "tags",
    "votes",
  ];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/idea"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
        >
          <ArrowLeft className="size-4" />
          Back to ideas
        </Link>

        <div className="flex flex-wrap gap-2">
          <Badge tone="success">{formatBadgeLabel(idea.status)}</Badge>
          <Badge>{formatBadgeLabel(idea.visibility)}</Badge>
          <Badge>{formatBadgeLabel(idea.accessType)}</Badge>
        </div>
      </div>

      <section className="overflow-hidden bg-red-400 rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_70px_-40px_rgba(15,23,42,0.35)]">
        <div className="grid gap-0 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="relative min-h-72 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_40%,#0ea5e9_100%)]">
            {hasText(idea.coverImageUrl) ? (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-80"
                style={{ backgroundImage: `url(${idea.coverImageUrl})` }}
              />
            ) : null}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.12),rgba(15,23,42,0.85))]" />
            <div className="relative flex h-full flex-col justify-end p-6 text-white">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-200">
                {idea.category?.name ?? "Uncategorized"}
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
                {getIdeaTitle(idea)}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200">
                {getIdeaSummary(idea)}
              </p>
            </div>
          </div>

          <div className="space-y-6 p-6 lg:p-8">
            {isDetailLocked ? (
              <>
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                      <Lock className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Protected detail page
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-slate-950">
                        {lockedDetailsTitle}
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {lockedDetailsDescription}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard
                    label="Access"
                    value={formatBadgeLabel(idea.accessType)}
                  />
                  <StatCard label="Purchase" value={lockedStatusLabel} />
                  <StatCard
                    label="Viewer"
                    value={
                      hasPrivilegedAccess
                        ? "Privileged"
                        : isAuthenticated
                          ? "Signed in"
                          : "Guest"
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap gap-3">
                  <StatCard
                    label="Author"
                    value={formatText(idea.author?.name, "Unknown author")}
                  />
                  <StatCard
                    label="Category"
                    value={formatText(idea.category?.name, "Uncategorized")}
                  />
                  <StatCard
                    label="Last activity"
                    value={formatDate(idea.lastActivityAt, "Not recorded")}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  <StatCard
                    label="Views"
                    value={formatMetric(idea.totalViews)}
                  />
                  <StatCard
                    label="Impact"
                    value={formatMetric(idea.impactScore)}
                  />
                  <StatCard
                    label="Eco score"
                    value={formatMetric(idea.ecoScore)}
                  />
                  <StatCard
                    label="Comments"
                    value={formatMetric(idea.totalComments)}
                  />
                  <StatCard
                    label="Upvotes"
                    value={formatMetric(idea.totalUpvotes)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {shouldShowPurchasePanel ? (
        <IdeaPurchasePanel
          idea={idea}
          isAuthenticated={isAuthenticated}
          hasBrowserAuthIssue={hasBrowserAuthIssue}
        />
      ) : null}

      {isDetailLocked ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Lock className="size-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">
                Full idea details are locked
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                Purchase access before the full proposal, interaction workspace,
                and discussion area can be opened from this route.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          {availableLongTextFields.length > 0 ? (
            <DetailSection
              title="Proposal details"
              description="Long-form fields from the idea payload are shown here one by one."
            >
              <div className="grid gap-4 xl:grid-cols-2">
                {availableLongTextFields.map(({ key, title }) => (
                  <article
                    key={key}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {title}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-slate-400">
                      {key}
                    </p>
                    <div className="mt-4 break-words whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {renderFieldValue(key, ideaRecord[key], ideaRecord)}
                    </div>
                  </article>
                ))}
              </div>
            </DetailSection>
          ) : null}

          <FieldGrid
            title="Idea record fields"
            description="Every scalar top-level field returned by the idea endpoint."
            record={ideaRecord}
            hiddenKeys={hiddenIdeaFieldKeys}
          />

          {authorRecord ? (
            <FieldGrid
              title="Author fields"
              description="Nested author data returned with this idea."
              record={authorRecord}
            />
          ) : null}

          {categoryRecord ? (
            <FieldGrid
              title="Category fields"
              description="Nested category data returned with this idea."
              record={categoryRecord}
            />
          ) : null}

          {campaignRecord ? (
            <FieldGrid
              title="Campaign fields"
              description="Nested campaign data returned with this idea."
              record={campaignRecord}
            />
          ) : null}

          <RecordCollectionSection
            title="Media items"
            description="Uploaded media related to this idea."
            itemLabel="Media"
            items={mediaRecords}
          />

          <RecordCollectionSection
            title="Attachments"
            description="Attached files available for this idea."
            itemLabel="Attachment"
            items={attachmentRecords}
          />

          <RecordCollectionSection
            title="Purchases"
            description="Purchase records currently attached to this idea."
            itemLabel="Purchase"
            items={purchaseRecords}
          />

          <RecordCollectionSection
            title="Bookmarks"
            description="Users who bookmarked this idea."
            itemLabel="Bookmark"
            items={bookmarkRecords}
          />

          <RecordCollectionSection
            title="Experience reports"
            description="Reports submitted by users after trying this idea."
            itemLabel="Report"
            items={experienceReportRecords}
          />

          <RecordCollectionSection
            title="Tags"
            description="Tags currently attached to this idea."
            itemLabel="Tag"
            items={tagRecords}
          />

          <RecordCollectionSection
            title="Votes"
            description="Vote records attached to this idea."
            itemLabel="Vote"
            items={voteRecords}
          />

          <section className="space-y-5 bg-red-100 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">
                  Interaction workspace
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                  Vote, save, and discuss this idea from one place.
                </p>
              </div>
              <Badge tone={isAuthenticated ? "accent" : "neutral"}>
                {isAuthenticated
                  ? `Signed in${effectiveRole ? ` as ${formatBadgeLabel(effectiveRole)}` : ""}`
                  : "Guest mode"}
              </Badge>
            </div>

            <FeedbackBanner feedback={interactionFeedback} />

            {!isIdeaInteractive ? (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                This idea is currently{" "}
                <strong>{formatBadgeLabel(idea.status)}</strong>. Interaction
                actions are only enabled for published ideas.
              </p>
            ) : null}

            {hasBrowserAuthIssue ? (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                You appear signed in on the page, but browser API auth is
                missing. Log out and sign in again to use vote, save, and
                comment actions.
              </p>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-2">
              <ActionCard
                title="Vote"
                description="Support the idea, switch your vote, or remove it entirely."
                icon={ThumbsUp}
              >
                {!isAuthenticated ? (
                  <GuestPrompt
                    title="Sign in to vote"
                    description="Voting is available to signed-in users so the platform can track your current vote."
                  />
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <StatCard
                        label="Current vote"
                        value={currentVote ?? "Not detected"}
                      />
                      <StatCard
                        label="Upvotes"
                        value={formatMetric(idea.totalUpvotes)}
                      />
                      <StatCard
                        label="Downvotes"
                        value={formatMetric(idea.totalDownvotes)}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={currentVote === "UP" ? "default" : "outline"}
                        disabled={
                          voteBusy || !isIdeaInteractive || hasBrowserAuthIssue
                        }
                        onClick={() => {
                          void submitVote("UP");
                        }}
                      >
                        <ThumbsUp className="size-4" />
                        Upvote
                      </Button>
                      <Button
                        type="button"
                        variant={currentVote === "DOWN" ? "default" : "outline"}
                        disabled={
                          voteBusy || !isIdeaInteractive || hasBrowserAuthIssue
                        }
                        onClick={() => {
                          void submitVote("DOWN");
                        }}
                      >
                        <ThumbsDown className="size-4" />
                        Downvote
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={
                          voteBusy ||
                          !currentVote ||
                          !isIdeaInteractive ||
                          hasBrowserAuthIssue
                        }
                        onClick={() => {
                          void submitVote(currentVote === "UP" ? "UP" : "DOWN");
                        }}
                      >
                        Remove vote
                      </Button>
                    </div>
                  </>
                )}
              </ActionCard>

              <ActionCard
                title="Save"
                description="Bookmark the idea and keep it in your saved list."
                icon={Bookmark}
              >
                {!isAuthenticated ? (
                  <GuestPrompt
                    title="Sign in to save ideas"
                    description="Bookmarks are tied to your account, so guest visitors cannot create or remove them."
                  />
                ) : bookmarksQuery.isError ? (
                  <ErrorState
                    title="Could not load bookmarks"
                    description={getApiErrorMessage(bookmarksQuery.error)}
                    onRetry={() => {
                      void bookmarksQuery.refetch();
                    }}
                  />
                ) : (
                  <>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Save state
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {isBookmarked
                          ? "Saved to your bookmarks"
                          : "Not saved yet"}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Total bookmarks on this idea:{" "}
                        {formatMetric(idea.totalBookmarks)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={isBookmarked ? "default" : "outline"}
                      disabled={
                        bookmarkBusy ||
                        bookmarksQuery.isPending ||
                        !isIdeaInteractive ||
                        hasBrowserAuthIssue
                      }
                      onClick={() => {
                        void toggleBookmark();
                      }}
                    >
                      <Bookmark className="size-4" />
                      {bookmarkBusy
                        ? isBookmarked
                          ? "Removing..."
                          : "Saving..."
                        : isBookmarked
                          ? "Remove bookmark"
                          : "Save idea"}
                    </Button>
                  </>
                )}
              </ActionCard>
            </div>
          </section>

          <section className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">
                  Discussion
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Join the thread, add replies, or manage your own comments.
                </p>
              </div>
              <Badge>{commentsQuery.data?.data?.length ?? 0} comments</Badge>
            </div>

            {!isAuthenticated ? (
              <GuestPrompt
                title="Sign in to join the discussion"
                description="Comments and replies are available to signed-in users."
              />
            ) : (
              <div className="space-y-3 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5">
                <p className="text-sm font-semibold text-slate-950">
                  Add a comment
                </p>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Share your thoughts about this idea"
                  disabled={!isIdeaInteractive || hasBrowserAuthIssue}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={
                      createCommentMutation.isPending ||
                      !isIdeaInteractive ||
                      hasBrowserAuthIssue
                    }
                    onClick={() => {
                      void submitComment();
                    }}
                  >
                    <Send className="size-4" />
                    {createCommentMutation.isPending
                      ? "Posting..."
                      : "Post comment"}
                  </Button>
                </div>
              </div>
            )}

            {commentsQuery.isPending ? (
              <LoadingState
                rows={4}
                title="Loading comments"
                description="Fetching discussion for this idea."
              />
            ) : commentsQuery.isError ? (
              <ErrorState
                title="Could not load comments"
                description={getApiErrorMessage(commentsQuery.error)}
                onRetry={() => {
                  void commentsQuery.refetch();
                }}
              />
            ) : visibleComments.length === 0 ? (
              <EmptyState
                title="No comments yet"
                description="Be the first person to start the discussion for this idea."
              />
            ) : (
              <div className="space-y-4">
                {visibleComments.map((comment) => (
                  <CommentThreadItem
                    key={comment.id}
                    comment={comment}
                    viewerId={viewerId}
                    isAuthenticated={isAuthenticated}
                    isIdeaInteractive={isIdeaInteractive}
                    onFeedback={setInteractionFeedback}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Views" value={formatMetric(idea.totalViews)} />
            <StatCard
              label="Last activity"
              value={formatDate(idea.lastActivityAt, "Not recorded")}
            />
            <StatCard label="Eco score" value={formatMetric(idea.ecoScore)} />
            <StatCard
              label="Author role"
              value={formatText(idea.author?.role)}
            />
          </section>
        </>
      )}
    </main>
  );
}

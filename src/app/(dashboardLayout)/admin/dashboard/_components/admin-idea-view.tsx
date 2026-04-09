"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/data-state";
import {
  useApproveIdeaMutation,
  useArchiveIdeaMutation,
  useDeleteIdeaMutation,
  useFeatureIdeaMutation,
  useHighlightIdeaMutation,
  useIdeasQuery,
  usePublishIdeaMutation,
  useRejectIdeaMutation,
} from "@/features/idea";
import { getApiErrorMessage } from "@/lib/errors/api-error";
import type { Idea } from "@/services/idea.service";

export type AdminIdeaViewMode =
  | "overview"
  | "ideas-management"
  | "pending-review"
  | "featured-ideas"
  | "archived-ideas";

type AdminIdeaViewProps = {
  mode?: AdminIdeaViewMode;
};

type Feedback = {
  type: "success" | "error";
  text: string;
};

type ViewCopy = {
  title: string;
  description: string;
  emptyTitle: string;
};

type StatusAction = "APPROVE" | "REJECT" | "ARCHIVE" | "PUBLISH";

function getIdeaTitle(idea: Idea) {
  return typeof idea.title === "string" && idea.title.trim()
    ? idea.title
    : "Untitled Idea";
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

function isPendingReviewIdea(idea: Idea) {
  const status = getIdeaStatus(idea).toLowerCase();
  return (
    status.includes("pending") ||
    status.includes("submitted") ||
    status.includes("review")
  );
}

function isArchivedIdea(idea: Idea) {
  const status = getIdeaStatus(idea).toLowerCase();
  return status.includes("archiv") || Boolean(idea.archivedAt);
}

function isPublishedIdea(idea: Idea) {
  const status = getIdeaStatus(idea).toLowerCase();
  return status.includes("publish") || Boolean(idea.publishedAt);
}

function getVisibleIdeas(ideas: Idea[], mode: AdminIdeaViewMode) {
  switch (mode) {
    case "pending-review":
      return ideas.filter(isPendingReviewIdea);
    case "featured-ideas":
      return ideas.filter((idea) => idea.isFeatured);
    case "archived-ideas":
      return ideas.filter(isArchivedIdea);
    default:
      return ideas;
  }
}

function getViewCopy(mode: AdminIdeaViewMode): ViewCopy {
  switch (mode) {
    case "ideas-management":
      return {
        title: "All Ideas",
        description:
          "Review every idea returned by the ideas API and apply moderation actions.",
        emptyTitle: "No ideas found",
      };
    case "pending-review":
      return {
        title: "Pending Review",
        description:
          "Approve, reject, or archive ideas that are waiting for moderation.",
        emptyTitle: "No ideas pending review",
      };
    case "featured-ideas":
      return {
        title: "Featured Ideas",
        description:
          "Monitor featured ideas and continue promoting or archiving them.",
        emptyTitle: "No featured ideas found",
      };
    case "archived-ideas":
      return {
        title: "Archived Ideas",
        description:
          "Inspect archived ideas currently returned by the backend.",
        emptyTitle: "No archived ideas found",
      };
    default:
      return {
        title: "Admin Dashboard",
        description:
          "Manage ideas, moderation state, and featured content from one place.",
        emptyTitle: "No ideas found",
      };
  }
}

function getActionVisibility(mode: AdminIdeaViewMode, idea: Idea) {
  const pendingReview = isPendingReviewIdea(idea);
  const archived = isArchivedIdea(idea);
  const published = isPublishedIdea(idea);
  const featured = Boolean(idea.isFeatured);
  const highlighted = Boolean(idea.isHighlighted);

  if (mode === "pending-review") {
    return {
      approve: pendingReview,
      reject: pendingReview,
      archive: !archived,
      publish: false,
      feature: false,
      highlight: false,
    };
  }

  if (mode === "featured-ideas") {
    return {
      approve: false,
      reject: false,
      archive: !archived,
      publish: !published,
      feature: false,
      highlight: !highlighted,
    };
  }

  if (mode === "archived-ideas") {
    return {
      approve: false,
      reject: false,
      archive: false,
      publish: false,
      feature: false,
      highlight: false,
    };
  }

  return {
    approve: pendingReview,
    reject: pendingReview,
    archive: !archived,
    publish: !published,
    feature: !featured,
    highlight: !highlighted,
  };
}

function getDefaultStatusAction(idea: Idea): StatusAction {
  const status = getIdeaStatus(idea).toLowerCase();

  if (isPendingReviewIdea(idea)) {
    return "APPROVE";
  }

  if (status.includes("draft")) {
    return "APPROVE";
  }

  if (isArchivedIdea(idea)) {
    return "PUBLISH";
  }

  if (isPublishedIdea(idea)) {
    return "ARCHIVE";
  }

  return "PUBLISH";
}

export function AdminIdeaView({
  mode = "overview",
}: Readonly<AdminIdeaViewProps>) {
  const ideasQuery = useIdeasQuery();

  const approveIdeaMutation = useApproveIdeaMutation();
  const rejectIdeaMutation = useRejectIdeaMutation();
  const archiveIdeaMutation = useArchiveIdeaMutation();
  const publishIdeaMutation = usePublishIdeaMutation();
  const featureIdeaMutation = useFeatureIdeaMutation();
  const highlightIdeaMutation = useHighlightIdeaMutation();
  const deleteIdeaMutation = useDeleteIdeaMutation();

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [statusActionByIdeaId, setStatusActionByIdeaId] = useState<
    Record<string, StatusAction>
  >({});
  const [rejectReasonByIdeaId, setRejectReasonByIdeaId] = useState<
    Record<string, string>
  >({});

  const ideas = ideasQuery.data?.data ?? [];
  const visibleIdeas = getVisibleIdeas(ideas, mode);
  const viewCopy = getViewCopy(mode);

  const onApprove = async (idea: Idea) => {
    setFeedback(null);

    try {
      const response = await approveIdeaMutation.mutateAsync({ id: idea.id });
      setFeedback({
        type: "success",
        text: response.message || "Idea approved.",
      });
    } catch (mutationError) {
      setFeedback({ type: "error", text: getApiErrorMessage(mutationError) });
    }
  };

  const onReject = async (idea: Idea) => {
    const reason = window.prompt(
      "Enter reject reason:",
      "Not aligned with current standards",
    );

    if (!reason || !reason.trim()) {
      return;
    }

    setFeedback(null);

    try {
      const response = await rejectIdeaMutation.mutateAsync({
        id: idea.id,
        payload: {
          status: "REJECTED",
          rejectionFeedback: reason.trim(),
          adminNote: reason.trim(),
        },
      });
      setFeedback({
        type: "success",
        text: response.message || "Idea rejected.",
      });
    } catch (mutationError) {
      setFeedback({ type: "error", text: getApiErrorMessage(mutationError) });
    }
  };

  const onRejectWithReason = async (idea: Idea, reason: string) => {
    const normalizedReason = reason.trim();

    if (!normalizedReason) {
      setFeedback({
        type: "error",
        text: "Rejection reason is required.",
      });
      return;
    }

    setFeedback(null);

    try {
      const response = await rejectIdeaMutation.mutateAsync({
        id: idea.id,
        payload: {
          status: "REJECTED",
          rejectionFeedback: normalizedReason,
          adminNote: normalizedReason,
        },
      });
      setFeedback({
        type: "success",
        text: response.message || "Idea rejected.",
      });
      setRejectReasonByIdeaId((previous) => ({
        ...previous,
        [idea.id]: "",
      }));
    } catch (mutationError) {
      setFeedback({ type: "error", text: getApiErrorMessage(mutationError) });
    }
  };

  const onArchive = async (idea: Idea) => {
    setFeedback(null);

    try {
      const response = await archiveIdeaMutation.mutateAsync({ id: idea.id });
      setFeedback({
        type: "success",
        text: response.message || "Idea archived.",
      });
    } catch (mutationError) {
      setFeedback({ type: "error", text: getApiErrorMessage(mutationError) });
    }
  };

  const onPublish = async (idea: Idea) => {
    setFeedback(null);

    try {
      const response = await publishIdeaMutation.mutateAsync({ id: idea.id });
      setFeedback({
        type: "success",
        text: response.message || "Idea published.",
      });
    } catch (mutationError) {
      setFeedback({ type: "error", text: getApiErrorMessage(mutationError) });
    }
  };

  const onFeature = async (idea: Idea) => {
    setFeedback(null);

    try {
      const response = await featureIdeaMutation.mutateAsync({ id: idea.id });
      setFeedback({
        type: "success",
        text: response.message || "Idea featured.",
      });
    } catch (mutationError) {
      setFeedback({ type: "error", text: getApiErrorMessage(mutationError) });
    }
  };

  const onHighlight = async (idea: Idea) => {
    setFeedback(null);

    try {
      const response = await highlightIdeaMutation.mutateAsync({ id: idea.id });
      setFeedback({
        type: "success",
        text: response.message || "Idea highlighted.",
      });
    } catch (mutationError) {
      setFeedback({ type: "error", text: getApiErrorMessage(mutationError) });
    }
  };

  const onDelete = async (idea: Idea) => {
    const shouldDelete = window.confirm(
      `Delete idea "${getIdeaTitle(idea)}"? This action cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    setFeedback(null);

    try {
      const response = await deleteIdeaMutation.mutateAsync({ id: idea.id });
      setFeedback({
        type: "success",
        text: response.message || "Idea deleted.",
      });
      setStatusActionByIdeaId((previous) => {
        const next = { ...previous };
        delete next[idea.id];
        return next;
      });
      setRejectReasonByIdeaId((previous) => {
        const next = { ...previous };
        delete next[idea.id];
        return next;
      });
    } catch (mutationError) {
      setFeedback({ type: "error", text: getApiErrorMessage(mutationError) });
    }
  };

  const onApplyStatusAction = async (idea: Idea, action: StatusAction) => {
    switch (action) {
      case "APPROVE":
        await onApprove(idea);
        return;
      case "ARCHIVE":
        await onArchive(idea);
        return;
      case "PUBLISH":
        await onPublish(idea);
        return;
      case "REJECT": {
        const reason = rejectReasonByIdeaId[idea.id] ?? "";
        await onRejectWithReason(idea, reason);
        return;
      }
      default:
        return;
    }
  };

  if (ideasQuery.isPending) {
    return (
      <LoadingState
        title="Loading ideas"
        description="Fetching submitted ideas for moderation."
      />
    );
  }

  if (ideasQuery.isError) {
    return (
      <ErrorState
        title="Could not load ideas"
        description={getApiErrorMessage(ideasQuery.error)}
        onRetry={() => {
          void ideasQuery.refetch();
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

      {visibleIdeas.length === 0 ? (
        <EmptyState title={viewCopy.emptyTitle} />
      ) : (
        <ul className="space-y-3">
          {visibleIdeas.map((idea) => {
            const actions = getActionVisibility(mode, idea);
            const isApproving =
              approveIdeaMutation.isPending &&
              approveIdeaMutation.variables?.id === idea.id;
            const isRejecting =
              rejectIdeaMutation.isPending &&
              rejectIdeaMutation.variables?.id === idea.id;
            const isArchiving =
              archiveIdeaMutation.isPending &&
              archiveIdeaMutation.variables?.id === idea.id;
            const isPublishing =
              publishIdeaMutation.isPending &&
              publishIdeaMutation.variables?.id === idea.id;
            const isFeaturing =
              featureIdeaMutation.isPending &&
              featureIdeaMutation.variables?.id === idea.id;
            const isHighlighting =
              highlightIdeaMutation.isPending &&
              highlightIdeaMutation.variables?.id === idea.id;
            const isDeleting =
              deleteIdeaMutation.isPending &&
              deleteIdeaMutation.variables?.id === idea.id;
            const selectedStatusAction =
              statusActionByIdeaId[idea.id] ?? getDefaultStatusAction(idea);
            const rejectReason = rejectReasonByIdeaId[idea.id] ?? "";
            const isRejectingWithReason =
              selectedStatusAction === "REJECT" && !rejectReason.trim();
            const isUpdatingStatus =
              isApproving || isRejecting || isArchiving || isPublishing;
            const hasActions = Object.values(actions).some(Boolean);

            return (
              <li key={idea.id} className="rounded-xl border bg-background p-4">
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">{getIdeaTitle(idea)}</p>
                    <p className="text-sm text-muted-foreground">
                      Status: {getIdeaStatus(idea)}
                    </p>
                  </div>

                  <div className="grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
                    <p>Idea ID: {idea.id}</p>
                    <p>
                      Category:{" "}
                      {idea.category?.name ??
                        idea.categoryId ??
                        "Uncategorized"}
                    </p>
                    <p>Submitted: {formatDate(idea.submittedAt)}</p>
                    <p>Published: {formatDate(idea.publishedAt)}</p>
                    <p>Featured: {idea.isFeatured ? "Yes" : "No"}</p>
                    <p>Highlighted: {idea.isHighlighted ? "Yes" : "No"}</p>
                  </div>

                  {idea.rejectionFeedback ? (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      Rejection feedback: {idea.rejectionFeedback}
                    </p>
                  ) : null}

                  {idea.adminNote ? (
                    <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      Admin note: {idea.adminNote}
                    </p>
                  ) : null}

                  {mode === "ideas-management" ? (
                    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Status Management
                      </p>

                      <div className="grid gap-2 md:grid-cols-[12rem_minmax(0,1fr)_auto_auto] md:items-center">
                        <select
                          value={selectedStatusAction}
                          onChange={(event) => {
                            const nextAction = event.target
                              .value as StatusAction;
                            setStatusActionByIdeaId((previous) => ({
                              ...previous,
                              [idea.id]: nextAction,
                            }));
                          }}
                          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                        >
                          <option value="APPROVE">Approve</option>
                          <option value="REJECT">Reject</option>
                          <option value="PUBLISH">Publish</option>
                          <option value="ARCHIVE">Archive</option>
                        </select>

                        {selectedStatusAction === "REJECT" ? (
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(event) => {
                              const nextReason = event.target.value;
                              setRejectReasonByIdeaId((previous) => ({
                                ...previous,
                                [idea.id]: nextReason,
                              }));
                            }}
                            placeholder="Rejection reason"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Current status: {getIdeaStatus(idea)}
                          </p>
                        )}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            void onApplyStatusAction(
                              idea,
                              selectedStatusAction,
                            );
                          }}
                          disabled={
                            isUpdatingStatus ||
                            isDeleting ||
                            isRejectingWithReason
                          }
                        >
                          {isUpdatingStatus ? "Updating..." : "Update Status"}
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            void onDelete(idea);
                          }}
                          disabled={isDeleting || isUpdatingStatus}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  ) : hasActions ? (
                    <div className="flex flex-wrap gap-2">
                      {actions.approve ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            void onApprove(idea);
                          }}
                          disabled={isApproving}
                        >
                          {isApproving ? "Approving..." : "Approve"}
                        </Button>
                      ) : null}

                      {actions.reject ? (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            void onReject(idea);
                          }}
                          disabled={isRejecting}
                        >
                          {isRejecting ? "Rejecting..." : "Reject"}
                        </Button>
                      ) : null}

                      {actions.archive ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            void onArchive(idea);
                          }}
                          disabled={isArchiving}
                        >
                          {isArchiving ? "Archiving..." : "Archive"}
                        </Button>
                      ) : null}

                      {actions.publish ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            void onPublish(idea);
                          }}
                          disabled={isPublishing}
                        >
                          {isPublishing ? "Publishing..." : "Publish"}
                        </Button>
                      ) : null}

                      {actions.feature ? (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            void onFeature(idea);
                          }}
                          disabled={isFeaturing}
                        >
                          {isFeaturing ? "Featuring..." : "Feature"}
                        </Button>
                      ) : null}

                      {actions.highlight ? (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            void onHighlight(idea);
                          }}
                          disabled={isHighlighting}
                        >
                          {isHighlighting ? "Highlighting..." : "Highlight"}
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No direct moderation action is available for this idea on
                      the current route.
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

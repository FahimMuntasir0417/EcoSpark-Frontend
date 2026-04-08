import { queryOptions, useQuery } from "@tanstack/react-query";
import { interactionService } from "@/services/interaction.service";

export const interactionQueryKeys = {
  all: ["interaction"] as const,
  ideaComments: (ideaId: string) =>
    [...interactionQueryKeys.all, "idea", ideaId, "comments"] as const,
  commentReplies: (commentId: string) =>
    [...interactionQueryKeys.all, "comment", commentId, "replies"] as const,
  myBookmarks: () => [...interactionQueryKeys.all, "bookmarks", "me"] as const,
};

export function getIdeaCommentsQueryOptions(
  ideaId: string,
  params?: Record<string, unknown>,
) {
  return queryOptions({
    queryKey: [...interactionQueryKeys.ideaComments(ideaId), params ?? {}] as const,
    queryFn: ({ signal }) =>
      interactionService.getIdeaComments(ideaId, { params, signal }),
    enabled: Boolean(ideaId),
  });
}

export function getCommentRepliesQueryOptions(
  commentId: string,
  params?: Record<string, unknown>,
) {
  return queryOptions({
    queryKey: [...interactionQueryKeys.commentReplies(commentId), params ?? {}] as const,
    queryFn: ({ signal }) =>
      interactionService.getCommentReplies(commentId, { params, signal }),
    enabled: Boolean(commentId),
  });
}

export function getMyBookmarksQueryOptions(params?: Record<string, unknown>) {
  return queryOptions({
    queryKey: [...interactionQueryKeys.myBookmarks(), params ?? {}] as const,
    queryFn: ({ signal }) => interactionService.getMyBookmarks({ params, signal }),
  });
}

export function useIdeaCommentsQuery(
  ideaId: string,
  params?: Record<string, unknown>,
) {
  return useQuery(getIdeaCommentsQueryOptions(ideaId, params));
}

export function useCommentRepliesQuery(
  commentId: string,
  params?: Record<string, unknown>,
) {
  return useQuery(getCommentRepliesQueryOptions(commentId, params));
}

export function useMyBookmarksQuery(params?: Record<string, unknown>) {
  return useQuery(getMyBookmarksQueryOptions(params));
}
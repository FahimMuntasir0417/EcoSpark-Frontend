import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  interactionService,
  type CommentInput,
  type UpdateCommentInput,
  type VoteInput,
} from "@/services/interaction.service";
import { interactionQueryKeys } from "./use-interaction-queries";

type IdeaVoteVariables = {
  ideaId: string;
  payload: VoteInput;
};

type IdeaIdVariables = {
  ideaId: string;
};

type CreateCommentVariables = {
  ideaId: string;
  payload: CommentInput;
};

type UpdateCommentVariables = {
  id: string;
  payload: UpdateCommentInput;
};

type DeleteCommentVariables = {
  id: string;
};

type ReplyToCommentVariables = {
  id: string;
  payload: CommentInput;
};

function useInteractionInvalidator() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: interactionQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["ideas"] }),
    ]);
  };
}

export function useVoteIdeaMutation() {
  const invalidate = useInteractionInvalidator();

  return useMutation({
    mutationFn: ({ ideaId, payload }: IdeaVoteVariables) =>
      interactionService.voteIdea(ideaId, payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useUpdateVoteMutation() {
  const invalidate = useInteractionInvalidator();

  return useMutation({
    mutationFn: ({ ideaId, payload }: IdeaVoteVariables) =>
      interactionService.updateVote(ideaId, payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useRemoveVoteMutation() {
  const invalidate = useInteractionInvalidator();

  return useMutation({
    mutationFn: ({ ideaId }: IdeaIdVariables) => interactionService.removeVote(ideaId),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useCreateCommentMutation() {
  const invalidate = useInteractionInvalidator();

  return useMutation({
    mutationFn: ({ ideaId, payload }: CreateCommentVariables) =>
      interactionService.createComment(ideaId, payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useUpdateCommentMutation() {
  const invalidate = useInteractionInvalidator();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateCommentVariables) =>
      interactionService.updateComment(id, payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useDeleteCommentMutation() {
  const invalidate = useInteractionInvalidator();

  return useMutation({
    mutationFn: ({ id }: DeleteCommentVariables) => interactionService.deleteComment(id),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useReplyToCommentMutation() {
  const invalidate = useInteractionInvalidator();

  return useMutation({
    mutationFn: ({ id, payload }: ReplyToCommentVariables) =>
      interactionService.replyToComment(id, payload),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useBookmarkIdeaMutation() {
  const invalidate = useInteractionInvalidator();

  return useMutation({
    mutationFn: ({ ideaId }: IdeaIdVariables) => interactionService.bookmarkIdea(ideaId),
    onSuccess: async () => {
      await invalidate();
    },
  });
}

export function useRemoveBookmarkMutation() {
  const invalidate = useInteractionInvalidator();

  return useMutation({
    mutationFn: ({ ideaId }: IdeaIdVariables) =>
      interactionService.removeBookmark(ideaId),
    onSuccess: async () => {
      await invalidate();
    },
  });
}
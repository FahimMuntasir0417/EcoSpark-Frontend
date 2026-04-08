import { z } from "zod";
import { httpClient } from "@/lib/axios/httpClient";
import { parseApiData, parseApiPayload } from "@/lib/api/parse";
import {
  bookmarkSchema,
  commentInputSchema,
  commentSchema,
  updateCommentInputSchema,
  voteInputSchema,
} from "@/contracts/interaction.contract";
import { nullSchema } from "@/contracts/common";
import type {
  Bookmark,
  Comment,
  CommentInput,
  UpdateCommentInput,
  VoteInput,
  VoteType,
} from "@/contracts/interaction.contract";

export type { Bookmark, Comment, CommentInput, UpdateCommentInput, VoteInput, VoteType };

export type InteractionQueryOptions = {
  params?: Record<string, unknown>;
  signal?: AbortSignal;
};

const commentListSchema = z.array(commentSchema);
const bookmarkListSchema = z.array(bookmarkSchema);
const interactionResultSchema = z.record(z.string(), z.unknown());

export const interactionService = {
  async voteIdea(ideaId: string, payload: VoteInput) {
    const parsedPayload = parseApiPayload(payload, voteInputSchema);
    const response = await httpClient.post<unknown>(
      `/interactions/ideas/${encodeURIComponent(ideaId)}/votes`,
      parsedPayload,
    );
    return parseApiData(response, interactionResultSchema);
  },

  async updateVote(ideaId: string, payload: VoteInput) {
    const parsedPayload = parseApiPayload(payload, voteInputSchema);
    const response = await httpClient.patch<unknown>(
      `/interactions/ideas/${encodeURIComponent(ideaId)}/votes`,
      parsedPayload,
    );
    return parseApiData(response, interactionResultSchema);
  },

  async removeVote(ideaId: string) {
    const response = await httpClient.delete<unknown>(
      `/interactions/ideas/${encodeURIComponent(ideaId)}/votes`,
    );
    return parseApiData(response, nullSchema);
  },

  async createComment(ideaId: string, payload: CommentInput) {
    const parsedPayload = parseApiPayload(payload, commentInputSchema);
    const response = await httpClient.post<unknown>(
      `/interactions/ideas/${encodeURIComponent(ideaId)}/comments`,
      parsedPayload,
    );
    return parseApiData(response, commentSchema);
  },

  async getIdeaComments(ideaId: string, options: InteractionQueryOptions = {}) {
    const response = await httpClient.get<unknown>(
      `/interactions/ideas/${encodeURIComponent(ideaId)}/comments`,
      {
        params: options.params,
        signal: options.signal,
      },
    );
    return parseApiData(response, commentListSchema);
  },

  async updateComment(id: string, payload: UpdateCommentInput) {
    const parsedPayload = parseApiPayload(payload, updateCommentInputSchema);
    const response = await httpClient.patch<unknown>(
      `/interactions/comments/${encodeURIComponent(id)}`,
      parsedPayload,
    );
    return parseApiData(response, commentSchema);
  },

  async deleteComment(id: string) {
    const response = await httpClient.delete<unknown>(`/interactions/comments/${encodeURIComponent(id)}`);
    return parseApiData(response, nullSchema);
  },

  async replyToComment(id: string, payload: CommentInput) {
    const parsedPayload = parseApiPayload(payload, commentInputSchema);
    const response = await httpClient.post<unknown>(
      `/interactions/comments/${encodeURIComponent(id)}/replies`,
      parsedPayload,
    );
    return parseApiData(response, commentSchema);
  },

  async getCommentReplies(id: string, options: InteractionQueryOptions = {}) {
    const response = await httpClient.get<unknown>(
      `/interactions/comments/${encodeURIComponent(id)}/replies`,
      {
        params: options.params,
        signal: options.signal,
      },
    );
    return parseApiData(response, commentListSchema);
  },

  async bookmarkIdea(ideaId: string) {
    const response = await httpClient.post<unknown>(
      `/interactions/ideas/${encodeURIComponent(ideaId)}/bookmark`,
      {},
    );
    return parseApiData(response, bookmarkSchema);
  },

  async removeBookmark(ideaId: string) {
    const response = await httpClient.delete<unknown>(
      `/interactions/ideas/${encodeURIComponent(ideaId)}/bookmark`,
    );
    return parseApiData(response, nullSchema);
  },

  async getMyBookmarks(options: InteractionQueryOptions = {}) {
    const response = await httpClient.get<unknown>("/interactions/users/me/bookmarks", {
      params: options.params,
      signal: options.signal,
    });
    return parseApiData(response, bookmarkListSchema);
  },
};

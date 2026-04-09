import { z } from "zod";
import { httpClient } from "@/lib/axios/httpClient";
import { parseApiData } from "@/lib/api/parse";
import { idSchema, nullSchema } from "@/contracts/common";
import { ideaSchema } from "@/contracts/idea.contract";
import { commentSchema, voteTypeSchema } from "@/contracts/interaction.contract";
import { userSchema } from "@/contracts/user.contract";
import { normalizeApiError } from "@/lib/errors/api-error";
import type { ApiListResponse, ApiResponse } from "@/types/api";
import type { User } from "@/contracts/user.contract";

export type { User };
export type UpdateMyProfileInput = {
  data: Record<string, unknown>;
  image?: File | null;
};

type UserQueryOptions = {
  params?: Record<string, unknown>;
  signal?: AbortSignal;
};

const userListSchema = z.array(userSchema);
const userVoteSchema = z
  .object({
    id: idSchema,
    ideaId: idSchema,
    userId: idSchema.optional(),
    type: voteTypeSchema,
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    idea: ideaSchema.nullable().optional(),
  })
  .passthrough();
const commentParentSchema = z
  .object({
    id: idSchema,
    content: z.string().optional(),
    author: userSchema.nullable().optional(),
  })
  .passthrough();
const userCommentSchema = commentSchema
  .extend({
    authorId: idSchema.optional(),
    isEdited: z.boolean().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    idea: ideaSchema.nullable().optional(),
    author: userSchema.nullable().optional(),
    parent: commentParentSchema.nullable().optional(),
  })
  .passthrough();
const userVoteListSchema = z.array(userVoteSchema);
const userCommentListSchema = z.array(userCommentSchema);
const myProfileCandidateEndpoints = [
  "/users/me",
  "/users/profile",
  "/users/my-profile",
] as const;

export type UserVote = z.infer<typeof userVoteSchema>;
export type UserComment = z.infer<typeof userCommentSchema>;

function buildProfileFormData(payload: UpdateMyProfileInput) {
  const formData = new FormData();
  formData.append("data", JSON.stringify(payload.data));

  if (payload.image) {
    formData.append("image", payload.image);
  }

  return formData;
}

export const userService = {
  async getMe(): Promise<ApiResponse<User>> {
    let lastNotFoundError: unknown = null;

    for (const endpoint of myProfileCandidateEndpoints) {
      try {
        const response = await httpClient.get<unknown>(endpoint);
        return parseApiData(response, userSchema);
      } catch (error) {
        const normalizedError = normalizeApiError(error);

        if (normalizedError.statusCode === 404) {
          lastNotFoundError = error;
          continue;
        }

        throw error;
      }
    }

    throw lastNotFoundError ?? new Error("Could not load current user profile.");
  },

  async updateMe(payload: UpdateMyProfileInput): Promise<ApiResponse<User>> {
    let lastNotFoundError: unknown = null;

    for (const endpoint of myProfileCandidateEndpoints) {
      try {
        const response = await httpClient.patch<unknown>(
          endpoint,
          buildProfileFormData(payload),
        );

        return parseApiData(response, userSchema);
      } catch (error) {
        const normalizedError = normalizeApiError(error);

        if (normalizedError.statusCode === 404) {
          lastNotFoundError = error;
          continue;
        }

        throw error;
      }
    }

    throw lastNotFoundError ?? new Error("Could not update current user profile.");
  },

  async getUsers(): Promise<ApiListResponse<User>> {
    const response = await httpClient.get<unknown>("/users");
    return parseApiData(response, userListSchema);
  },

  async getMyVotes(
    options: UserQueryOptions = {},
  ): Promise<ApiListResponse<UserVote>> {
    const response = await httpClient.get<unknown>("/users/me/votes", {
      params: options.params,
      signal: options.signal,
    });

    return parseApiData(response, userVoteListSchema);
  },

  async getMyComments(
    options: UserQueryOptions = {},
  ): Promise<ApiListResponse<UserComment>> {
    const response = await httpClient.get<unknown>("/users/me/comments", {
      params: options.params,
      signal: options.signal,
    });

    return parseApiData(response, userCommentListSchema);
  },

  async deleteUser(id: string): Promise<ApiResponse<null>> {
    const response = await httpClient.delete<unknown>(
      `/users/${encodeURIComponent(id)}`,
    );
    return parseApiData(response, nullSchema);
  },
};

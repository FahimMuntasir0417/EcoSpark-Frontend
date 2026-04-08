import { z } from "zod";
import { httpClient } from "@/lib/axios/httpClient";
import { parseApiData } from "@/lib/api/parse";
import { userSchema } from "@/contracts/user.contract";
import { normalizeApiError } from "@/lib/errors/api-error";
import type { ApiListResponse, ApiResponse } from "@/types/api";
import type { User } from "@/contracts/user.contract";

export type { User };
export type UpdateMyProfileInput = {
  data: Record<string, unknown>;
  image?: File | null;
};

const userListSchema = z.array(userSchema);
const myProfileCandidateEndpoints = [
  "/users/me",
  "/users/profile",
  "/users/my-profile",
] as const;

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
};

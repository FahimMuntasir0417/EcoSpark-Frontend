import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";
import { env } from "@/config/env";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  persistAuthSession,
} from "@/lib/auth/session";

const EXTERNAL_API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, "");
const INTERNAL_API_BASE_URL = "/api/v1";
const API_BASE_URL =
  typeof window === "undefined" ? EXTERNAL_API_BASE_URL : INTERNAL_API_BASE_URL;

type RetriableAxiosRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  withCredentials: true,
});

function extractAuthPayload(source: unknown): {
  accessToken?: string;
  refreshToken?: string;
  role?: string;
} {
  if (!source || typeof source !== "object") {
    return {};
  }

  const root = source as Record<string, unknown>;
  const candidate =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  const accessToken =
    (typeof candidate.accessToken === "string" && candidate.accessToken) ||
    (typeof candidate.access_token === "string" && candidate.access_token) ||
    (typeof candidate.token === "string" && candidate.token) ||
    undefined;

  const refreshToken =
    (typeof candidate.refreshToken === "string" && candidate.refreshToken) ||
    (typeof candidate.refresh_token === "string" && candidate.refresh_token) ||
    undefined;

  const roleFromSelf =
    (typeof candidate.role === "string" && candidate.role) || undefined;

  const user =
    candidate.user && typeof candidate.user === "object"
      ? (candidate.user as Record<string, unknown>)
      : undefined;

  const roleFromUser =
    (user && typeof user.role === "string" && user.role) || undefined;

  return {
    accessToken,
    refreshToken,
    role: roleFromSelf ?? roleFromUser,
  };
}

async function requestTokenRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh-token`,
      refreshToken ? { refreshToken } : {},
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30_000,
        withCredentials: true,
      },
    );

    const authPayload = extractAuthPayload(response.data);

    if (!authPayload.accessToken) {
      return null;
    }

    persistAuthSession({
      accessToken: authPayload.accessToken,
      refreshToken: authPayload.refreshToken ?? refreshToken,
      role: authPayload.role,
    });

    return authPayload.accessToken;
  } catch {
    return null;
  }
}

let activeRefreshPromise: Promise<string | null> | null = null;

api.interceptors.request.use((config) => {
  const nextConfig = config;
  const accessToken = getAccessToken();

  if (typeof FormData !== "undefined" && nextConfig.data instanceof FormData) {
    const headers = nextConfig.headers as
      | { delete?: (name: string) => void; [key: string]: unknown }
      | undefined;

    if (headers) {
      if (typeof headers.delete === "function") {
        headers.delete("Content-Type");
      } else {
        delete headers["Content-Type"];
        delete headers["content-type"];
      }
    }
  }

  if (accessToken) {
    nextConfig.headers = nextConfig.headers ?? {};
    nextConfig.headers.Authorization = `Bearer ${accessToken}`;
  }

  return nextConfig;
});

api.interceptors.response.use(
  (response) => {
    const url = response.config.url ?? "";

    if (url.includes("/auth/logout")) {
      clearAuthSession();
      return response;
    }

    const payload = extractAuthPayload(response.data);

    if (payload.accessToken || payload.refreshToken || payload.role) {
      persistAuthSession(payload);
    }

    return response;
  },
  async (error: AxiosError) => {
    const responseStatus = error.response?.status;
    const originalRequest = error.config as RetriableAxiosRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest.skipAuthRefresh || originalRequest._retry) {
      return Promise.reject(error);
    }

    const isRefreshRequest = (originalRequest.url ?? "").includes("/auth/refresh-token");

    if (responseStatus !== 401 || isRefreshRequest) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!activeRefreshPromise) {
      activeRefreshPromise = requestTokenRefresh().finally(() => {
        activeRefreshPromise = null;
      });
    }

    const refreshedAccessToken = await activeRefreshPromise;

    if (!refreshedAccessToken) {
      clearAuthSession();

      if (typeof window !== "undefined") {
        const protectedPath = /^\/(admin|scientist|dashboard)(\/|$)/.test(
          window.location.pathname,
        );

        if (protectedPath) {
          window.location.href = "/login";
        }
      }

      return Promise.reject(error);
    }

    originalRequest.headers = originalRequest.headers ?? {};
    originalRequest.headers.Authorization = `Bearer ${refreshedAccessToken}`;

    return api(originalRequest);
  },
);

export default api;

import api from "@/lib/axios";
import { toApiClientError } from "@/lib/errors/api-error";
import type { ApiResponse } from "@/types/api";

export interface ApiRequestOptions {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

function resolveRequestHeaders(
  options: ApiRequestOptions | undefined,
  data?: unknown,
): Record<string, string> | undefined {
  const headers = options?.headers ? { ...options.headers } : undefined;

  if (!headers) {
    return headers;
  }

  if (typeof FormData !== "undefined" && data instanceof FormData) {
    delete headers["Content-Type"];
    delete headers["content-type"];
  }

  return headers;
}

const httpGet = async <TData>(
  endpoint: string,
  options?: ApiRequestOptions,
): Promise<ApiResponse<TData>> => {
  try {
    const response = await api.get<ApiResponse<TData>>(endpoint, {
      params: options?.params,
      headers: resolveRequestHeaders(options),
      signal: options?.signal,
    });
    return response.data;
  } catch (error) {
    throw toApiClientError(error, `GET ${endpoint} failed`);
  }
};

const httpPost = async <TData>(
  endpoint: string,
  data: unknown = {},
  options?: ApiRequestOptions,
): Promise<ApiResponse<TData>> => {
  try {
    const response = await api.post<ApiResponse<TData>>(endpoint, data, {
      params: options?.params,
      headers: resolveRequestHeaders(options, data),
      signal: options?.signal,
    });
    return response.data;
  } catch (error) {
    throw toApiClientError(error, `POST ${endpoint} failed`);
  }
};

const httpPut = async <TData>(
  endpoint: string,
  data: unknown,
  options?: ApiRequestOptions,
): Promise<ApiResponse<TData>> => {
  try {
    const response = await api.put<ApiResponse<TData>>(endpoint, data, {
      params: options?.params,
      headers: resolveRequestHeaders(options, data),
      signal: options?.signal,
    });
    return response.data;
  } catch (error) {
    throw toApiClientError(error, `PUT ${endpoint} failed`);
  }
};

const httpPatch = async <TData>(
  endpoint: string,
  data: unknown,
  options?: ApiRequestOptions,
): Promise<ApiResponse<TData>> => {
  try {
    const response = await api.patch<ApiResponse<TData>>(endpoint, data, {
      params: options?.params,
      headers: resolveRequestHeaders(options, data),
      signal: options?.signal,
    });
    return response.data;
  } catch (error) {
    throw toApiClientError(error, `PATCH ${endpoint} failed`);
  }
};

const httpDelete = async <TData>(
  endpoint: string,
  options?: ApiRequestOptions,
): Promise<ApiResponse<TData>> => {
  try {
    const response = await api.delete<ApiResponse<TData>>(endpoint, {
      params: options?.params,
      headers: resolveRequestHeaders(options),
      signal: options?.signal,
    });
    return response.data;
  } catch (error) {
    throw toApiClientError(error, `DELETE ${endpoint} failed`);
  }
};

export const httpClient = {
  get: httpGet,
  post: httpPost,
  put: httpPut,
  patch: httpPatch,
  delete: httpDelete,
};

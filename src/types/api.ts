export interface ApiResponse<TData = unknown> {
  success: boolean;
  message: string;
  meta?: PaginationMeta;
  data: TData;
}

export type ApiListResponse<TData = unknown> = ApiResponse<TData[]>;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPage?: number;
  totalPages?: number;
}

export interface ApiErrorItem {
  path?: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  statusCode?: number;
  errors?: ApiErrorItem[];
}

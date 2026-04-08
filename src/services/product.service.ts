import { z } from "zod";
import { httpClient } from "@/lib/axios/httpClient";
import { parseApiData } from "@/lib/api/parse";
import { productSchema } from "@/contracts/product.contract";
import type { ApiListResponse, ApiResponse } from "@/types/api";
import type { Product } from "@/contracts/product.contract";

export type { Product };

const productListSchema = z.array(productSchema);

export const productService = {
  async getProducts(): Promise<ApiListResponse<Product>> {
    const response = await httpClient.get<unknown>("/products");
    return parseApiData(response, productListSchema);
  },

  async getProductById(id: string): Promise<ApiResponse<Product>> {
    const response = await httpClient.get<unknown>(`/products/${encodeURIComponent(id)}`);
    return parseApiData(response, productSchema);
  },
};

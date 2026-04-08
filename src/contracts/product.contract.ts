import { z } from "zod";
import { idSchema } from "./common";

export const productSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1),
    price: z.number(),
  })
  .passthrough();

export type Product = z.infer<typeof productSchema>;

import { z } from "zod";
import { idSchema } from "./common";

export const userSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1),
    email: z.string().email(),
  })
  .passthrough();

export type User = z.infer<typeof userSchema>;

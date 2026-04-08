import { z } from "zod";
import { idSchema } from "./common";

export const voteTypeSchema = z.enum(["UP", "DOWN"]);

export const voteInputSchema = z.object({
  type: voteTypeSchema,
});

export const commentSchema = z
  .object({
    id: idSchema,
    content: z.string().min(1),
    ideaId: z.string().optional(),
    parentId: z.string().nullable().optional(),
  })
  .passthrough();

export const commentInputSchema = z.object({
  content: z.string().min(1),
});

export const updateCommentInputSchema = commentInputSchema.partial();

export const bookmarkSchema = z
  .object({
    id: idSchema,
    ideaId: z.string().optional(),
  })
  .passthrough();

export type VoteType = z.infer<typeof voteTypeSchema>;
export type VoteInput = z.infer<typeof voteInputSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type CommentInput = z.infer<typeof commentInputSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentInputSchema>;
export type Bookmark = z.infer<typeof bookmarkSchema>;

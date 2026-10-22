import { z } from 'zod';

export const COMMENT_BODY_MAX_LENGTH = 5000;

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(COMMENT_BODY_MAX_LENGTH),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

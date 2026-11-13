import { z } from 'zod';

export const FORUM_THREAD_TITLE_MAX_LENGTH = 160;
export const FORUM_THREAD_BODY_MAX_LENGTH = 5000;

export const createForumThreadSchema = z
  .object({
    title: z.string().trim().min(5).max(FORUM_THREAD_TITLE_MAX_LENGTH),
    body: z.string().trim().min(1).max(FORUM_THREAD_BODY_MAX_LENGTH),
  })
  .strict();

export type CreateForumThreadInput = z.infer<typeof createForumThreadSchema>;

export const createForumReplySchema = z
  .object({
    body: z.string().trim().min(1).max(FORUM_THREAD_BODY_MAX_LENGTH),
    parentPostId: z.string().uuid().optional(),
  })
  .strict();

export type CreateForumReplyInput = z.infer<typeof createForumReplySchema>;

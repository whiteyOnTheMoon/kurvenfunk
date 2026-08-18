import { z } from 'zod';

import { slugSchema } from './common.ts';

const articleContentSchema = z.json();

export const createArticleSchema = z.object({
  title: z.string().trim().min(1).max(300),
  slug: slugSchema,
  lead: z.string().trim().max(1000).nullable().optional(),
  content: articleContentSchema,
  isTopNews: z.boolean().optional(),
});

export const updateArticleSchema = createArticleSchema.partial();

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;

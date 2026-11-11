import { z } from 'zod';

import { slugSchema } from './common.js';

const forumCategoryNameSchema = z.string().trim().min(1).max(120);
const forumCategoryDescriptionSchema = z.string().trim().max(500).nullable();
const forumCategoryOrderSchema = z.number().int().min(0).max(100_000);

export const createForumCategorySchema = z
  .object({
    name: forumCategoryNameSchema,
    slug: slugSchema.max(100),
    description: forumCategoryDescriptionSchema.optional(),
    sortOrder: forumCategoryOrderSchema.optional(),
    active: z.boolean().optional(),
  })
  .strict();

export const updateForumCategorySchema = z
  .object({
    name: forumCategoryNameSchema.optional(),
    description: forumCategoryDescriptionSchema.optional(),
    sortOrder: forumCategoryOrderSchema.optional(),
    active: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export type CreateForumCategoryInput = z.infer<typeof createForumCategorySchema>;
export type UpdateForumCategoryInput = z.infer<typeof updateForumCategorySchema>;

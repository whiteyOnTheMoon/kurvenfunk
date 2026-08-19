import { z } from 'zod';

import { slugSchema } from './common.ts';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: slugSchema,
  active: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

import { z } from 'zod';

import { slugSchema } from './common.ts';

export const createTagSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: slugSchema,
  active: z.boolean().optional(),
});

export const updateTagSchema = createTagSchema.partial();

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;

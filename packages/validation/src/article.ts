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

export const articlePublicationStatusSchema = z.enum([
  'DRAFT',
  'REVIEW',
  'SCHEDULED',
  'PUBLISHED',
  'ARCHIVED',
]);

export const articlePublicationWorkflowSchema = z
  .object({
    status: articlePublicationStatusSchema,
    scheduledAt: z.iso.datetime().nullable().optional(),
  })
  .superRefine((input, context) => {
    if (input.status === 'SCHEDULED' && !input.scheduledAt) {
      context.addIssue({
        code: 'custom',
        path: ['scheduledAt'],
        message: 'scheduledAt is required for scheduled articles',
      });
    }

    if (
      input.status !== 'SCHEDULED' &&
      input.scheduledAt !== undefined &&
      input.scheduledAt !== null
    ) {
      context.addIssue({
        code: 'custom',
        path: ['scheduledAt'],
        message: 'scheduledAt is only allowed for scheduled articles',
      });
    }
  });

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ArticlePublicationStatus = z.infer<typeof articlePublicationStatusSchema>;
export type ArticlePublicationWorkflowInput = z.infer<typeof articlePublicationWorkflowSchema>;

import { z } from 'zod';

import { slugSchema } from './common.ts';

const articleHttpUrlSchema = z
  .url()
  .refine((value) => /^https?:\/\//i.test(value), 'URL must use http or https');

const articleTextMarkSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('bold'),
  }),
  z.object({
    type: z.literal('italic'),
  }),
  z.object({
    type: z.literal('strike'),
  }),
  z.object({
    type: z.literal('code'),
  }),
  z.object({
    type: z.literal('link'),
    attrs: z.object({
      href: articleHttpUrlSchema,
      target: z.enum(['_blank', '_self']).nullable().optional(),
      rel: z.string().nullable().optional(),
      class: z.string().nullable().optional(),
    }),
  }),
]);

const articleTextNodeSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  marks: z.array(articleTextMarkSchema).optional(),
});

type ArticleContentNode = {
  type: string;
  attrs?: Record<string, unknown> | undefined;
  content?: ArticleContentNode[] | undefined;
  text?: string | undefined;
  marks?: z.infer<typeof articleTextMarkSchema>[] | undefined;
};

const articleContentNodeSchema: z.ZodType<ArticleContentNode> = z.lazy(() =>
  z.discriminatedUnion('type', [
    articleTextNodeSchema,
    z.object({
      type: z.literal('paragraph'),
      content: z.array(articleContentNodeSchema).optional(),
    }),
    z.object({
      type: z.literal('heading'),
      attrs: z.object({
        level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
      }),
      content: z.array(articleContentNodeSchema).optional(),
    }),
    z.object({
      type: z.literal('bulletList'),
      content: z.array(articleContentNodeSchema).min(1),
    }),
    z.object({
      type: z.literal('orderedList'),
      attrs: z
        .object({
          start: z.number().int().positive().optional(),
          type: z.string().nullable().optional(),
        })
        .optional(),
      content: z.array(articleContentNodeSchema).min(1),
    }),
    z.object({
      type: z.literal('listItem'),
      content: z.array(articleContentNodeSchema).min(1),
    }),
    z.object({
      type: z.literal('blockquote'),
      content: z.array(articleContentNodeSchema).min(1),
    }),
    z.object({
      type: z.literal('codeBlock'),
      attrs: z
        .object({
          language: z.string().nullable().optional(),
        })
        .optional(),
      content: z.array(articleContentNodeSchema).optional(),
    }),
    z.object({
      type: z.literal('horizontalRule'),
    }),
    z.object({
      type: z.literal('hardBreak'),
    }),
    z.object({
      type: z.literal('image'),
      attrs: z.object({
        src: articleHttpUrlSchema,
        alt: z.string().nullable().optional(),
        title: z.string().nullable().optional(),
        width: z.union([z.number(), z.string()]).nullable().optional(),
        height: z.union([z.number(), z.string()]).nullable().optional(),
      }),
    }),
  ]),
);

export const articleContentSchema = z.object({
  type: z.literal('doc'),
  content: z.array(articleContentNodeSchema).default([]),
});

export const createArticleSchema = z.object({
  title: z.string().trim().min(1).max(300),
  slug: slugSchema,
  lead: z.string().trim().max(1000).nullable().optional(),
  content: articleContentSchema,
  isTopNews: z.boolean().optional(),
  competitionId: z.uuid().nullable().optional(),
  matchId: z.uuid().nullable().optional(),
  leadMediaId: z.uuid().nullable().optional(),
  seoTitle: z.string().trim().max(300).nullable().optional(),
  seoDescription: z.string().trim().max(500).nullable().optional(),
  canonicalUrl: articleHttpUrlSchema.nullable().optional(),
  ogImageId: z.uuid().nullable().optional(),
  clubIds: z.array(z.uuid()).max(20).default([]),
  categoryIds: z.array(z.uuid()).max(20).default([]),
  tagIds: z.array(z.uuid()).max(50).default([]),
});

export const updateArticleSchema = createArticleSchema.partial().extend({
  clubIds: z.array(z.uuid()).max(20).optional(),
  categoryIds: z.array(z.uuid()).max(20).optional(),
  tagIds: z.array(z.uuid()).max(50).optional(),
});

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

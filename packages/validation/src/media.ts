import { z } from 'zod';

const optionalNullableText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .transform((value) => value || null);

const optionalNullableUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null)
  .pipe(z.string().url().nullable());

export const mediaUploadMetadataSchema = z.object({
  altText: optionalNullableText(500),
  copyright: optionalNullableText(500),
  source: optionalNullableText(500),
  sourceUrl: optionalNullableUrl,
});

export const updateMediaMetadataSchema = z.object({
  altText: optionalNullableText(500),
  copyright: optionalNullableText(500),
  source: optionalNullableText(500),
  sourceUrl: optionalNullableUrl,
});

export const mediaListQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export type MediaUploadMetadataInput = z.infer<typeof mediaUploadMetadataSchema>;
export type UpdateMediaMetadataInput = z.infer<typeof updateMediaMetadataSchema>;
export type MediaListQueryInput = z.infer<typeof mediaListQuerySchema>;

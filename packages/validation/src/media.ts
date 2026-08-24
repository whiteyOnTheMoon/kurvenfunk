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

export type MediaUploadMetadataInput = z.infer<typeof mediaUploadMetadataSchema>;

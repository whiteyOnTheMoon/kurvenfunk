import { z } from 'zod';

export const DISPLAY_NAME_MAX_LENGTH = 60;
export const BIO_MAX_LENGTH = 500;

const optionalTrimmedText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable();

export const updateProfileSchema = z.object({
  displayName: optionalTrimmedText(DISPLAY_NAME_MAX_LENGTH),
  bio: optionalTrimmedText(BIO_MAX_LENGTH),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

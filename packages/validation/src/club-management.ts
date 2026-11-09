import { z } from 'zod';

import { slugSchema } from './common.js';

const clubNameSchema = z.string().trim().min(1).max(120);
const shortNameSchema = z.string().trim().min(1).max(60).nullable();

export const clubColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Expected a six-digit HEX color')
  .transform((value) => value.toUpperCase());

const optionalColorSchema = clubColorSchema.nullable();

const officialWebsiteSchema = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') &&
      !url.username && !url.password;
  }, 'Expected an absolute HTTP(S) website without credentials')
  .nullable();

const clubFields = {
  name: clubNameSchema,
  shortName: shortNameSchema.optional(),
  color1Hex: clubColorSchema,
  color2Hex: optionalColorSchema.optional(),
  color3Hex: optionalColorSchema.optional(),
  accentColorHex: optionalColorSchema.optional(),
  website: officialWebsiteSchema.optional(),
  logoMediaId: z.string().uuid().nullable().optional(),
  active: z.boolean().optional(),
};

export const createClubSchema = z
  .object({
    ...clubFields,
    slug: slugSchema.max(100),
  })
  .strict();

export const updateClubSchema = z
  .object({
    ...clubFields,
    name: clubNameSchema.optional(),
    color1Hex: clubColorSchema.optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, 'At least one field is required');

export type CreateClubInput = z.infer<typeof createClubSchema>;
export type UpdateClubInput = z.infer<typeof updateClubSchema>;

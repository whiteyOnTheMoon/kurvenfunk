import { z } from 'zod';

import { slugSchema } from './common.js';

const competitionNameSchema = z.string().trim().min(1).max(120);
const shortNameSchema = z.string().trim().min(1).max(60).nullable();
const countryCodeSchema = z
  .string()
  .regex(/^[A-Z]{2}$/)
  .nullable();

export const createCompetitionSchema = z
  .object({
    name: competitionNameSchema,
    shortName: shortNameSchema.optional(),
    slug: slugSchema.max(100),
    type: z.enum(['LEAGUE', 'CUP']),
    countryCode: countryCodeSchema.optional(),
    active: z.boolean().optional(),
  })
  .strict();

export const updateCompetitionSchema = z
  .object({
    name: competitionNameSchema.optional(),
    shortName: shortNameSchema.optional(),
    countryCode: countryCodeSchema.optional(),
    active: z.boolean().optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, 'At least one field is required');

export type CreateCompetitionInput = z.infer<typeof createCompetitionSchema>;
export type UpdateCompetitionInput = z.infer<typeof updateCompetitionSchema>;

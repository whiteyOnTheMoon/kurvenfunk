import { z } from 'zod';

const uuidSchema = z.string().uuid();
const matchdaySchema = z.number().int().min(1).max(999).nullable();
const kickoffSchema = z.iso.datetime({ offset: true });
export const fixtureStatusSchema = z.enum(['SCHEDULED', 'POSTPONED', 'CANCELLED']);

export const createFixtureSchema = z
  .object({
    competitionId: uuidSchema,
    seasonId: uuidSchema,
    stageId: uuidSchema.nullable().optional(),
    homeClubId: uuidSchema,
    awayClubId: uuidSchema,
    kickoff: kickoffSchema,
    matchday: matchdaySchema.optional(),
    status: fixtureStatusSchema.optional(),
  })
  .strict()
  .refine((value) => value.homeClubId !== value.awayClubId, {
    path: ['awayClubId'],
    message: 'Home and away club must be different',
  });

export const updateFixtureSchema = z
  .object({
    stageId: uuidSchema.nullable().optional(),
    homeClubId: uuidSchema.optional(),
    awayClubId: uuidSchema.optional(),
    kickoff: kickoffSchema.optional(),
    matchday: matchdaySchema.optional(),
    status: fixtureStatusSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one fixture field is required',
  });

export type CreateFixtureInput = z.infer<typeof createFixtureSchema>;
export type UpdateFixtureInput = z.infer<typeof updateFixtureSchema>;

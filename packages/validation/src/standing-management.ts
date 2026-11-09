import { z } from 'zod';

const uuid = z.string().uuid();
const nonNegative = z.number().int().min(0).max(10000);
const position = z.number().int().min(1).max(10000);

const stats = {
  position,
  played: nonNegative,
  won: nonNegative,
  drawn: nonNegative,
  lost: nonNegative,
  goalsFor: nonNegative,
  goalsAgainst: nonNegative,
  points: z.number().int().min(-10000).max(10000),
  deductionPoints: nonNegative,
  sortOrder: z.number().int().min(0).max(10000).nullable(),
};

function coherentStats(value: {
  played: number;
  won: number;
  drawn: number;
  lost: number;
}): boolean {
  return value.played === value.won + value.drawn + value.lost;
}

/** A complete canonical row; the goal difference is derived server-side. */
export const createStandingSchema = z
  .object({
    clubId: uuid,
    stageId: uuid.nullable(),
    ...stats,
  })
  .strict()
  .refine(coherentStats, {
    path: ['played'],
    message: 'Played must equal won + drawn + lost',
  });

export const updateStandingSchema = z
  .object({
    ...stats,
    expectedUpdatedAt: z.iso.datetime({ offset: true }),
  })
  .strict()
  .refine(coherentStats, {
    path: ['played'],
    message: 'Played must equal won + drawn + lost',
  });

export type CreateStandingInput = z.infer<typeof createStandingSchema>;
export type UpdateStandingInput = z.infer<typeof updateStandingSchema>;

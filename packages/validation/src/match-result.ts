import { z } from 'zod';

export const resultStatusSchema = z.enum(['LIVE', 'FINISHED', 'ABANDONED']);
const scoreSchema = z.number().int().min(0).max(999).nullable();

export const updateMatchResultSchema = z
  .object({
    status: resultStatusSchema,
    homeScore: scoreSchema,
    awayScore: scoreSchema,
    expectedUpdatedAt: z.iso.datetime({ offset: true }),
  })
  .strict()
  .superRefine((input, context) => {
    if ((input.homeScore === null) !== (input.awayScore === null)) {
      context.addIssue({
        code: 'custom',
        path: ['awayScore'],
        message: 'Both scores must be provided together or both left unknown',
      });
    }
    if (input.status === 'FINISHED' && input.homeScore === null) {
      context.addIssue({
        code: 'custom',
        path: ['homeScore'],
        message: 'A finished match needs both final scores',
      });
    }
  });

export type UpdateMatchResultInput = z.infer<typeof updateMatchResultSchema>;

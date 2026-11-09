import { z } from 'zod';

export const standingCalculationPreviewSchema = z
  .object({ stageId: z.string().uuid().nullable() })
  .strict();

export const standingCalculationApplySchema = standingCalculationPreviewSchema.extend({
  expectedPreviewHash: z.string().regex(/^[a-f0-9]{64}$/),
  overwriteExisting: z.boolean(),
});

export type StandingCalculationPreviewInput = z.infer<typeof standingCalculationPreviewSchema>;
export type StandingCalculationApplyInput = z.infer<typeof standingCalculationApplySchema>;

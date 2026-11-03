import { Body, Controller, Post, Req } from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';
import { LimitedSanctionsService } from './limited-sanctions.service';

export const createLimitedSanctionSchema = z
  .object({
    userId: z.string().uuid(),
    duration: z.enum(['24H', '3D', '7D', '30D']),
    reasonCode: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[A-Z][A-Z0-9_]*$/),
    userMessage: z.string().trim().min(1).max(1000).optional(),
    moderatorNote: z.string().trim().min(1).max(2000),
  })
  .strict();

export type CreateLimitedSanctionInput = z.infer<typeof createLimitedSanctionSchema>;

@Controller('moderation/limited-sanctions')
export class LimitedSanctionsController {
  constructor(private readonly sanctions: LimitedSanctionsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.USER_LIMIT)
  create(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createLimitedSanctionSchema))
    input: CreateLimitedSanctionInput,
  ) {
    return this.sanctions.issue({
      ...input,
      moderatorId: request.user!.kurvenfunkUserId,
    });
  }
}

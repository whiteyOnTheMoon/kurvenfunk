import { Body, Controller, Post, Req } from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';

import { ModerationService } from './moderation.service';

export const createYellowCardSchema = z
  .object({
    userId: z.string().uuid(),

    reasonCode: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[A-Z][A-Z0-9_]*$/),

    userMessage: z.string().trim().min(1).max(1000).optional(),

    moderatorNote: z.string().trim().min(1).max(2000),

    sourceType: z
      .enum(['NONE', 'COMMENT', 'FORUM_POST', 'THREAD', 'ARTICLE', 'USER'])
      .default('NONE'),

    sourceId: z.string().uuid().optional(),

    expiresAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict()
  .refine(
    (input) =>
      input.sourceType === 'NONE' ? input.sourceId === undefined : input.sourceId !== undefined,
    {
      message: 'sourceId must match sourceType',
      path: ['sourceId'],
    },
  );

export type CreateYellowCardInput = z.infer<typeof createYellowCardSchema>;

@Controller('moderation/yellow-cards')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.USER_WARN)
  createYellowCard(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createYellowCardSchema))
    input: CreateYellowCardInput,
  ) {
    return this.moderationService.createYellowCard({
      ...input,
      moderatorId: request.user!.kurvenfunkUserId,
    });
  }
}

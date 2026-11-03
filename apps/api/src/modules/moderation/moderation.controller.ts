import { Body, Controller, Post, Req } from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';

import { ModerationService } from './moderation.service';

const moderationCardFields = z.object({
  userId: z.string().uuid(),
  reasonCode: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[A-Z][A-Z0-9_]*$/),
  userMessage: z.string().trim().min(1).max(1000).optional(),
  moderatorNote: z.string().trim().min(1).max(2000),
  sourceType: z.enum(['NONE', 'COMMENT', 'FORUM_POST', 'THREAD', 'ARTICLE', 'USER']).default('NONE'),
  sourceId: z.string().uuid().optional(),
});

const sourceMatchesType = (input: { sourceType: string; sourceId?: string }) =>
  input.sourceType === 'NONE' ? input.sourceId === undefined : input.sourceId !== undefined;

const sourceValidationError = {
  message: 'sourceId must match sourceType',
  path: ['sourceId'],
};

export const createYellowCardSchema = moderationCardFields
  .extend({ expiresAt: z.string().datetime({ offset: true }).optional() })
  .strict()
  .refine(sourceMatchesType, sourceValidationError);

export const createDirectRedCardSchema = moderationCardFields
  .strict()
  .refine(sourceMatchesType, sourceValidationError);

export type CreateYellowCardInput = z.infer<typeof createYellowCardSchema>;
export type CreateDirectRedCardInput = z.infer<typeof createDirectRedCardSchema>;

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

/** Task 177: direct RED cards require user.ban (not the moderator's user.warn). */
@Controller('moderation/red-cards')
export class DirectRedCardController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.USER_BAN)
  createDirectRedCard(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createDirectRedCardSchema))
    input: CreateDirectRedCardInput,
  ) {
    return this.moderationService.createDirectRedCard({
      ...input,
      moderatorId: request.user!.kurvenfunkUserId,
    });
  }
}

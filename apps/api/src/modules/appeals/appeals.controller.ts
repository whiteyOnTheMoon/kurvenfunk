import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';
import { AppealIdentityGuard } from './appeal-identity.guard';
import { AppealsService } from './appeals.service';

export const createAppealSchema = z
  .object({
    moderationCardId: z.string().uuid().optional(),
    sanctionId: z.string().uuid().optional(),
    reason: z.string().trim().min(10).max(2000),
  })
  .strict()
  .refine((input) => Boolean(input.moderationCardId) !== Boolean(input.sanctionId), {
    message: 'Exactly one card or sanction must be selected.',
    path: ['sanctionId'],
  });

export const decideAppealSchema = z
  .object({
    decision: z.enum(['ACCEPTED', 'REJECTED']),
    decisionNote: z.string().trim().min(10).max(2000),
  })
  .strict();

export const approveAppealSchema = z
  .object({
    outcome: z.enum(['APPROVE', 'RETURN']),
    decisionNote: z.string().trim().min(10).max(2000),
  })
  .strict();

export type ApproveAppealInput = z.infer<typeof approveAppealSchema>;
export type CreateAppealInput = z.infer<typeof createAppealSchema>;
export type DecideAppealInput = z.infer<typeof decideAppealSchema>;

@Controller('appeals')
export class AppealsController {
  constructor(private readonly appeals: AppealsService) {}

  @Post()
  @Header('Cache-Control', 'private, no-store')
  @UseGuards(AppealIdentityGuard)
  create(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createAppealSchema)) input: CreateAppealInput,
  ) {
    return this.appeals.create({
      ...input,
      userId: request.user!.kurvenfunkUserId,
    });
  }

  @Get('eligible')
  @Header('Cache-Control', 'private, no-store')
  @UseGuards(AppealIdentityGuard)
  eligible(@Req() request: AuthenticatedRequest) {
    return this.appeals.eligible(request.user!.kurvenfunkUserId);
  }

  @Get('mine')
  @Header('Cache-Control', 'private, no-store')
  @UseGuards(AppealIdentityGuard)
  listMine(@Req() request: AuthenticatedRequest) {
    return this.appeals.listMine(request.user!.kurvenfunkUserId);
  }
}

@Controller('moderation/appeals')
export class ModerationAppealsController {
  constructor(private readonly appeals: AppealsService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  @RequirePermissions(PERMISSIONS.USER_WARN)
  listOpen() {
    return this.appeals.listOpenForModeration();
  }

  @Get('policy')
  @Header('Cache-Control', 'private, no-store')
  @RequirePermissions(PERMISSIONS.USER_WARN)
  policy() {
    return { appealSecondReviewRequired: this.appeals.isFourEyesEnabled() };
  }

  @Get('pending')
  @Header('Cache-Control', 'private, no-store')
  @RequirePermissions(PERMISSIONS.USER_BAN)
  listPending() {
    return this.appeals.listPendingForApproval();
  }

  @Patch(':appealId/approval')
  @Header('Cache-Control', 'private, no-store')
  @RequirePermissions(PERMISSIONS.USER_BAN)
  approve(
    @Param('appealId', new ParseUUIDPipe({ version: '4' })) appealId: string,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(approveAppealSchema)) input: ApproveAppealInput,
  ) {
    return this.appeals.approve({
      ...input,
      appealId,
      reviewerId: request.user!.kurvenfunkUserId,
    });
  }

  @Patch(':appealId/decision')
  @Header('Cache-Control', 'private, no-store')
  @RequirePermissions(PERMISSIONS.USER_BAN)
  decide(
    @Param('appealId', new ParseUUIDPipe({ version: '4' })) appealId: string,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(decideAppealSchema)) input: DecideAppealInput,
  ) {
    return this.appeals.decide({
      ...input,
      appealId,
      reviewerId: request.user!.kurvenfunkUserId,
    });
  }
}

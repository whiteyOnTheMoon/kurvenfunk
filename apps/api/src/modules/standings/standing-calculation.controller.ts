import { Body, Controller, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common';
import {
  standingCalculationPreviewSchema,
  standingCalculationApplySchema,
  type StandingCalculationPreviewInput,
  type StandingCalculationApplyInput,
} from '@kurvenfunk/validation';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';
import { StandingCalculationService } from './standing-calculation.service';

@Controller('standings/admin/season')
export class StandingCalculationController {
  constructor(private readonly calculation: StandingCalculationService) {}

  @Post(':seasonId/calculate/preview')
  @RequirePermissions(PERMISSIONS.STANDING_MANAGE)
  preview(
    @Param('seasonId', new ParseUUIDPipe({ version: '4' })) seasonId: string,
    @Body(new ZodValidationPipe(standingCalculationPreviewSchema))
    input: StandingCalculationPreviewInput,
  ) {
    return this.calculation.preview(seasonId, input.stageId);
  }

  @Post(':seasonId/calculate/apply')
  @RequirePermissions(PERMISSIONS.STANDING_MANAGE)
  apply(
    @Req() request: AuthenticatedRequest,
    @Param('seasonId', new ParseUUIDPipe({ version: '4' })) seasonId: string,
    @Body(new ZodValidationPipe(standingCalculationApplySchema))
    input: StandingCalculationApplyInput,
  ) {
    return this.calculation.apply(
      seasonId,
      input.stageId,
      input.expectedPreviewHash,
      input.overwriteExisting,
      request.user!.kurvenfunkUserId,
    );
  }
}

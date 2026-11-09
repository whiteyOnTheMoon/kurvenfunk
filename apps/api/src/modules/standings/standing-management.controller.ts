import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  createStandingSchema,
  updateStandingSchema,
  type CreateStandingInput,
  type UpdateStandingInput,
} from '@kurvenfunk/validation';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';
import { StandingManagementService } from './standing-management.service';

@Controller('standings')
export class StandingManagementController {
  constructor(private readonly service: StandingManagementService) {}

  @Get('season/:seasonId')
  readSeason(
    @Param('seasonId', new ParseUUIDPipe({ version: '4' })) seasonId: string,
    @Query('stageId') stageId?: string,
  ) {
    return this.service.readSeason(seasonId, stageId);
  }

  @Get('admin/season/:seasonId')
  @RequirePermissions(PERMISSIONS.STANDING_MANAGE)
  readAdmin(
    @Param('seasonId', new ParseUUIDPipe({ version: '4' })) seasonId: string,
    @Query('stageId') stageId?: string,
  ) {
    return this.service.readSeason(seasonId, stageId);
  }

  @Post('admin/season/:seasonId/rows')
  @RequirePermissions(PERMISSIONS.STANDING_MANAGE)
  create(
    @Req() request: AuthenticatedRequest,
    @Param('seasonId', new ParseUUIDPipe({ version: '4' })) seasonId: string,
    @Body(new ZodValidationPipe(createStandingSchema)) input: CreateStandingInput,
  ) {
    return this.service.create(seasonId, input, request.user!.kurvenfunkUserId);
  }

  @Patch('admin/rows/:id')
  @RequirePermissions(PERMISSIONS.STANDING_MANAGE)
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(updateStandingSchema)) input: UpdateStandingInput,
  ) {
    return this.service.update(id, input, request.user!.kurvenfunkUserId);
  }
}

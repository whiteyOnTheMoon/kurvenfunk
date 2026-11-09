import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req } from '@nestjs/common';
import {
  createFixtureSchema,
  updateFixtureSchema,
  type CreateFixtureInput,
  type UpdateFixtureInput,
} from '@kurvenfunk/validation';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';
import { MatchManagementService } from './match-management.service';

@Controller('matches')
export class MatchManagementController {
  constructor(private readonly management: MatchManagementService) {}

  @Get('admin/season/:seasonId')
  @RequirePermissions(PERMISSIONS.MATCH_MANAGE)
  findForSeason(@Param('seasonId', new ParseUUIDPipe({ version: '4' })) seasonId: string) {
    return this.management.findForSeason(seasonId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MATCH_MANAGE)
  create(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createFixtureSchema)) input: CreateFixtureInput,
  ) {
    return this.management.create(input, request.user!.kurvenfunkUserId);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MATCH_MANAGE)
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(updateFixtureSchema)) input: UpdateFixtureInput,
  ) {
    return this.management.update(id, input, request.user!.kurvenfunkUserId);
  }
}

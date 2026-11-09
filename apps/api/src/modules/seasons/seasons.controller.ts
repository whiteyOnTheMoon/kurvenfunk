import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req } from '@nestjs/common';
import {
  createSeasonSchema,
  updateSeasonSchema,
  type CreateSeasonInput,
  type UpdateSeasonInput,
} from '@kurvenfunk/validation';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';
import { SeasonsService } from './seasons.service';

@Controller('seasons')
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Get('competition/:competitionSlug')
  findByCompetition(@Param('competitionSlug') competitionSlug: string) {
    return this.seasonsService.findByCompetition(competitionSlug);
  }

  @Get('competition/:competitionSlug/current')
  findCurrent(@Param('competitionSlug') competitionSlug: string) {
    return this.seasonsService.findCurrent(competitionSlug);
  }

  @Get('competition/:competitionSlug/:seasonSlug')
  findBySlug(
    @Param('competitionSlug') competitionSlug: string,
    @Param('seasonSlug') seasonSlug: string,
  ) {
    return this.seasonsService.findBySlug(competitionSlug, seasonSlug);
  }

  @Post('competition/:competitionSlug')
  @RequirePermissions(PERMISSIONS.SEASON_MANAGE)
  create(
    @Req() request: AuthenticatedRequest,
    @Param('competitionSlug') competitionSlug: string,
    @Body(new ZodValidationPipe(createSeasonSchema)) input: CreateSeasonInput,
  ) {
    return this.seasonsService.create(competitionSlug, input, request.user!.kurvenfunkUserId);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.SEASON_MANAGE)
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(updateSeasonSchema)) input: UpdateSeasonInput,
  ) {
    return this.seasonsService.update(id, input, request.user!.kurvenfunkUserId);
  }
}

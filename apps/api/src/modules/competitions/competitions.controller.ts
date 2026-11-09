import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req } from '@nestjs/common';
import {
  createCompetitionSchema,
  updateCompetitionSchema,
  type CreateCompetitionInput,
  type UpdateCompetitionInput,
} from '@kurvenfunk/validation';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';
import { CompetitionsService } from './competitions.service';

@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Get()
  findAll() {
    return this.competitionsService.findAll();
  }

  @Get('admin/all')
  @RequirePermissions(PERMISSIONS.COMPETITION_MANAGE)
  findAllForAdmin() {
    return this.competitionsService.findAllForAdmin();
  }

  @Get(':slug')
  findActiveBySlug(@Param('slug') slug: string) {
    return this.competitionsService.findActiveBySlug(slug);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.COMPETITION_MANAGE)
  create(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createCompetitionSchema)) input: CreateCompetitionInput,
  ) {
    return this.competitionsService.create(input, request.user!.kurvenfunkUserId);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.COMPETITION_MANAGE)
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(updateCompetitionSchema)) input: UpdateCompetitionInput,
  ) {
    return this.competitionsService.update(id, input, request.user!.kurvenfunkUserId);
  }
}

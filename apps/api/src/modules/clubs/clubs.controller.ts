import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req } from '@nestjs/common';
import {
  createClubSchema,
  updateClubSchema,
  type CreateClubInput,
  type UpdateClubInput,
} from '@kurvenfunk/validation';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';
import { ClubsService } from './clubs.service';

@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Get()
  findActive() {
    return this.clubsService.findActive();
  }

  @Get('admin/all')
  @RequirePermissions(PERMISSIONS.CLUB_MANAGE)
  findAllForAdmin() {
    return this.clubsService.findAllForAdmin();
  }

  @Get(':slug')
  findActiveBySlug(@Param('slug') slug: string) {
    return this.clubsService.findActiveBySlug(slug);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CLUB_MANAGE)
  create(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createClubSchema)) input: CreateClubInput,
  ) {
    return this.clubsService.create(input, request.user!.kurvenfunkUserId);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.CLUB_MANAGE)
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(updateClubSchema)) input: UpdateClubInput,
  ) {
    return this.clubsService.update(id, input, request.user!.kurvenfunkUserId);
  }
}

import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req } from '@nestjs/common';
import {
  createForumCategorySchema,
  updateForumCategorySchema,
  type CreateForumCategoryInput,
  type UpdateForumCategoryInput,
} from '@kurvenfunk/validation';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';
import { ForumsService } from './forums.service';

@Controller('forums')
export class ForumsController {
  constructor(private readonly forumsService: ForumsService) {}

  @Get('categories')
  findPublicCategories() {
    return this.forumsService.findPublicCategories();
  }

  @Get('categories/admin/all')
  @RequirePermissions(PERMISSIONS.FORUM_MANAGE)
  findAllCategoriesForAdmin() {
    return this.forumsService.findAllCategoriesForAdmin();
  }

  @Get('categories/:slug')
  findPublicCategoryBySlug(@Param('slug') slug: string) {
    return this.forumsService.findPublicCategoryBySlug(slug);
  }

  @Get('clubs/:clubSlug')
  findPublicClubForum(@Param('clubSlug') clubSlug: string) {
    return this.forumsService.findPublicClubForum(clubSlug);
  }

  @Post('clubs/:clubId/ensure')
  @RequirePermissions(PERMISSIONS.FORUM_MANAGE)
  ensureClubForum(
    @Req() request: AuthenticatedRequest,
    @Param('clubId', new ParseUUIDPipe({ version: '4' })) clubId: string,
  ) {
    return this.forumsService.ensureClubForum(clubId, request.user!.kurvenfunkUserId);
  }

  @Post('categories')
  @RequirePermissions(PERMISSIONS.FORUM_MANAGE)
  createCategory(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createForumCategorySchema)) input: CreateForumCategoryInput,
  ) {
    return this.forumsService.createCategory(input, request.user!.kurvenfunkUserId);
  }

  @Patch('categories/:id')
  @RequirePermissions(PERMISSIONS.FORUM_MANAGE)
  updateCategory(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(updateForumCategorySchema)) input: UpdateForumCategoryInput,
  ) {
    return this.forumsService.updateCategory(id, input, request.user!.kurvenfunkUserId);
  }
}

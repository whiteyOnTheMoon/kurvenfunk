import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { createForumThreadSchema, type CreateForumThreadInput } from '@kurvenfunk/validation';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';
import { ForumThreadsService } from './forum-threads.service';

@Controller('forums/by-slug/:forumSlug/threads')
export class ForumThreadsController {
  constructor(private readonly threadsService: ForumThreadsService) {}

  @Get()
  listPublicThreads(@Param('forumSlug') forumSlug: string) {
    return this.threadsService.listPublicThreads(forumSlug);
  }

  @Get(':threadSlug')
  findPublicThread(@Param('forumSlug') forumSlug: string, @Param('threadSlug') threadSlug: string) {
    return this.threadsService.findPublicThread(forumSlug, threadSlug);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.THREAD_CREATE)
  createThread(
    @Param('forumSlug') forumSlug: string,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createForumThreadSchema)) input: CreateForumThreadInput,
  ) {
    return this.threadsService.createThread(forumSlug, request.user!.kurvenfunkUserId, input);
  }
}

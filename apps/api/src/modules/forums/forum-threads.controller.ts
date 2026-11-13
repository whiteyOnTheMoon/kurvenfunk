import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import {
  createForumReplySchema,
  createForumThreadSchema,
  type CreateForumReplyInput,
  type CreateForumThreadInput,
} from '@kurvenfunk/validation';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';
import { ForumThreadsService } from './forum-threads.service';

@Controller('forums/by-slug/:forumSlug/threads')
export class ForumThreadsController {
  constructor(private readonly threadsService: ForumThreadsService) {}

  @Get()
  listPublicThreads(@Param('forumSlug') forumSlug: string, @Query('cursor') cursor?: unknown) {
    return this.threadsService.listPublicThreads(forumSlug, cursor);
  }

  @Get(':threadSlug')
  findPublicThread(
    @Param('forumSlug') forumSlug: string,
    @Param('threadSlug') threadSlug: string,
    @Query('cursor') cursor?: unknown,
  ) {
    return this.threadsService.findPublicThread(forumSlug, threadSlug, cursor);
  }

  @Get(':threadSlug/subscription')
  @RequirePermissions(PERMISSIONS.THREAD_SUBSCRIBE)
  getSubscription(
    @Param('forumSlug') forumSlug: string,
    @Param('threadSlug') threadSlug: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.threadsService.getThreadSubscription(
      forumSlug,
      threadSlug,
      request.user!.kurvenfunkUserId,
    );
  }

  @Put(':threadSlug/subscription')
  @RequirePermissions(PERMISSIONS.THREAD_SUBSCRIBE)
  subscribe(
    @Param('forumSlug') forumSlug: string,
    @Param('threadSlug') threadSlug: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.threadsService.subscribeToThread(
      forumSlug,
      threadSlug,
      request.user!.kurvenfunkUserId,
    );
  }

  @Delete(':threadSlug/subscription')
  @RequirePermissions(PERMISSIONS.THREAD_SUBSCRIBE)
  unsubscribe(
    @Param('forumSlug') forumSlug: string,
    @Param('threadSlug') threadSlug: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.threadsService.unsubscribeFromThread(
      forumSlug,
      threadSlug,
      request.user!.kurvenfunkUserId,
    );
  }

  @Post(':threadSlug/posts')
  @RequirePermissions(PERMISSIONS.THREAD_REPLY)
  replyToThread(
    @Param('forumSlug') forumSlug: string,
    @Param('threadSlug') threadSlug: string,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createForumReplySchema)) input: CreateForumReplyInput,
  ) {
    return this.threadsService.replyToThread(
      forumSlug,
      threadSlug,
      request.user!.kurvenfunkUserId,
      input,
    );
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

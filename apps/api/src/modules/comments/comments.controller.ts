import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { createCommentSchema, type CreateCommentInput } from '@kurvenfunk/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { parseCommentPageCursor, parseCommentPageSort } from './comment-pagination';
import { CommentsService } from './comments.service';

@Controller('articles/:articleId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  list(
    @Param('articleId', new ParseUUIDPipe({ version: '4' }))
    articleId: string,
    @Query('sort') sort?: unknown,
    @Query('cursor') cursor?: unknown,
  ) {
    const normalizedSort = parseCommentPageSort(sort);

    const parsedCursor = parseCommentPageCursor(cursor, normalizedSort);

    return this.commentsService.listPageForArticle(articleId, normalizedSort, parsedCursor);
  }

  @Delete(':commentId')
  @UseGuards(AuthGuard)
  remove(
    @Param('articleId', new ParseUUIDPipe({ version: '4' })) articleId: string,
    @Param('commentId', new ParseUUIDPipe({ version: '4' })) commentId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const user = request.user!;

    return this.commentsService.remove({
      articleId,
      commentId,
      authorId: user.kurvenfunkUserId,
      userStatus: user.kurvenfunkUserStatus,
    });
  }

  @Patch(':commentId')
  @UseGuards(AuthGuard)
  update(
    @Param('articleId', new ParseUUIDPipe({ version: '4' })) articleId: string,
    @Param('commentId', new ParseUUIDPipe({ version: '4' })) commentId: string,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createCommentSchema))
    input: CreateCommentInput,
  ) {
    const user = request.user!;

    return this.commentsService.update({
      articleId,
      commentId,
      authorId: user.kurvenfunkUserId,
      body: input.body,
      userStatus: user.kurvenfunkUserStatus,
    });
  }

  @Post(':parentId/replies')
  @UseGuards(AuthGuard)
  createReply(
    @Param('articleId', new ParseUUIDPipe({ version: '4' })) articleId: string,
    @Param('parentId', new ParseUUIDPipe({ version: '4' })) parentId: string,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createCommentSchema))
    input: CreateCommentInput,
  ) {
    const user = request.user!;

    return this.commentsService.createReply({
      articleId,
      parentId,
      authorId: user.kurvenfunkUserId,
      body: input.body,
      userStatus: user.kurvenfunkUserStatus,
    });
  }

  @Post()
  @UseGuards(AuthGuard)
  create(
    @Param('articleId', new ParseUUIDPipe({ version: '4' })) articleId: string,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createCommentSchema))
    input: CreateCommentInput,
  ) {
    const user = request.user!;

    return this.commentsService.create({
      articleId,
      authorId: user.kurvenfunkUserId,
      body: input.body,
      userStatus: user.kurvenfunkUserStatus,
    });
  }
}

import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { createCommentSchema, type CreateCommentInput } from '@kurvenfunk/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { CommentsService } from './comments.service';

@Controller('articles/:articleId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  list(@Param('articleId', new ParseUUIDPipe({ version: '4' })) articleId: string) {
    return this.commentsService.listForArticle(articleId);
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

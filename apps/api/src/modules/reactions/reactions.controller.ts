import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { ReactionsService } from './reactions.service';

const voteSchema = z
  .object({
    type: z.enum(['UPVOTE', 'DOWNVOTE']),
  })
  .strict();

const votersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().uuid().optional(),
});

type VoteInput = z.infer<typeof voteSchema>;
type VotersQuery = z.infer<typeof votersQuerySchema>;

const batchVoteQuerySchema = z.object({
  ids: z
    .string()
    .transform((value) => value.split(','))
    .pipe(z.array(z.string().uuid()).min(1).max(100)),
});

type BatchVoteQuery = z.infer<typeof batchVoteQuerySchema>;

@Controller('reactions')
export class ReactionSummariesController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Get('comments')
  getSummaries(
    @Query(new ZodValidationPipe(batchVoteQuerySchema))
    query: BatchVoteQuery,
  ) {
    return this.reactionsService.getSummaries(query.ids);
  }

  @Get('comments/me')
  @UseGuards(AuthGuard)
  getMySummaries(
    @Query(new ZodValidationPipe(batchVoteQuerySchema))
    query: BatchVoteQuery,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reactionsService.getSummaries(query.ids, request.user!.kurvenfunkUserId);
  }
}

@Controller('comments/:commentId/votes')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Get()
  getSummary(
    @Param('commentId', new ParseUUIDPipe({ version: '4' }))
    commentId: string,
  ) {
    return this.reactionsService.getSummary(commentId);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMyVote(
    @Param('commentId', new ParseUUIDPipe({ version: '4' }))
    commentId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reactionsService.getSummary(commentId, request.user!.kurvenfunkUserId);
  }

  @Get('voters')
  @UseGuards(AuthGuard)
  getVoters(
    @Param('commentId', new ParseUUIDPipe({ version: '4' }))
    commentId: string,
    @Query(new ZodValidationPipe(votersQuerySchema))
    query: VotersQuery,
  ) {
    return this.reactionsService.getVoters(commentId, query.limit, query.cursor);
  }

  @Put()
  @UseGuards(AuthGuard)
  setVote(
    @Param('commentId', new ParseUUIDPipe({ version: '4' }))
    commentId: string,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(voteSchema))
    input: VoteInput,
  ) {
    const user = request.user!;

    return this.reactionsService.setVote({
      commentId,
      userId: user.kurvenfunkUserId,
      userStatus: user.kurvenfunkUserStatus,
      type: input.type,
    });
  }

  @Delete()
  @UseGuards(AuthGuard)
  removeVote(
    @Param('commentId', new ParseUUIDPipe({ version: '4' }))
    commentId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const user = request.user!;

    return this.reactionsService.removeVote({
      commentId,
      userId: user.kurvenfunkUserId,
      userStatus: user.kurvenfunkUserStatus,
    });
  }
}

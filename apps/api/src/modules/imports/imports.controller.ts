import { Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ArticleEditorialGuard } from '../articles/article-editorial.guard';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { ImportsService } from './imports.service';

const importJobListQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

type ImportJobListQuery = z.infer<typeof importJobListQuerySchema>;

@Controller('imports')
@UseGuards(AuthGuard, ArticleEditorialGuard)
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Get('overview')
  getOverview() {
    return this.importsService.getOverview();
  }

  @Get('jobs')
  listJobs(
    @Query(new ZodValidationPipe(importJobListQuerySchema))
    query: ImportJobListQuery,
  ) {
    return this.importsService.listJobs(query);
  }

  @Get('matching-problems')
  getMatchingProblems() {
    return this.importsService.getMatchingProblems();
  }

  @Get('review-queue')
  getReviewQueue() {
    return this.importsService.getReviewQueue();
  }

  @Post('review/:id/approve')
  approveReview(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.importsService.approveReview(id, request.user!.kurvenfunkUserId);
  }

  @Post('review/:id/reject')
  rejectReview(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.importsService.rejectReview(id, request.user!.kurvenfunkUserId);
  }

  @Get('jobs/:id')
  getJob(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.importsService.getJob(id);
  }
}

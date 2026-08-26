import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ArticleEditorialGuard } from '../articles/article-editorial.guard';
import { AuthGuard } from '../auth/auth.guard';
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

  @Get('jobs/:id')
  getJob(@Param('id') id: string) {
    return this.importsService.getJob(id);
  }
}

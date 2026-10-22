import { Body, Controller, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { ReportsService } from './reports.service';

export const createCommentReportSchema = z
  .object({
    reason: z.enum([
      'SPAM',
      'HARASSMENT',
      'HATE_OR_ABUSE',
      'THREAT_OR_VIOLENCE',
      'PRIVACY',
      'IMPERSONATION',
      'ILLEGAL_CONTENT',
      'OFF_TOPIC',
      'MISINFORMATION',
      'OTHER',
    ]),
    details: z.string().trim().min(1).max(1000).optional(),
  })
  .strict();

type CreateCommentReportInput = z.infer<typeof createCommentReportSchema>;

@Controller('comments/:commentId/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(AuthGuard)
  createCommentReport(
    @Param('commentId', new ParseUUIDPipe({ version: '4' }))
    commentId: string,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createCommentReportSchema))
    input: CreateCommentReportInput,
  ) {
    const user = request.user!;

    return this.reportsService.createCommentReport({
      commentId,
      reporterId: user.kurvenfunkUserId,
      userStatus: user.kurvenfunkUserStatus,
      reason: input.reason,
      details: input.details,
    });
  }
}

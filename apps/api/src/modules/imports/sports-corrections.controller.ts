import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';
import { SportsCorrectionsService } from './sports-corrections.service';

const listSchema = z
  .object({
    status: z.enum(['review', 'all']).default('review'),
    limit: z.coerce.number().int().min(1).max(50).default(30),
  })
  .strict();

const candidateSchema = z
  .object({
    entityType: z.enum(['CLUB', 'MATCH']),
    q: z.string().trim().min(2).max(100),
  })
  .strict();

const correctionSchema = z.discriminatedUnion('decision', [
  z
    .object({
      decision: z.literal('MATCH'),
      targetId: z.string().uuid(),
      reason: z.string().trim().min(10).max(500),
      expectedUpdatedAt: z.string().datetime({ offset: true }),
    })
    .strict(),
  z
    .object({
      decision: z.literal('REJECT'),
      reason: z.string().trim().min(10).max(500),
      expectedUpdatedAt: z.string().datetime({ offset: true }),
    })
    .strict(),
]);

@Controller('imports/sports/corrections')
@RequirePermissions(PERMISSIONS.SPORTS_CORRECTION_MANAGE)
export class SportsCorrectionsController {
  constructor(private readonly corrections: SportsCorrectionsService) {}

  @Get()
  list(@Query(new ZodValidationPipe(listSchema)) query: z.infer<typeof listSchema>) {
    return this.corrections.list(query.status, query.limit);
  }

  @Get('candidates')
  candidates(
    @Query(new ZodValidationPipe(candidateSchema)) query: z.infer<typeof candidateSchema>,
  ) {
    return this.corrections.candidates(query.entityType, query.q);
  }

  @Post(':id')
  correct(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(correctionSchema)) input: z.infer<typeof correctionSchema>,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.corrections.correct(id, request.user!.kurvenfunkUserId, input);
  }
}

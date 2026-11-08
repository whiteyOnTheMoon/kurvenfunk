import { isIP } from 'node:net';

import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';

import { TemporaryIpBlockService } from './temporary-ip-block.service';

/**
 * Task 184: SUPERADMIN-only manual network sanctions. Reject unknown fields
 * (particularly forged actor IDs, arbitrary sources and permanent durations).
 * The source IP is processed in memory by the HMAC service and never returned.
 */
export const createManualIpBanSchema = z
  .object({
    ipAddress: z
      .string()
      .max(45)
      .refine((value) => isIP(value) !== 0, 'Invalid IPv4 or IPv6 address.'),
    duration: z.enum(['24H', '3D', '7D', '30D']),
    reasonCode: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[A-Z][A-Z0-9_]*$/),
    moderatorNote: z.string().trim().min(1).max(2000),
  })
  .strict();

export const revokeManualIpBanSchema = z
  .object({
    reasonCode: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[A-Z][A-Z0-9_]*$/),
    moderatorNote: z.string().trim().min(1).max(2000),
  })
  .strict();

type CreateManualIpBan = z.infer<typeof createManualIpBanSchema>;
type RevokeManualIpBan = z.infer<typeof revokeManualIpBanSchema>;

@Controller('moderation/ip-blocks')
export class ManualIpBanController {
  constructor(private readonly blocks: TemporaryIpBlockService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.USER_IPBAN)
  create(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createManualIpBanSchema)) input: CreateManualIpBan,
  ) {
    return this.blocks.issueManual(
      input.ipAddress,
      input.duration,
      request.user!.kurvenfunkUserId,
      input.reasonCode,
      input.moderatorNote,
    );
  }

  @Post(':id/revoke')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.USER_IPBAN)
  revoke(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) blockId: string,
    @Body(new ZodValidationPipe(revokeManualIpBanSchema)) input: RevokeManualIpBan,
  ) {
    return this.blocks.revokeManual(
      blockId,
      request.user!.kurvenfunkUserId,
      input.reasonCode,
      input.moderatorNote,
    );
  }
}

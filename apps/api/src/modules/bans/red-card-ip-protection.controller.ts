import { isIP } from 'node:net';

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';

import { RedCardIpProtectionService } from './red-card-ip-protection.service';

const reason = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[A-Z][A-Z0-9_]*$/);

export const createRedCardIpProtectionSchema = z
  .object({
    ipAddress: z
      .string()
      .max(45)
      .refine((value) => isIP(value) !== 0, 'Invalid IPv4 or IPv6 address.'),
    duration: z.enum(['15M', '1H', '24H']),
    reasonCode: reason,
    moderatorNote: z.string().trim().min(1).max(2000),
    // A network is not a person: the actor explicitly acknowledges collateral risk.
    sharedIpRiskAccepted: z.literal(true),
  })
  .strict();

export const revokeRedCardIpProtectionSchema = z
  .object({
    reasonCode: reason,
    moderatorNote: z.string().trim().min(1).max(2000),
  })
  .strict();

type CreateRedCardIpProtection = z.infer<typeof createRedCardIpProtectionSchema>;
type RevokeRedCardIpProtection = z.infer<typeof revokeRedCardIpProtectionSchema>;

/**
 * Explicit secondary action: issuing a RED account ban does not call this
 * controller, and cannot silently create an IP sanction.
 */
@Controller('moderation/red-cards')
export class RedCardIpProtectionController {
  constructor(private readonly protection: RedCardIpProtectionService) {}

  @Post(':cardId/ip-protection')
  @RequirePermissions(PERMISSIONS.USER_IPBAN)
  create(
    @Req() request: AuthenticatedRequest,
    @Param('cardId', new ParseUUIDPipe({ version: '4' })) cardId: string,
    @Body(new ZodValidationPipe(createRedCardIpProtectionSchema))
    input: CreateRedCardIpProtection,
  ) {
    return this.protection.issue({
      cardId,
      address: input.ipAddress,
      duration: input.duration,
      reasonCode: input.reasonCode,
      moderatorNote: input.moderatorNote,
      sharedIpRiskAccepted: input.sharedIpRiskAccepted,
      actorUserId: request.user!.kurvenfunkUserId,
    });
  }

  @Post(':cardId/ip-protection/:blockId/revoke')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.USER_IPBAN)
  revoke(
    @Req() request: AuthenticatedRequest,
    @Param('cardId', new ParseUUIDPipe({ version: '4' })) cardId: string,
    @Param('blockId', new ParseUUIDPipe({ version: '4' })) blockId: string,
    @Body(new ZodValidationPipe(revokeRedCardIpProtectionSchema))
    input: RevokeRedCardIpProtection,
  ) {
    return this.protection.revoke({
      cardId,
      blockId,
      actorUserId: request.user!.kurvenfunkUserId,
      reasonCode: input.reasonCode,
      moderatorNote: input.moderatorNote,
    });
  }
}

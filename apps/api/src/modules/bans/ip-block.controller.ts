import { isIP } from 'node:net';
import { Body, Controller, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { PERMISSIONS } from '../permissions/permissions.constants';
import { RequirePermissions } from '../permissions/require-permissions.decorator';
import { IpBlockService } from './ip-block.service';

const ipBlockFields = z.object({
  ipAddress: z
    .string()
    .trim()
    .max(45)
    .refine((value) => isIP(value) !== 0, { message: 'Invalid IPv4 or IPv6 address.' }),
  duration: z.enum(['24H', '3D', '7D', '30D']),
  reasonCode: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[A-Z][A-Z0-9_]*$/),
  moderatorNote: z.string().trim().min(1).max(2000),
});

export const createManualIpBlockSchema = ipBlockFields
  .extend({ userId: z.string().uuid().optional() })
  .strict();

export const createRedCardIpBlockSchema = ipBlockFields.strict();

type ManualInput = z.infer<typeof createManualIpBlockSchema>;
type RedCardInput = z.infer<typeof createRedCardIpBlockSchema>;

@Controller('moderation/ip-blocks')
export class IpBlockController {
  constructor(private readonly blocks: IpBlockService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.USER_IPBAN)
  createManual(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createManualIpBlockSchema)) input: ManualInput,
  ) {
    return this.blocks.create({
      ...input,
      actorId: request.user!.kurvenfunkUserId,
    });
  }
}

/** IP protection is an explicit additional decision, never automatic on every RED. */
@Controller('moderation/red-cards/:cardId/ip-protection')
export class RedCardIpBlockController {
  constructor(private readonly blocks: IpBlockService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.USER_IPBAN)
  addProtection(
    @Req() request: AuthenticatedRequest,
    @Param('cardId', new ParseUUIDPipe({ version: '4' })) cardId: string,
    @Body(new ZodValidationPipe(createRedCardIpBlockSchema)) input: RedCardInput,
  ) {
    return this.blocks.create({
      ...input,
      sourceCardId: cardId,
      actorId: request.user!.kurvenfunkUserId,
    });
  }
}

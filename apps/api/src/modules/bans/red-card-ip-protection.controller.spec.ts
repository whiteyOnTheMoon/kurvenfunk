import 'reflect-metadata';

import type { AuthenticatedRequest } from '../auth/auth.types';
import {
  PERMISSIONS,
  REQUIRED_PERMISSIONS_METADATA_KEY,
} from '../permissions/permissions.constants';
import { PermissionsService } from '../permissions/permissions.service';

import {
  createRedCardIpProtectionSchema,
  revokeRedCardIpProtectionSchema,
  RedCardIpProtectionController,
} from './red-card-ip-protection.controller';
import type { RedCardIpProtectionService } from './red-card-ip-protection.service';

const CARD = '11111111-1111-4111-8111-111111111111';
const BLOCK = '22222222-2222-4222-8222-222222222222';
const ACTOR = '33333333-3333-4333-8333-333333333333';
const input = {
  ipAddress: '192.0.2.185',
  duration: '15M',
  reasonCode: 'BAN_EVASION',
  moderatorNote: 'Private evidence',
  sharedIpRiskAccepted: true,
} as const;

describe('Task 185 red-card IP protection controller', () => {
  it.each(['create', 'revoke'] as const)(
    'requires SUPERADMIN-only user.ipban permission for %s',
    (action) => {
      const descriptor = Object.getOwnPropertyDescriptor(
        RedCardIpProtectionController.prototype,
        action,
      );
      const handler: unknown = descriptor?.value;
      expect(typeof handler).toBe('function');
      const metadata: unknown = Reflect.getMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, handler);
      expect(metadata).toEqual([PERMISSIONS.USER_IPBAN]);

      const permissions = new PermissionsService();
      expect(
        permissions.hasPermission({ status: 'ACTIVE', roles: ['SUPERADMIN'] }, PERMISSIONS.USER_IPBAN),
      ).toBe(true);
      for (const role of ['USER', 'MODERATOR', 'ADMIN'] as const) {
        expect(
          permissions.hasPermission({ status: 'ACTIVE', roles: [role] }, PERMISSIONS.USER_IPBAN),
        ).toBe(false);
      }
    },
  );

  it('requires risk acknowledgement, bounded duration, strict fields and IP syntax', () => {
    expect(createRedCardIpProtectionSchema.safeParse(input).success).toBe(true);
    for (const invalid of [
      { ...input, sharedIpRiskAccepted: false },
      { ...input, sharedIpRiskAccepted: undefined },
      { ...input, duration: 'PERMANENT' },
      { ...input, duration: '3D' },
      { ...input, ipAddress: 'invalid IP' },
      { ...input, moderatorNote: ' ' },
      { ...input, reasonCode: 'invalid reason' },
      { ...input, actorUserId: ACTOR },
      { ...input, ipHash: 'f'.repeat(64) },
      { ...input, source: 'MANUAL' },
    ]) {
      expect(createRedCardIpProtectionSchema.safeParse(invalid).success).toBe(false);
    }
    expect(
      revokeRedCardIpProtectionSchema.safeParse({
        reasonCode: 'FALSE_POSITIVE',
        moderatorNote: 'Evidence',
      }).success,
    ).toBe(true);
    expect(
      revokeRedCardIpProtectionSchema.safeParse({
        reasonCode: 'FALSE_POSITIVE',
        moderatorNote: 'Evidence',
        actorUserId: ACTOR,
      }).success,
    ).toBe(false);
  });

  it('derives actor from authentication and forwards the explicit card link', async () => {
    const issue = jest.fn().mockResolvedValue({ id: BLOCK });
    const revoke = jest.fn().mockResolvedValue({ id: BLOCK, active: false });
    const controller = new RedCardIpProtectionController({
      issue,
      revoke,
    } as unknown as RedCardIpProtectionService);
    const request = {
      user: { kurvenfunkUserId: ACTOR },
    } as unknown as AuthenticatedRequest;

    await controller.create(request, CARD, input);
    expect(issue).toHaveBeenCalledWith({
      cardId: CARD,
      address: input.ipAddress,
      duration: input.duration,
      reasonCode: input.reasonCode,
      moderatorNote: input.moderatorNote,
      sharedIpRiskAccepted: true,
      actorUserId: ACTOR,
    });

    await controller.revoke(request, CARD, BLOCK, {
      reasonCode: 'FALSE_POSITIVE',
      moderatorNote: 'Private reason',
    });
    expect(revoke).toHaveBeenCalledWith({
      cardId: CARD,
      blockId: BLOCK,
      actorUserId: ACTOR,
      reasonCode: 'FALSE_POSITIVE',
      moderatorNote: 'Private reason',
    });
  });
});

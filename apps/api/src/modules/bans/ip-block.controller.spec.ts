import 'reflect-metadata';
import type { AuthenticatedRequest } from '../auth/auth.types';
import {
  PERMISSIONS,
  REQUIRED_PERMISSIONS_METADATA_KEY,
} from '../permissions/permissions.constants';
import { PermissionsService } from '../permissions/permissions.service';

import {
  createManualIpBlockSchema,
  createRedCardIpBlockSchema,
  IpBlockController,
  RedCardIpBlockController,
} from './ip-block.controller';
import type { IpBlockService } from './ip-block.service';

jest.mock('./ip-block.service', () => ({
  IpBlockService: jest.fn(),
}));
jest.mock('../auth/auth.guard', () => ({
  AuthGuard: jest.fn(),
}));

const MODERATOR = '11111111-1111-4111-8111-111111111111';
const CARD_ID = '22222222-2222-4222-8222-222222222222';

const payload = {
  ipAddress: '203.0.113.18',
  duration: '3D' as const,
  reasonCode: 'REPEATED_ABUSE',
  moderatorNote: 'Private incident evidence',
};

function permissionOf(controller: object, method: string): unknown {
  const handler: unknown = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(controller) as object,
    method,
  )?.value;
  if (typeof handler !== 'function') throw new Error('Missing protected handler');
  return Reflect.getMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, handler) as unknown;
}

describe('IP block permissions and source validation', () => {
  it('requires user.ipban for both manual and RED-associated blocks', () => {
    const blocks = { create: jest.fn() } as unknown as IpBlockService;
    expect(permissionOf(new IpBlockController(blocks), 'createManual')).toEqual([
      PERMISSIONS.USER_IPBAN,
    ]);
    expect(permissionOf(new RedCardIpBlockController(blocks), 'addProtection')).toEqual([
      PERMISSIONS.USER_IPBAN,
    ]);
  });

  it('reserves IP bans for SUPERADMIN, not MODERATOR or ADMIN', () => {
    const service = new PermissionsService();
    expect(
      service.hasPermission({ roles: ['MODERATOR'], status: 'ACTIVE' }, PERMISSIONS.USER_IPBAN),
    ).toBe(false);
    expect(
      service.hasPermission({ roles: ['ADMIN'], status: 'ACTIVE' }, PERMISSIONS.USER_IPBAN),
    ).toBe(false);
    expect(
      service.hasPermission({ roles: ['SUPERADMIN'], status: 'ACTIVE' }, PERMISSIONS.USER_IPBAN),
    ).toBe(true);
  });

  it('binds a manual block to the authenticated actor', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'block' });
    const controller = new IpBlockController({ create } as unknown as IpBlockService);
    await controller.createManual(
      {
        user: { kurvenfunkUserId: MODERATOR },
      } as unknown as AuthenticatedRequest,
      payload,
    );

    expect(create).toHaveBeenCalledWith({ ...payload, actorId: MODERATOR });
  });

  it('requires the trusted red card path param, not a spoofed sourceCardId', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'block' });
    const controller = new RedCardIpBlockController({ create } as unknown as IpBlockService);

    await controller.addProtection(
      {
        user: { kurvenfunkUserId: MODERATOR },
      } as unknown as AuthenticatedRequest,
      CARD_ID,
      payload,
    );

    expect(create).toHaveBeenCalledWith({
      ...payload,
      sourceCardId: CARD_ID,
      actorId: MODERATOR,
    });
  });

  it('accepts valid IPv4/IPv6 with a finite duration', () => {
    expect(createManualIpBlockSchema.safeParse(payload).success).toBe(true);
    expect(
      createManualIpBlockSchema.safeParse({ ...payload, ipAddress: '2001:db8::1' }).success,
    ).toBe(true);
  });

  it('rejects spoofing, invalid IPs and permanent blocks', () => {
    expect(createManualIpBlockSchema.safeParse({ ...payload, actorId: MODERATOR }).success).toBe(
      false,
    );
    expect(createManualIpBlockSchema.safeParse({ ...payload, ipAddress: 'not-ip' }).success).toBe(
      false,
    );
    expect(createManualIpBlockSchema.safeParse({ ...payload, duration: 'PERMANENT' }).success).toBe(
      false,
    );
    expect(createRedCardIpBlockSchema.safeParse({ ...payload, userId: MODERATOR }).success).toBe(
      false,
    );
    expect(
      createRedCardIpBlockSchema.safeParse({ ...payload, sourceCardId: CARD_ID }).success,
    ).toBe(false);
  });
});

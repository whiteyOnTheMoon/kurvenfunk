import 'reflect-metadata';

jest.mock('./limited-sanctions.service', () => ({
  LimitedSanctionsService: jest.fn(),
}));

import type { AuthenticatedRequest } from '../auth/auth.types';
import {
  PERMISSIONS,
  REQUIRED_PERMISSIONS_METADATA_KEY,
} from '../permissions/permissions.constants';

import { LimitedSanctionsController, limitedSanctionSchema } from './limited-sanctions.controller';
import type { LimitedSanctionsService } from './limited-sanctions.service';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const MODERATOR_ID = '22222222-2222-4222-8222-222222222222';

const valid = {
  userId: USER_ID,
  duration: '7D' as const,
  reasonCode: 'REPEATED_ABUSE',
  moderatorNote: 'Internal moderation evidence',
};

describe('LimitedSanctionsController', () => {
  it('requires user.limit permission', () => {
    const handler: unknown = Object.getOwnPropertyDescriptor(
      LimitedSanctionsController.prototype,
      'create',
    )?.value;

    if (typeof handler !== 'function') {
      throw new Error('LIMITED endpoint missing');
    }

    const metadata: unknown = Reflect.getMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, handler);
    expect(metadata).toEqual([PERMISSIONS.USER_LIMIT]);
  });

  it('binds the moderator from the authenticated request', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'test-sanction' });
    const controller = new LimitedSanctionsController({
      create,
    } as unknown as LimitedSanctionsService);
    const request = {
      user: { kurvenfunkUserId: MODERATOR_ID },
    } as unknown as AuthenticatedRequest;

    await controller.create(request, valid);

    expect(create).toHaveBeenCalledWith({ ...valid, moderatorId: MODERATOR_ID });
  });
});

describe('Limited sanction input validation', () => {
  it.each(['24H', '3D', '7D', '30D'] as const)('accepts %s duration', (duration) => {
    expect(limitedSanctionSchema.safeParse({ ...valid, duration }).success).toBe(true);
  });

  it('rejects arbitrary durations, unexpected moderatorId and malformed reasons', () => {
    expect(limitedSanctionSchema.safeParse({ ...valid, duration: 'FOREVER' }).success).toBe(false);
    expect(limitedSanctionSchema.safeParse({ ...valid, moderatorId: MODERATOR_ID }).success).toBe(
      false,
    );
    expect(limitedSanctionSchema.safeParse({ ...valid, reasonCode: 'bad reason' }).success).toBe(
      false,
    );
  });

  it('requires nonempty internal notes and valid target UUID', () => {
    expect(limitedSanctionSchema.safeParse({ ...valid, moderatorNote: '  ' }).success).toBe(false);
    expect(limitedSanctionSchema.safeParse({ ...valid, userId: 'other-user' }).success).toBe(false);
  });
});

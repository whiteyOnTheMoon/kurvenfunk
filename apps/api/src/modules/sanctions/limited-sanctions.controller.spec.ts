import 'reflect-metadata';

jest.mock('./limited-sanctions.service', () => ({
  LimitedSanctionsService: jest.fn(),
}));

jest.mock('../auth/auth.guard', () => ({
  AuthGuard: jest.fn(),
}));

import type { AuthenticatedRequest } from '../auth/auth.types';
import {
  PERMISSIONS,
  REQUIRED_PERMISSIONS_METADATA_KEY,
} from '../permissions/permissions.constants';
import {
  createLimitedSanctionSchema,
  LimitedSanctionsController,
} from './limited-sanctions.controller';
import type { LimitedSanctionsService } from './limited-sanctions.service';

const TARGET = '11111111-1111-4111-8111-111111111111';
const ACTOR = '22222222-2222-4222-8222-222222222222';

const payload = {
  userId: TARGET,
  duration: '24H' as const,
  reasonCode: 'SPAM',
  moderatorNote: 'Private evidence',
};

describe('Limited sanctions controller', () => {
  it('requires user.limit', () => {
    const handler: unknown = Object.getOwnPropertyDescriptor(
      LimitedSanctionsController.prototype,
      'create',
    )?.value;
    if (typeof handler !== 'function') {
      throw new Error('Limited sanction handler missing');
    }
    const metadata: unknown = Reflect.getMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, handler);
    expect(metadata).toEqual([PERMISSIONS.USER_LIMIT]);
  });

  it('derives actor ID only from the verified request', async () => {
    const issue = jest.fn().mockResolvedValue({ id: 'sanction' });
    const controller = new LimitedSanctionsController({
      issue,
    } as unknown as LimitedSanctionsService);
    const request = { user: { kurvenfunkUserId: ACTOR } } as unknown as AuthenticatedRequest;

    await controller.create(request, payload);

    expect(issue).toHaveBeenCalledWith({ ...payload, moderatorId: ACTOR });
  });
});

describe('Limited sanction input', () => {
  it.each(['24H', '3D', '7D', '30D'] as const)('accepts %s', (duration) => {
    expect(createLimitedSanctionSchema.safeParse({ ...payload, duration }).success).toBe(true);
  });

  it('rejects unknown duration', () => {
    expect(createLimitedSanctionSchema.safeParse({ ...payload, duration: 'FOREVER' }).success).toBe(
      false,
    );
  });

  it('rejects actor spoofing, extra fields, missing notes, and invalid reasons', () => {
    expect(createLimitedSanctionSchema.safeParse({ ...payload, moderatorId: ACTOR }).success).toBe(
      false,
    );
    expect(createLimitedSanctionSchema.safeParse({ ...payload, moderatorNote: ' ' }).success).toBe(
      false,
    );
    expect(
      createLimitedSanctionSchema.safeParse({ ...payload, reasonCode: 'Invalid reason' }).success,
    ).toBe(false);
    expect(
      createLimitedSanctionSchema.safeParse({ ...payload, expiresAt: '2028-01-01' }).success,
    ).toBe(false);
  });
});

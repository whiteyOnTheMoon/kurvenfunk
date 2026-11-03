import 'reflect-metadata';

// Isolate the controller from the real database service.
jest.mock('./moderation.service', () => ({
  ModerationService: jest.fn(),
}));

// Isolate controller tests from Keycloak and database dependencies.
jest.mock('../auth/auth.guard', () => ({
  AuthGuard: jest.fn(),
}));

import type { AuthenticatedRequest } from '../auth/auth.types';
import {
  PERMISSIONS,
  REQUIRED_PERMISSIONS_METADATA_KEY,
} from '../permissions/permissions.constants';

import { createYellowCardSchema, ModerationController } from './moderation.controller';

import type { ModerationService } from './moderation.service';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const MODERATOR_ID = '22222222-2222-4222-8222-222222222222';

const validInput = {
  userId: USER_ID,
  reasonCode: 'SPAM',
  moderatorNote: 'Internal note',
  sourceType: 'NONE' as const,
};

describe('Yellow Card Controller', () => {
  it('requires user.warn permission', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      ModerationController.prototype,
      'createYellowCard',
    );

    const handler: unknown = descriptor?.value;

    if (typeof handler !== 'function') {
      throw new Error('Yellow card handler missing');
    }

    const metadata: unknown = Reflect.getMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, handler);

    expect(metadata).toEqual([PERMISSIONS.USER_WARN]);
  });

  it('uses the authenticated moderator ID', async () => {
    const createYellowCard = jest.fn().mockResolvedValue({
      id: 'created-card',
    });

    const controller = new ModerationController({
      createYellowCard,
    } as unknown as ModerationService);

    const request = {
      user: {
        kurvenfunkUserId: MODERATOR_ID,
      },
    } as unknown as AuthenticatedRequest;

    await controller.createYellowCard(request, validInput);

    expect(createYellowCard).toHaveBeenCalledWith({
      ...validInput,
      moderatorId: MODERATOR_ID,
    });
  });
});

describe('Yellow Card Input Validation', () => {
  it('accepts valid input', () => {
    expect(createYellowCardSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects invalid user IDs', () => {
    expect(
      createYellowCardSchema.safeParse({
        ...validInput,
        userId: 'invalid',
      }).success,
    ).toBe(false);
  });

  it('rejects empty moderator notes', () => {
    expect(
      createYellowCardSchema.safeParse({
        ...validInput,
        moderatorNote: ' ',
      }).success,
    ).toBe(false);
  });

  it('rejects unexpected moderator IDs', () => {
    expect(
      createYellowCardSchema.safeParse({
        ...validInput,
        moderatorId: MODERATOR_ID,
      }).success,
    ).toBe(false);
  });

  it('rejects sources without IDs', () => {
    expect(
      createYellowCardSchema.safeParse({
        ...validInput,
        sourceType: 'COMMENT',
      }).success,
    ).toBe(false);
  });

  it('rejects malformed reasons', () => {
    expect(
      createYellowCardSchema.safeParse({
        ...validInput,
        reasonCode: 'invalid reason',
      }).success,
    ).toBe(false);
  });
});

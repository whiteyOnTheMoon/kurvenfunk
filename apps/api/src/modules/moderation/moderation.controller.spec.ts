import 'reflect-metadata';

// Isolate the controller from the real database service.
jest.mock('./moderation.service', () => ({
  ModerationService: jest.fn(),
}));
jest.mock('./direct-red-card.service', () => ({
  DirectRedCardService: jest.fn(),
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

import {
  createDirectRedCardSchema,
  createYellowCardSchema,
  DirectRedCardController,
  ModerationController,
} from './moderation.controller';

import type { DirectRedCardService } from './direct-red-card.service';
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

describe('Direct Red Card Controller', () => {
  it('requires user.ban, not user.warn', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      DirectRedCardController.prototype,
      'createDirectRedCard',
    );
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_METADATA_KEY, descriptor?.value)).toEqual([
      PERMISSIONS.USER_BAN,
    ]);
  });

  it('forwards the authenticated actor, never a client-supplied moderatorId', async () => {
    const createDirectRedCard = jest.fn().mockResolvedValue({ id: 'new-red' });
    const controller = new DirectRedCardController({
      createDirectRedCard,
    } as unknown as DirectRedCardService);
    const request = {
      user: { kurvenfunkUserId: MODERATOR_ID },
    } as unknown as AuthenticatedRequest;

    await controller.createDirectRedCard(request, validInput);

    expect(createDirectRedCard).toHaveBeenCalledWith({
      ...validInput,
      moderatorId: MODERATOR_ID,
    });
  });

  it('keeps standard MODERATOR roles from having user.ban', () => {
    const { PermissionsService } = jest.requireActual('../permissions/permissions.service') as
      typeof import('../permissions/permissions.service');
    const permissions = new PermissionsService();
    expect(permissions.hasPermission({ status: 'ACTIVE', roles: ['MODERATOR'] }, PERMISSIONS.USER_BAN))
      .toBe(false);
    expect(permissions.hasPermission({ status: 'ACTIVE', roles: ['ADMIN'] }, PERMISSIONS.USER_BAN))
      .toBe(true);
  });
});

describe('Direct Red Card Validation', () => {
  it('accepts a direct account-level red card', () => {
    expect(createDirectRedCardSchema.safeParse(validInput).success).toBe(true);
  });

  it('defaults sourceType to NONE', () => {
    expect(createDirectRedCardSchema.parse({
      userId: USER_ID,
      reasonCode: 'ABUSE',
      moderatorNote: 'Evidence retained',
    }).sourceType).toBe('NONE');
  });

  it('rejects malformed reasons, empty notes and spoofed actor IDs', () => {
    expect(createDirectRedCardSchema.safeParse({ ...validInput, reasonCode: 'bad reason' }).success)
      .toBe(false);
    expect(createDirectRedCardSchema.safeParse({ ...validInput, moderatorNote: '  ' }).success)
      .toBe(false);
    expect(createDirectRedCardSchema.safeParse({ ...validInput, moderatorId: MODERATOR_ID }).success)
      .toBe(false);
  });

  it('rejects source IDs without a source, and sources without an ID', () => {
    expect(createDirectRedCardSchema.safeParse({ ...validInput, sourceId: USER_ID }).success)
      .toBe(false);
    expect(createDirectRedCardSchema.safeParse({ ...validInput, sourceType: 'COMMENT' }).success)
      .toBe(false);
  });

  it('does not allow direct-red expiration timestamps', () => {
    expect(createDirectRedCardSchema.safeParse({
      ...validInput,
      expiresAt: '2027-01-01T00:00:00Z',
    }).success).toBe(false);
  });
});

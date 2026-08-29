jest.mock('@kurvenfunk/validation', () => ({
  createCommentSchema: {
    safeParse: (value: unknown) => ({
      success: true,
      data: value,
    }),
  },
}));

jest.mock('../auth/auth.guard', () => ({
  AuthGuard: class AuthGuard {
    canActivate() {
      return true;
    }
  },
}));

jest.mock('./comments.service', () => ({
  CommentsService: class CommentsService {},
}));

import type { AuthenticatedRequest } from '../auth/auth.types';
import { CommentsController } from './comments.controller';
import type { CommentsService } from './comments.service';

describe('CommentsController', () => {
  const create = jest.fn();

  const commentsService = {
    create,
  } as unknown as CommentsService;

  const controller = new CommentsController(commentsService);

  beforeEach(() => {
    create.mockReset();
  });

  it('passes the authenticated Kurvenfunk user to the service', async () => {
    create.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
    });

    const request = {
      user: {
        sub: 'keycloak-user',
        kurvenfunkUserId: '33333333-3333-4333-8333-333333333333',
        kurvenfunkUserStatus: 'ACTIVE',
        kurvenfunkFanPreference: 'NEUTRAL',
        kurvenfunkFavoriteClubId: null,
        kurvenfunkOnboardingCompleted: true,
        kurvenfunkRoles: ['USER'],
      },
    } as AuthenticatedRequest;

    await controller.create('11111111-1111-4111-8111-111111111111', request, {
      body: 'Rapid spielt heute stark.',
    });

    expect(create).toHaveBeenCalledWith({
      articleId: '11111111-1111-4111-8111-111111111111',
      authorId: '33333333-3333-4333-8333-333333333333',
      body: 'Rapid spielt heute stark.',
      userStatus: 'ACTIVE',
    });
  });
});

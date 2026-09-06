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
  const createReply = jest.fn();
  const update = jest.fn();
  const listForArticle = jest.fn();

  const commentsService = {
    create,
    createReply,
    update,
    listForArticle,
  } as unknown as CommentsService;

  const controller = new CommentsController(commentsService);

  beforeEach(() => {
    create.mockReset();
    createReply.mockReset();
    update.mockReset();
    listForArticle.mockReset();
  });

  it('lists comments for the requested article', async () => {
    listForArticle.mockResolvedValue([]);

    await controller.list('11111111-1111-4111-8111-111111111111');

    expect(listForArticle).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111');
  });

  it('passes edit data and the authenticated user to the service', async () => {
    update.mockResolvedValue({
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

    await controller.update(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      request,
      {
        body: 'Rapid spielt heute sehr stark.',
      },
    );

    expect(update).toHaveBeenCalledWith({
      articleId: '11111111-1111-4111-8111-111111111111',
      commentId: '22222222-2222-4222-8222-222222222222',
      authorId: '33333333-3333-4333-8333-333333333333',
      body: 'Rapid spielt heute sehr stark.',
      userStatus: 'ACTIVE',
    });
  });

  it('passes reply data and the authenticated user to the service', async () => {
    createReply.mockResolvedValue({
      id: '44444444-4444-4444-8444-444444444444',
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

    await controller.createReply(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      request,
      {
        body: 'Das sehe ich genauso.',
      },
    );

    expect(createReply).toHaveBeenCalledWith({
      articleId: '11111111-1111-4111-8111-111111111111',
      parentId: '22222222-2222-4222-8222-222222222222',
      authorId: '33333333-3333-4333-8333-333333333333',
      body: 'Das sehe ich genauso.',
      userStatus: 'ACTIVE',
    });
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

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
  const remove = jest.fn();
  const listPageForArticle = jest.fn();

  const commentsService = {
    create,
    createReply,
    update,
    remove,
    listPageForArticle,
  } as unknown as CommentsService;

  const controller = new CommentsController(commentsService);

  beforeEach(() => {
    create.mockReset();
    createReply.mockReset();
    update.mockReset();
    remove.mockReset();
    listPageForArticle.mockReset();
  });

  describe('paginated comment listing', () => {
    const articleId = '11111111-1111-4111-8111-111111111111';

    it('defaults to newest sorting', async () => {
      const result = {
        items: [],
        pagination: {
          nextCursor: null,
          hasNextPage: false,
        },
      };

      listPageForArticle.mockResolvedValue(result);

      expect(await controller.list(articleId)).toEqual(result);

      expect(listPageForArticle).toHaveBeenCalledWith(articleId, 'newest', null);
    });

    it('supports oldest sorting', async () => {
      await controller.list(articleId, 'oldest');

      expect(listPageForArticle).toHaveBeenCalledWith(articleId, 'oldest', null);
    });

    it('supports popular sorting', async () => {
      await controller.list(articleId, 'popular');

      expect(listPageForArticle).toHaveBeenCalledWith(articleId, 'popular', null);
    });

    it('passes a decoded cursor to the service', async () => {
      const cursorData = {
        version: 1,
        sort: 'popular',
        id: '22222222-2222-4222-8222-222222222222',
        createdAt: '2026-10-14T12:00:00.000Z',
        score: 5,
      };

      const cursor = Buffer.from(JSON.stringify(cursorData)).toString('base64url');

      await controller.list(articleId, 'popular', cursor);

      expect(listPageForArticle).toHaveBeenCalledWith(articleId, 'popular', cursorData);
    });

    it('rejects unsupported sorting modes', () => {
      expect(() => controller.list(articleId, 'random')).toThrow();

      expect(listPageForArticle).not.toHaveBeenCalled();
    });

    it('rejects malformed cursors', () => {
      expect(() => controller.list(articleId, 'newest', 'invalid!')).toThrow();

      expect(listPageForArticle).not.toHaveBeenCalled();
    });

    it('rejects cursors from another sorting mode', () => {
      const cursor = Buffer.from(
        JSON.stringify({
          version: 1,
          sort: 'popular',
          id: '22222222-2222-4222-8222-222222222222',
          createdAt: '2026-10-14T12:00:00.000Z',
          score: 5,
        }),
      ).toString('base64url');

      expect(() => controller.list(articleId, 'newest', cursor)).toThrow();

      expect(listPageForArticle).not.toHaveBeenCalled();
    });
  });

  it('passes delete data and the authenticated user to the service', async () => {
    remove.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      deleted: true,
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

    await controller.remove(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      request,
    );

    expect(remove).toHaveBeenCalledWith({
      articleId: '11111111-1111-4111-8111-111111111111',
      commentId: '22222222-2222-4222-8222-222222222222',
      authorId: '33333333-3333-4333-8333-333333333333',
      userStatus: 'ACTIVE',
    });
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

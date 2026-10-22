jest.mock('../auth/auth.guard', () => ({
  AuthGuard: class MockAuthGuard {
    canActivate() {
      return true;
    }
  },
}));

jest.mock('./reactions.service', () => ({
  ReactionsService: class MockReactionsService {},
}));

import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { ReactionSummariesController, ReactionsController } from './reactions.controller';
import type { ReactionsService } from './reactions.service';

describe('Voting controllers', () => {
  const commentId = '11111111-1111-4111-8111-111111111111';
  const userId = '22222222-2222-4222-8222-222222222222';

  const summary = {
    commentId,
    upvotes: 3,
    downvotes: 1,
    score: 2,
    viewerVote: 'UPVOTE' as const,
  };

  const service = {
    getSummary: jest.fn(),
    getSummaries: jest.fn(),
    setVote: jest.fn(),
    removeVote: jest.fn(),
    getVoters: jest.fn(),
  };

  const request = {
    user: {
      kurvenfunkUserId: userId,
      kurvenfunkUserStatus: 'ACTIVE',
    },
  } as unknown as AuthenticatedRequest;

  let votesController: ReactionsController;
  let summariesController: ReactionSummariesController;

  beforeEach(() => {
    jest.clearAllMocks();

    const reactionsService = service as unknown as ReactionsService;

    votesController = new ReactionsController(reactionsService);
    summariesController = new ReactionSummariesController(reactionsService);

    service.getSummary.mockResolvedValue(summary);
    service.getSummaries.mockResolvedValue([summary]);
    service.setVote.mockResolvedValue(summary);
    service.removeVote.mockResolvedValue(summary);
    service.getVoters.mockResolvedValue({
      commentId,
      type: 'UPVOTE',
      items: [],
      nextCursor: null,
    });
  });

  it('provides public voting totals without a user ID', async () => {
    await votesController.getSummary(commentId);

    expect(service.getSummary).toHaveBeenCalledWith(commentId);
  });

  it('requests the authenticated users own vote', async () => {
    await votesController.getMyVote(commentId, request);

    expect(service.getSummary).toHaveBeenCalledWith(commentId, userId);
  });

  it('passes the authenticated user to the vote service', async () => {
    await votesController.setVote(commentId, request, {
      type: 'UPVOTE',
    });

    expect(service.setVote).toHaveBeenCalledWith({
      commentId,
      userId,
      userStatus: 'ACTIVE',
      type: 'UPVOTE',
    });
  });

  it('passes the authenticated user when removing a vote', async () => {
    await votesController.removeVote(commentId, request);

    expect(service.removeVote).toHaveBeenCalledWith({
      commentId,
      userId,
      userStatus: 'ACTIVE',
    });
  });

  it('loads a paginated chronological voter list', async () => {
    const cursor = '33333333-3333-4333-8333-333333333333';

    await votesController.getVoters(commentId, {
      limit: 20,
      cursor,
    });

    expect(service.getVoters).toHaveBeenCalledWith(commentId, 20, cursor);
  });

  it('does not send a user ID for public batch summaries', async () => {
    await summariesController.getSummaries({
      ids: [commentId],
    });

    expect(service.getSummaries).toHaveBeenCalledWith([commentId]);
  });

  it('includes the authenticated user for personal batch summaries', async () => {
    await summariesController.getMySummaries({ ids: [commentId] }, request);

    expect(service.getSummaries).toHaveBeenCalledWith([commentId], userId);
  });

  describe('voting route protection', () => {
    it.each([
      ['setVote', ReactionsController.prototype, 'setVote'],
      ['removeVote', ReactionsController.prototype, 'removeVote'],
      ['getMyVote', ReactionsController.prototype, 'getMyVote'],
      ['getVoters', ReactionsController.prototype, 'getVoters'],
      ['getMySummaries', ReactionSummariesController.prototype, 'getMySummaries'],
    ] as const)('protects %s using AuthGuard', (_name, prototype, methodName) => {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, methodName);

      expect(descriptor).toBeDefined();

      const guards = Reflect.getMetadata(GUARDS_METADATA, descriptor?.value as object) as unknown;

      expect(Array.isArray(guards)).toBe(true);
      expect(guards).toContain(AuthGuard);
    });
  });
});

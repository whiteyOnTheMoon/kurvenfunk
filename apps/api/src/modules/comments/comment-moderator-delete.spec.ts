const findUnique = jest.fn();
const updateMany = jest.fn();
const createAudit = jest.fn();
const transaction = jest.fn();
const disconnect = jest.fn();

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => ({
    $transaction: transaction,
    $disconnect: disconnect,
  }),
}));

import { CommentsService } from './comments.service';
import type { CommentSpamProtectionService } from './comment-spam-protection.service';

describe('Task 166: audited moderator comment deletion', () => {
  const commentId = '11111111-1111-4111-8111-111111111111';
  const moderatorId = '22222222-2222-4222-8222-222222222222';
  const authorId = '33333333-3333-4333-8333-333333333333';
  const articleId = '44444444-4444-4444-8444-444444444444';
  const command = { commentId, moderatorId, reason: 'Communityregel verletzt' };

  let service: CommentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        comment: { findUnique, updateMany },
        auditLog: { create: createAudit },
      }),
    );
    findUnique.mockResolvedValue({
      id: commentId,
      articleId,
      authorId,
      status: 'VISIBLE',
      deletedAt: null,
    });
    updateMany.mockResolvedValue({ count: 1 });
    createAudit.mockResolvedValue({ id: 'audit-id' });
    service = new CommentsService({} as CommentSpamProtectionService);
  });

  it('soft-deletes and atomically audits a moderator action', async () => {
    await expect(service.moderateRemove(command)).resolves.toEqual({
      id: commentId,
      deleted: true,
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: commentId, status: 'VISIBLE', deletedAt: null },
      data: {
        status: 'DELETED',
        deletedAt: expect.any(Date),
        moderatedAt: expect.any(Date),
      },
    });
    expect(createAudit).toHaveBeenCalledWith({
      data: {
        actorType: 'USER',
        actorUserId: moderatorId,
        action: 'COMMENT_DELETED_BY_MODERATOR',
        category: 'MODERATION',
        targetType: 'COMMENT',
        targetId: commentId,
        targetUserId: authorId,
        reason: command.reason,
        metadata: { articleId },
      },
    });
    expect(updateMany.mock.invocationCallOrder[0]).toBeLessThan(
      createAudit.mock.invocationCallOrder[0]!,
    );
  });

  it('rejects an unknown comment without writing an audit event', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.moderateRemove(command)).rejects.toMatchObject({
      response: { code: 'COMMENT_NOT_FOUND' },
    });

    expect(updateMany).not.toHaveBeenCalled();
    expect(createAudit).not.toHaveBeenCalled();
  });

  it('does not moderate a previously deleted comment', async () => {
    findUnique.mockResolvedValue({
      id: commentId,
      articleId,
      authorId,
      status: 'DELETED',
      deletedAt: new Date(),
    });

    await expect(service.moderateRemove(command)).rejects.toMatchObject({
      response: { code: 'COMMENT_NOT_FOUND' },
    });
    expect(createAudit).not.toHaveBeenCalled();
  });

  it('does not write an audit event when a concurrent delete wins', async () => {
    updateMany.mockResolvedValue({ count: 0 });

    await expect(service.moderateRemove(command)).rejects.toMatchObject({
      response: { code: 'COMMENT_NOT_FOUND' },
    });
    expect(createAudit).not.toHaveBeenCalled();
  });

  it('propagates an audit database failure so the transaction can roll back', async () => {
    createAudit.mockRejectedValue(new Error('AUDIT_STORAGE_UNAVAILABLE'));

    await expect(service.moderateRemove(command)).rejects.toThrow(
      'AUDIT_STORAGE_UNAVAILABLE',
    );
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});

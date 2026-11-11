import type { Prisma } from '@kurvenfunk/database';
import { ConflictException } from '@nestjs/common';

import { canonicalClubForumSlug, provisionClubForum } from './club-forum-provisioning';

const findCategory = jest.fn();
const findForums = jest.fn();
const findSlug = jest.fn();
const createForum = jest.fn();
const writeAudit = jest.fn();
const club = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Echter Testverein',
  slug: 'echter-testverein',
  active: true,
};
const actor = '22222222-2222-4222-8222-222222222222';
const forum = {
  id: '33333333-3333-4333-8333-333333333333',
  clubId: club.id,
  categoryId: '44444444-4444-4444-8444-444444444444',
  name: club.name,
  slug: 'verein-echter-testverein',
  active: true,
  threadCreationEnabled: true,
};
const tx = {
  forumCategory: { findUnique: findCategory },
  forum: { findMany: findForums, findUnique: findSlug, create: createForum },
  auditLog: { create: writeAudit },
} as unknown as Prisma.TransactionClient;

describe('Task 22.210 deterministic club forum provisioning', () => {
  beforeEach(() => {
    for (const fn of [findCategory, findForums, findSlug, createForum, writeAudit]) {
      fn.mockReset();
    }
    findCategory.mockResolvedValue({ id: forum.categoryId, active: true });
    findForums.mockResolvedValue([]);
    findSlug.mockResolvedValue(null);
    createForum.mockResolvedValue(forum);
    writeAudit.mockResolvedValue({});
  });

  it('derives stable globally unique slugs from immutable real club slugs', () => {
    expect(canonicalClubForumSlug('sk-rapid-wien')).toBe('verein-sk-rapid-wien');
  });

  it('creates no forum or category on an empty clean DEV database', async () => {
    findCategory.mockResolvedValue(null);
    await expect(provisionClubForum(tx, club, actor, false)).resolves.toBeNull();
    expect(createForum).not.toHaveBeenCalled();
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it('requires an explicitly configured active vereine category for admin provisioning', async () => {
    findCategory.mockResolvedValue({ id: forum.categoryId, active: false });
    await expect(provisionClubForum(tx, club, actor, true)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(createForum).not.toHaveBeenCalled();
  });

  it('never publishes an automatically created forum for an inactive club', async () => {
    await expect(
      provisionClubForum(tx, { ...club, active: false }, actor, false),
    ).resolves.toBeNull();
    await expect(
      provisionClubForum(tx, { ...club, active: false }, actor, true),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(findCategory).not.toHaveBeenCalled();
    expect(createForum).not.toHaveBeenCalled();
  });

  it('reuses the existing forum for an already associated real club', async () => {
    findForums.mockResolvedValue([forum]);
    await expect(provisionClubForum(tx, club, actor, true)).resolves.toEqual(forum);
    expect(createForum).not.toHaveBeenCalled();
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it('fails closed when multiple forums could be the primary one', async () => {
    findForums.mockResolvedValue([forum, { ...forum, id: 'different', slug: 'additional' }]);
    await expect(provisionClubForum(tx, club, actor, true)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(createForum).not.toHaveBeenCalled();
  });

  it('does not take over a canonical slug owned by another forum', async () => {
    findSlug.mockResolvedValue({ id: 'unrelated', clubId: 'someone-else' });
    await expect(provisionClubForum(tx, club, actor, true)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(createForum).not.toHaveBeenCalled();
  });

  it('links a real club and the approved category, auditing exactly one creation', async () => {
    const result: unknown = await provisionClubForum(tx, club, actor, true);
    expect(result).toEqual(forum);
    expect(findCategory).toHaveBeenCalledWith({
      where: { slug: 'vereine' },
      select: { id: true, active: true },
    });
    expect(findForums).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clubId: club.id, categoryId: forum.categoryId },
        take: 2,
      }),
    );
    expect(createForum).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          clubId: club.id,
          categoryId: forum.categoryId,
          name: club.name,
          slug: forum.slug,
          description: 'Diskussionen rund um Echter Testverein.',
          active: true,
          threadCreationEnabled: true,
        },
      }),
    );
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorUserId: actor,
          targetId: forum.id,
          metadata: {
            entity: 'CLUB_FORUM',
            operation: 'CREATE',
            clubId: club.id,
            categoryId: forum.categoryId,
            slug: forum.slug,
          },
        }),
      }),
    );
  });
});

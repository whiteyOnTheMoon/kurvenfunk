const findMany = jest.fn<Promise<unknown[]>, [unknown]>();
const findFirst = jest.fn<Promise<unknown>, [unknown]>();
const findUnique = jest.fn<Promise<unknown>, [unknown]>();
const create = jest.fn<Promise<unknown>, [unknown]>();
const update = jest.fn<Promise<unknown>, [unknown]>();
const createAudit = jest.fn<Promise<unknown>, [unknown]>();
const disconnect = jest.fn<Promise<void>, []>();

type ForumTransaction = {
  forumCategory: {
    findUnique: typeof findUnique;
    create: typeof create;
    update: typeof update;
  };
  auditLog: { create: typeof createAudit };
};

const transaction = jest.fn<
  Promise<unknown>,
  [(callback: (tx: ForumTransaction) => Promise<unknown>) => unknown]
>();

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => ({
    forumCategory: { findMany, findFirst, findUnique, create, update },
    auditLog: { create: createAudit },
    $transaction: transaction,
    $disconnect: disconnect,
  }),
}));

import { ConflictException, NotFoundException } from '@nestjs/common';

import { ForumsService } from './forums.service';

const category = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Bundesliga',
  slug: 'bundesliga',
  description: 'Österreichischer Fußball',
  sortOrder: 10,
  active: true,
  createdAt: new Date('2026-11-11T00:00:00.000Z'),
  updatedAt: new Date('2026-11-11T00:00:00.000Z'),
};

describe('ForumsService – 22.209 categories', () => {
  let service: ForumsService;

  beforeEach(() => {
    for (const mock of [
      findMany,
      findFirst,
      findUnique,
      create,
      update,
      createAudit,
      transaction,
    ]) {
      mock.mockReset();
    }
    disconnect.mockReset();
    transaction.mockImplementation((callback) =>
      Promise.resolve(
        callback({
          forumCategory: { findUnique, create, update },
          auditLog: { create: createAudit },
        }),
      ),
    );
    service = new ForumsService();
  });

  it('returns an empty public list on the clean DEV database without creating fixtures', async () => {
    findMany.mockResolvedValueOnce([]);
    await expect(service.findPublicCategories()).resolves.toEqual([]);
    expect(findMany).toHaveBeenCalledWith({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        sortOrder: true,
        forums: {
          where: {
            active: true,
            OR: [{ clubId: null }, { club: { is: { active: true } } }],
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            club: { select: { id: true, name: true, slug: true } },
            threadCreationEnabled: true,
          },
        },
      },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('does not expose hidden categories through slug lookup', async () => {
    findFirst.mockResolvedValueOnce(null);
    await expect(service.findPublicCategoryBySlug('intern')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(findFirst).toHaveBeenCalledWith({
      where: { slug: 'intern', active: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        sortOrder: true,
        forums: {
          where: {
            active: true,
            OR: [{ clubId: null }, { club: { is: { active: true } } }],
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            club: { select: { id: true, name: true, slug: true } },
            threadCreationEnabled: true,
          },
        },
      },
    });
  });

  it('allows authorized admins to list inactive categories for editing', async () => {
    findMany.mockResolvedValueOnce([{ ...category, active: false }]);
    const result = await service.findAllCategoriesForAdmin();
    expect(result).toEqual([{ ...category, active: false }]);
    expect(findMany).toHaveBeenCalledWith({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        sortOrder: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it('creates a real category transactionally and records the actor in the audit log', async () => {
    create.mockResolvedValueOnce(category);
    createAudit.mockResolvedValueOnce({});
    const result = await service.createCategory(
      {
        name: category.name,
        slug: category.slug,
        description: category.description,
        sortOrder: category.sortOrder,
      },
      '22222222-2222-4222-8222-222222222222',
    );
    expect(result).toEqual(category);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      data: {
        name: 'Bundesliga',
        slug: 'bundesliga',
        description: 'Österreichischer Fußball',
        sortOrder: 10,
        active: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        sortOrder: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    const logInput = createAudit.mock.calls[0]?.[0] as {
      data: { actorUserId: string; metadata: unknown };
    };
    expect(logInput.data.actorUserId).toBe('22222222-2222-4222-8222-222222222222');
    expect(logInput.data.metadata).toEqual({
      entity: 'FORUM_CATEGORY',
      operation: 'CREATE',
      slug: 'bundesliga',
      after: {
        name: 'Bundesliga',
        description: 'Österreichischer Fußball',
        sortOrder: 10,
        active: true,
      },
    });
  });

  it('returns a conflict rather than overwriting an existing slug', async () => {
    create.mockRejectedValueOnce({ code: 'P2002' });
    await expect(
      service.createCategory({ name: 'Duplikat', slug: 'bundesliga' }, category.id),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('prevents updates to unknown categories', async () => {
    findUnique.mockResolvedValueOnce(null);
    await expect(
      service.updateCategory(category.id, { active: false }, category.id),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(update).not.toHaveBeenCalled();
  });

  it('deactivates an existing category without deleting it and audits the change', async () => {
    findUnique.mockResolvedValueOnce(category);
    update.mockResolvedValueOnce({ ...category, active: false });
    createAudit.mockResolvedValueOnce({});
    const result = await service.updateCategory(
      category.id,
      { active: false },
      '22222222-2222-4222-8222-222222222222',
    );
    expect(result.active).toBe(false);
    expect(update).toHaveBeenCalledWith({
      where: { id: category.id },
      data: { active: false },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        sortOrder: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(createAudit).toHaveBeenCalledTimes(1);
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});

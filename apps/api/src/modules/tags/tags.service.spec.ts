const findManyTag = jest.fn();
const findUniqueTag = jest.fn();
const findFirstTag = jest.fn();
const createTag = jest.fn();
const updateTag = jest.fn();
const deleteTag = jest.fn();
const disconnect = jest.fn();

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => ({
    tag: {
      findMany: findManyTag,
      findUnique: findUniqueTag,
      findFirst: findFirstTag,
      create: createTag,
      update: updateTag,
      delete: deleteTag,
    },
    $disconnect: disconnect,
  }),
}));

import { ConflictException, NotFoundException } from '@nestjs/common';

import { TagsService } from './tags.service';

const tagId = '11111111-1111-4111-8111-111111111111';

describe('TagsService', () => {
  let service: TagsService;

  beforeEach(() => {
    findManyTag.mockReset();
    findUniqueTag.mockReset();
    findFirstTag.mockReset();
    createTag.mockReset();
    updateTag.mockReset();
    deleteTag.mockReset();
    disconnect.mockReset();

    service = new TagsService();
  });

  it('lists active tags before inactive tags and orders by name', async () => {
    findManyTag.mockResolvedValue([]);

    await service.findAll();

    expect(findManyTag).toHaveBeenCalledWith({
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });
  });

  it('returns a tag by id', async () => {
    const tag = {
      id: tagId,
      name: 'Transfers',
      slug: 'transfers',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        articles: 0,
      },
    };

    findUniqueTag.mockResolvedValue(tag);

    await expect(service.findById(tagId)).resolves.toBe(tag);
  });

  it('throws when a tag does not exist', async () => {
    findUniqueTag.mockResolvedValue(null);

    await expect(service.findById(tagId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a tag when the slug is free', async () => {
    findUniqueTag.mockResolvedValue(null);

    createTag.mockResolvedValue({
      id: tagId,
      name: 'Transfers',
      slug: 'transfers',
      active: true,
    });

    await service.create({
      name: 'Transfers',
      slug: 'transfers',
    });

    expect(createTag).toHaveBeenCalledWith({
      data: {
        name: 'Transfers',
        slug: 'transfers',
        active: true,
      },
    });
  });

  it('rejects a duplicate tag slug on create', async () => {
    findUniqueTag.mockResolvedValue({
      id: tagId,
    });

    await expect(
      service.create({
        name: 'Transfers',
        slug: 'transfers',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(createTag).not.toHaveBeenCalled();
  });

  it('updates a tag', async () => {
    findUniqueTag.mockResolvedValue({
      id: tagId,
      name: 'Transfers',
      slug: 'transfers',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        articles: 0,
      },
    });

    findFirstTag.mockResolvedValue(null);

    await service.update(tagId, {
      name: 'Transfermarkt',
      slug: 'transfermarkt',
    });

    expect(updateTag).toHaveBeenCalledWith({
      where: {
        id: tagId,
      },
      data: {
        name: 'Transfermarkt',
        slug: 'transfermarkt',
      },
    });
  });

  it('rejects a duplicate tag slug on update', async () => {
    findUniqueTag.mockResolvedValue({
      id: tagId,
      name: 'Transfers',
      slug: 'transfers',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        articles: 0,
      },
    });

    findFirstTag.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
    });

    await expect(
      service.update(tagId, {
        slug: 'analyse',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(updateTag).not.toHaveBeenCalled();
  });

  it('deletes an unused tag', async () => {
    findUniqueTag.mockResolvedValue({
      id: tagId,
      name: 'Transfers',
      slug: 'transfers',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        articles: 0,
      },
    });

    deleteTag.mockResolvedValue({
      id: tagId,
    });

    await service.remove(tagId);

    expect(deleteTag).toHaveBeenCalledWith({
      where: {
        id: tagId,
      },
    });
  });

  it('does not delete a tag that is assigned to an article', async () => {
    findUniqueTag.mockResolvedValue({
      id: tagId,
      name: 'Transfers',
      slug: 'transfers',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        articles: 2,
      },
    });

    await expect(service.remove(tagId)).rejects.toBeInstanceOf(ConflictException);

    expect(deleteTag).not.toHaveBeenCalled();
  });

  it('disconnects the database client on module destroy', async () => {
    disconnect.mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});

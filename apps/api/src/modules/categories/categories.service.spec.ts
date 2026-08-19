const findManyCategory = jest.fn();
const findUniqueCategory = jest.fn();
const findFirstCategory = jest.fn();
const createCategory = jest.fn();
const updateCategory = jest.fn();
const deleteCategory = jest.fn();
const disconnect = jest.fn();

jest.mock('@kurvenfunk/database', () => ({
  createPrismaClient: () => ({
    category: {
      findMany: findManyCategory,
      findUnique: findUniqueCategory,
      findFirst: findFirstCategory,
      create: createCategory,
      update: updateCategory,
      delete: deleteCategory,
    },
    $disconnect: disconnect,
  }),
}));

import { ConflictException, NotFoundException } from '@nestjs/common';

import { CategoriesService } from './categories.service';

const categoryId = '11111111-1111-4111-8111-111111111111';

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(() => {
    findManyCategory.mockReset();
    findUniqueCategory.mockReset();
    findFirstCategory.mockReset();
    createCategory.mockReset();
    updateCategory.mockReset();
    deleteCategory.mockReset();
    disconnect.mockReset();

    service = new CategoriesService();
  });

  it('lists active categories before inactive categories and orders by name', async () => {
    findManyCategory.mockResolvedValue([]);

    await service.findAll();

    expect(findManyCategory).toHaveBeenCalledWith({
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

  it('returns a category by id', async () => {
    const category = {
      id: categoryId,
      name: 'Transfers',
      slug: 'transfers',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        articles: 0,
      },
    };

    findUniqueCategory.mockResolvedValue(category);

    await expect(service.findById(categoryId)).resolves.toBe(category);
  });

  it('throws when a category does not exist', async () => {
    findUniqueCategory.mockResolvedValue(null);

    await expect(service.findById(categoryId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a category when the slug is free', async () => {
    findUniqueCategory.mockResolvedValue(null);

    createCategory.mockResolvedValue({
      id: categoryId,
      name: 'Transfers',
      slug: 'transfers',
      active: true,
    });

    await service.create({
      name: 'Transfers',
      slug: 'transfers',
    });

    expect(createCategory).toHaveBeenCalledWith({
      data: {
        name: 'Transfers',
        slug: 'transfers',
        active: true,
      },
    });
  });

  it('rejects a duplicate category slug on create', async () => {
    findUniqueCategory.mockResolvedValue({
      id: categoryId,
    });

    await expect(
      service.create({
        name: 'Transfers',
        slug: 'transfers',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(createCategory).not.toHaveBeenCalled();
  });

  it('updates a category', async () => {
    findUniqueCategory.mockResolvedValue({
      id: categoryId,
      name: 'Transfers',
      slug: 'transfers',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        articles: 0,
      },
    });

    findFirstCategory.mockResolvedValue(null);

    await service.update(categoryId, {
      name: 'Transfermarkt',
      slug: 'transfermarkt',
    });

    expect(updateCategory).toHaveBeenCalledWith({
      where: {
        id: categoryId,
      },
      data: {
        name: 'Transfermarkt',
        slug: 'transfermarkt',
      },
    });
  });

  it('rejects a duplicate category slug on update', async () => {
    findUniqueCategory.mockResolvedValue({
      id: categoryId,
      name: 'Transfers',
      slug: 'transfers',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        articles: 0,
      },
    });

    findFirstCategory.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
    });

    await expect(
      service.update(categoryId, {
        slug: 'analyse',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(updateCategory).not.toHaveBeenCalled();
  });

  it('deletes an unused category', async () => {
    findUniqueCategory.mockResolvedValue({
      id: categoryId,
      name: 'Transfers',
      slug: 'transfers',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        articles: 0,
      },
    });

    deleteCategory.mockResolvedValue({
      id: categoryId,
    });

    await service.remove(categoryId);

    expect(deleteCategory).toHaveBeenCalledWith({
      where: {
        id: categoryId,
      },
    });
  });

  it('does not delete a category that is assigned to an article', async () => {
    findUniqueCategory.mockResolvedValue({
      id: categoryId,
      name: 'Transfers',
      slug: 'transfers',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        articles: 2,
      },
    });

    await expect(service.remove(categoryId)).rejects.toBeInstanceOf(ConflictException);

    expect(deleteCategory).not.toHaveBeenCalled();
  });

  it('disconnects the database client on module destroy', async () => {
    disconnect.mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});

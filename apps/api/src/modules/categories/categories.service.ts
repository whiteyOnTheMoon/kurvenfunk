import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import type { CreateCategoryInput, UpdateCategoryInput } from '@kurvenfunk/validation';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';

@Injectable()
export class CategoriesService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async findAll() {
    return this.database.category.findMany({
      orderBy: [
        {
          active: 'desc',
        },
        {
          name: 'asc',
        },
      ],
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
  }

  async findById(id: string) {
    const category = await this.database.category.findUnique({
      where: {
        id,
      },
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

    if (!category) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Category not found',
      });
    }

    return category;
  }

  async create(input: CreateCategoryInput) {
    const existing = await this.database.category.findUnique({
      where: {
        slug: input.slug,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new ConflictException({
        code: 'CATEGORY_SLUG_TAKEN',
        message: 'Category slug is already in use',
      });
    }

    return this.database.category.create({
      data: {
        name: input.name,
        slug: input.slug,
        active: input.active ?? true,
      },
    });
  }

  async update(id: string, input: UpdateCategoryInput) {
    await this.findById(id);

    if (input.slug) {
      const existing = await this.database.category.findFirst({
        where: {
          slug: input.slug,
          id: {
            not: id,
          },
        },
        select: {
          id: true,
        },
      });

      if (existing) {
        throw new ConflictException({
          code: 'CATEGORY_SLUG_TAKEN',
          message: 'Category slug is already in use',
        });
      }
    }

    return this.database.category.update({
      where: {
        id,
      },
      data: input,
    });
  }

  async remove(id: string) {
    const category = await this.findById(id);

    if (category._count.articles > 0) {
      throw new ConflictException({
        code: 'CATEGORY_IN_USE',
        message: 'Category is assigned to one or more articles',
      });
    }

    return this.database.category.delete({
      where: {
        id,
      },
    });
  }

  async onModuleDestroy() {
    await this.database.$disconnect();
  }
}

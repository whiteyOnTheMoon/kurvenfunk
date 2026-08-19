import { createPrismaClient, type DatabaseClient } from '@kurvenfunk/database';
import type { CreateTagInput, UpdateTagInput } from '@kurvenfunk/validation';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';

@Injectable()
export class TagsService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  async findAll() {
    return this.database.tag.findMany({
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
    const tag = await this.database.tag.findUnique({
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

    if (!tag) {
      throw new NotFoundException({
        code: 'TAG_NOT_FOUND',
        message: 'Tag not found',
      });
    }

    return tag;
  }

  async create(input: CreateTagInput) {
    const existing = await this.database.tag.findUnique({
      where: {
        slug: input.slug,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new ConflictException({
        code: 'TAG_SLUG_TAKEN',
        message: 'Tag slug is already in use',
      });
    }

    return this.database.tag.create({
      data: {
        name: input.name,
        slug: input.slug,
        active: input.active ?? true,
      },
    });
  }

  async update(id: string, input: UpdateTagInput) {
    await this.findById(id);

    if (input.slug) {
      const existing = await this.database.tag.findFirst({
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
          code: 'TAG_SLUG_TAKEN',
          message: 'Tag slug is already in use',
        });
      }
    }

    return this.database.tag.update({
      where: {
        id,
      },
      data: input,
    });
  }

  async remove(id: string) {
    const tag = await this.findById(id);

    if (tag._count.articles > 0) {
      throw new ConflictException({
        code: 'TAG_IN_USE',
        message: 'Tag is assigned to one or more articles',
      });
    }

    return this.database.tag.delete({
      where: {
        id,
      },
    });
  }

  async onModuleDestroy() {
    await this.database.$disconnect();
  }
}

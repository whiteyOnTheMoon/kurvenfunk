import { createPrismaClient, type DatabaseClient, type Prisma } from '@kurvenfunk/database';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleDestroy,
} from '@nestjs/common';
import type {
  CreateForumCategoryInput,
  UpdateForumCategoryInput,
} from '@kurvenfunk/validation';

const publicCategorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  sortOrder: true,
  forums: {
    where: { active: true },
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
} satisfies Prisma.ForumCategorySelect;

const adminCategorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  sortOrder: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

function isDatabaseError(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

@Injectable()
export class ForumsService implements OnModuleDestroy {
  private readonly database: DatabaseClient = createPrismaClient();

  /** Public navigation must never reveal inactive categories or forums. */
  findPublicCategories() {
    return this.database.forumCategory.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: publicCategorySelect,
    });
  }

  async findPublicCategoryBySlug(slug: string) {
    const category = await this.database.forumCategory.findFirst({
      where: { slug, active: true },
      select: publicCategorySelect,
    });
    if (!category) {
      throw new NotFoundException({
        code: 'FORUM_CATEGORY_NOT_FOUND',
        message: 'Forenkategorie wurde nicht gefunden.',
      });
    }
    return category;
  }

  /** Inactive categories stay available to authorized admins, not the public. */
  findAllCategoriesForAdmin() {
    return this.database.forumCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: adminCategorySelect,
    });
  }

  async createCategory(input: CreateForumCategoryInput, actorUserId: string) {
    try {
      return await this.database.$transaction(async (tx) => {
        const category = await tx.forumCategory.create({
          data: {
            name: input.name,
            slug: input.slug,
            description: input.description ?? null,
            sortOrder: input.sortOrder ?? 0,
            active: input.active ?? true,
          },
          select: adminCategorySelect,
        });
        await tx.auditLog.create({
          data: {
            actorType: 'USER',
            actorUserId,
            action: 'ADMIN_CORRECTION',
            category: 'SYSTEM',
            targetType: 'SYSTEM',
            targetId: category.id,
            metadata: {
              entity: 'FORUM_CATEGORY',
              operation: 'CREATE',
              slug: category.slug,
              after: {
                name: category.name,
                description: category.description,
                sortOrder: category.sortOrder,
                active: category.active,
              },
            },
          },
        });
        return category;
      });
    } catch (error) {
      if (isDatabaseError(error, 'P2002')) {
        throw new ConflictException({
          code: 'FORUM_CATEGORY_SLUG_TAKEN',
          message: 'Dieser Forenkategorie-Slug ist bereits vergeben.',
        });
      }
      throw error;
    }
  }

  async updateCategory(id: string, input: UpdateForumCategoryInput, actorUserId: string) {
    return this.database.$transaction(async (tx) => {
      const before = await tx.forumCategory.findUnique({
        where: { id },
        select: adminCategorySelect,
      });
      if (!before) {
        throw new NotFoundException({
          code: 'FORUM_CATEGORY_NOT_FOUND',
          message: 'Forenkategorie wurde nicht gefunden.',
        });
      }
      const after = await tx.forumCategory.update({
        where: { id },
        data: input,
        select: adminCategorySelect,
      });
      await tx.auditLog.create({
        data: {
          actorType: 'USER',
          actorUserId,
          action: 'ADMIN_CORRECTION',
          category: 'SYSTEM',
          targetType: 'SYSTEM',
          targetId: after.id,
          metadata: {
            entity: 'FORUM_CATEGORY',
            operation: 'UPDATE',
            slug: after.slug,
            before: {
              name: before.name,
              description: before.description,
              sortOrder: before.sortOrder,
              active: before.active,
            },
            after: {
              name: after.name,
              description: after.description,
              sortOrder: after.sortOrder,
              active: after.active,
            },
          },
        },
      });
      return after;
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.database.$disconnect();
  }
}

import type { Prisma } from '@kurvenfunk/database';
import { ConflictException } from '@nestjs/common';

/** A club's canonical forum slug is stable because club slugs are immutable. */
export const CLUB_FORUM_CATEGORY_SLUG = 'vereine';

export interface ForumClubSource {
  id: string;
  slug: string;
  name: string;
  active: boolean;
}

export function canonicalClubForumSlug(clubSlug: string): string {
  return `verein-${clubSlug}`;
}

const clubForumSelect = {
  id: true,
  categoryId: true,
  clubId: true,
  name: true,
  slug: true,
  active: true,
  threadCreationEnabled: true,
} as const;

function missingClubForumCategory(): ConflictException {
  return new ConflictException({
    code: 'CLUB_FORUM_CATEGORY_REQUIRED',
    message: 'Zuerst muss die aktive Forenkategorie "vereine" eingerichtet werden.',
  });
}

/**
 * Create at most one default forum for a real, administratively managed club.
 * The canonical global slug is protected by Forum.slug's database UNIQUE key.
 * Secondary club forums remain possible without a blanket UNIQUE(clubId).
 *
 * New clubs tolerate an absent category: no implicit categories or fake data.
 * Explicit admin provisioning requires an existing active "vereine" category.
 */
export async function provisionClubForum(
  tx: Prisma.TransactionClient,
  club: ForumClubSource,
  actorUserId: string,
  requireCategory: boolean,
) {
  if (!club.active) {
    if (requireCategory) {
      throw new ConflictException({
        code: 'CLUB_FORUM_CLUB_INACTIVE',
        message: 'Für einen inaktiven Verein kann kein neues Vereinsforum aktiviert werden.',
      });
    }
    return null;
  }

  const category = await tx.forumCategory.findUnique({
    where: { slug: CLUB_FORUM_CATEGORY_SLUG },
    select: { id: true, active: true },
  });
  if (!category?.active) {
    if (requireCategory) throw missingClubForumCategory();
    return null;
  }

  const existingClubForums = await tx.forum.findMany({
    where: { clubId: club.id, categoryId: category.id },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: 2,
    select: clubForumSelect,
  });
  if (existingClubForums.length > 1) {
    throw new ConflictException({
      code: 'CLUB_FORUM_AMBIGUOUS',
      message: 'Mehrere Vereinsforen existieren bereits. Die Zuordnung muss geprüft werden.',
    });
  }
  const existing = existingClubForums[0];
  if (existing) return existing;

  const slug = canonicalClubForumSlug(club.slug);
  const other = await tx.forum.findUnique({
    where: { slug },
    select: { id: true, clubId: true },
  });
  if (other) {
    throw new ConflictException({
      code: 'CLUB_FORUM_SLUG_CONFLICT',
      message: 'Die reguläre Vereinsforum-Kennung ist bereits durch ein anderes Forum belegt.',
    });
  }

  const forum = await tx.forum.create({
    data: {
      clubId: club.id,
      categoryId: category.id,
      slug,
      name: club.name,
      description: `Diskussionen rund um ${club.name}.`,
      active: true,
      threadCreationEnabled: true,
    },
    select: clubForumSelect,
  });
  await tx.auditLog.create({
    data: {
      actorType: 'USER',
      actorUserId,
      action: 'ADMIN_CORRECTION',
      category: 'SYSTEM',
      targetType: 'SYSTEM',
      targetId: forum.id,
      metadata: {
        entity: 'CLUB_FORUM',
        operation: 'CREATE',
        clubId: club.id,
        categoryId: category.id,
        slug,
      },
    },
  });
  return forum;
}

export { clubForumSelect };

// DEV-only, read-only cross-module data inventory for Phase 0–21 acceptance.
// Never print real account IDs, tokens, article text, comment content or emails.
import { createPrismaClient } from '@kurvenfunk/database';

if (process.env.PHASE021_AUDIT_TARGET !== 'DEV') {
  throw new Error('DEV_ONLY_READONLY_AUDIT');
}
const db = createPrismaClient();
const knownSeedSubjects = ['seed-neutral-user', 'seed-rapid-user', 'seed-editor-user'];
const suspiciousPrefixes = ['seed-', 'demo-', 'mock-', 'test-', 'sample-', 'fixture-'];
const candidateSlugWhere = {
  OR: suspiciousPrefixes.map((prefix) => ({ slug: { startsWith: prefix } })),
};
const seedArticleWhere = { slug: { startsWith: 'seed-' } };

const userCounts = {
  articles: true,
  comments: true,
  reactions: true,
  forumThreads: true,
  forumPosts: true,
  postsDeleted: true,
  threadsPinned: true,
  threadsLocked: true,
  subscriptions: true,
  threadReadStates: true,
  reportsCreated: true,
  reportsReceived: true,
  reportsAssigned: true,
  moderationCardsReceived: true,
  moderationCardsIssued: true,
  moderationCardsRevoked: true,
  appealsFiled: true,
  appealsReviewed: true,
  appealsProposed: true,
  sanctionsReceived: true,
  sanctionsCreated: true,
  sanctionsRevoked: true,
  ipBlocksCreated: true,
  ipBlocksDeactivated: true,
  auditEventsAsActor: true,
  auditEventsAsTarget: true,
  notificationsReceived: true,
  notificationActions: true,
  notificationPreferences: true,
  roleAssignments: true,
  rolesGranted: true,
  entityMatchesReviewed: true,
  importRecordsReviewed: true,
};
const rowModels = [
  'user', 'profile', 'userRoleAssignment', 'club', 'clubAlias',
  'competition', 'season', 'stage', 'match', 'standing',
  'article', 'articleRevision', 'comment', 'commentRevision',
  'reaction', 'media', 'forumCategory', 'forum', 'thread', 'post',
  'moderationReport', 'moderationCard', 'sanction', 'appeal',
  'ipBlock', 'auditLog', 'notification', 'notificationPreference',
  'provider', 'importJob', 'importRecord', 'rawPayload', 'entityMatch',
];

try {
  const rows = Object.fromEntries(
    await Promise.all(rowModels.map(async (model) => [model, await db[model].count()])),
  );
  const [seedUsers, seedArticles, candidates] = await Promise.all([
    db.user.findMany({
      where: { keycloakSubject: { in: knownSeedSubjects } },
      select: {
        id: true,
        keycloakSubject: true,
        profile: { select: { id: true } },
        _count: { select: userCounts },
      },
    }),
    db.article.findMany({
      where: seedArticleWhere,
      select: {
        slug: true,
        status: true,
        importRecordId: true,
        author: { select: { keycloakSubject: true } },
        _count: { select: { comments: true, revisions: true, entityMatches: true, clubs: true } },
      },
    }),
    Promise.all([
      db.article.count({ where: candidateSlugWhere }),
      db.article.count({ where: { ...candidateSlugWhere, status: 'PUBLISHED' } }),
      db.club.count({ where: candidateSlugWhere }),
      db.user.count({
        where: {
          OR: [
            { keycloakSubject: { startsWith: 'seed-' } },
            { keycloakSubject: { startsWith: 'test-' } },
            { keycloakSubject: { startsWith: 'demo-' } },
          ],
        },
      }),
      db.provider.count({
        where: {
          OR: [
            { key: { contains: 'fake', mode: 'insensitive' } },
            { key: { contains: 'test', mode: 'insensitive' } },
            { key: { contains: 'demo', mode: 'insensitive' } },
          ],
        },
      }),
      db.comment.count({ where: { article: seedArticleWhere } }),
    ]),
  ]);

  // The extra comment attribution is calculated after seed account lookup.
  const seedIds = seedUsers.map((user) => user.id);
  const [commentsBySeedOnSeedArticles, commentsBySeedElsewhere, seedAuthoredPublished] =
    await Promise.all([
      db.comment.count({
        where: { article: seedArticleWhere, authorId: { in: seedIds } },
      }),
      db.comment.count({
        where: { article: { NOT: seedArticleWhere }, authorId: { in: seedIds } },
      }),
      db.article.count({
        where: { authorId: { in: seedIds }, status: 'PUBLISHED' },
      }),
    ]);

  const seedAccountDependencies = seedUsers.map(({ id: _id, keycloakSubject, profile, _count }) => ({
    seedSubject: keycloakSubject,
    hasProfile: profile !== null,
    relations: _count,
    totalRelations: Object.values(_count).reduce((sum, n) => sum + n, 0),
  }));
  console.log('PHASE021_DEV_ROW_COUNTS=' + JSON.stringify(rows));
  console.log('PHASE021_DEV_SYNTHETIC_CANDIDATES=' + JSON.stringify({
    syntheticPrefixArticleCount: candidates[0],
    syntheticPrefixPublishedArticles: candidates[1],
    syntheticPrefixClubs: candidates[2],
    seedOrTestSubjectUsers: candidates[3],
    fakeOrTestProviders: candidates[4],
    seedArticleCommentCount: candidates[5],
    knownSeedAccounts: seedUsers.length,
    knownSeedArticles: seedArticles.map((article) => ({
      slug: article.slug,
      status: article.status,
      authoredByKnownSeed: knownSeedSubjects.includes(article.author?.keycloakSubject),
      importLinked: article.importRecordId !== null,
      relations: article._count,
    })),
    knownSeedAccountDependencies: seedAccountDependencies,
    commentsBySeedOnSeedArticles,
    commentsBySeedElsewhere,
    seedAuthoredPublished,
  }));
  console.log('PHASE021_DEV_AUDIT_EXECUTION=PASS_READ_ONLY');
  console.log('PHASE021_DEV_CLEANLINESS=' +
    (seedUsers.length || seedArticles.length || candidates[1] || candidates[2] || candidates[4]
      ? 'UNRESOLVED_REVIEW_REQUIRED'
      : 'NO_KNOWN_MARKERS_FOUND_NOT_A_COMPLETE_PROVENANCE_PROOF'));
} catch (error) {
  console.error('PHASE021_DEV_AUDIT_EXECUTION=FAILED', error instanceof Error ? error.name : 'Unknown');
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}

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
  'user',
  'profile',
  'userRoleAssignment',
  'club',
  'clubAlias',
  'competition',
  'season',
  'stage',
  'match',
  'standing',
  'article',
  'articleRevision',
  'comment',
  'commentRevision',
  'reaction',
  'media',
  'forumCategory',
  'forum',
  'thread',
  'post',
  'moderationReport',
  'moderationCard',
  'sanction',
  'appeal',
  'iPBlock',
  'auditLog',
  'notification',
  'notificationPreference',
  'provider',
  'importJob',
  'importRecord',
  'rawPayload',
  'entityMatch',
];

try {
  const rows = Object.fromEntries(
    await Promise.all(rowModels.map(async (model) => [model, await db[model].count()])),
  );
  const [seedUsers, qaUsers, seedArticles, candidates] = await Promise.all([
    db.user.findMany({
      where: { keycloakSubject: { in: knownSeedSubjects } },
      select: {
        id: true,
        keycloakSubject: true,
        profile: { select: { id: true } },
        _count: { select: userCounts },
      },
    }),
    db.user.findMany({
      where: {
        OR: [
          { nickname: { startsWith: 'Phase17 Test ' } },
          { nickname: { startsWith: 'Phase19 Test ' } },
          { nickname: { startsWith: 'Phase20 ' } },
        ],
      },
      select: {
        id: true,
        nickname: true,
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
      db.article.count({
        where: {
          OR: [
            { slug: { startsWith: 'phase20-' } },
            { slug: { startsWith: 'phase17-' } },
            { slug: { startsWith: 'phase19-' } },
          ],
        },
      }),
      db.user.count({ where: { nickname: { startsWith: 'Phase17 Test ' } } }),
      db.user.count({ where: { nickname: { startsWith: 'Phase19 Test ' } } }),
      db.comment.count({ where: { body: { contains: 'Synthetic', mode: 'insensitive' } } }),
    ]),
  ]);

  // The extra comment attribution is calculated after seed account lookup.
  const seedIds = seedUsers.map((user) => user.id);
  const qaAccountDependencies = qaUsers.map(({ id: _id, nickname, profile, _count }) => ({
    category: nickname?.startsWith('Phase17 Test ')
      ? 'PHASE17'
      : nickname?.startsWith('Phase19 Test ')
        ? 'PHASE19'
        : 'PHASE20',
    hasProfile: profile !== null,
    relations: _count,
    totalRelations: Object.values(_count).reduce((sum, n) => sum + n, 0),
  }));
  const [commentsBySeedOnSeedArticles, allCommentsBySeedAccounts, seedAuthoredPublished] =
    await Promise.all([
      db.comment.count({
        where: { article: seedArticleWhere, authorId: { in: seedIds } },
      }),
      db.comment.count({ where: { authorId: { in: seedIds } } }),
      db.article.count({
        where: { authorId: { in: seedIds }, status: 'PUBLISHED' },
      }),
    ]);
  const commentsBySeedElsewhere = allCommentsBySeedAccounts - commentsBySeedOnSeedArticles;

  const seedAccountDependencies = seedUsers.map(
    ({ id: _id, keycloakSubject, profile, _count }) => ({
      seedSubject: keycloakSubject,
      hasProfile: profile !== null,
      relations: _count,
      totalRelations: Object.values(_count).reduce((sum, n) => sum + n, 0),
    }),
  );
  console.log('PHASE021_DEV_ROW_COUNTS=' + JSON.stringify(rows));
  console.log(
    'PHASE021_DEV_SYNTHETIC_CANDIDATES=' +
      JSON.stringify({
        syntheticPrefixArticleCount: candidates[0],
        syntheticPrefixPublishedArticles: candidates[1],
        syntheticPrefixClubs: candidates[2],
        seedOrTestSubjectUsers: candidates[3],
        fakeOrTestProviders: candidates[4],
        seedArticleCommentCount: candidates[5],
        phase17Or19Or20ArticleSlugs: candidates[6],
        phase17QaAccounts: candidates[7],
        phase19QaAccounts: candidates[8],
        commentsContainingSyntheticMarker: candidates[9],
        knownSeedAccounts: seedUsers.length,
        qaAccountDependencies,
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
      }),
  );
  // Extra metadata-only provenance review. No titles, slugs, content, user IDs or
  // personal details leave the worker: only aggregates and synthetic-marker counts.
  const marker = /(?:test|demo|mock|sample|fixture|synthetic|seed|phase[ -]?(?:17|19|20))/i;
  const [
    articleMetadata,
    userMetadata,
    mediaMetadata,
    moderationMetadata,
    notificationMetadata,
    auditMetadata,
    providers,
    jobGroups,
    competitionMetadata,
    seasonMetadata,
  ] = await Promise.all([
    db.article.findMany({
      select: {
        status: true,
        deletedAt: true,
        importRecordId: true,
        sourceId: true,
        slug: true,
        title: true,
        author: { select: { nickname: true, keycloakSubject: true } },
        _count: { select: { clubs: true, revisions: true } },
      },
    }),
    db.user.findMany({ select: { nickname: true, keycloakSubject: true, status: true } }),
    db.media.findMany({
      select: {
        originalFileName: true,
        altText: true,
        source: true,
        status: true,
        storageType: true,
        _count: {
          select: {
            profileAvatars: true,
            clubLogos: true,
            articleLeads: true,
            articleOgImages: true,
          },
        },
      },
    }),
    db.moderationCard.findMany({
      select: {
        reasonCode: true,
        sourceType: true,
        status: true,
        _count: { select: { sanctions: true, appeals: true, auditLogs: true } },
      },
    }),
    db.notification.findMany({ select: { type: true, sourceType: true, title: true, body: true } }),
    db.auditLog.findMany({
      select: { reason: true, action: true, category: true, metadata: true },
    }),
    db.provider.findMany({
      select: {
        id: true,
        key: true,
        type: true,
        _count: { select: { importJobs: true, importRecords: true, rawPayloads: true } },
      },
    }),
    db.importJob.groupBy({ by: ['providerId', 'kind', 'status'], _count: { _all: true } }),
    db.competition.findMany({
      select: {
        _count: { select: { seasons: true, matches: true, standings: true, articles: true } },
      },
    }),
    db.season.findMany({
      select: { _count: { select: { stages: true, matches: true, standings: true } } },
    }),
  ]);
  const countStatuses = (rows) =>
    rows.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    }, {});
  const countMarked = (rows, values) =>
    rows.filter((row) =>
      values(row).some((value) => typeof value === 'string' && marker.test(value)),
    ).length;
  const providerClass = (key) =>
    /(?:fake|mock|test|demo|seed)/i.test(key)
      ? 'SYNTHETIC'
      : /(?:ots|apa)/i.test(key)
        ? 'OTS_APA'
        : 'OTHER_OR_UNKNOWN';
  const providerLookup = new Map(providers.map((p) => [p.id, providerClass(p.key)]));
  const jobsByClass = jobGroups.reduce((acc, job) => {
    const kind = providerLookup.get(job.providerId) ?? 'MISSING_PROVIDER';
    acc[kind] = (acc[kind] ?? 0) + job._count._all;
    return acc;
  }, {});
  console.log(
    'PHASE021_DEV_RESIDUAL_METADATA=' +
      JSON.stringify({
        articles: {
          total: articleMetadata.length,
          byStatus: countStatuses(articleMetadata),
          softDeleted: articleMetadata.filter((row) => row.deletedAt !== null).length,
          imported: articleMetadata.filter((row) => row.importRecordId !== null).length,
          withSource: articleMetadata.filter((row) => row.sourceId !== null).length,
          linkedToClub: articleMetadata.filter((row) => row._count.clubs > 0).length,
          withRevisions: articleMetadata.filter((row) => row._count.revisions > 0).length,
          markedTitleOrSlug: countMarked(articleMetadata, (row) => [row.slug, row.title]),
          authoredByMarkedAccount: countMarked(articleMetadata, (row) => [
            row.author?.nickname,
            row.author?.keycloakSubject,
          ]),
        },
        users: {
          total: userMetadata.length,
          markedNicknameOrSubject: countMarked(userMetadata, (row) => [
            row.nickname,
            row.keycloakSubject,
          ]),
        },
        media: {
          total: mediaMetadata.length,
          byStatus: countStatuses(mediaMetadata),
          markedMetadata: countMarked(mediaMetadata, (row) => [
            row.originalFileName,
            row.altText,
            row.source,
          ]),
          attached: mediaMetadata.filter((row) =>
            Object.values(row._count).some((number) => number > 0),
          ).length,
        },
        moderationCards: {
          total: moderationMetadata.length,
          markedReason: countMarked(moderationMetadata, (row) => [row.reasonCode]),
          byStatus: countStatuses(moderationMetadata),
          linkedToCommentSource: moderationMetadata.filter((row) => row.sourceType === 'COMMENT')
            .length,
        },
        notifications: {
          total: notificationMetadata.length,
          markedBodyOrTitle: countMarked(notificationMetadata, (row) => [row.title, row.body]),
        },
        auditLogs: {
          total: auditMetadata.length,
          markedReasonOrMetadata: countMarked(auditMetadata, (row) => [
            row.reason,
            JSON.stringify(row.metadata ?? {}),
          ]),
        },
        import: {
          providerClasses: providers.reduce((acc, provider) => {
            const kind = providerClass(provider.key);
            acc[kind] = (acc[kind] ?? 0) + 1;
            return acc;
          }, {}),
          jobsByProviderClass: jobsByClass,
          records: providers.reduce((sum, provider) => sum + provider._count.importRecords, 0),
          payloads: providers.reduce((sum, provider) => sum + provider._count.rawPayloads, 0),
        },
        competition: {
          total: competitionMetadata.length,
          referencedByArticles: competitionMetadata.filter((row) => row._count.articles > 0).length,
          seasons: seasonMetadata.length,
          seasonsWithFixturesOrStandings: seasonMetadata.filter(
            (row) => row._count.matches + row._count.standings > 0,
          ).length,
        },
      }),
  );

  console.log('PHASE021_DEV_AUDIT_EXECUTION=PASS_READ_ONLY');
  console.log(
    'PHASE021_DEV_CLEANLINESS=' +
      (seedUsers.length ||
      qaUsers.length ||
      seedArticles.length ||
      candidates[1] ||
      candidates[2] ||
      candidates[4] ||
      candidates[6]
        ? 'UNRESOLVED_REVIEW_REQUIRED'
        : 'NO_KNOWN_MARKERS_FOUND_NOT_A_COMPLETE_PROVENANCE_PROOF'),
  );
} catch (error) {
  console.error(
    'PHASE021_DEV_AUDIT_EXECUTION=FAILED',
    error instanceof Error ? error.name : 'Unknown',
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}

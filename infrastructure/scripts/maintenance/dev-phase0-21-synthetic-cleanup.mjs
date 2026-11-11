// DEV ONLY. Destructive cleanup is authorized for comments and confirmed seed/test records.
// All writes require a verified private backup of BOTH the app and Keycloak databases.
// Never print account identifiers, credentials, article/comment bodies or tokens.
import { createPrismaClient } from '@kurvenfunk/database';

const mode = process.env.PHASE021_CLEANUP_MODE ?? 'plan';
if (!['plan', 'apply', 'verify'].includes(mode)) throw new Error('INVALID_MODE');
if (process.env.PHASE021_CLEANUP_TARGET !== 'DEV') throw new Error('DEV_ONLY');
if (mode === 'apply' && process.env.PHASE021_TWO_VERIFIED_BACKUPS !== 'YES') {
  throw new Error('TWO_DATABASE_BACKUPS_REQUIRED');
}
const dbUrl = new URL(process.env.DATABASE_URL ?? 'http://invalid');
if (dbUrl.hostname !== 'postgres') throw new Error('DEV_POSTGRES_REQUIRED');
const kcBase = process.env.KEYCLOAK_ADMIN_INTERNAL_URL;
const realm = process.env.KEYCLOAK_REVOKER_REALM;
if (
  kcBase !== 'http://keycloak:8080' ||
  realm !== 'kurvenfunk' ||
  !process.env.KEYCLOAK_REVOKER_CLIENT_ID ||
  !process.env.KEYCLOAK_REVOKER_CLIENT_SECRET
) {
  throw new Error('DEV_KEYCLOAK_SERVICE_ACCOUNT_REQUIRED');
}

const seedSubjects = ['seed-neutral-user', 'seed-rapid-user', 'seed-editor-user'];
const expectedArticleSlugs = ['seed-sturm-kader-update', 'seed-cup-blau-weiss-rapid'];
const qaNicknames = ['Phase17 Test EDITOR', 'Phase17 Test USER', 'Phase19 Test MODERATOR'];
const expectedQaRole = new Map([
  ['Phase17 Test EDITOR', 'EDITOR'],
  ['Phase17 Test USER', 'USER'],
  ['Phase19 Test MODERATOR', 'MODERATOR'],
]);
const userRelations = {
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

const db = createPrismaClient();
let accessToken;
async function kc(method, path) {
  const res = await fetch(new URL('/admin/realms/' + realm + path, kcBase), {
    method,
    headers: { Authorization: 'Bearer ' + accessToken },
    signal: AbortSignal.timeout(15000),
  });
  if (method === 'DELETE' && (res.status === 204 || res.status === 404)) return null;
  if (method === 'GET' && res.status === 404) return null;
  if (!res.ok) throw new Error('KEYCLOAK_HTTP_' + res.status);
  return res.json();
}
async function keycloakLogin() {
  const res = await fetch(new URL('/realms/' + realm + '/protocol/openid-connect/token', kcBase), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.KEYCLOAK_REVOKER_CLIENT_ID,
      client_secret: process.env.KEYCLOAK_REVOKER_CLIENT_SECRET,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error('KEYCLOAK_AUTH_UNAVAILABLE');
  accessToken = (await res.json()).access_token;
  if (!accessToken) throw new Error('KEYCLOAK_ADMIN_TOKEN_MISSING');
}
async function getQaKeycloakUsers(qaUsers) {
  const identities = [];
  for (const row of qaUsers) {
    const identity = await kc('GET', '/users/' + encodeURIComponent(row.keycloakSubject));
    const prefix = row.nickname?.startsWith('Phase17 ') ? 'kf-p17-' : 'kf-p19-';
    if (
      !identity ||
      identity.id !== row.keycloakSubject ||
      !identity.username?.startsWith(prefix) ||
      !identity.username?.endsWith('@example.test') ||
      identity.email !== identity.username
    ) {
      throw new Error('QA_IDENTITY_PROVENANCE_MISMATCH');
    }
    identities.push(identity);
  }
  for (const prefix of ['kf-p17-', 'kf-p19-']) {
    const found = await kc('GET', '/users?search=' + prefix + '&max=1000');
    const matching = found.filter((user) => user.username?.startsWith(prefix));
    if (
      matching.length !== (prefix === 'kf-p17-' ? 2 : 1) ||
      matching.some((user) => !identities.some((id) => id.id === user.id))
    ) {
      throw new Error('UNRECOGNIZED_QA_KEYCLOAK_ACCOUNT');
    }
  }
  return identities;
}
async function inspect(tx) {
  const [accounts, articles, comments, commentRevisions, commentVotes] = await Promise.all([
    tx.user.findMany({
      where: {
        OR: [{ keycloakSubject: { in: seedSubjects } }, { nickname: { in: qaNicknames } }],
      },
      select: {
        id: true,
        keycloakSubject: true,
        nickname: true,
        roleAssignments: { select: { role: true } },
        profile: { select: { id: true } },
        _count: { select: userRelations },
      },
    }),
    tx.article.findMany({
      where: { slug: { startsWith: 'seed-' } },
      select: {
        id: true,
        slug: true,
        status: true,
        authorId: true,
        importRecordId: true,
        _count: { select: { revisions: true, entityMatches: true, comments: true } },
      },
    }),
    tx.comment.findMany({ select: { id: true, articleId: true } }),
    tx.commentRevision.count(),
    tx.reaction.count({ where: { commentId: { not: null } } }),
  ]);
  const knownSeed = accounts.filter((row) => seedSubjects.includes(row.keycloakSubject));
  const knownQa = accounts.filter((row) => qaNicknames.includes(row.nickname));
  const commentIds = comments.map((row) => row.id);
  const articleIds = articles.map((row) => row.id);
  const reports = await tx.moderationReport.findMany({
    where: { commentId: { in: commentIds } },
    select: { id: true, _count: { select: { sanctions: true } } },
  });
  const linkedCards = await tx.moderationCard.count({
    where: { sourceType: 'COMMENT', sourceId: { in: commentIds } },
  });
  const syntheticPublished = await tx.article.count({
    where: {
      status: 'PUBLISHED',
      OR: [
        { slug: { startsWith: 'seed-' } },
        { slug: { startsWith: 'demo-' } },
        { slug: { startsWith: 'mock-' } },
        { slug: { startsWith: 'test-' } },
      ],
    },
  });
  if (syntheticPublished > 0) throw new Error('UNEXPECTED_PUBLISHED_SYNTHETIC_ARTICLE');
  if (
    accounts.length !== 6 ||
    knownSeed.length !== 3 ||
    knownQa.length !== 3 ||
    articles.length !== 2 ||
    comments.length !== 29 ||
    articles.some(
      (row) =>
        !expectedArticleSlugs.includes(row.slug) ||
        row.status !== 'ARCHIVED' ||
        row.importRecordId !== null ||
        row._count.revisions !== 0 ||
        row._count.entityMatches !== 0 ||
        row.authorId !== knownSeed.find((u) => u.keycloakSubject === 'seed-editor-user')?.id,
    ) ||
    comments.some((row) => !articleIds.includes(row.articleId)) ||
    linkedCards !== 0 ||
    reports.some((row) => row._count.sanctions !== 0)
  ) {
    throw new Error('DEV_SNAPSHOT_CHANGED_OR_PROVENANCE_UNSAFE');
  }
  const allowed = new Set(['articles', 'roleAssignments', 'reportsAssigned', 'auditEventsAsActor']);
  for (const account of accounts) {
    if (
      Object.entries(account._count).some(
        ([relation, count]) => count > 0 && !allowed.has(relation),
      ) ||
      !account.roleAssignments.every((role) =>
        account.nickname && expectedQaRole.has(account.nickname)
          ? role.role === expectedQaRole.get(account.nickname)
          : true,
      ) ||
      (account.nickname &&
        expectedQaRole.has(account.nickname) &&
        account.roleAssignments.length !== 1)
    ) {
      throw new Error('ACCOUNT_HAS_UNEXPECTED_REAL_DEPENDENCIES');
    }
  }
  const editor = knownSeed.find((u) => u.keycloakSubject === 'seed-editor-user');
  if (!editor || editor._count.articles !== 2) throw new Error('SEED_AUTHOR_MISMATCH');
  console.log(
    'PHASE021_CLEANUP_PLAN=' +
      JSON.stringify({
        confirmedSyntheticUsers: accounts.length,
        qaKeycloakAccounts: knownQa.length,
        archivedSeedArticles: articles.length,
        allComments: comments.length,
        commentRevisions,
        commentVotes,
        linkedCommentReports: reports.length,
        linkedModerationCards: linkedCards,
        preservedClubIdentities: await tx.club.count(),
        preservedImportJobs: await tx.importJob.count(),
      }),
  );
  return { accounts, knownQa, articleIds, commentIds, reportIds: reports.map((row) => row.id) };
}
async function applyDb(tx, state) {
  const userIds = state.accounts.map((row) => row.id);
  const { articleIds, commentIds, reportIds } = state;
  const relatedIds = [...commentIds, ...reportIds, ...articleIds];
  const logs = await tx.auditLog.deleteMany({
    where: {
      OR: [
        { moderationReportId: { in: reportIds } },
        { targetType: 'COMMENT', targetId: { in: commentIds } },
        { targetType: 'ARTICLE', targetId: { in: articleIds } },
        { actorUserId: { in: userIds } },
        { targetUserId: { in: userIds } },
      ],
    },
  });
  const notifications = await tx.notification.deleteMany({
    where: {
      OR: [
        { sourceId: { in: relatedIds } },
        { userId: { in: userIds } },
        { actorUserId: { in: userIds } },
      ],
    },
  });
  const reports = await tx.moderationReport.deleteMany({
    where: { commentId: { in: commentIds } },
  });
  await tx.commentRevision.deleteMany({ where: { commentId: { in: commentIds } } });
  await tx.reaction.deleteMany({ where: { commentId: { in: commentIds } } });
  await tx.comment.updateMany({ where: { parentId: { not: null } }, data: { parentId: null } });
  const comments = await tx.comment.deleteMany({});
  const articles = await tx.article.deleteMany({ where: { id: { in: articleIds } } });
  const users = await tx.user.deleteMany({ where: { id: { in: userIds } } });
  if (comments.count !== 29 || articles.count !== 2 || users.count !== 6) {
    throw new Error('CONCURRENT_CLEANUP_COUNT_MISMATCH');
  }
  console.log(
    'PHASE021_DEV_DB_REMOVED=' +
      JSON.stringify({
        comments: comments.count,
        seedArticles: articles.count,
        qaAndSeedAccounts: users.count,
        linkedReports: reports.count,
        relatedNotifications: notifications.count,
        relatedAuditEvents: logs.count,
      }),
  );
}
async function verify() {
  const qa = await db.user.count({ where: { nickname: { in: qaNicknames } } });
  const seeded = await db.user.count({ where: { keycloakSubject: { in: seedSubjects } } });
  const seedArticles = await db.article.count({ where: { slug: { startsWith: 'seed-' } } });
  const comments = await db.comment.count();
  const revisions = await db.commentRevision.count();
  const votes = await db.reaction.count({ where: { commentId: { not: null } } });
  let inKeycloak = 0;
  for (const prefix of ['kf-p17-', 'kf-p19-']) {
    const found = await kc('GET', '/users?search=' + prefix + '&max=1000');
    inKeycloak += found.filter((row) => row.username?.startsWith(prefix)).length;
  }
  const result = {
    knownSeedAndQaUsers: qa + seeded,
    seedArticles,
    comments,
    revisions,
    votes,
    qaKeycloakUsers: inKeycloak,
  };
  console.log('PHASE021_CLEANUP_VERIFICATION=' + JSON.stringify(result));
  if (Object.values(result).some((v) => v !== 0)) throw new Error('CLEANUP_NOT_COMPLETE');
}

try {
  await keycloakLogin();
  if (mode === 'verify') {
    await verify();
  } else {
    const state = await inspect(db);
    const qaIdentities = await getQaKeycloakUsers(state.knownQa);
    if (mode === 'plan') {
      console.log('PHASE021_CLEANUP=PLAN_SAFE_NO_CHANGES');
    } else {
      await db.$transaction(
        async (tx) => {
          const current = await inspect(tx);
          await applyDb(tx, current);
        },
        { isolationLevel: 'Serializable', maxWait: 10000, timeout: 60000 },
      );
      for (const identity of qaIdentities) {
        await kc('DELETE', '/users/' + encodeURIComponent(identity.id));
      }
      await verify();
      console.log('PHASE021_CLEANUP=APPLIED_AND_VERIFIED');
    }
  }
} catch (error) {
  console.error('PHASE021_CLEANUP_FAILED', error instanceof Error ? error.message : 'UNKNOWN');
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}

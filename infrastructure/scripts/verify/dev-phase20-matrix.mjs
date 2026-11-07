// DEV-only Task 179: temporary real Keycloak identities + real HTTP API validation.
// Run only via the guarded VPS launcher. Never display tokens, passwords or raw responses.
import { createHash, randomBytes } from 'node:crypto';
import { createPrismaClient } from '@kurvenfunk/database';

let database;
let adminToken;
let failure = null;
let cleanupFailed = false;
const createdKeycloak = [];
const createdDatabase = [];
let fixtureArticleId = null;
let fixtureCommentId = null;
let fixtureArticleSlug = null;
let fixtureModeratorId = null;
const realm = 'kurvenfunk';
const marker = randomBytes(12).toString('hex');
const note = 'Private synthetic Phase20-179 HTTP acceptance note';
const userMessage = 'Temporary test-only account restriction';

function check(ok, code) {
  if (!ok) throw new Error(code);
}

function safeCode(error) {
  const message = error instanceof Error ? error.message : '';
  return /^[A-Z][A-Z0-9_]{2,90}$/.test(message) ? message : 'UNEXPECTED_FAILURE';
}

async function jsonOrNull(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request(url, options = {}) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
}

async function admin(method, suffix, payload) {
  const url = new URL('/admin/realms/' + realm + suffix, process.env.KEYCLOAK_ADMIN_INTERNAL_URL);
  return request(url, {
    method,
    headers: {
      authorization: 'Bearer ' + adminToken,
      ...(payload === undefined ? {} : { 'content-type': 'application/json' }),
    },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  });
}

function captureCookies(response, jar) {
  for (const entry of response.headers.getSetCookie()) {
    const first = entry.split(';', 1)[0];
    const separator = first.indexOf('=');
    if (separator > 0) {
      const name = first.slice(0, separator);
      const value = first.slice(separator + 1);
      if (value) {
        jar.set(name, value);
      } else {
        jar.delete(name);
      }
    }
  }
}

function privateKeycloakUrl(address) {
  const url = new URL(address);
  if (url.hostname === 'auth-dev.kurvenfunk.at') {
    url.protocol = 'http:';
    url.hostname = 'keycloak';
    url.port = '8080';
  }
  check(url.protocol === 'http:' && url.hostname === 'keycloak', 'PKCE_UNTRUSTED_REDIRECT');
  return url;
}

async function sessionRequest(jar, method, address, body) {
  const response = await request(privateKeycloakUrl(address), {
    method,
    redirect: 'manual',
    headers: {
      cookie: [...jar.entries()].map(([name, value]) => name + '=' + value).join('; '),
      ...(body === undefined ? {} : { 'content-type': 'application/x-www-form-urlencoded' }),
    },
    ...(body === undefined ? {} : { body }),
  });
  captureCookies(response, jar);
  return response;
}

async function getTokenFor(username, password) {
  const web = new URL(process.env.WEB_URL ?? '');
  check(web.hostname === 'dev.kurvenfunk.at' && web.protocol === 'https:', 'DEV_WEB_URL_REQUIRED');
  const redirectUri = new URL('/login', web).href;
  const codeVerifier = randomBytes(48).toString('base64url');
  const challenge = createHash('sha256').update(codeVerifier).digest('base64url');
  const state = randomBytes(24).toString('hex');
  const authorizeUrl = new URL(
    '/realms/' + realm + '/protocol/openid-connect/auth',
    process.env.KEYCLOAK_ADMIN_INTERNAL_URL,
  );
  authorizeUrl.search = new URLSearchParams({
    client_id: 'kurvenfunk-web',
    redirect_uri: redirectUri,
    response_type: 'code',
    response_mode: 'query',
    scope: 'openid',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  }).toString();

  const jar = new Map();
  let current = authorizeUrl;
  let response = await sessionRequest(jar, 'GET', current);
  let submitted = false;
  let authorizationCode;

  for (let redirects = 0; redirects < 10; redirects += 1) {
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      check(Boolean(location), 'PKCE_REDIRECT_MISSING');
      const next = new URL(location, current);
      if (next.origin === web.origin && next.pathname === '/login') {
        check(next.searchParams.get('state') === state, 'PKCE_STATE_MISMATCH');
        authorizationCode = next.searchParams.get('code');
        check(Boolean(authorizationCode), 'PKCE_AUTHORIZATION_CODE_MISSING');
        break;
      }
      current = next;
      response = await sessionRequest(jar, 'GET', current);
      continue;
    }

    check(response.status === 200, 'PKCE_LOGIN_PAGE_UNAVAILABLE');
    check(!submitted, 'PKCE_LOGIN_NOT_ACCEPTED');
    const html = await response.text();
    const forms = html.match(/<form\b[^>]*>/gi) ?? [];
    const form = forms.find(
      (item) => /id=["']kc-form-login["']/i.test(item) || /login-actions\/authenticate/i.test(item),
    );
    check(Boolean(form), 'PKCE_PASSWORD_FORM_NOT_FOUND');
    const action = form.match(/\baction=["']([^"']+)["']/i)?.[1];
    check(Boolean(action), 'PKCE_PASSWORD_FORM_ACTION_MISSING');
    const unescaped = action.replaceAll('&amp;', '&').replaceAll('&#38;', '&');
    current = new URL(unescaped, current);
    response = await sessionRequest(
      jar,
      'POST',
      current,
      new URLSearchParams({ username, password, credentialId: '' }),
    );
    submitted = true;
  }
  check(Boolean(authorizationCode), 'PKCE_REDIRECT_LIMIT_REACHED');

  const tokenUrl = new URL(
    '/realms/' + realm + '/protocol/openid-connect/token',
    process.env.KEYCLOAK_ADMIN_INTERNAL_URL,
  );
  const result = await request(tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: 'kurvenfunk-web',
      code: authorizationCode,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });
  check(result.status === 200, 'PKCE_TOKEN_EXCHANGE_FAILED');
  const payload = await jsonOrNull(result);
  check(typeof payload?.access_token === 'string', 'PKCE_ACCESS_TOKEN_MISSING');
  return payload.access_token;
}

async function api(method, path, token, payload) {
  const response = await request('http://127.0.0.1:3000/api/v1' + path, {
    method,
    headers: {
      authorization: 'Bearer ' + token,
      ...(payload === undefined ? {} : { 'content-type': 'application/json' }),
    },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  });
  return { status: response.status, body: await jsonOrNull(response) };
}

async function createIdentity(role) {
  const username = 'kf-p179-' + role.toLowerCase() + '-' + marker + '@example.test';
  const password = randomBytes(36).toString('base64url');
  const response = await admin('POST', '/users', {
    username,
    email: username,
    firstName: 'Kurvenfunk',
    lastName: 'Synthetic Phase20 179',
    enabled: true,
    emailVerified: true,
    requiredActions: [],
  });
  check(response.status === 201, 'KEYCLOAK_TEST_USER_CREATION_FAILED');

  let subject = response.headers.get('location')?.match(/\/users\/([0-9a-f-]{36})$/i)?.[1];
  if (!subject) {
    const found = await admin(
      'GET',
      '/users?username=' + encodeURIComponent(username) + '&exact=true',
    );
    check(found.status === 200, 'KEYCLOAK_TEST_USER_LOOKUP_FAILED');
    const matches = (await jsonOrNull(found))?.filter((entry) => entry.username === username);
    check(Array.isArray(matches) && matches.length === 1, 'KEYCLOAK_TEST_USER_AMBIGUOUS');
    subject = matches[0].id;
  }
  check(/^[0-9a-f-]{36}$/i.test(subject), 'KEYCLOAK_TEST_USER_INVALID_ID');
  createdKeycloak.push({ subject, username });

  const reset = await admin('PUT', '/users/' + encodeURIComponent(subject) + '/reset-password', {
    type: 'password',
    value: password,
    temporary: false,
  });
  check(reset.status === 204, 'KEYCLOAK_TEST_USER_PASSWORD_FAILED');

  const user = await database.user.create({
    data: {
      keycloakSubject: subject,
      nickname: 'Phase20 179 ' + role + ' ' + marker,
      status: 'ACTIVE',
      fanPreference: 'NEUTRAL',
      onboardingCompleted: true,
      roleAssignments: { create: { role } },
    },
    select: { id: true },
  });
  createdDatabase.push({ id: user.id, subject });
  return { username, password, id: user.id };
}

async function execute() {
  const databaseUrl = new URL(process.env.DATABASE_URL ?? '');
  const keycloakUrl = new URL(process.env.KEYCLOAK_ADMIN_INTERNAL_URL ?? '');
  const issuer = new URL(process.env.KEYCLOAK_ISSUER ?? '');
  check(databaseUrl.hostname === 'postgres', 'DEV_POSTGRES_REQUIRED');
  check(
    keycloakUrl.hostname === 'keycloak' && keycloakUrl.protocol === 'http:',
    'DEV_KEYCLOAK_INTERNAL_REQUIRED',
  );
  check(
    issuer.hostname === 'auth-dev.kurvenfunk.at' && issuer.pathname === '/realms/kurvenfunk',
    'DEV_ISSUER_REQUIRED',
  );
  check(process.env.KEYCLOAK_REVOKER_REALM === realm, 'DEV_REALM_REQUIRED');
  check(Boolean(process.env.KEYCLOAK_REVOKER_CLIENT_ID), 'DEV_ADMIN_CLIENT_REQUIRED');
  check(Boolean(process.env.KEYCLOAK_REVOKER_CLIENT_SECRET), 'DEV_ADMIN_SECRET_REQUIRED');

  database = createPrismaClient();

  const tokenResponse = await request(
    new URL('/realms/' + realm + '/protocol/openid-connect/token', keycloakUrl),
    {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.KEYCLOAK_REVOKER_CLIENT_ID,
        client_secret: process.env.KEYCLOAK_REVOKER_CLIENT_SECRET,
      }),
    },
  );
  check(tokenResponse.status === 200, 'KEYCLOAK_DEV_ADMIN_TOKEN_FAILED');
  const adminResult = await jsonOrNull(tokenResponse);
  adminToken = adminResult?.access_token;
  check(
    typeof adminToken === 'string' && adminToken.length > 0,
    'KEYCLOAK_DEV_ADMIN_TOKEN_MISSING',
  );

  const moderator = await createIdentity('MODERATOR');
  const reader = await createIdentity('USER');
  const moderatorToken = await getTokenFor(moderator.username, moderator.password);
  const readerToken = await getTokenFor(reader.username, reader.password);

  const before = await api('GET', '/auth/me', moderatorToken);
  check(before.status === 200, 'MODERATOR_AUTH_FAILED');
  check(
    before.body?.data?.id === moderator.id && before.body?.data?.roles?.includes('MODERATOR'),
    'MODERATOR_ROLE_NOT_CONFIRMED',
  );

  const path = '/moderation/limited-sanctions';
  const command = {
    userId: reader.id,
    duration: '24H',
    reasonCode: 'PHASE20_179_TEST',
    moderatorNote: note,
    userMessage,
  };
  const unauthorized = await api('POST', path, readerToken, command);
  check(unauthorized.status === 403, 'USER_LIMIT_PERMISSION_NOT_BLOCKED');

  const created = await api('POST', path, moderatorToken, command);
  check(created.status === 201, 'LIMITED_HTTP_CREATE_FAILED');
  const sanctionId = created.body?.data?.id;
  check(typeof sanctionId === 'string', 'LIMITED_HTTP_RESPONSE_MISSING');
  check(created.body.data.accountStatus === 'LIMITED', 'LIMITED_HTTP_ACCOUNT_STATUS_WRONG');
  check(!JSON.stringify(created.body).includes(note), 'LIMITED_HTTP_PRIVATE_NOTE_LEAK');

  const duplicate = await api('POST', path, moderatorToken, command);
  check(duplicate.status === 409, 'LIMITED_DUPLICATE_NOT_BLOCKED');

  const after = await api('GET', '/auth/me', readerToken);
  check(after.status === 200, 'LIMITED_USER_AUTH_FAILED');
  check(after.body?.data?.status === 'LIMITED', 'LIMITED_HTTP_STATUS_NOT_VISIBLE');

  // Everything below is Task 179 only. All content is uniquely synthetic.
  fixtureModeratorId = moderator.id;
  fixtureArticleSlug = 'phase20-179-matrix-' + marker;
  const syntheticArticle = await database.article.create({
    data: {
      title: 'Synthetic Phase 20 179 permission matrix',
      slug: fixtureArticleSlug,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      content: { type: 'doc', content: [] },
    },
    select: { id: true },
  });
  fixtureArticleId = syntheticArticle.id;
  const syntheticComment = await database.comment.create({
    data: {
      articleId: syntheticArticle.id,
      authorId: moderator.id,
      body: 'Synthetic Task 179 vote and report fixture',
    },
    select: { id: true },
  });
  fixtureCommentId = syntheticComment.id;

  const allowedReads = [
    '/articles?limit=10',
    '/articles/by-slug/' + fixtureArticleSlug,
    '/articles/' + fixtureArticleId + '/comments',
    '/matches',
    '/competitions',
    '/clubs',
    '/reactions/comments?ids=' + fixtureCommentId,
    '/comments/' + fixtureCommentId + '/votes/me',
  ];
  for (const path of allowedReads) {
    check((await api('GET', path, readerToken)).status === 200, 'LIMITED_READ_NOT_ALLOWED');
  }

  const votePath = '/comments/' + fixtureCommentId + '/votes';
  const upvote = await api('PUT', votePath, readerToken, { type: 'UPVOTE' });
  check(upvote.status === 200, 'LIMITED_VOTE_NOT_ALLOWED');
  const ownVote = await api('GET', votePath + '/me', readerToken);
  check(
    ownVote.status === 200 && ownVote.body?.data?.viewerVote === 'UPVOTE',
    'LIMITED_OWN_VOTE_NOT_VISIBLE',
  );
  const removeVote = await api('DELETE', votePath, readerToken);
  check(removeVote.status === 200, 'LIMITED_VOTE_REMOVAL_BLOCKED');
  check(
    (await database.reaction.count({
      where: { userId: reader.id, commentId: fixtureCommentId },
    })) === 0,
    'LIMITED_VOTE_REMOVAL_NOT_PERSISTED',
  );

  const report = await api('POST', '/comments/' + fixtureCommentId + '/reports', readerToken, {
    reason: 'SPAM',
  });
  check(report.status === 201, 'LIMITED_REPORT_NOT_ALLOWED');

  const commentsPath = '/articles/' + fixtureArticleId + '/comments';
  const blockedRequests = [
    ['POST', commentsPath, { body: 'LIMITED must not create' }],
    ['POST', commentsPath + '/' + fixtureCommentId + '/replies', { body: 'No replies' }],
    ['PATCH', commentsPath + '/' + fixtureCommentId, { body: 'No edits' }],
    ['DELETE', commentsPath + '/' + fixtureCommentId],
    ['GET', '/moderation/comment-reports'],
  ];
  for (const [method, path, body] of blockedRequests) {
    check(
      (await api(method, path, readerToken, body)).status === 403,
      'LIMITED_FORBIDDEN_ACTION_ALLOWED',
    );
  }
  check(
    (await database.comment.count({
      where: { articleId: fixtureArticleId, authorId: reader.id },
    })) === 0,
    'LIMITED_UNEXPECTED_COMMENT_CREATED',
  );
  console.log('PHASE20_179_DEV_KEYCLOAK_HTTP_MATRIX: PASS');

  const forbiddenPost = await api(
    'POST',
    '/articles/11111111-1111-4111-8111-111111111111/comments',
    readerToken,
    { body: 'This synthetic LIMITED request must be denied' },
  );
  check(forbiddenPost.status === 403, 'LIMITED_WRITE_NOT_BLOCKED');

  const sanction = await database.sanction.findUnique({
    where: { id: sanctionId },
    select: {
      userId: true,
      createdById: true,
      type: true,
      status: true,
      startsAt: true,
      expiresAt: true,
      reasonCode: true,
      internalNote: true,
      userMessage: true,
    },
  });
  check(
    sanction?.userId === reader.id &&
      sanction?.createdById === moderator.id &&
      sanction?.type === 'LIMITED' &&
      sanction?.status === 'ACTIVE' &&
      sanction?.internalNote === note &&
      sanction?.userMessage === userMessage &&
      sanction?.reasonCode === 'PHASE20_179_TEST',
    'LIMITED_DATABASE_RECORD_WRONG',
  );
  check(
    sanction.expiresAt.getTime() - sanction.startsAt.getTime() === 24 * 60 * 60 * 1000,
    'LIMITED_DATABASE_EXPIRATION_WRONG',
  );

  check(
    (await database.sanction.count({
      where: { userId: reader.id, type: 'LIMITED', status: 'ACTIVE' },
    })) === 1,
    'LIMITED_DUPLICATE_SANCTION_PERSISTED',
  );
  check(
    (await database.auditLog.count({
      where: {
        sanctionId,
        actorUserId: moderator.id,
        action: { in: ['SANCTION_CREATED', 'USER_STATUS_CHANGED'] },
      },
    })) === 2,
    'LIMITED_AUDIT_MISSING',
  );
  const notification = await database.notification.findFirst({
    where: { userId: reader.id, type: 'LIMITED', sourceId: sanctionId },
    select: { body: true },
  });
  check(
    notification?.body?.includes(userMessage) && !notification.body.includes(note),
    'LIMITED_NOTIFICATION_MISSING_OR_PRIVATE',
  );
  console.log('PHASE20_179_DEV_KEYCLOAK_HTTP: PASS');
}

async function cleanup() {
  if (database) {
    try {
      const ids = createdDatabase.map((entry) => entry.id);
      if (ids.length > 0) {
        const records = await database.user.findMany({
          where: { id: { in: ids } },
          select: { id: true, nickname: true, keycloakSubject: true },
        });
        check(
          records.length === ids.length &&
            records.every(
              (user) =>
                user.nickname?.startsWith('Phase20 179 ') &&
                createdDatabase.some(
                  (entry) => entry.id === user.id && entry.subject === user.keycloakSubject,
                ),
            ),
          'TEST_CLEANUP_IDENTITY_GUARD_FAILED',
        );
        if (fixtureArticleId) {
          const stored = await database.article.findUnique({
            where: { id: fixtureArticleId },
            select: { slug: true },
          });
          check(stored?.slug === fixtureArticleSlug, 'MATRIX_CLEANUP_ARTICLE_IDENTITY_FAILED');
        }
        if (fixtureCommentId) {
          const stored = await database.comment.findUnique({
            where: { id: fixtureCommentId },
            select: { articleId: true, authorId: true },
          });
          check(
            stored?.articleId === fixtureArticleId && stored?.authorId === fixtureModeratorId,
            'MATRIX_CLEANUP_COMMENT_IDENTITY_FAILED',
          );
        }
        await database.$transaction(async (tx) => {
          await tx.reaction.deleteMany({ where: { userId: { in: ids } } });
          await tx.moderationReport.deleteMany({
            where: { reporterId: { in: ids } },
          });
          if (fixtureCommentId) {
            await tx.comment.deleteMany({
              where: { id: fixtureCommentId, authorId: fixtureModeratorId },
            });
          }
          if (fixtureArticleId) {
            await tx.article.deleteMany({
              where: { id: fixtureArticleId, slug: fixtureArticleSlug },
            });
          }
          await tx.notification.deleteMany({
            where: { OR: [{ userId: { in: ids } }, { actorUserId: { in: ids } }] },
          });
          await tx.auditLog.deleteMany({
            where: { OR: [{ actorUserId: { in: ids } }, { targetUserId: { in: ids } }] },
          });
          await tx.sanction.deleteMany({
            where: { OR: [{ userId: { in: ids } }, { createdById: { in: ids } }] },
          });
          await tx.user.deleteMany({ where: { id: { in: ids } } });
        });
      }
    } catch {
      cleanupFailed = true;
      console.error('PHASE20_179_DEV_DB_CLEANUP_FAILED');
    }
    try {
      await database.$disconnect();
    } catch {
      cleanupFailed = true;
    }
  }

  if (adminToken) {
    for (const created of [...createdKeycloak].reverse()) {
      try {
        check(
          created.username.startsWith('kf-p179-') && created.username.endsWith('@example.test'),
          'TEST_KEYCLOAK_CLEANUP_IDENTITY_GUARD_FAILED',
        );
        const response = await admin('DELETE', '/users/' + encodeURIComponent(created.subject));
        check(response.status === 204 || response.status === 404, 'TEST_KEYCLOAK_CLEANUP_REJECTED');
      } catch {
        cleanupFailed = true;
        console.error('PHASE20_179_DEV_KEYCLOAK_CLEANUP_FAILED');
      }
    }
  }
}

try {
  await execute();
} catch (error) {
  failure = safeCode(error);
} finally {
  await cleanup();
}
if (failure || cleanupFailed) {
  console.error('PHASE20_179_DEV_HTTP_E2E: FAIL ' + (failure ?? 'CLEANUP_FAILED'));
  process.exitCode = 1;
} else {
  console.log('PHASE20_179_DEV_HTTP_E2E: PASS; TEST_FIXTURES_REMOVED');
}

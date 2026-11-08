// DEV-only Task 186: temporary real Keycloak identities + real HTTP API validation.
// Run only via the guarded VPS launcher. Never display tokens, passwords or raw responses.
import { createHash, randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { createPrismaClient } from '@kurvenfunk/database';

let database;
let adminToken;
let pendingRefreshToken = null;
const require = createRequire(import.meta.url);
const { DirectRedCardService } = require('./dist/modules/moderation/direct-red-card.service.js');
const { ModerationService } = require('./dist/modules/moderation/moderation.service.js');
const { KeycloakSessionRevoker } = require('./dist/modules/moderation/keycloak-session-revoker.js');
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
const note = 'Private synthetic Phase20-186 HTTP acceptance note';
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
  if (username.startsWith('kf-p186-trusted_user-')) {
    check(typeof payload.refresh_token === 'string', 'PKCE_REFRESH_TOKEN_MISSING');
    pendingRefreshToken = payload.refresh_token;
  }
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
  const username = 'kf-p186-' + role.toLowerCase() + '-' + marker + '@example.test';
  const password = randomBytes(36).toString('base64url');
  const response = await admin('POST', '/users', {
    username,
    email: username,
    firstName: 'Kurvenfunk',
    lastName: 'Synthetic Phase20 186',
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
      nickname: 'Phase20 186 ' + role + ' ' + marker,
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

  const administrator = await createIdentity('ADMIN');
  const target = await createIdentity('USER');
  const administratorToken = await getTokenFor(administrator.username, administrator.password);
  const originalTargetToken = await getTokenFor(target.username, target.password);

  // Real Keycloak browser session must exist before the ordinary HTTP RED ban.
  const httpTargetRecord = createdKeycloak.find((item) => item.username === target.username);
  check(Boolean(httpTargetRecord), 'HTTP_TEST_USER_MISSING');
  const httpSessions = await admin(
    'GET',
    '/users/' + encodeURIComponent(httpTargetRecord.subject) + '/sessions',
  );
  check(httpSessions.status === 200, 'HTTP_TEST_SESSIONS_UNAVAILABLE');
  const httpSessionsBefore = await jsonOrNull(httpSessions);
  check(
    Array.isArray(httpSessionsBefore) && httpSessionsBefore.length > 0,
    'HTTP_TEST_SESSION_NOT_ACTIVE',
  );

  const before = await api('GET', '/auth/me', originalTargetToken);
  check(
    before.status === 200 && before.body?.data?.status === 'ACTIVE',
    'BANNED_PRECONDITION_ACTIVE_MISSING',
  );

  fixtureModeratorId = administrator.id;
  fixtureArticleSlug = 'phase20-186-banned-' + marker;
  const article = await database.article.create({
    data: {
      title: 'Synthetic Phase 20 180 banned test article',
      slug: fixtureArticleSlug,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      content: { type: 'doc', content: [] },
    },
    select: { id: true },
  });
  fixtureArticleId = article.id;
  const comment = await database.comment.create({
    data: {
      articleId: article.id,
      authorId: administrator.id,
      body: 'Synthetic comment for banned-action testing only',
    },
    select: { id: true },
  });
  fixtureCommentId = comment.id;

  const command = {
    userId: target.id,
    reasonCode: 'PHASE20_186_TEST',
    moderatorNote: note,
    userMessage,
    sourceType: 'NONE',
  };
  const unauthorized = await api('POST', '/moderation/red-cards', originalTargetToken, command);
  check(unauthorized.status === 403, 'BANNED_USER_BAN_PERMISSION_NOT_BLOCKED');

  const issued = await api('POST', '/moderation/red-cards', administratorToken, command);
  const cardId = issued.body?.data?.id;
  check(issued.status === 201 && typeof cardId === 'string', 'BANNED_RED_CARD_CREATE_FAILED');
  check(
    issued.body.data.accountStatus === 'BANNED' && issued.body.data.type === 'RED',
    'BANNED_RED_CARD_RESPONSE_WRONG',
  );
  check(!JSON.stringify(issued.body).includes(note), 'BANNED_PRIVATE_NOTE_LEAK');
  check(issued.body.data.sessionRevocation === 'REVOKED', 'BANNED_SESSION_REVOKE_NOT_CONFIRMED');

  const duplicate = await api('POST', '/moderation/red-cards', administratorToken, command);
  check(duplicate.status === 409, 'BANNED_DUPLICATE_RED_CARD_NOT_BLOCKED');

  const sessions = await admin(
    'GET',
    '/users/' +
      encodeURIComponent(
        createdKeycloak.find((user) => user.username === target.username)?.subject,
      ) +
      '/sessions',
  );
  check(sessions.status === 200, 'BANNED_SESSION_LIST_NOT_AVAILABLE');
  const activeSessions = await jsonOrNull(sessions);
  check(
    Array.isArray(activeSessions) && activeSessions.length === 0,
    'BANNED_SESSIONS_STILL_ACTIVE',
  );

  const staleTokenCheck = await api('GET', '/auth/me', originalTargetToken);
  check(
    staleTokenCheck.status === 403 && staleTokenCheck.body?.code === 'ACCOUNT_BANNED',
    'BANNED_STALE_TOKEN_ALLOWED',
  );

  const freshTargetToken = await getTokenFor(target.username, target.password);
  const freshStatus = await api('GET', '/auth/me', freshTargetToken);
  check(
    freshStatus.status === 403 && freshStatus.body?.code === 'ACCOUNT_BANNED',
    'BANNED_FRESH_LOGIN_ALLOWED',
  );

  const root = '/articles/' + fixtureArticleId + '/comments';
  const votes = '/comments/' + fixtureCommentId + '/votes';
  const deniedActions = [
    ['POST', root, { body: 'Must not create a comment' }],
    ['POST', root + '/' + fixtureCommentId + '/replies', { body: 'Must not reply' }],
    ['PATCH', root + '/' + fixtureCommentId, { body: 'Must not edit' }],
    ['DELETE', root + '/' + fixtureCommentId],
    ['PUT', votes, { type: 'UPVOTE' }],
    ['DELETE', votes],
    ['POST', '/comments/' + fixtureCommentId + '/reports', { reason: 'SPAM' }],
    ['GET', '/reactions/comments/me?ids=' + fixtureCommentId],
    ['GET', '/moderation/comment-reports'],
    [
      'POST',
      '/moderation/limited-sanctions',
      {
        userId: administrator.id,
        duration: '24H',
        reasonCode: 'BANNED_BYPASS_TEST',
        moderatorNote: note,
      },
    ],
    ['POST', '/moderation/red-cards', command],
  ];
  for (const [method, route, input] of deniedActions) {
    const rejected = await api(method, route, freshTargetToken, input);
    check(
      rejected.status === 403 && rejected.body?.code === 'ACCOUNT_BANNED',
      'BANNED_AUTHENTICATED_BYPASS_ALLOWED',
    );
  }

  // Public resources must remain visible, but they never confer membership access.
  check(
    (await api('GET', '/articles/by-slug/' + fixtureArticleSlug, originalTargetToken)).status ===
      200,
    'BANNED_PUBLIC_ARTICLE_UNAVAILABLE',
  );
  check(
    (await api('GET', '/comments/' + fixtureCommentId + '/votes', originalTargetToken)).status ===
      200,
    'BANNED_PUBLIC_VOTE_SUMMARY_UNAVAILABLE',
  );

  const card = await database.moderationCard.findUnique({
    where: { id: cardId },
    select: {
      userId: true,
      moderatorId: true,
      type: true,
      status: true,
      reasonCode: true,
      moderatorNote: true,
    },
  });
  check(
    card?.userId === target.id &&
      card.moderatorId === administrator.id &&
      card.type === 'RED' &&
      card.status === 'ACTIVE' &&
      card.reasonCode === 'PHASE20_186_TEST' &&
      card.moderatorNote === note,
    'BANNED_RED_CARD_DATABASE_MISMATCH',
  );
  const targetRow = await database.user.findUnique({
    where: { id: target.id },
    select: { status: true },
  });
  check(targetRow?.status === 'BANNED', 'BANNED_STATUS_NOT_PERSISTED');
  check(
    (await database.moderationCard.count({
      where: { userId: target.id, type: 'RED', status: 'ACTIVE' },
    })) === 1,
    'BANNED_DUPLICATE_CARD_PERSISTED',
  );
  check(
    (await database.auditLog.count({
      where: {
        moderationCardId: cardId,
        actorUserId: administrator.id,
        action: { in: ['MODERATION_CARD_CREATED', 'USER_STATUS_CHANGED'] },
      },
    })) === 2,
    'BANNED_AUDIT_MISSING',
  );
  const notification = await database.notification.findFirst({
    where: { userId: target.id, type: 'RED_CARD', sourceId: cardId },
    select: { body: true, metadata: true },
  });
  check(
    notification?.body?.includes('PHASE20_186_TEST') &&
      !notification.body.includes(note) &&
      notification.metadata?.sessionRevocation === 'REVOKED',
    'BANNED_NOTIFICATION_OR_REVOCATION_WRONG',
  );
  check(
    (await database.comment.count({ where: { authorId: target.id } })) === 0 &&
      (await database.reaction.count({ where: { userId: target.id } })) === 0 &&
      (await database.moderationReport.count({ where: { reporterId: target.id } })) === 0,
    'BANNED_BLOCKED_ACTION_MUTATED_DATA',
  );

  // Task 186: isolated failure on a second newly created synthetic account.
  // The real shared Keycloak service stays up. No existing user/session is touched.
  const deferred = await createIdentity('TRUSTED_USER');
  const deferredToken = await getTokenFor(deferred.username, deferred.password);
  check((await api('GET', '/auth/me', deferredToken)).status === 200, 'DEFERRED_TARGET_NOT_ACTIVE');
  const deferredKeycloak = createdKeycloak.find((item) => item.username === deferred.username);
  check(Boolean(deferredKeycloak), 'DEFERRED_KEYCLOAK_IDENTITY_MISSING');
  const activeBefore = await admin(
    'GET',
    '/users/' + encodeURIComponent(deferredKeycloak.subject) + '/sessions',
  );
  check(activeBefore.status === 200, 'DEFERRED_SESSIONS_QUERY_FAILED');
  const sessionsBefore = await jsonOrNull(activeBefore);
  check(
    Array.isArray(sessionsBefore) && sessionsBefore.length > 0,
    'DEFERRED_PKCE_SESSION_MISSING',
  );

  // Inject a failing revoker for this *single in-process direct-ban service*.
  // This is not a Keycloak outage or network tampering.
  const simulatedOutageRevoker = {
    isConfigured: true,
    revokeSessions: async (subject) => {
      check(subject === deferredKeycloak.subject, 'DEFERRED_REVOCATION_SCOPE_VIOLATION');
      return false;
    },
  };
  const direct = new DirectRedCardService(simulatedOutageRevoker);
  let deferredCard;
  try {
    deferredCard = await direct.createDirectRedCard({
      userId: deferred.id,
      moderatorId: administrator.id,
      reasonCode: 'PHASE20_186_TEST',
      moderatorNote: note,
      userMessage,
      sourceType: 'NONE',
    });
    check(
      deferredCard.sessionRevocation === 'PENDING' && deferredCard.accountStatus === 'BANNED',
      'DEFERRED_BAN_NOT_PENDING',
    );
  } finally {
    await direct.onModuleDestroy();
  }
  const deferredNotice = await database.notification.findFirst({
    where: { userId: deferred.id, sourceId: deferredCard.id, type: 'RED_CARD' },
    select: { id: true, metadata: true },
  });
  check(deferredNotice?.metadata?.sessionRevocation === 'PENDING', 'DEFERRED_PENDING_NOT_DURABLE');
  check(
    (await database.user.findUnique({ where: { id: deferred.id } }))?.status === 'BANNED',
    'DEFERRED_ACCOUNT_NOT_BANNED',
  );
  const stillActiveDuringFailure = await admin(
    'GET',
    '/users/' + encodeURIComponent(deferredKeycloak.subject) + '/sessions',
  );
  check(stillActiveDuringFailure.status === 200, 'DEFERRED_OUTAGE_SESSION_UNAVAILABLE');
  const sessionsDuringOutage = await jsonOrNull(stillActiveDuringFailure);
  check(
    Array.isArray(sessionsDuringOutage) && sessionsDuringOutage.length > 0,
    'DEFERRED_OUTAGE_DID_NOT_LEAVE_SESSION_ACTIVE',
  );
  // The app's BANNED guard must deny both stale browser and mobile credentials,
  // even before Keycloak's logout eventually succeeds.
  const deniedStale = await api('GET', '/auth/me', deferredToken);
  check(
    deniedStale.status === 403 && deniedStale.body?.code === 'ACCOUNT_BANNED',
    'DEFERRED_STALE_JWT_NOT_DENIED',
  );
  const mobileResponse = await request('http://127.0.0.1:3000/api/v1/auth/me', {
    headers: {
      authorization: 'Bearer ' + deferredToken,
      'user-agent': 'kurvenfunk-synthetic-mobile/1.0',
      accept: 'application/json',
    },
  });
  const mobileBody = await jsonOrNull(mobileResponse);
  check(
    mobileResponse.status === 403 && mobileBody?.code === 'ACCOUNT_BANNED',
    'DEFERRED_MOBILE_JWT_NOT_DENIED',
  );

  // A scoped DB adapter is critical: the retry may only see or update this
  // test notification, NEVER another DEV account's pending revocations.
  function scopedDatabase() {
    return {
      notification: {
        findMany: async (query) => {
          check(
            query.where.type === 'RED_CARD' && query.where.metadata?.equals === 'PENDING',
            'DEFERRED_SCAN_NOT_BOUNDED',
          );
          return database.notification.findMany({
            ...query,
            where: { ...query.where, id: deferredNotice.id },
          });
        },
        update: async (query) => {
          check(query.where.id === deferredNotice.id, 'DEFERRED_UPDATE_OUTSIDE_SYNTHETIC_NOTICE');
          return database.notification.update(query);
        },
      },
      $disconnect: async () => undefined,
    };
  }

  // First the periodic recovery sees an isolated Keycloak failure: still PENDING.
  const failedRecovery = new ModerationService(simulatedOutageRevoker);
  const failedRecoveryOriginalDb = failedRecovery.database;
  failedRecovery.database = scopedDatabase();
  try {
    await failedRecovery.retryPendingSessionRevocations();
    const noteAfterFailure = await database.notification.findUnique({
      where: { id: deferredNotice.id },
      select: { metadata: true },
    });
    check(
      noteAfterFailure?.metadata?.sessionRevocation === 'PENDING',
      'DEFERRED_FAILURE_LOST_PENDING',
    );
  } finally {
    await failedRecovery.onModuleDestroy();
    await failedRecoveryOriginalDb.$disconnect();
  }

  // Simulate a fresh API module initialization and use a REAL Keycloak
  // service-account POST /logout. No shared-container restart is required.
  const recovered = new ModerationService(new KeycloakSessionRevoker());
  const recoveredOriginalDb = recovered.database;
  recovered.database = scopedDatabase();
  try {
    recovered.onModuleInit();
    let restored = false;
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const observed = await database.notification.findUnique({
        where: { id: deferredNotice.id },
        select: { metadata: true },
      });
      if (observed?.metadata?.sessionRevocation === 'REVOKED') {
        restored = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    check(restored, 'DEFERRED_STARTUP_RETRY_NOT_COMPLETED');
    await recovered.retryPendingSessionRevocations(); // no repeat once REVOKED
  } finally {
    await recovered.onModuleDestroy();
    await recoveredOriginalDb.$disconnect();
  }
  const activeAfter = await admin(
    'GET',
    '/users/' + encodeURIComponent(deferredKeycloak.subject) + '/sessions',
  );
  check(
    activeAfter.status === 200 && (await jsonOrNull(activeAfter))?.length === 0,
    'DEFERRED_KEYCLOAK_SESSIONS_NOT_REVOKED',
  );
  const refresh = await request(
    new URL(
      '/realms/' + realm + '/protocol/openid-connect/token',
      process.env.KEYCLOAK_ADMIN_INTERNAL_URL,
    ),
    {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: 'kurvenfunk-web',
        refresh_token: pendingRefreshToken,
      }),
    },
  );
  check(
    refresh.status === 400 || refresh.status === 401,
    'DEFERRED_REVOKED_SESSION_REFRESH_ALLOWED',
  );
  check(
    (await database.user.findUnique({ where: { id: deferred.id } }))?.status === 'BANNED',
    'DEFERRED_REVOKE_UNBANNED_USER',
  );
  check(
    (await api('GET', '/auth/me', deferredToken)).status === 403,
    'DEFERRED_REVOKED_STALE_JWT_ALLOWED',
  );
  check(
    (
      await database.notification.findUnique({
        where: { id: deferredNotice.id },
        select: { metadata: true },
      })
    )?.metadata?.sessionRevocation === 'REVOKED',
    'DEFERRED_REVOCATION_STATUS_WRONG',
  );

  console.log(
    'PHASE20_186_DEV_SESSION_REVOKE: PASS (real PKCE logout, simulated outage, durable retry on startup, stale JWT and refresh denied)',
  );
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
                user.nickname?.startsWith('Phase20 186 ') &&
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
          await tx.moderationCard.deleteMany({ where: { userId: { in: ids } } });
          await tx.user.deleteMany({ where: { id: { in: ids } } });
        });
      }
    } catch {
      cleanupFailed = true;
      console.error('PHASE20_186_DEV_DB_CLEANUP_FAILED');
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
          created.username.startsWith('kf-p186-') && created.username.endsWith('@example.test'),
          'TEST_KEYCLOAK_CLEANUP_IDENTITY_GUARD_FAILED',
        );
        const response = await admin('DELETE', '/users/' + encodeURIComponent(created.subject));
        check(response.status === 204 || response.status === 404, 'TEST_KEYCLOAK_CLEANUP_REJECTED');
      } catch {
        cleanupFailed = true;
        console.error('PHASE20_186_DEV_KEYCLOAK_CLEANUP_FAILED');
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
  console.error('PHASE20_186_DEV_HTTP_E2E: FAIL ' + (failure ?? 'CLEANUP_FAILED'));
  process.exitCode = 1;
} else {
  console.log('PHASE20_186_DEV_HTTP_E2E: PASS; TEST_FIXTURES_REMOVED');
}

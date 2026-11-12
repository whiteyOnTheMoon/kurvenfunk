#!/usr/bin/env node
// One-time archival cleanup for the 11 explicitly reviewed stale branch refs.
// Archive each exact commit as a Git tag BEFORE deleting its branch.
const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const expectedSha = process.env.GITHUB_SHA;
if (
  repo !== 'whiteyOnTheMoon/kurvenfunk' ||
  !token ||
  !/^[0-9a-f]{40}$/i.test(expectedSha ?? '') ||
  process.env.GITHUB_REF !== 'refs/heads/develop'
) {
  throw new Error('ARCHIVE_CLEANUP_GUARD_FAILED');
}

const candidates = Object.freeze([
  'chore/phase21-cleanup-last-ambiguous-fixture',
  'chore/phase21-final-dev-cleanup-retry',
  'diag/task-176-dev-accounts',
  'diag/task-177-dev-e2e',
  'feat/phase20-appeals-dashboard',
  'feat/phase20-ip-protection',
  'feat/phase20-limited-expiration',
  'feat/phase20-moderation-insights',
  'feature/phase21-dev-provenance-cleanup',
  'ops/phase0-21-safe-dev-test-account-cleanup',
  'test/phase19-chromium-voting-reports',
]);
const apiBase = 'https://api.github.com/repos/' + repo;
const headers = {
  authorization: 'Bearer ' + token,
  accept: 'application/vnd.github+json',
  'x-github-api-version': '2022-11-28',
};
const encodePath = (path) => path.split('/').map(encodeURIComponent).join('/');
async function api(path, method = 'GET', body, optional404 = false) {
  const response = await fetch(apiBase + path, {
    method,
    headers: {
      ...headers,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20000),
  });
  if (optional404 && response.status === 404) return null;
  if (!response.ok) {
    throw new Error('ARCHIVE_GITHUB_API_HTTP_' + response.status);
  }
  return response.status === 204 ? null : response.json();
}
async function allOpenPulls() {
  const result = [];
  for (let page = 1; page <= 20; page++) {
    const chunk = await api('/pulls?state=open&per_page=100&page=' + page);
    if (!Array.isArray(chunk)) throw new Error('ARCHIVE_PULL_PAGINATION_INVALID');
    result.push(...chunk);
    if (chunk.length < 100) return result;
  }
  throw new Error('ARCHIVE_PULL_PAGINATION_EXCEEDED');
}
async function assertDevelopPinned() {
  const dev = await api('/branches/develop');
  if (dev.commit.sha !== expectedSha) throw new Error('ARCHIVE_DEVELOP_MOVED');
}
await assertDevelopPinned();
const openPulls = await allOpenPulls();
const openRefs = new Set(
  openPulls.filter((pr) => pr.head.repo?.full_name === repo).map((pr) => pr.head.ref),
);
const archived = [];
const skipped = [];
for (const name of candidates) {
  if (['develop', 'main'].includes(name) || openRefs.has(name)) {
    skipped.push({ name, reason: 'protected_or_open' });
    continue;
  }
  await assertDevelopPinned();
  const branch = await api('/branches/' + encodePath(name), 'GET', undefined, true);
  if (!branch) {
    skipped.push({ name, reason: 'already_absent' });
    continue;
  }
  if (branch.protected || !/^[0-9a-f]{40}$/i.test(branch.commit.sha)) {
    skipped.push({ name, reason: 'protected_or_invalid' });
    continue;
  }
  const originalSha = branch.commit.sha;
  const archiveName = 'archive/branch-cleanup-20261112/' + name;
  const tagRef = 'refs/tags/' + archiveName;
  const tagPath = '/git/ref/tags/' + encodePath(archiveName);
  let tag = await api(tagPath, 'GET', undefined, true);
  if (!tag) {
    await api('/git/refs', 'POST', { ref: tagRef, sha: originalSha });
    tag = await api(tagPath);
  }
  if (tag.object?.sha !== originalSha || tag.object?.type !== 'commit') {
    throw new Error('ARCHIVE_TAG_NOT_IDENTICAL_' + name);
  }
  // No removal if the branch was modified, protected, or gained an open PR.
  await assertDevelopPinned();
  const fresh = await api('/branches/' + encodePath(name), 'GET', undefined, true);
  if (!fresh || fresh.protected || fresh.commit.sha !== originalSha) {
    skipped.push({ name, reason: 'branch_changed' });
    continue;
  }
  const openNow = await api(
    '/pulls?state=open&per_page=100&head=' + encodeURIComponent(repo.split('/')[0] + ':' + name),
  );
  if (openNow.length > 0) {
    skipped.push({ name, reason: 'new_open_pr' });
    continue;
  }
  await api('/git/refs/heads/' + encodePath(name), 'DELETE');
  console.log('ARCHIVED_AND_REMOVED ' + name + ' ' + archiveName);
  archived.push(name);
}
console.log(
  'ARCHIVE_CLEANUP_RESULT ' +
    JSON.stringify({
      candidates: candidates.length,
      removed: archived.length,
      preserved: skipped,
      archivePrefix: 'refs/tags/archive/branch-cleanup-20261112/',
    }),
);

#!/usr/bin/env node
// One-time branch hygiene: ONLY exact source tips of merged PRs, no open PRs.
// GitHub Actions runs this after the tested DEV deployment and smoke test.
const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const expectedSha = process.env.GITHUB_SHA;

if (
  !repo ||
  !/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repo) ||
  !token ||
  !/^[0-9a-f]{40}$/i.test(expectedSha ?? '') ||
  process.env.GITHUB_REF !== 'refs/heads/develop'
) {
  throw new Error('BRANCH_CLEANUP_GUARD_FAILED');
}

const base = 'https://api.github.com/repos/' + repo;
const headers = {
  authorization: 'Bearer ' + token,
  accept: 'application/vnd.github+json',
  'x-github-api-version': '2022-11-28',
};
async function api(path, method = 'GET') {
  const response = await fetch(base + path, {
    method,
    headers,
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    if (method === 'DELETE') {
      throw new Error('BRANCH_DELETE_HTTP_' + response.status);
    }
    throw new Error('GITHUB_API_HTTP_' + response.status);
  }
  return method === 'DELETE' ? null : response.json();
}

async function pages(resource) {
  const items = [];
  for (let page = 1; page <= 20; page += 1) {
    const data = await api(
      resource + (resource.includes('?') ? '&' : '?') + 'per_page=100&page=' + page,
    );
    if (!Array.isArray(data)) throw new Error('GITHUB_PAGINATION_UNEXPECTED');
    items.push(...data);
    if (data.length < 100) return items;
  }
  throw new Error('GITHUB_PAGINATION_LIMIT_EXCEEDED');
}

// Ensure our job only runs against the exact develop commit that passed CI.
const develop = await api('/branches/develop');
if (develop.commit.sha !== expectedSha) {
  throw new Error('BRANCH_CLEANUP_DEVELOP_MOVED');
}

const [branches, pulls] = await Promise.all([pages('/branches'), pages('/pulls?state=all')]);
const protectedNames = new Set(['develop', 'main']);
const openHeads = new Set(
  pulls
    .filter((pr) => pr.state === 'open' && pr.head.repo?.full_name === repo)
    .map((pr) => pr.head.ref),
);
const mergedAtExactTip = new Map();
for (const pr of pulls) {
  if (
    !pr.merged_at ||
    pr.head.repo?.full_name !== repo ||
    !['main', 'develop'].includes(pr.base.ref)
  )
    continue;

  const key = pr.head.ref + ':' + pr.head.sha;
  mergedAtExactTip.set(key, true);
}

let deleted = 0;
const retained = {
  protected: 0,
  open: 0,
  unmerged: 0,
  moved: 0,
};

for (const branch of branches) {
  const name = branch.name;
  if (protectedNames.has(name) || branch.protected) {
    retained.protected += 1;
    continue;
  }
  if (openHeads.has(name)) {
    retained.open += 1;
    continue;
  }
  if (!mergedAtExactTip.get(name + ':' + branch.commit.sha)) {
    retained.unmerged += 1;
    continue;
  }

  // Recheck just before the irreversible operation. Do not delete branches
  // updated since the listing or those that gained a new open PR.
  const current = await api('/branches/' + encodeURIComponent(name));
  const openNow = await api(
    '/pulls?state=open&head=' +
      encodeURIComponent(repo.split('/')[0] + ':' + name) +
      '&per_page=100',
  );

  if (current.protected || current.commit.sha !== branch.commit.sha || openNow.length) {
    retained.moved += 1;
    continue;
  }

  // Slash-separated refs are a supported GitHub git/refs route.
  const refPath = name.split('/').map(encodeURIComponent).join('/');
  await api('/git/refs/heads/' + refPath, 'DELETE');
  deleted += 1;
  console.log('REMOVED_MERGED_PR_BRANCH ' + name);
}

console.log(
  'BRANCH_CLEANUP_RESULT ' + JSON.stringify({ before: branches.length, deleted, retained }),
);

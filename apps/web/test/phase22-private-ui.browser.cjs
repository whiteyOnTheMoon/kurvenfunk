/* eslint-disable @typescript-eslint/no-require-imports -- isolated Chromium runner */
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { join, resolve } = require('node:path');

const listen = (server) =>
  new Promise((done, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', done);
  });
const close = (server) =>
  server.listening ? new Promise((done) => server.close(done)) : Promise.resolve();

async function main() {
  const installed = process.env.PLAYWRIGHT_MODULE_DIR;
  if (!installed) throw new Error('PLAYWRIGHT_MODULE_DIR is required');
  const { chromium } = require(join(installed, 'playwright'));
  const { build } = require(join(installed, 'esbuild'));
  const root = resolve(__dirname, '..');

  const source = [
    "import React from 'react';",
    "import { createRoot } from 'react-dom/client';",
    "import { ForumReportQueue } from './src/features/forum/forum-report-queue';",
    "import { ThreadUnreadToggle } from './src/features/forum/thread-unread-toggle';",
    "const mode = new URLSearchParams(window.location.search).get('view');",
    "createRoot(document.getElementById('root')).render(mode === 'queue'",
    '  ? <ForumReportQueue apiUrl={window.location.origin} />',
    '  : <ThreadUnreadToggle apiUrl={window.location.origin}',
    "      forumSlug='verein-sv-test' threadSlug='thema-a' revision={0}",
    "      posts={[{ id: 'post-1', sequenceNumber: 1, deleted: false },",
    "        { id: 'post-2', sequenceNumber: 2, deleted: false }]} />);",
  ].join('\n');

  const built = await build({
    stdin: {
      contents: source,
      resolveDir: root,
      sourcefile: join(root, 'phase22-account-switch-harness.tsx'),
      loader: 'tsx',
    },
    bundle: true,
    write: false,
    outdir: '/tmp/phase22-private-ui',
    platform: 'browser',
    format: 'iife',
    jsx: 'automatic',
    loader: { '.module.css': 'local-css', '.css': 'css' },
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [
      {
        name: 'isolated-auth-and-link',
        setup(builder) {
          builder.onResolve({ filter: /auth\/auth-provider$/ }, () => ({
            path: 'auth-stub',
            namespace: 'phase22-stub',
          }));
          builder.onResolve({ filter: /^next\/link$/ }, () => ({
            path: 'link-stub',
            namespace: 'phase22-stub',
          }));
          builder.onLoad({ filter: /.*/, namespace: 'phase22-stub' }, (args) => ({
            contents:
              args.path === 'auth-stub'
                ? [
                    "import React from 'react';",
                    'let current = { initialized: true, sessionRecovering: false,',
                    '  authenticated: false, token: null, user: null };',
                    'const listeners = new Set();',
                    'export function useAuth() {',
                    '  return React.useSyncExternalStore(',
                    '    callback => { listeners.add(callback); return () => listeners.delete(callback); },',
                    '    () => current);',
                    '}',
                    'window.__phase22SwitchAuth = next => {',
                    '  current = next;',
                    '  for (const listener of listeners) listener();',
                    '};',
                  ].join('\n')
                : "import React from 'react'; export default function Link({href, children, ...rest}) {" +
                  "return React.createElement('a', {href, ...rest}, children); }",
            loader: 'js',
            resolveDir: root,
          }));
        },
      },
    ],
    logLevel: 'silent',
  });
  const js = built.outputFiles.find((file) => file.path.endsWith('.js'))?.text;
  const css = built.outputFiles.find((file) => file.path.endsWith('.css'))?.text;
  assert.ok(js);
  assert.ok(css);

  const report = (owner) => ({
    id: 'report-' + owner,
    postId: 'post-' + owner,
    status: 'OPEN',
    reason: 'SPAM',
    details: null,
    createdAt: '2026-11-21T10:00:00.000Z',
    post: {
      id: 'post-' + owner,
      content: 'Vertraulicher Moderationsinhalt ' + owner,
      deleted: false,
      thread: {
        title: 'Prüffall ' + owner,
        slug: 'thema-a',
        forum: { slug: 'verein-sv-test', club: { slug: 'sv-test' } },
      },
    },
  });
  const requests = [];
  const server = createServer((req, res) => {
    const path = new URL(req.url, 'http://127.0.0.1').pathname;
    if (path === '/bundle.js') {
      res.setHeader('Content-Type', 'application/javascript');
      res.end(js);
      return;
    }
    if (path === '/bundle.css') {
      res.setHeader('Content-Type', 'text/css');
      res.end(css);
      return;
    }
    if (path.startsWith('/api/v1/')) {
      requests.push({ method: req.method, path, token: req.headers.authorization });
      const owner = req.headers.authorization === '***' ? 'A' : 'B';
      const send = (code, payload) => {
        res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify(payload));
      };
      if (!['***', '***'].includes(req.headers.authorization)) {
        return send(401, { error: 'UNAUTHORIZED' });
      }
      if (path === '/api/v1/moderation/forum-post-reports') {
        // Leave a deterministic window to catch stale data during account change.
        if (owner === 'B') return setTimeout(() => send(200, { data: [report(owner)] }), 500);
        return send(200, { data: [report(owner)] });
      }
      if (path === '/api/v1/forums/by-slug/verein-sv-test/threads/thema-a/unread') {
        if (owner === 'B') {
          return setTimeout(
            () =>
              send(200, {
                data: {
                  unread: true,
                  lastReadSequenceNumber: 0,
                  latestSequenceNumber: 2,
                  lastReadPostId: null,
                },
              }),
            500,
          );
        }
        return send(200, {
          data: {
            unread: true,
            lastReadSequenceNumber: 1,
            latestSequenceNumber: 2,
            lastReadPostId: 'post-1',
          },
        });
      }
      return send(404, { error: 'UNKNOWN_FIXTURE_ENDPOINT' });
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(
      '<!doctype html><html lang="de-AT"><head><meta name="viewport" ' +
        'content="width=device-width,initial-scale=1"><style>' +
        '*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif}' +
        '#root{max-width:1050px;width:calc(100% - 24px);margin:auto}' +
        ':root{--kf-text:#222;--kf-text-muted:#555;--kf-surface:#fff;' +
        '--kf-link:#155fa0;--kf-border:#ccc;--kf-radius-lg:10px;' +
        '--kf-radius-xl:14px;--kf-font-size-xs:12px}</style>' +
        '<link rel="stylesheet" href="/bundle.css"></head><body>' +
        '<div id="root"></div><script src="/bundle.js"></script></body></html>',
    );
  });

  const auth = (id, role, status = 'ACTIVE') => ({
    initialized: true,
    sessionRecovering: false,
    authenticated: true,
    token: id === 'A' ? 'token-a' : 'token-b',
    user: {
      id: 'user-' + id,
      status,
      onboardingCompleted: true,
      roles: [role],
    },
  });
  const anonymous = {
    initialized: true,
    sessionRecovering: false,
    authenticated: false,
    token: null,
    user: null,
  };

  let browser;
  try {
    await listen(server);
    browser = await chromium.launch({ headless: true });
    const base = 'http://127.0.0.1:' + server.address().port;
    async function pageFor(view, width) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(base + '/?view=' + view);
      return { page, errors };
    }
    async function switchAuth(page, next) {
      await page.evaluate((value) => window.__phase22SwitchAuth(value), next);
    }
    async function noOverflow(page, width) {
      const measure = await page.evaluate(() => ({
        viewport: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        outliers: [...document.querySelectorAll('*')]
          .map((element) => {
            const bounds = element.getBoundingClientRect();
            return {
              element: element.tagName.toLowerCase(),
              className: typeof element.className === 'string' ? element.className : '',
              text: (element.textContent || '').slice(0, 60),
              left: Math.round(bounds.left),
              right: Math.round(bounds.right),
              width: Math.round(bounds.width),
            };
          })
          .filter((element) => element.right > window.innerWidth + 1 || element.left < -1)
          .slice(0, 12),
      }));
      assert.ok(
        measure.documentWidth <= measure.viewport,
        'No horizontal overflow at ' + width + 'px: ' + JSON.stringify(measure),
      );
    }

    const { page: queue, errors: queueErrors } = await pageFor('queue', 320);
    try {
      await queue.getByText('Für diesen Bereich fehlen die Berechtigungen.').waitFor();
      await switchAuth(queue, auth('A', 'MODERATOR'));
      await queue.getByText('Vertraulicher Moderationsinhalt A').waitFor();
      await noOverflow(queue, 320);

      await switchAuth(queue, auth('B', 'MODERATOR'));
      await queue.getByText('Meldungen werden geladen …').waitFor();
      assert.equal(await queue.getByText('Vertraulicher Moderationsinhalt A').count(), 0);
      await queue.getByText('Vertraulicher Moderationsinhalt B').waitFor();
      assert.equal(await queue.getByText('Vertraulicher Moderationsinhalt A').count(), 0);

      await switchAuth(queue, auth('B', 'USER'));
      await queue.getByText('Für diesen Bereich fehlen die Berechtigungen.').waitFor();
      assert.equal(await queue.getByText('Vertraulicher Moderationsinhalt B').count(), 0);

      await switchAuth(queue, auth('B', 'MODERATOR', 'LIMITED'));
      assert.equal(
        await queue.getByText('Für diesen Bereich fehlen die Berechtigungen.').count(),
        1,
      );
      await switchAuth(queue, anonymous);
      assert.equal(
        await queue.getByRole('heading', { name: 'Offene Beitragsmeldungen' }).count(),
        0,
      );
      assert.deepEqual(queueErrors, []);
    } finally {
      await queue.close();
    }

    const { page: unread, errors: unreadErrors } = await pageFor('unread', 375);
    try {
      await unread.getByRole('link', { name: 'Melde dich an' }).waitFor();
      await switchAuth(unread, auth('A', 'USER'));
      await unread.getByText('Leseposition: Beitrag #1').waitFor();
      await unread.getByLabel('Zuletzt gelesener Beitrag').selectOption('post-2');
      assert.equal(await unread.getByLabel('Zuletzt gelesener Beitrag').inputValue(), 'post-2');

      await switchAuth(unread, auth('B', 'USER'));
      await unread.getByText('Lesestand wird geladen …').waitFor();
      assert.equal(await unread.getByText('Leseposition: Beitrag #1').count(), 0);
      await unread.getByText('Leseposition: noch keiner').waitFor();
      assert.equal(await unread.getByLabel('Zuletzt gelesener Beitrag').inputValue(), '');
      assert.equal(
        await unread.getByRole('button', { name: 'Leseposition speichern' }).isDisabled(),
        true,
      );
      await noOverflow(unread, 375);

      await switchAuth(unread, anonymous);
      await unread.getByRole('link', { name: 'Melde dich an' }).waitFor();
      assert.equal(await unread.getByText('Leseposition: noch keiner').count(), 0);
      assert.deepEqual(unreadErrors, []);
    } finally {
      await unread.close();
    }

    assert.equal(
      requests.every((request) => request.method === 'GET'),
      true,
      'No browser writes',
    );
    process.stdout.write(
      'Phase 22 Chromium moderator queue and unread cross-account privacy: PASS\n',
    );
  } finally {
    if (browser) await browser.close();
    await close(server);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : 'Phase 22 privacy browser test failed');
  process.exitCode = 1;
});

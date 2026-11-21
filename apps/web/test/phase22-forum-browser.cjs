/* eslint-disable @typescript-eslint/no-require-imports -- isolated Node/Chromium runner */
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { join, resolve } = require('node:path');

function listen(server) {
  return new Promise((done, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', done);
  });
}

function close(server) {
  if (!server.listening) return Promise.resolve();
  return new Promise((done) => server.close(done));
}

async function main() {
  const installed = process.env.PLAYWRIGHT_MODULE_DIR;
  if (!installed) throw new Error('PLAYWRIGHT_MODULE_DIR is required');

  const { chromium } = require(join(installed, 'playwright'));
  const { build } = require(join(installed, 'esbuild'));
  const root = resolve(__dirname, '..');

  // Render the actual Phase 22 React components and their local CSS, but never
  // contact DEV, Keycloak or a real provider. All browser data are disposable.
  const source = [
    "import React from 'react';",
    "import { createRoot } from 'react-dom/client';",
    "import { ForumOverview } from './src/features/forum/forum-overview';",
    "import { ArticleDiscussionDirectory } from './src/features/forum/article-discussion-directory';",
    'const params = new URLSearchParams(window.location.search);',
    "const slug = params.get('slug');",
    "const view = params.get('view');",
    "createRoot(document.getElementById('root')).render(",
    "  view === 'articles' ? <ArticleDiscussionDirectory apiUrl={window.location.origin} />",
    '    : <ForumOverview apiUrl={window.location.origin} categorySlug={slug || undefined} />',
    ');',
  ].join('\n');

  const compiled = await build({
    stdin: {
      contents: source,
      resolveDir: root,
      sourcefile: join(root, 'phase22-forum-browser-harness.tsx'),
      loader: 'tsx',
    },
    bundle: true,
    write: false,
    outdir: '/tmp/kurvenfunk-phase22-forum-browser',
    platform: 'browser',
    format: 'iife',
    jsx: 'automatic',
    loader: { '.module.css': 'local-css', '.css': 'css' },
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [
      {
        name: 'next-link-browser-stub',
        setup(builder) {
          builder.onResolve({ filter: /^next\/link$/ }, () => ({
            path: 'next-link',
            namespace: 'phase22-test',
          }));
          builder.onLoad({ filter: /.*/, namespace: 'phase22-test' }, () => ({
            contents:
              "import React from 'react'; export default function Link({ href, children, ...props }) {" +
              "return React.createElement('a', { href, ...props }, children); }",
            loader: 'js',
            resolveDir: root,
          }));
        },
      },
    ],
    logLevel: 'silent',
  });

  const js = compiled.outputFiles.find((file) => file.path.endsWith('.js'))?.text;
  const css = compiled.outputFiles.find((file) => file.path.endsWith('.css'))?.text;
  assert.ok(js, 'Forum components must compile');
  assert.ok(css, 'Actual forum CSS must be included for mobile checks');

  const category = {
    id: 'category-1',
    slug: 'wien',
    name: 'Wiener Vereine',
    description: 'Österreichischer Fußball in Wien',
    sortOrder: 1,
    forums: [
      {
        id: 'forum-1',
        slug: 'sv-test',
        name: 'SV Test Forum',
        description: 'Echte Daten werden hier nicht verwendet',
        club: { id: 'club-1', slug: 'sv-test', name: 'SV Test' },
        threadCreationEnabled: false,
      },
    ],
  };
  const article = {
    id: 'article-1',
    slug: 'ein-testartikel',
    title: 'Ein langer Testartikel über österreichischen Fußball und gemeinsame Diskussionen',
    lead: 'Ausschließlich isolierte Browser-Testdaten.',
    publishedAt: '2026-11-01T10:00:00.000Z',
  };

  let scenario = 'empty';
  const requests = [];
  const server = createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const path = new URL(req.url, 'http://127.0.0.1').pathname;
    requests.push({ method: req.method, path });

    if (path === '/bundle.js') {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.end(js);
      return;
    }
    if (path === '/bundle.css') {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
      res.end(css);
      return;
    }
    const send = (code, data) => {
      res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
    };

    if (path.startsWith('/api/v1/forums/categories')) {
      if (scenario === 'api-error') return send(503, { error: 'UNAVAILABLE' });
      if (scenario === 'category-404') return send(404, { error: 'NOT_FOUND' });
      if (path === '/api/v1/forums/categories')
        return send(200, { data: scenario === 'category' ? [category] : [] });
      return send(200, { data: category });
    }
    if (path === '/api/v1/articles') {
      if (scenario === 'article-error') return send(503, { error: 'UNAVAILABLE' });
      return send(200, {
        data: {
          items: scenario === 'article-filled' ? [article] : [],
          pagination: { hasNextPage: false, nextCursor: null },
        },
      });
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(
      '<!doctype html><html lang="de-AT"><head>' +
        '<meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<style>*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif}' +
        '#root{width:calc(100% - 24px);max-width:1100px;margin:auto}' +
        ':root{--kf-text:#222;--kf-text-muted:#555;--kf-surface:#fff;' +
        '--kf-link:#155fa0;--kf-border:#ccc;--kf-radius-lg:10px;' +
        '--kf-radius-xl:14px;--kf-font-size-xs:12px}</style>' +
        '<link rel="stylesheet" href="/bundle.css"></head>' +
        '<body><div id="root"></div><script src="/bundle.js"></script></body></html>',
    );
  });

  let browser;
  try {
    await listen(server);
    const base = 'http://127.0.0.1:' + server.address().port;
    browser = await chromium.launch({ headless: true });

    async function verify(mode, path, width, check) {
      scenario = mode;
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      try {
        await page.goto(base + path);
        await check(page);
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          true,
          'No horizontal overflow at ' + width + 'px in ' + mode,
        );
        assert.deepEqual(errors, []);
      } finally {
        await page.close();
      }
    }

    await verify('empty', '/', 320, async (page) => {
      await page
        .getByRole('status')
        .getByText(/Noch keine freigegebenen Forenkategorien/)
        .waitFor();
      assert.equal(await page.getByRole('heading', { name: 'Forum' }).count(), 1);
      const link = page.getByRole('link', { name: 'Artikel-Diskussionen', exact: true });
      assert.equal(await link.getAttribute('href'), '/forum/artikel');
      await page.keyboard.press('Tab');
      assert.equal(
        await page.evaluate(() => document.activeElement?.getAttribute('href')),
        '/forum/artikel',
      );
    });

    await verify('category', '/?slug=wien', 375, async (page) => {
      await page.getByRole('heading', { name: 'Wiener Vereine', level: 1 }).waitFor();
      assert.equal(
        await page.getByRole('link', { name: 'SV Test' }).getAttribute('href'),
        '/forum/verein/sv-test',
      );
      assert.equal(await page.getByText('Aktuell nur lesbar').count(), 1);
    });

    await verify('category-404', '/?slug=missing', 375, async (page) => {
      await page
        .getByRole('status')
        .getByText('Diese Forenkategorie ist nicht verfügbar.')
        .waitFor();
      assert.equal(await page.getByRole('alert').count(), 0);
      assert.equal(await page.getByRole('link', { name: 'SV Test' }).count(), 0);
    });

    await verify('api-error', '/', 1280, async (page) => {
      await page
        .getByRole('alert')
        .getByText(/Forenübersicht ist derzeit nicht erreichbar/)
        .waitFor();
      assert.equal(await page.getByRole('link', { name: 'SV Test' }).count(), 0);
    });

    await verify('article-empty', '/?view=articles', 320, async (page) => {
      await page.getByText('Aktuell sind keine veröffentlichten Artikel vorhanden.').waitFor();
      assert.equal(await page.getByRole('heading', { name: 'Artikel-Diskussionen' }).count(), 1);
    });

    await verify('article-error', '/?view=articles', 375, async (page) => {
      await page
        .getByRole('alert')
        .getByText(/Artikel-Diskussionen sind derzeit nicht erreichbar/)
        .waitFor();
    });

    await verify('article-filled', '/?view=articles', 375, async (page) => {
      const link = page.getByRole('link', { name: article.title });
      await link.waitFor();
      assert.equal(await link.getAttribute('href'), '/forum/artikel/ein-testartikel');
      assert.equal(
        await page.getByRole('link', { name: 'Zur gemeinsamen Diskussion' }).getAttribute('href'),
        '/forum/artikel/ein-testartikel',
      );
    });

    assert.equal(
      requests.every(({ method }) => method === 'GET'),
      true,
      'No test writes',
    );
    process.stdout.write(
      'Phase 22 isolated Chromium forum/article empty, 404, error and 320–1280px: PASS\n',
    );
  } finally {
    if (browser) await browser.close();
    await close(server);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : 'Phase 22 browser check failed');
  process.exitCode = 1;
});

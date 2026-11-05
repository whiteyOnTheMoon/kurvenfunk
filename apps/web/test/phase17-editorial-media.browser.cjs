/* eslint-disable @typescript-eslint/no-require-imports -- isolated Node browser runner */
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
  const requests = [];
  const mediaId = '9ceda631-1a37-4133-a1f5-83f4afac23ad';
  const mediaItem = {
    id: mediaId,
    originalFileName: 'phase17-test-image.png',
    mimeType: 'image/webp',
    width: 24,
    height: 16,
    altText: 'Redaktionelles Testbild',
  };
  // A transparent single-pixel PNG, used only by the isolated local test API.
  const samplePng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9YfCoWkAAAAASUVORK5CYII=',
    'base64',
  );
  const api = createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    let status = 200;
    let data;
    if (req.method === 'GET' && req.url?.startsWith('/api/v1/media?')) {
      data = { items: [mediaItem], nextCursor: null };
    } else if (req.method === 'GET' && req.url === '/api/v1/media/' + mediaId + '/content') {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(samplePng);
      return;
    } else if (
      req.method === 'GET' &&
      /^\/api\/v1\/(clubs|competitions|categories|tags)$/.test(req.url ?? '')
    ) {
      data = [];
    } else if (req.method === 'POST' && req.url === '/api/v1/articles') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const article = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      requests.push({
        authorization: req.headers.authorization,
        article,
      });
      status = 201;
      data = {
        id: 'test-article-id',
        ...article,
        status: 'DRAFT',
        leadMedia: null,
        ogImage: null,
      };
    } else {
      res.writeHead(404);
      res.end();
      return;
    }

    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ data }));
  });

  await listen(api);
  const apiUrl = 'http://127.0.0.1:' + api.address().port;
  const root = resolve(__dirname, '..');
  const componentEntry = [
    "import React from 'react';",
    "import { createRoot } from 'react-dom/client';",
    "import { ArticleEditor } from './src/features/admin/articles/article-editor';",
    "import { ArticleDetail } from './src/features/articles/article-detail';",
    'const image = {id: ' +
      JSON.stringify(mediaId) +
      ", storageKey: 'media/2026/11/image.webp', externalUrl: null, altText: 'Lead aus Storage', copyright: null, source: null, sourceUrl: null, width: 24, height: 16};",
    "const article = {id: 'published-id', slug: 'browser-test', title: 'Veröffentlicht', lead: null, content: {type: 'doc', content: [{type: 'paragraph', content: [{type: 'text', text: 'Browserinhalt'}]}]}, publishedAt: '2026-11-05T07:00:00.000Z', originalUrl: null, author: null, source: null, leadMedia: image, competition: null, clubs: [], tags: [], _count: {comments: 0}};",
    "const root = document.getElementById('root');",
    'createRoot(root).render(<><ArticleEditor apiUrl=' +
      JSON.stringify(apiUrl) +
      " /><div id='public-preview'><ArticleDetail apiUrl=" +
      JSON.stringify(apiUrl) +
      ' article={article} /></div></>);',
  ].join('\n');

  const stubs = {
    '@kurvenfunk/ui': `
      import React from 'react';
      export const Field = ({label, children}) => React.createElement('label', {}, label, children);
      export const Input = (props) => React.createElement('input', props);
      export const Textarea = (props) => React.createElement('textarea', props);
      export const Button = ({children, variant, ...props}) =>
        React.createElement('button', {type: 'button', ...props}, children);
    `,
    'next/link': `
      import React from 'react';
      export default function Link({href, children, ...props}) {
        return React.createElement('a', {href, ...props}, children);
      }
    `,
    'auth-provider': `
      export function useAuth() {
        return {initialized: true, authenticated: true, token: 'isolated-editor-token'};
      }
    `,
    'comment-composer': `export function CommentComposer() { return null; }`,
  };

  const built = await build({
    stdin: {
      contents: componentEntry,
      loader: 'tsx',
      resolveDir: root,
      sourcefile: join(root, 'browser-phase17.tsx'),
    },
    bundle: true,
    write: false,
    outdir: '/tmp/kurvenfunk-editor-browser',
    platform: 'browser',
    format: 'iife',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [
      {
        name: 'isolated-editor-api-and-auth',
        setup(builder) {
          builder.onResolve({ filter: /^(@kurvenfunk\/ui|next\/link)$/ }, (args) => ({
            path: args.path,
            namespace: 'test-stub',
          }));
          builder.onResolve({ filter: /auth\/auth-provider$/ }, () => ({
            path: 'auth-provider',
            namespace: 'test-stub',
          }));
          builder.onResolve(
            { filter: /articles\/comment-composer$|^\.\/comment-composer$/ },
            () => ({ path: 'comment-composer', namespace: 'test-stub' }),
          );
          builder.onLoad({ filter: /.*/, namespace: 'test-stub' }, (args) => ({
            contents: stubs[args.path],
            loader: 'tsx',
            resolveDir: root,
          }));
        },
      },
    ],
    logLevel: 'silent',
  });
  const js = built.outputFiles.find((file) => file.path.endsWith('.js'))?.text;
  const css = built.outputFiles.find((file) => file.path.endsWith('.css'))?.text ?? '';
  assert.ok(js, 'Editorial app bundle must be generated');

  const web = createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.url === '/bundle.js') {
      res.setHeader('Content-Type', 'application/javascript');
      res.end(js);
      return;
    }
    if (req.url === '/bundle.css') {
      res.setHeader('Content-Type', 'text/css');
      res.end(css);
      return;
    }
    res.setHeader('Content-Type', 'text/html');
    res.end(
      '<!doctype html><html lang="de"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/bundle.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>',
    );
  });

  let browser;
  try {
    await listen(web);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('http://127.0.0.1:' + web.address().port, { waitUntil: 'load' });

    // The public page must display locally uploaded lead images, not a placeholder.
    const publicLeadImage = page.locator('#public-preview figure img');
    await publicLeadImage.waitFor();
    assert.equal(
      await publicLeadImage.getAttribute('src'),
      apiUrl + '/api/v1/media/' + mediaId + '/content',
    );

    await page.getByRole('textbox', { name: 'Titel', exact: true }).fill('Phase 17 Testartikel');
    await page.getByRole('button', { name: 'OG-Bild auswählen' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'phase17-test-image.png' }).click();
    assert.equal(await page.locator('.ProseMirror img').count(), 0);
    assert.ok(
      (await page.getByRole('button', { name: 'Ändern' }).count()) >= 1,
      'OG image should be selected in the sidebar',
    );

    await page.getByRole('button', { name: 'Entwurf speichern' }).click();
    await page.getByRole('status').getByText('Entwurf gespeichert.').waitFor();
    assert.equal(requests.length, 1);
    assert.equal(requests[0].authorization, 'Bearer isolated-editor-token');
    assert.equal(requests[0].article.ogImageId, mediaId);
    assert.equal(requests[0].article.leadMediaId, null);
    assert.equal(JSON.stringify(requests[0].article.content).includes('/media/'), false);

    // The same picker works for lead and in-article images on a narrow viewport.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Leadbild auswählen' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'phase17-test-image.png' }).click();
    await page.getByRole('button', { name: 'Bild', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'phase17-test-image.png' }).click();
    await page.locator('.ProseMirror img').waitFor();

    await page.getByRole('button', { name: 'Entwurf speichern' }).click();
    await page.waitForFunction(() =>
      document.querySelector('[role="status"]')?.textContent?.includes('Entwurf gespeichert.'),
    );
    assert.equal(requests.length, 2);
    assert.equal(requests[1].article.ogImageId, mediaId);
    assert.equal(requests[1].article.leadMediaId, mediaId);
    assert.ok(
      JSON.stringify(requests[1].article.content).includes('/api/v1/media/' + mediaId + '/content'),
    );
    assert.deepEqual(errors, []);
    process.stdout.write('Phase 17 Chromium editorial media desktop/mobile: PASS\n');
  } finally {
    if (browser) await browser.close();
    await close(web);
    await close(api);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Editorial browser test failed');
  process.exitCode = 1;
});

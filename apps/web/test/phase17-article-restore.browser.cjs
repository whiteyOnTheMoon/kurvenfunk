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
  const articleId = '32b43ae0-f5ed-4bda-bcf9-1e288e0815c4';
  const actions = [];
  let article = {
    id: articleId,
    title: 'Veröffentlichter Testartikel',
    slug: 'browser-delete-restore',
    status: 'PUBLISHED',
    updatedAt: '2026-11-05T07:00:00.000Z',
    deletedAt: null,
    publishedAt: '2026-11-05T07:00:00.000Z',
    scheduledAt: null,
    author: { id: 'editor', nickname: 'Testredaktion' },
  };

  const api = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.headers.authorization !== 'Bearer isolated-editor-token') {
      res.writeHead(401);
      res.end();
      return;
    }

    let data;
    if (req.method === 'GET' && req.url === '/api/v1/articles/editorial') {
      data = [article];
    } else if (req.method === 'DELETE' && req.url === '/api/v1/articles/' + articleId) {
      actions.push('delete');
      article = { ...article, deletedAt: '2026-11-05T08:00:00.000Z' };
      data = article;
    } else if (req.method === 'POST' && req.url === '/api/v1/articles/' + articleId + '/restore') {
      actions.push('restore');
      article = {
        ...article,
        deletedAt: null,
        status: 'DRAFT',
        scheduledAt: null,
        publishedAt: null,
      };
      data = article;
    } else {
      res.writeHead(404);
      res.end();
      return;
    }

    res.writeHead(req.method === 'POST' ? 201 : 200, {
      'Content-Type': 'application/json; charset=utf-8',
    });
    res.end(JSON.stringify({ data }));
  });
  await listen(api);
  const apiUrl = 'http://127.0.0.1:' + api.address().port;
  const root = resolve(__dirname, '..');

  const compiled = await build({
    stdin: {
      contents: [
        "import React from 'react';",
        "import {createRoot} from 'react-dom/client';",
        "import {ArticleList} from './src/features/admin/articles/article-list';",
        "createRoot(document.getElementById('root')).render(<ArticleList apiUrl=" +
          JSON.stringify(apiUrl) +
          " />);",
      ].join('\n'),
      loader: 'tsx',
      resolveDir: root,
      sourcefile: join(root, 'phase17-restore.tsx'),
    },
    bundle: true,
    write: false,
    outdir: '/tmp/kurvenfunk-restore-browser',
    platform: 'browser',
    format: 'iife',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [
      {
        name: 'isolated-editor-auth',
        setup(builder) {
          builder.onResolve({ filter: /^(@kurvenfunk\/ui|next\/link)$/ }, (args) => ({
            path: args.path,
            namespace: 'test-stub',
          }));
          builder.onResolve({ filter: /auth\/auth-provider$/ }, () => ({
            path: 'auth-provider',
            namespace: 'test-stub',
          }));
          builder.onLoad({ filter: /.*/, namespace: 'test-stub' }, (args) => ({
            contents:
              args.path === 'auth-provider'
                ? "export function useAuth() { return {initialized: true, authenticated: true, token: 'isolated-editor-token'}; }"
                : args.path === 'next/link'
                  ? "import React from 'react'; export default function Link({href, children, ...props}) {return React.createElement('a', {href, ...props}, children);}"
                  : "import React from 'react'; export const Button = ({children, variant, ...props}) => React.createElement('button', {type: 'button', ...props}, children); export const EmptyState = ({title, children}) => React.createElement('div', {}, title, children); export const Skeleton = (props) => React.createElement('div', props);",
            loader: 'tsx',
            resolveDir: root,
          }));
        },
      },
    ],
    logLevel: 'silent',
  });

  const js = compiled.outputFiles.find((file) => file.path.endsWith('.js'))?.text;
  const css = compiled.outputFiles.find((file) => file.path.endsWith('.css'))?.text ?? '';
  assert.ok(js, 'Editorial list bundle should be created');

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
    const browserErrors = [];
    page.on('pageerror', (error) => browserErrors.push(error.message));
    await page.goto('http://127.0.0.1:' + web.address().port);
    await page.getByRole('link', { name: /Veröffentlichter Testartikel/ }).waitFor();

    page.once('dialog', (dialog) => dialog.dismiss());
    await page.getByRole('button', { name: 'Löschen' }).click();
    assert.deepEqual(actions, [], 'Canceled deletion must not call the API');

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Löschen' }).click();
    await page.getByRole('status').getByText(/Artikel wurde gelöscht/).waitFor();
    assert.deepEqual(actions, ['delete']);
    assert.equal(await page.getByRole('link', { name: /Veröffentlichter Testartikel/ }).count(), 0);
    await page.getByRole('button', { name: 'Wiederherstellen' }).waitFor();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Wiederherstellen' }).click();
    await page.getByRole('status').getByText(/unveröffentlichter Entwurf/).waitFor();
    await page.getByRole('link', { name: /Veröffentlichter Testartikel/ }).waitFor();
    assert.deepEqual(actions, ['delete', 'restore']);
    assert.equal(article.status, 'DRAFT');
    assert.equal(article.deletedAt, null);
    assert.equal(article.publishedAt, null);
    assert.deepEqual(browserErrors, []);
    process.stdout.write('Phase 17 Chromium editorial delete/restore desktop/mobile: PASS\n');
  } finally {
    if (browser) await browser.close();
    await close(web);
    await close(api);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Editorial list browser test failed');
  process.exitCode = 1;
});

/* eslint-disable @typescript-eslint/no-require-imports -- isolated Node browser test */
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { join, resolve } = require('node:path');

async function main() {
  const installed = process.env.PLAYWRIGHT_MODULE_DIR;
  if (!installed) throw new Error('PLAYWRIGHT_MODULE_DIR is required');

  const { chromium } = require(join(installed, 'playwright'));
  const { build } = require(join(installed, 'esbuild'));

  const bundle = await build({
    entryPoints: [resolve(__dirname, 'phase19-community-browser-harness.tsx')],
    bundle: true,
    write: false,
    platform: 'browser',
    format: 'iife',
    jsx: 'automatic',
    outdir: '/out',
    loader: { '.module.css': 'local-css' },
    define: { 'process.env.NODE_ENV': '"production"' },
    logLevel: 'silent',
  });
  const javascript = bundle.outputFiles.find((file) => file.path.endsWith('.js'))?.text;
  const stylesheet = bundle.outputFiles.find((file) => file.path.endsWith('.css'))?.text;
  assert.ok(javascript, 'Bundled React test UI is missing');

  const votes = new Map();
  const reports = [];

  const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    res.setHeader('Cache-Control', 'no-store');

    function send(status, payload) {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: payload }));
    }

    if (url.pathname === '/bundle.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(javascript);
      return;
    }

    if (url.pathname === '/bundle.css') {
      res.writeHead(200, { 'Content-Type': 'text/css' });
      res.end(stylesheet || '');
      return;
    }

    const vote = /^\/api\/v1\/comments\/([^/]+)\/votes$/.exec(url.pathname);
    if (vote && ['PUT', 'DELETE'].includes(req.method)) {
      const commentId = decodeURIComponent(vote[1]);
      if (req.headers.authorization !== 'Bearer isolated-browser-test-token') {
        send(401, {});
        return;
      }
      let next = null;
      if (req.method === 'PUT') {
        let raw = '';
        for await (const part of req) raw += part;
        const parsed = JSON.parse(raw);
        if (!['UPVOTE', 'DOWNVOTE'].includes(parsed.type)) {
          send(400, {});
          return;
        }
        next = parsed.type;
      }
      votes.set(commentId, next);
      const upvotes = next === 'UPVOTE' ? 1 : 0;
      const downvotes = next === 'DOWNVOTE' ? 1 : 0;
      send(200, {
        commentId,
        upvotes,
        downvotes,
        score: upvotes - downvotes,
        viewerVote: next,
      });
      return;
    }

    const report = /^\/api\/v1\/comments\/([^/]+)\/reports$/.exec(url.pathname);
    if (report && req.method === 'POST') {
      if (req.headers.authorization !== 'Bearer isolated-browser-test-token') {
        send(401, {});
        return;
      }
      let raw = '';
      for await (const part of req) raw += part;
      const parsed = JSON.parse(raw);
      reports.push({ commentId: decodeURIComponent(report[1]), ...parsed });
      send(201, { status: 'OPEN' });
      return;
    }

    if (url.pathname === '/state') {
      send(200, { votes: Object.fromEntries(votes), reports });
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      '<!doctype html><html lang="de"><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/bundle.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>',
    );
  });

  await new Promise((accept) => server.listen(0, '127.0.0.1', accept));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(baseUrl);

    const active = page.getByRole('region', { name: 'Active voting' });
    const activeUp = active.getByRole('button', { name: 'Kommentar positiv bewerten' });
    const activeDown = active.getByRole('button', { name: 'Kommentar negativ bewerten' });
    await activeUp.click();
    await page.waitForFunction(
      () =>
        document.querySelector('[aria-label="Active voting"] [aria-label="Kommentar positiv bewerten"]')
          ?.getAttribute('aria-pressed') === 'true',
    );
    await activeDown.click();
    await page.waitForFunction(
      () =>
        document.querySelector('[aria-label="Active voting"] [aria-label="Kommentar negativ bewerten"]')
          ?.getAttribute('aria-pressed') === 'true',
    );
    await activeDown.click();
    await page.waitForFunction(
      () =>
        document.querySelector('[aria-label="Active voting"] [aria-label="Kommentar negativ bewerten"]')
          ?.getAttribute('aria-pressed') === 'false',
    );

    const limited = page.getByRole('region', { name: 'Limited voting' });
    await limited.getByRole('button', { name: 'Kommentar positiv bewerten' }).click();
    const self = page.getByRole('region', { name: 'Self voting' });
    assert.equal(await self.getByRole('button', { name: 'Kommentar positiv bewerten' }).isDisabled(), true);
    const banned = page.getByRole('region', { name: 'Banned voting' });
    assert.equal(await banned.getByRole('button', { name: 'Kommentar negativ bewerten' }).isDisabled(), true);

    const reportArea = page.getByRole('region', { name: 'Comment reporting' });
    await reportArea.getByRole('button', { name: 'Melden' }).click();
    const dialog = page.getByRole('dialog', { name: 'Kommentar melden' });
    await dialog.getByLabel('Meldegrund').selectOption('SPAM');
    await dialog.getByLabel('Zusätzliche Informationen (optional)').fill('Isolierter Chromium-Test');
    await dialog.getByRole('button', { name: 'Meldung absenden' }).click();
    await reportArea.getByText('Vielen Dank! Deine Meldung wurde übermittelt.').waitFor();
    const ownReport = page.getByRole('region', { name: 'Self reporting' });
    assert.equal(await ownReport.getByRole('button', { name: 'Melden' }).count(), 0);

    const state = await (await page.request.get(`${baseUrl}/state`)).json();
    assert.equal(state.data.votes['active-comment'], null);
    assert.equal(state.data.votes['limited-comment'], 'UPVOTE');
    assert.deepEqual(state.data.reports, [
      {
        commentId: 'report-comment',
        reason: 'SPAM',
        details: 'Isolierter Chromium-Test',
      },
    ]);
    assert.deepEqual(errors, []);

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const mobileErrors = [];
    mobile.on('pageerror', (error) => mobileErrors.push(error.message));
    await mobile.goto(baseUrl);
    assert.equal(
      await mobile.getByRole('region', { name: 'Active voting' })
        .getByRole('button', { name: 'Kommentar positiv bewerten' })
        .isVisible(),
      true,
    );
    assert.equal(
      await mobile.getByRole('region', { name: 'Comment reporting' })
        .getByRole('button', { name: 'Melden' })
        .isVisible(),
      true,
    );
    assert.deepEqual(mobileErrors, []);

    process.stdout.write('Chromium desktop/mobile voting & report UI: PASS\n');
  } finally {
    if (browser) await browser.close();
    await new Promise((accept) => server.close(accept));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Phase 19 Chromium regression failed');
  process.exitCode = 1;
});

/* eslint-disable @typescript-eslint/no-require-imports -- Node-only CommonJS test runner */
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { join, resolve } = require('node:path');

async function listen(server) {
  return new Promise((done, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', done);
  });
}

async function close(server) {
  if (server.listening) {
    await new Promise((done) => server.close(done));
  }
}

async function main() {
  const installed = process.env.PLAYWRIGHT_MODULE_DIR;
  if (!installed) throw new Error('PLAYWRIGHT_MODULE_DIR is required');

  const { chromium } = require(join(installed, 'playwright'));
  const { build } = require(join(installed, 'esbuild'));

  const built = await build({
    entryPoints: [resolve(__dirname, 'auth-provider-browser-harness.tsx')],
    alias: { 'keycloak-js': resolve(__dirname, 'keycloak-client.browser-mock.ts') },
    bundle: true,
    write: false,
    platform: 'browser',
    format: 'iife',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"development"' },
    logLevel: 'silent',
  });
  const bundle = built.outputFiles[0].text;
  const meRequests = [];

  const apiServer = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url !== '/api/v1/auth/me') {
      res.writeHead(404);
      res.end();
      return;
    }

    const credential = req.headers.authorization;
    meRequests.push(credential);
    res.setHeader('Content-Type', 'application/json');
    if (!credential?.startsWith('Bearer ')) {
      res.writeHead(401);
      res.end(JSON.stringify({ code: 'UNAUTHORIZED' }));
      return;
    }

    res.end(
      JSON.stringify({
        data: {
          id: 'isolated-browser-user',
          status: 'ACTIVE',
          roles: ['EDITOR'],
          subject: 'isolated-browser-subject',
          fanPreference: 'NEUTRAL',
          favoriteClubId: null,
          onboardingCompleted: true,
        },
      }),
    );
  });

  await listen(apiServer);
  const apiPort = apiServer.address().port;

  const webServer = createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.url === '/bundle.js') {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.end(bundle);
      return;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(
      '<!doctype html><html><head><title>Kurvenfunk auth lifecycle regression</title></head>' +
        '<body><div id="root"></div><script>window.__kurvenfunkTest=' +
        JSON.stringify({
          apiUrl: 'http://127.0.0.1:' + apiPort,
          authUrl: 'http://unused.invalid',
        }) +
        '</script><script src="/bundle.js"></script></body></html>',
    );
  });

  let browser;
  try {
    await listen(webServer);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('http://127.0.0.1:' + webServer.address().port + '/login');
    const waitText = (selector, value) =>
      page.waitForFunction(
        ({ selector, value }) => document.querySelector(selector)?.textContent === value,
        { selector, value },
        { timeout: 15000 },
      );

    await waitText('#auth-ready', 'true');
    await waitText('#auth-status', 'authenticated');
    await waitText('#user-status', 'ACTIVE');
    assert.deepEqual(meRequests, ['Bearer initial-browser-token']);

    const originalCalls = await page.evaluate(() => window.__mockKeycloak.refreshCalls);
    await page.evaluate(() => {
      const client = window.__mockKeycloak;
      client.nextToken = 'rotated-browser-token';
      client.onTokenExpired();
      window.dispatchEvent(new Event('focus'));
    });

    await waitText('#token-fingerprint', 'rotated-browser-token'.slice(-12));
    assert.equal(await page.locator('#auth-status').textContent(), 'authenticated');
    assert.equal(await page.locator('#user-status').textContent(), 'ACTIVE');
    assert.equal(await page.evaluate(() => window.__mockKeycloak.refreshCalls), originalCalls + 1);

    await page.evaluate(() => {
      const client = window.__mockKeycloak;
      client.failNext = true;
      client.onTokenExpired();
    });
    await waitText('#auth-status', 'anonymous');
    await waitText('#auth-error', 'AUTHENTICATION_FAILED');
    await waitText('#token-fingerprint', '');
    await waitText('#user-status', '');

    // A sleeping tab wakes up; restoring the token without /auth/me leaves
    // the UI authenticated but without a user. Check full rehydration.
    await page.evaluate(() => {
      window.__mockKeycloak.nextToken = 'recovered-browser-token';
      window.dispatchEvent(new Event('focus'));
    });

    await waitText('#auth-status', 'authenticated');
    await waitText('#user-status', 'ACTIVE');
    await waitText('#token-fingerprint', 'recovered-browser-token'.slice(-12));
    await waitText('#auth-error', '');
    assert.deepEqual(meRequests, [
      'Bearer initial-browser-token',
      'Bearer rotated-browser-token',
      'Bearer recovered-browser-token',
    ]);

    await page.locator('#logout').click();
    await waitText('#auth-status', 'anonymous');
    await waitText('#token-fingerprint', '');
    await waitText('#user-status', '');

    const beforeLogoutEvent = await page.evaluate(() => {
      const client = window.__mockKeycloak;
      const refreshCallsBefore = client.refreshCalls;
      client.nextToken = 'must-not-restore-session';
      client.onTokenExpired();
      window.dispatchEvent(new Event('focus'));
      return refreshCallsBefore;
    });
    assert.equal(await page.evaluate(() => window.__mockKeycloak.refreshCalls), beforeLogoutEvent);
    assert.equal(await page.locator('#auth-status').textContent(), 'anonymous');
    assert.equal(await page.evaluate(() => localStorage.getItem('token')), null);
    assert.deepEqual(pageErrors, []);

    process.stdout.write('React AuthProvider Chromium refresh, recovery and logout: PASS\n');
  } finally {
    if (browser) await browser.close();
    await close(webServer);
    await close(apiServer);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'AuthProvider browser test failed');
  process.exitCode = 1;
});

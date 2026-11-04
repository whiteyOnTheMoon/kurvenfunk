const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { join, resolve } = require('node:path');

function listen(server, port) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

async function main() {
  const installed = process.env.PLAYWRIGHT_MODULE_DIR;
  const identityProvider = process.env.KEYCLOAK_TEST_URL;
  if (!installed || !identityProvider) throw new Error('Isolated browser test setup missing');

  const { chromium } = require(join(installed, 'playwright'));
  const { build } = require(join(installed, 'esbuild'));
  const buildResult = await build({
    entryPoints: [resolve(__dirname, 'auth-provider-browser-harness.tsx')],
    bundle: true,
    write: false,
    platform: 'browser',
    format: 'iife',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"development"' },
    logLevel: 'silent',
  });
  const application = buildResult.outputFiles[0].text;

  const allowedOrigin = 'http://127.0.0.1:3000';
  const apiServer = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.url === '/api/v1/auth/me') {
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            id: 'browser-e2e-user',
            status: 'ACTIVE',
            subject: 'browser-e2e',
            fanPreference: 'NEUTRAL',
            favoriteClubId: null,
            onboardingCompleted: true,
          },
        }),
      );
      return;
    }
    res.writeHead(404);
    res.end();
  });

  const webServer = createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.url === '/bundle.js') {
      res.setHeader('Content-Type', 'application/javascript');
      res.end(application);
      return;
    }

    res.setHeader('Content-Type', 'text/html');
    res.end(
      '<!doctype html><html><head><title>Isolated Kurvenfunk AuthProvider test</title></head><body><div id="root"></div><script>window.__kurvenfunkTest={apiUrl:"http://127.0.0.1:3001",authUrl:' +
        JSON.stringify(identityProvider) +
        '}</script><script src="/bundle.js"></script></body></html>',
    );
  });

  await listen(apiServer, 3001);
  await listen(webServer, 3000);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const browserErrors = [];
    page.on('pageerror', (error) => browserErrors.push(error.message));

    await page.goto('http://127.0.0.1:3000/login');
    await page.waitForFunction(
      () => document.getElementById('auth-ready')?.textContent === 'true',
      null,
      { timeout: 30000 },
    );
    await page.locator('#login').click();
    await page.locator('#username').fill('browser-e2e');
    await page.locator('#password').fill('local-only-browser-test-password');
    await page.locator('#kc-login').click();

    await page.waitForFunction(
      () => document.getElementById('auth-status')?.textContent === 'authenticated',
      null,
      { timeout: 30000 },
    );
    await page.waitForFunction(
      () => document.getElementById('user-status')?.textContent === 'ACTIVE',
      null,
      { timeout: 30000 },
    );

    const tokenBefore = await page.locator('#token-fingerprint').textContent();
    assert.ok(tokenBefore, 'Original Keycloak token should be present');

    const refresh = await page.waitForResponse(
      (response) =>
        response.url().includes('/protocol/openid-connect/token') &&
        response.request().postData()?.includes('grant_type=refresh_token') &&
        response.status() === 200,
      { timeout: 100000 },
    );

    assert.equal(refresh.status(), 200);
    await page.waitForFunction(
      (previous) => {
        const current = document.getElementById('token-fingerprint')?.textContent;
        return current && current !== previous;
      },
      tokenBefore,
      { timeout: 20000 },
    );

    assert.equal(await page.locator('#auth-status').textContent(), 'authenticated');
    assert.equal(await page.locator('#auth-error').textContent(), '');
    assert.deepEqual(browserErrors, []);

    process.stdout.write('Real Keycloak + Chromium login and refresh: PASS\n');
  } finally {
    if (browser) await browser.close();
    await close(webServer);
    await close(apiServer);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Isolated Keycloak browser test failed');
  process.exitCode = 1;
});

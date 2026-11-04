/* eslint-disable @typescript-eslint/no-require-imports -- Node-only CommonJS test runner */
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFileSync } = require('node:fs');
const { resolve, join } = require('node:path');
const typescript = require('typescript');

async function main() {
  const playwrightDir = process.env.PLAYWRIGHT_MODULE_DIR;
  if (!playwrightDir) throw new Error('PLAYWRIGHT_MODULE_DIR is required');

  const { chromium } = require(join(playwrightDir, 'playwright'));
  const source = readFileSync(resolve(__dirname, '../src/features/auth/token-refresh.ts'), 'utf8');
  const compiled = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;

  const server = createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.url === '/token-refresh.js') {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.end(compiled);
      return;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(
      '<!doctype html><html><head><title>Kurvenfunk token refresh browser test</title></head><body>Test</body></html>',
    );
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  let browser;
  try {
    const address = server.address();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:' + address.port, { waitUntil: 'load' });

    const result = await page.evaluate(async () => {
      const { ensureFreshToken } = await import('/token-refresh.js');
      const outcomes = {};

      const proactive = {
        token: 'stale-token',
        updateToken: async (threshold) => {
          outcomes.threshold = threshold;
          proactive.token = 'fresh-token';
          return true;
        },
      };

      outcomes.proactive = await ensureFreshToken(proactive);
      let calls = 0;
      let unblock;
      const simultaneous = {
        token: 'stale-token',
        updateToken: () => {
          calls += 1;
          return new Promise((resolve) => {
            unblock = () => {
              simultaneous.token = 'refreshed-once';
              resolve(true);
            };
          });
        },
      };

      const first = ensureFreshToken(simultaneous);
      const second = ensureFreshToken(simultaneous);
      outcomes.calls = calls;
      unblock();
      outcomes.concurrent = await Promise.all([first, second]);

      let reject = true;
      const failing = {
        token: 'expired-token',
        updateToken: async () => {
          if (reject) {
            reject = false;
            throw Error('refresh rejected');
          }
          failing.token = 'recovered-token';
          return true;
        },
      };

      try {
        await ensureFreshToken(failing);
        outcomes.failure = 'INVALID';
      } catch (error) {
        outcomes.failure = error.message;
      }

      outcomes.recovered = await ensureFreshToken(failing);

      let eventToken;
      const expired = {
        token: 'expired-event-token',
        updateToken: async () => {
          expired.token = 'event-rotated-token';
          return true;
        },
      };
      expired.onTokenExpired = async () => {
        eventToken = await ensureFreshToken(expired);
      };
      await expired.onTokenExpired();
      outcomes.expiredEvent = eventToken;
      outcomes.storedToken = localStorage.getItem('token');

      return outcomes;
    });

    assert.equal(result.threshold, 60);
    assert.equal(result.proactive, 'fresh-token');
    assert.equal(result.calls, 1);
    assert.deepEqual(result.concurrent, ['refreshed-once', 'refreshed-once']);
    assert.equal(result.failure, 'refresh rejected');
    assert.equal(result.recovered, 'recovered-token');
    assert.equal(result.expiredEvent, 'event-rotated-token');
    assert.equal(result.storedToken, null);
    process.stdout.write('Chromium token refresh browser assertions: PASS\n');
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Browser test failed');
  process.exitCode = 1;
});

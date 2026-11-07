/* eslint-disable @typescript-eslint/no-require-imports -- isolated Chromium runner */
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

  const compiled = await build({
    stdin: {
      contents: [
        "import React from 'react';",
        "import {createRoot} from 'react-dom/client';",
        "import {AdminLayout} from './src/features/admin/admin-layout';",
        "createRoot(document.getElementById('root')).render(<AdminLayout><p data-testid='protected'>Geschützte Verwaltung</p></AdminLayout>);",
      ].join('\n'),
      loader: 'tsx',
      resolveDir: root,
      sourcefile: join(root, 'phase17-admin-guard.tsx'),
    },
    bundle: true,
    write: false,
    outdir: '/tmp/kurvenfunk-admin-guard',
    platform: 'browser',
    format: 'iife',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [
      {
        name: 'test-router-and-keycloak',
        setup(builder) {
          builder.onResolve({ filter: /^next\/(navigation|link)$/ }, (args) => ({
            path: args.path,
            namespace: 'test-stub',
          }));
          builder.onResolve({ filter: /auth\/auth-provider$/ }, () => ({
            path: 'auth-provider',
            namespace: 'test-stub',
          }));
          builder.onLoad({ filter: /.*/, namespace: 'test-stub' }, (args) => {
            const contents =
              args.path === 'auth-provider'
                ? `export function useAuth() {
                    const params = new URLSearchParams(window.location.search);
                    const role = params.get('role') ?? 'USER';
                    const authenticated = role !== 'guest';
                    return {
                      initialized: true,
                      authenticated,
                      user: authenticated
                        ? {
                            status: params.get('status') ?? 'ACTIVE',
                            onboardingCompleted: params.get('onboard') !== 'no',
                            roles: [role],
                          }
                        : undefined,
                    };
                  }`
                : args.path === 'next/link'
                  ? `import React from 'react';
                     export default function Link({ href, children, ...props }) {
                       return React.createElement('a', {href, ...props}, children);
                     }`
                  : `export function usePathname() {
                       return new URLSearchParams(window.location.search).get('path') ?? '/admin';
                     }
                     export function useRouter() {
                       return {
                         replace: (path) => window.__redirects.push(path),
                       };
                     }`;
            return { contents, loader: 'tsx', resolveDir: root };
          });
        },
      },
    ],
    logLevel: 'silent',
  });

  const js = compiled.outputFiles.find((file) => file.path.endsWith('.js'))?.text;
  const css = compiled.outputFiles.find((file) => file.path.endsWith('.css'))?.text ?? '';
  assert.ok(js, 'Admin guard bundle must be created');

  const server = createServer((req, res) => {
    if (req.url?.startsWith('/bundle.js')) {
      res.setHeader('Content-Type', 'application/javascript');
      res.end(js);
    } else if (req.url?.startsWith('/bundle.css')) {
      res.setHeader('Content-Type', 'text/css');
      res.end(css);
    } else {
      res.setHeader('Content-Type', 'text/html');
      res.end(
        '<!doctype html><html lang="de"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/bundle.css"></head><body><div id="root"></div><script>window.__redirects=[]</script><script src="/bundle.js"></script></body></html>',
      );
    }
  });

  let browser;
  try {
    await listen(server);
    browser = await chromium.launch({ headless: true });
    const base = 'http://127.0.0.1:' + server.address().port;

    async function verify({ role, path, allowed, redirect, status, onboard, width = 1280 }) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const params = new URLSearchParams({ role, path });
      if (status) params.set('status', status);
      if (onboard) params.set('onboard', onboard);
      try {
        await page.goto(base + '/?' + params.toString());
        if (allowed) {
          await page.getByTestId('protected').waitFor();
          assert.ok(
            (await page.getByRole('navigation', { name: 'Admin Navigation' }).count()) === 1,
          );
          assert.deepEqual(await page.evaluate(() => window.__redirects), []);
        } else {
          await page.getByRole('status').waitFor();
          await page.waitForFunction(() => window.__redirects.length > 0);
          assert.equal(await page.getByTestId('protected').count(), 0);
          assert.equal(await page.getByRole('navigation', { name: 'Admin Navigation' }).count(), 0);
          assert.deepEqual(await page.evaluate(() => window.__redirects), [redirect]);
        }
        assert.deepEqual(errors, []);
      } finally {
        await page.close();
      }
    }

    await verify({ role: 'guest', path: '/admin', allowed: false, redirect: '/login' });
    await verify({ role: 'USER', path: '/admin/artikel', allowed: false, redirect: '/' });
    await verify({
      role: 'TRUSTED_USER',
      path: '/admin',
      allowed: false,
      redirect: '/',
      width: 390,
    });
    await verify({ role: 'EDITOR', path: '/admin/artikel/neu', allowed: true });
    await verify({ role: 'EDITOR', path: '/admin/system', allowed: false, redirect: '/admin/artikel' });
    await verify({ role: 'MODERATOR', path: '/admin/moderation', allowed: true, width: 390 });
    await verify({ role: 'MODERATOR', path: '/admin/artikel', allowed: false, redirect: '/admin/moderation' });
    await verify({ role: 'ADMIN', path: '/admin/system', allowed: true });
    await verify({ role: 'SUPERADMIN', path: '/admin/benutzer', allowed: true });
    await verify({
      role: 'EDITOR',
      path: '/admin/artikel',
      allowed: false,
      redirect: '/',
      status: 'LIMITED',
    });
    await verify({
      role: 'EDITOR',
      path: '/admin/artikel',
      allowed: false,
      redirect: '/onboarding',
      onboard: 'no',
    });

    process.stdout.write('Phase 17 Chromium admin authorization desktop/mobile: PASS\n');
  } finally {
    if (browser) await browser.close();
    await close(server);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : 'Admin guard browser test failed');
  process.exitCode = 1;
});

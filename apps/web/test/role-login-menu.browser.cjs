/* eslint-disable @typescript-eslint/no-require-imports -- Node-only isolated Chromium runner */
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
  const root = resolve(__dirname, '..');

  const built = await build({
    stdin: {
      contents: [
        "import React from 'react';",
        "import { createRoot } from 'react-dom/client';",
        "import { LoginClient } from './src/app/login/login-client';",
        "import { AppShell } from './src/components/layout/app-shell';",
        "const screen = new URLSearchParams(location.search).get('screen');",
        "createRoot(document.getElementById('root')).render(screen === 'login' ? <LoginClient /> : <AppShell><p>Portal</p></AppShell>);",
      ].join('\n'),
      loader: 'tsx',
      resolveDir: root,
      sourcefile: join(root, 'role-login-menu.tsx'),
    },
    bundle: true,
    write: false,
    outdir: '/tmp/kurvenfunk-role-login',
    platform: 'browser',
    format: 'iife',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [
      {
        name: 'isolated-auth-navigation',
        setup(builder) {
          builder.onResolve({ filter: /^next\/(link|navigation)$/ }, (args) => ({
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
                ? [
                    'export function useAuth() {',
                    '  const params = new URLSearchParams(location.search);',
                    "  const role = params.get('role') ?? 'USER';",
                    "  const authenticated = role !== 'guest';",
                    '  return {',
                    '    initialized: true,',
                    '    authenticated,',
                    '    sessionRecovering: false,',
                    '    login: async () => {},',
                    '    loginWithGoogle: async () => {},',
                    '    logout: async () => {},',
                    '    user: authenticated ? {',
                    '      roles: [role],',
                    "      status: params.get('status') ?? 'ACTIVE',",
                    "      onboardingCompleted: params.get('onboard') !== 'no',",
                    "      fanPreference: 'NEUTRAL',",
                    '    } : undefined,',
                    '  };',
                    '}',
                  ].join('\n')
                : args.path === 'next/link'
                  ? [
                      "import React from 'react';",
                      'export default function Link({ href, children, ...props }) {',
                      "  return React.createElement('a', { href, ...props }, children);",
                      '}',
                    ].join('\n')
                  : [
                      "export function usePathname() { return '/'; }",
                      'export function useRouter() {',
                      '  return { replace: (path) => window.__redirects.push(path) };',
                      '}',
                    ].join('\n');
            return { contents, loader: 'tsx', resolveDir: root };
          });
        },
      },
    ],
    logLevel: 'silent',
  });

  const js = built.outputFiles.find((file) => file.path.endsWith('.js'))?.text;
  const css = built.outputFiles.find((file) => file.path.endsWith('.css'))?.text ?? '';
  assert.ok(js, 'Role-routing Chromium bundle must be created');

  const server = createServer((req, res) => {
    if (req.url?.startsWith('/bundle.js')) {
      res.setHeader('Content-Type', 'application/javascript');
      res.end(js);
      return;
    }
    if (req.url?.startsWith('/bundle.css')) {
      res.setHeader('Content-Type', 'text/css');
      res.end(css);
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(
      '<!doctype html><html lang="de"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/bundle.css"></head><body><div id="root"></div><script>window.__redirects=[]</script><script src="/bundle.js"></script></body></html>',
    );
  });

  let browser;
  try {
    await listen(server);
    browser = await chromium.launch({ headless: true });
    const base = 'http://127.0.0.1:' + server.address().port;

    async function verifyLogin(role, expected, options = {}) {
      const page = await browser.newPage({
        viewport: { width: options.mobile ? 390 : 1280, height: 844 },
      });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const params = new URLSearchParams({ screen: 'login', role });
      if (options.onboard === false) params.set('onboard', 'no');
      if (options.status) params.set('status', options.status);
      try {
        await page.goto(base + '/?' + params);
        await page.waitForFunction(() => window.__redirects.length === 1);
        assert.deepEqual(await page.evaluate(() => window.__redirects), [expected]);
        assert.deepEqual(errors, []);
      } finally {
        await page.close();
      }
    }

    async function verifyMenu(role, expected, options = {}) {
      const page = await browser.newPage({
        viewport: { width: options.mobile ? 390 : 1280, height: 844 },
      });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const params = new URLSearchParams({ screen: 'menu', role });
      if (options.onboard === false) params.set('onboard', 'no');
      if (options.status) params.set('status', options.status);
      try {
        await page.goto(base + '/?' + params);
        if (role === 'guest') {
          assert.equal(await page.getByRole('link', { name: 'Admin-Bereich' }).count(), 0);
        } else {
          await page.locator('details summary').click();
          const link = page.getByRole('link', { name: 'Admin-Bereich' });
          if (expected) {
            assert.equal(await link.getAttribute('href'), expected);
          } else {
            assert.equal(await link.count(), 0);
          }
        }
        assert.deepEqual(errors, []);
      } finally {
        await page.close();
      }
    }

    await verifyLogin('USER', '/');
    await verifyLogin('TRUSTED_USER', '/', { mobile: true });
    await verifyLogin('EDITOR', '/admin/artikel');
    await verifyLogin('MODERATOR', '/admin/moderation', { mobile: true });
    await verifyLogin('ADMIN', '/admin');
    await verifyLogin('SUPERADMIN', '/admin');
    await verifyLogin('EDITOR', '/onboarding', { onboard: false });
    await verifyLogin('USER', '/onboarding', { onboard: false });
    await verifyLogin('EDITOR', '/', { status: 'LIMITED' });

    await verifyMenu('guest', null);
    await verifyMenu('USER', null);
    await verifyMenu('TRUSTED_USER', null, { mobile: true });
    await verifyMenu('EDITOR', '/admin/artikel');
    await verifyMenu('MODERATOR', '/admin/moderation', { mobile: true });
    await verifyMenu('SUPERADMIN', '/admin');
    await verifyMenu('EDITOR', null, { status: 'LIMITED' });
    await verifyMenu('MODERATOR', null, { onboard: false });

    process.stdout.write('Chromium role login redirects and profile admin entry: PASS\n');
  } finally {
    if (browser) await browser.close();
    await close(server);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : 'Role login/menu browser test failed');
  process.exitCode = 1;
});

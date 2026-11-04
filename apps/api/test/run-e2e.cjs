// Own disposable local resources; never reuse injected service URLs or databases.
const { execFileSync, spawnSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { setTimeout: delay } = require('node:timers/promises');
const { resolve } = require('node:path');
const repo = resolve(__dirname, '../../..');
const api = resolve(__dirname, '..');
const containers = [];
let setupStep = 'initialization';
// Maintained MinIO-compatible fork; upstream public Docker Hub/Quay images were withdrawn.
const minioImage = 'pgsty/minio:RELEASE.2026-08-04T00-00-00Z';
const env = { ...process.env };
for (const key of [
  'DOCKER_HOST',
  'DOCKER_CONTEXT',
  'DOCKER_TLS',
  'DOCKER_TLS_VERIFY',
  'DOCKER_CERT_PATH',
])
  delete env[key];
const dockerArgs = ['--host=unix:///var/run/docker.sock'];
function docker(...args) {
  return execFileSync('docker', [...dockerArgs, ...args], {
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}
function command(args, cwd = repo, commandEnv = env) {
  const result = spawnSync('pnpm', args, {
    cwd,
    env: commandEnv,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`Setup command failed (exit ${result.status}): ${args.join(' ')}`);
}
async function ready(id, args) {
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      if (docker('exec', id, ...args).includes('PONG') || args[0] === 'pg_isready') return;
    } catch {}
    await delay(250);
  }
  throw new Error('Isolated E2E service did not become ready');
}
async function readyHttp(url) {
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.ok) return;
    } catch {}
    await delay(500);
  }
  throw new Error('Isolated MinIO service did not become ready');
}
async function run() {
  env.POSTGRES_PASSWORD = randomBytes(24).toString('hex');
  env.E2E_REDIS_PASSWORD = randomBytes(24).toString('hex');
  env.MINIO_ROOT_USER = 'e2e-local-user';
  env.MINIO_ROOT_PASSWORD = randomBytes(24).toString('hex');
  env.REDISCLI_AUTH = env.E2E_REDIS_PASSWORD;
  try {
    for (const image of ['postgres:17-alpine', 'redis:7.4-alpine', minioImage]) {
      setupStep = `check image ${image}`;
      try {
        docker('image', 'inspect', image);
      } catch {
        setupStep = `pull image ${image}`;
        docker('pull', image);
      }
    }
    setupStep = 'start isolated PostgreSQL';
    const postgres = docker(
      'run',
      '--rm',
      '-d',
      '--label',
      'kurvenfunk.test=api-e2e',
      '-p',
      '127.0.0.1::5432',
      '-e',
      'POSTGRES_PASSWORD',
      '-e',
      'POSTGRES_USER=e2e',
      '-e',
      'POSTGRES_DB=kurvenfunk_e2e',
      'postgres:17-alpine',
    );
    containers.push(postgres);
    setupStep = 'start isolated Redis';
    const redis = docker(
      'run',
      '--rm',
      '-d',
      '--label',
      'kurvenfunk.test=api-e2e',
      '-p',
      '127.0.0.1::6379',
      '-e',
      'E2E_REDIS_PASSWORD',
      'redis:7.4-alpine',
      'sh',
      '-c',
      'exec redis-server --save "" --appendonly no --requirepass "$E2E_REDIS_PASSWORD"',
    );
    containers.push(redis);
    setupStep = 'start isolated MinIO';
    const minio = docker(
      'run',
      '--rm',
      '-d',
      '--label',
      'kurvenfunk.test=api-e2e',
      '-p',
      '127.0.0.1::9000',
      '-e',
      'MINIO_ROOT_USER',
      '-e',
      'MINIO_ROOT_PASSWORD',
      minioImage,
      'server',
      '/data',
    );
    containers.push(minio);
    setupStep = 'wait for isolated PostgreSQL';
    await ready(postgres, ['pg_isready', '-U', 'e2e', '-d', 'kurvenfunk_e2e']);
    setupStep = 'wait for isolated Redis';
    await ready(redis, ['sh', '-c', 'REDISCLI_AUTH="$E2E_REDIS_PASSWORD" redis-cli ping']);
    const postgresPort = docker('port', postgres, '5432/tcp').split(':').at(-1);
    const redisPort = docker('port', redis, '6379/tcp').split(':').at(-1);
    const minioPort = docker('port', minio, '9000/tcp').split(':').at(-1);
    setupStep = 'wait for isolated MinIO';
    await readyHttp(`http://127.0.0.1:${minioPort}/minio/health/ready`);
    Object.assign(env, {
      API_E2E_ISOLATED: 'true',
      NODE_ENV: 'test',
      APP_ENV: 'test',
      REQUEST_ID_TEST_ENABLED: 'false',
      DATABASE_URL: `postgresql://e2e:${env.POSTGRES_PASSWORD}@127.0.0.1:${postgresPort}/kurvenfunk_e2e`,
      REDIS_HOST: '127.0.0.1',
      REDIS_PORT: redisPort,
      REDIS_PASSWORD: env.E2E_REDIS_PASSWORD,
      WEB_URL: 'http://localhost:3000',
      KEYCLOAK_ISSUER: 'http://127.0.0.1:9/realms/e2e',
      KEYCLOAK_JWKS_URL: 'http://127.0.0.1:9/realms/e2e/protocol/openid-connect/certs',
      KEYCLOAK_AUDIENCE: 'kurvenfunk-api',
      STORAGE_ENDPOINT: `http://127.0.0.1:${minioPort}`,
      STORAGE_REGION: 'us-east-1',
      STORAGE_BUCKET: 'e2e-only',
      STORAGE_ACCESS_KEY: env.MINIO_ROOT_USER,
      STORAGE_SECRET_KEY: env.MINIO_ROOT_PASSWORD,
      SWAGGER_ENABLED: 'false',
    });
    setupStep = 'generate Prisma client';
    command(['--filter', '@kurvenfunk/database', 'generate']);
    setupStep = 'build shared packages';
    command([
      'exec',
      'turbo',
      'build',
      '--filter=@kurvenfunk/database',
      '--filter=@kurvenfunk/types',
      '--filter=@kurvenfunk/logger',
      '--filter=@kurvenfunk/validation',
    ]);
    setupStep = 'migrate isolated database';
    command(['--filter', '@kurvenfunk/database', 'exec', 'prisma', 'migrate', 'deploy']);
    setupStep = 'run isolated HTTP integration tests';
    const result = spawnSync(
      process.execPath,
      [
        '--experimental-vm-modules',
        require.resolve('jest/bin/jest'),
        '--config',
        './test/jest-e2e.json',
        '--runInBand',
        ...process.argv.slice(2),
      ],
      { cwd: api, env, stdio: 'inherit' },
    );
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } finally {
    for (const id of containers.reverse()) {
      try {
        docker('rm', '-f', id);
      } catch {
        console.error('Could not remove an owned E2E container:', id);
        process.exitCode = 1;
      }
    }
  }
}
run().catch(() => {
  // Stage labels contain no environment values, credentials or child exception text.
  console.error(`API E2E setup failed at: ${setupStep}`);
  process.exitCode = 1;
});

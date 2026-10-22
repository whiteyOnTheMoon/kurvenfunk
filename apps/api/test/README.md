# Isolated API E2E tests

From the repository root, with Node 24, pnpm 11.20.0 and a working **local** Docker socket:

```sh
pnpm install --frozen-lockfile
pnpm --filter api test:e2e
```

The runner creates disposable PostgreSQL 17 and Redis 7.4 containers bound to random
loopback ports with generated test-only credentials. It overrides injected service
URLs, generates Prisma, builds the actual shared packages and migrates the fresh
`kurvenfunk_e2e` database. Existing containers, databases and credentials are not
used. Missing images are pulled normally through the configured Docker daemon.
Keep the managed environment's proxy/CA configuration and verification enabled.

Jest runs with Node VM module support and ts-jest ESM output. Workspace packages,
JWT guards, Prisma, Redis and API bootstrap are real imports: no empty modules,
module-name aliases or service mocks. Only the test resources are isolated.
`configureApplication` is also called by `main.ts`, preserving its prefix,
CORS, global filters/interceptors and optional Swagger behavior. Existing
route-specific validation pipes remain unchanged.

The suite checks `/api/v1/health`, `/api/v1/health/live`, `/api/v1/health/ready`, missing and
malformed Authorization headers, and rejection of unprefixed `/health`. Success
and error envelopes and Request-ID propagation are asserted. Readiness performs
actual PostgreSQL/Redis operations. Login/Google/SMTP/Keycloak user flows are not
claimed by this health/auth-rejection smoke suite.

Arguments are forwarded to Jest, for example:

```sh
pnpm --filter api test:e2e --runTestsByPath test/app.e2e-spec.ts
```

The runner preserves Jest's nonzero exit status (including failed assertions or
signals), fails on setup errors, and removes only containers it created in a
`finally` block on ordinary success/failure. No production resource or deployment
is involved. Do not run Jest directly with injected database URLs; the suite
requires the isolation marker and loopback test database set by the runner.
A force-killed runner cannot execute cleanup; remove only its labelled disposable
containers after checking ownership (`kurvenfunk.test=api-e2e`).

The test files are compiled as ESM through the E2E-specific tsconfig; application
and existing unit-test module settings are unchanged. The runner needs Docker;
there is no fallback that silently substitutes mocks or an existing database.

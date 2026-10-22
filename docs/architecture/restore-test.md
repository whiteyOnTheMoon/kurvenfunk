# Restore Test

## Purpose

This document records the practical restore verification for the Kurvenfunk
backup strategy.

A backup is considered usable only when it can be successfully restored into
an empty environment.

## Test date

2026-08-14

## Tested backups

### PostgreSQL

Environment:

- staging

Backup:

- `/srv/kurvenfunk/staging/backups/postgres/20260813-235755`

Contents:

- `kurvenfunk.dump`
- `keycloak.dump`

Backup format:

- PostgreSQL custom format

### Keycloak realm export

Environment:

- staging

Backup:

- `/srv/kurvenfunk/staging/backups/keycloak/20260814-001023`

Contents:

- `kurvenfunk-realm.json`

Backup format:

- Keycloak directory export

## Isolation

The restore tests were performed using temporary Docker resources.

Neither the running staging environment nor the production environment was
used as the restore target.

Temporary resources used:

- `kurvenfunk-restore-test-postgres`
- `kurvenfunk-restore-test-postgres-data`
- `kurvenfunk-restore-test-keycloak-db`
- `kurvenfunk-restore-test-keycloak`
- `kurvenfunk-restore-test` network

All temporary resources were removed after the tests.

## PostgreSQL restore test

A completely empty PostgreSQL 17 instance was created.

The following databases were created:

- `kurvenfunk`
- `keycloak`

Both staging dumps were validated using `pg_restore --list` and then restored
using `pg_restore` with:

- `--exit-on-error`
- `--no-owner`
- `--no-acl`

### Verification

The restore completed successfully.

The restored `kurvenfunk` database contained the expected Prisma migration
table:

- `_prisma_migrations`

The restored Keycloak database contained:

- 90 public tables
- `master` realm
- `kurvenfunk` realm

The restored `kurvenfunk` realm was enabled.

Result:

**PASSED**

## Keycloak realm restore test

A separate empty PostgreSQL 17 database and a fresh Keycloak 26.6.3 instance
were created.

The staging realm export was imported using the Keycloak import command with
the overwrite strategy enabled.

### Verification

The import completed successfully.

The restored database contained:

- `master` realm
- `kurvenfunk` realm

A fresh Keycloak 26.6.3 instance was then started using the restored database.

The OpenID Connect discovery endpoint for the restored `kurvenfunk` realm was
successfully reachable.

The following eight clients were present:

- `account`
- `account-console`
- `admin-cli`
- `broker`
- `kurvenfunk-api`
- `kurvenfunk-web`
- `realm-management`
- `security-admin-console`

Result:

**PASSED**

## Cleanup verification

After the restore tests:

- no restore-test containers remained
- no restore-test volumes remained
- no restore-test networks remained

## Result

The Kurvenfunk PostgreSQL and Keycloak backups were successfully restored into
empty isolated test environments.

The backup and restore process is therefore practically verified for the
tested staging backups.

Future backup or restore format changes should be followed by another restore
test.

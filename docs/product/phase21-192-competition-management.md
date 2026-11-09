# Phase 21 / Task 192 – Competition Management (DEV)

## Scope

The canonical `Competition` model and the initial Austrian Bundesliga
(`austrian-bundesliga`, LEAGUE, AT) already exist in the database schema and
development seed. Task 192 adds an administrative management slice without
introducing season, club, match, results, standing or provider logic.

## API

- `GET /api/v1/competitions`: existing public list, **active only**.
- `GET /api/v1/competitions/:slug`: public details, **active only**.
- `GET /api/v1/competitions/admin/all`: authenticated list including inactive competitions.
- `POST /api/v1/competitions`: create a canonical competition.
- `PATCH /api/v1/competitions/:id`: update name, short name, country code, or active flag.

All administrative routes require `competition.manage`; only ACTIVE ADMIN and
SUPERADMIN identities receive this permission. Neither MODERATOR nor EDITOR,
nor a LIMITED/BANNED elevated account can administer sports competitions.

`slug` and `type` are set at creation and intentionally not editable in this
slice: changing canonical URLs or a competition's fundamental classification
requires a separately reviewed migration/correction process. No hard-delete
endpoint is provided. Deactivation preserves historical references.

Writes and `ADMIN_CORRECTION` audit entries commit in one PostgreSQL
transaction. Audit metadata identifies the COMPETITION record and captures
before/after managed fields. Slug uniqueness is enforced by the existing
database constraint, including concurrent writes.

**Seed safety:** initial competition upserts now use no-op updates for existing
rows so a later seed run cannot revert an administrator's edits or re-activate
an intentionally deactivated competition. Seed creation remains idempotent.

## Acceptance

Run full PR CI (format/lint/typecheck/unit/build, isolated PostgreSQL/Redis
HTTP E2E) and review the resulting logs. The new E2E covers:
anonymous/role/status 401/403; invalid payload 400; create 201;
duplicate slug 409; public active and private historical reads; update;
immutable identity; audit persistence; refusal to physically delete.

Any DEV deployment or browser test must use synthetic competition records
only. No real competition metadata or user data may be modified for tests.
STAGING and PROD are excluded.

Task 193 (Season Management) and tasks 194–208 remain separate.

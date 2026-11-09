# Phase 21.194 – Club Management

## Scope

Canonical club administration for Austrian football, including branding colors,
an optional official website and a linked logo. Uses the existing Club / Media
data model. No provider-specific IDs, no club-to-competition field and no new
Prisma migrations. Club aliases remain in their existing domain; importing and
matching other names is part of future sports provider tasks.

## Routes

- `GET /api/v1/clubs`: existing active-only public list (backward-compatible).
- `GET /api/v1/clubs/:slug`: existing active-only public details.
- `GET /api/v1/clubs/admin/all`: authenticated ADMIN/SUPERADMIN list including inactive clubs.
- `POST /api/v1/clubs`: create with stable slug, name, primary color and optional metadata.
- `PATCH /api/v1/clubs/:id`: update name, colors, website, logo or active flag.

No DELETE route; no slug or club ID changes. Historical references remain
linked when a club is deactivated. ADMIN and SUPERADMIN accounts in ACTIVE
status have the `club.manage` permission. Limited, banned and non-admin accounts
may not manage clubs. Changes are audited in the same transaction as the write.

Colors are required as **#RRGGBB** on write (primary required, others optional);
the API normalizes hexadecimal letters to uppercase and derives all RGBA values.
Clients cannot write RGBA directly. Null clears optional colors. The UI shows
color swatches only: colors never override text contrast or bypass the theme
system's accessibility requirements.

An optional `logoMediaId` may only reference an existing ACTIVE PNG/JPEG/WebP
media record. Arbitrary logo URLs, raw image upload and unlicensed asset
acquisition are out of scope for Task 194. Only rights-cleared media may be
linked by administrators; the existing media workflow remains responsible for
rights and upload provenance.

The development seed creates missing sample clubs but no longer overwrites
club names, colors and active state on repeat runs. It does not assign
competition membership from club identity.

## Acceptance

Isolated HTTP E2E with disposable local PostgreSQL/Redis and signed test JWT
must cover read compatibility, permissions, validation, uniqueness,
HEX/RGBA sync, logo constraints, audit, inactive archive and seed safety.
CI and DEV runtime checks precede DONE; STAGING/PROD remain untouched.

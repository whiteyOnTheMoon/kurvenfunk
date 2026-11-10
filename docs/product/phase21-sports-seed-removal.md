# Phase 21 – DEV Sports Seed Removal and Provenance Inventory

## Decision
The old global Prisma seed script injected 28 club identities, three competition/seasons,
nine manufactured fixtures and results, three synthetic application users, and
a set of published development articles. It is removed from source and from
`prisma.config.ts`, so normal CLI use can no longer rehydrate this data.

`compose.dev.yml` now explicitly forces all synthetic sports-import toggles off
for API and worker, even when stale .env.dev values enable them. The offline
FakeSportsProvider remains solely as a test adapter for Phase 21.201 isolated
acceptance; no fake data are written into live canonical tables.

## Live DEV data
Removing a code seed does **not** delete historical database rows. In particular
the 28 club names are real sports identities but were originally created with
unattributed seed operations; the schema has no `isSeed` ownership marker.
Persisted standings may be manually entered/calculated/edited, and article/
forum/favorite relations may depend on clubs.

Use `infrastructure/scripts/verify/dev-phase21-seed-audit.sh` first, with a
verified `develop` checkout and `EXPECTED_COMMIT`, to produce a read-only
count inventory. This audit makes no data changes and prints no user details.

A later **explicit, backed-up, provenance-guarded DEV cleanup** can remove
only confirmed synthetic records. Do not use `DELETE ... WHERE competitionId`
or blanket club deletions: that risks deleting actual editorial data and
historical sport records. No STAGING/PROD data cleanup is authorized here.
Unit/isolated integration test fixtures stay in the repository for regression
coverage and never enter shared DEV tables.

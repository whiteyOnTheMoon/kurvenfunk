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

## DEV provenance audit evidence (2026-11-10)

Read-only GitHub Actions audit: https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/42860556454

| Inventory | Count |
| --- | ---: |
| Original seed club slugs still present | 28 |
| Those with references to content or matches | 26 |
| Club aliases | 90 |
| Fingerprint-matched original fixtures | 9 |
| Matched fixtures with linked content | 2 |
| Other fixtures in seeded seasons | 0 |
| Standings in seeded seasons | 0 |
| Seed-prefixed articles | 18 |
| Seed articles with comments, revisions or matching | 1 |
| Seed user subjects | 3 |
| Fake-sports providers and import records | 0 |

**Deletion gate:** Do not equate seed-origin with safe-to-delete. Before any shared DEV deletion, take and verify a restorable database backup, inventory foreign-key and editorial references for every candidate ID, establish provenance and distinguish human-edited records. Require an explicit allowlist and a reversible, transaction-bound deletion procedure. Abort on any mismatch. Preserve genuine club identities and linked editorial material unless explicitly reviewed. No STAGING/PROD deletion. Isolated regression fixtures stay in code.

# Phase 21 – backed-up DEV synthetic sports cleanup

This operation is explicitly limited to the shared DEV environment and to the
exact old deterministic Prisma seed material. It is **not** a production data
migration and runs only with the explicit `[phase21-dev-seed-cleanup]` marker,
after successful CI and DEV deployment.

## Guardrails

1. Require a clean `develop` checkout matching both the tested GitHub commit
   and `origin/develop`, plus exclusive DEV deploy/cleanup locks.
2. Inspect the canonical original Prisma seed manifest: **9 fixtures, 18
   articles and 28 real club identities**. Original fixture kickoffs,
   participants, stage, matchday, status, scores and creation/update window must
   still match. Real provider matches block deletion.
3. Read-only preview first. Before any mutation, make a private PostgreSQL
   `pg_dump` custom archive, verify its listing and full read via `pg_restore`,
   retain it outside the repository with permissions 0600, and display only
   its checksum. No backup bytes or credentials enter GitHub logs.
4. Transactionally remove only exact seed-body articles authored by the
   synthetic seed editor and without import ownership. The one seed article
   with **29 comments** is archived, not deleted, preserving every comment.
   Unexpected/modified articles are skipped.
5. Detach the known genuine editorial article about Sturm–Rapid from the
   **false Sturm–Salzburg seed fixture** without deleting the article or its
   revisions; delete a fixture only when its remaining links are known seed
   articles and no provider matches exist.
6. Delete seed-born, unmodified club rows and aliases only if absolutely no
   match, article, standing, real-user favorite, forum or provider link remains.
   Preserve all protected clubs; seeded competition/season metadata remains,
   because those names represent real competitions.
7. Keep the 3 synthetic application-user records for a separate identity and
   Keycloak-review procedure. The cleanup does not erase users, comments,
   moderation or other community data.

`PHASE21_CLEANUP_MODE=plan` is a read-only preflight. The apply mode requires
the verified backup sentinel and a DEV-only CI action. The action concludes
with the existing provenance inventory and emits counts for every retained,
archived and deleted entity. Any unexpected concurrent change fails closed.

No fixtures from the offline fake provider are published to shared DEV. Real
21.201 Redis/PostgreSQL/worker acceptance runs only against disposable CI
containers; do **not** remove those regression fixtures.

## First execution guard and retry (2026-11-10)

The first explicit DEV cleanup action in GitHub Actions run
[42876564393](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/42876564393)
**correctly stopped before opening a backup or executing a database write**:
`develop` advanced from `b2f104f` to `391bad0` because unrelated PR #126
removed additional homepage fake numbers. The exact-head interlock refused a
stale cleanup. This retry uses the latest checked-out `develop` with the same
fingerprint guards and requires its own green PR CI and DEV deployment. Do not
force or bypass the SHA comparison.

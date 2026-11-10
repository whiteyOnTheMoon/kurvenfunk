# Phase 21 – Abschlussgate für echte Sportdaten (DEV)

Die historische Roadmap in `docs/audits/verification-001-174-2026-10-22/masterplan.txt` definiert Phase 21 als Tasks **192–208**. Die Implementierungs-PRs #107–#123 sind nach `develop` gemergt. Die zusätzlichen Produktionsschutzmaßnahmen (kein Prisma-Sports-Seed, Fake-Provider nur im isolierten Test) kamen mit PR #124. Der echte BullMQ-/Redis-/PostgreSQL-/Worker-Test für 21.201 kam mit PR #125; die Startseiten-Mockdaten wurden mit PR #126 entfernt.

## Nachweise und Abgrenzungen

- Echte Queue-Abnahme: PR #129, Workflow [#42875786592](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/42875786592), Job `Phase 21.201 real worker + Redis + PostgreSQL queue acceptance` erfolgreich. Fake-Provider und Test-Fixtures bleiben ausschließlich im isolierten CI-Test; keine kanonischen Club-/Match-/Standing-Schreibzugriffe im Test.
- DEV-Herkunftsinventar vor Bereinigung: [#42860556454](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/42860556454), dokumentiert in `phase21-sports-seed-removal.md`. Die alten DB-Daten werden durch Entfernen des Seed-Skripts allein **nicht** gelöscht.
- Bereinigung: PR #129 implementiert nur für DEV ein transaktionales, anhand exakter Fingerprints geprüftes Verfahren mit privatem verifiziertem PostgreSQL-Backup und Schutz existierender Benutzer-, Artikel-, Kommentar-, Vereins- und Provider-Beziehungen. Siehe `phase21-dev-seed-cleanup-acceptance.md`.
- Startseite: PR #126 ist nach `develop` gemergt und zeigt API-Daten oder ehrliche Leerzustände statt erfundener Ergebnisse und Diskussionszahlen.
- **Keine** Migration oder Löschung auf STAGING oder PROD. Echte Vereine sind nicht allein wegen ihrer Herkunft als Fake-Daten zu behandeln.

## Sicherer Wiederanlauf nach einem Git-Standwechsel

Der auf PR #129 folgende Push-Workflow [#42876564393](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/42876564393) hat DEV erfolgreich deployed. Seine nachfolgenden Cleanup-/Branch-Prune-Jobs brachen **vor der Datenänderung** ab, weil beim Start `origin/develop` inzwischen auf einen neueren Commit zeigte (PR #126). Das ist die beabsichtigte Fail-Closed-Sperre und darf nicht übergangen werden.

Ein neuer `develop`-Push mit **`[phase21-dev-seed-cleanup]`** und **`[phase21-branch-cleanup]`** darf erst nach erfolgreicher CI-Prüfung des zugrunde liegenden PRs erfolgen. Er startet erneut DEV-Deployment und danach die guarded Cleanup- und Branch-Prune-Jobs mit dem **neuen exakten SHA**. Während dieses Durchlaufs keine weiteren Merges in `develop`.

## Phase 21 erst als vollständig abgenommen melden, wenn

1. Aktueller PR: CI, Typecheck, Tests, Build und isolierter 21.201-E2E erfolgreich; keine übersprungenen erforderlichen PR-Gates.
2. Neu ausgelöster DEV-Workflow: Deployment erfolgreich, Seed-Cleanup **success**, inklusive Plan, privaten Backup-Prüfungen, Transaktion und read-only Nachinventar.
3. Nachinventar belegt, dass keine verifizierten alten Seed-Spiele/Seed-Artikel mehr live veröffentlicht sind, während geschützte echte Daten, Kommentare und Favoriten erhalten bleiben. Archivierte Altartikel und gesondert zu prüfende synthetische Keycloak-/User-Identitäten ausdrücklich ausweisen.
4. Branch-Prune erfolgreich oder dokumentiert übersprungen, falls keine sicher löschbaren Branches existieren. Offene, nicht zu Phase 21 gehörende PRs nicht automatisch mergen.

Kein Erfolg allein aus einem gemergten PR oder einem erfolgreichen Deploy ableiten. Bei einem Sicherheits-Preflight-Fehler Daten unverändert lassen und nur die konkrete Ursache untersuchen.

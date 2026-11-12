# Phase 22 – Archivierte Branch-Altbestände (12.11.2026)

## Inventar und Ziel

GitHub meldete nach dem Merge der regulären Bereinigung #162 noch **15 Branches**. Die frühere Bereinigung hat 22 der ursprünglich 37 Branches entfernt.

**Unbedingt erhalten:** `main`, `develop`, `chore/save-masterplan-audit` (offener PR #1) und `feat/email-exchange-online-oauth` (offener PR #91).

**Elf explizit geprüfte Kandidaten** (alle ohne offene PR):
- vollständig hinter `develop`, **ahead=0**: `chore/phase21-cleanup-last-ambiguous-fixture`, `feature/phase21-dev-provenance-cleanup`, `ops/phase0-21-safe-dev-test-account-cleanup`
- divergiert mit eigener Historie: `chore/phase21-final-dev-cleanup-retry` (geschlossener, nicht gemergter #131); `diag/task-176-dev-accounts`, `diag/task-177-dev-e2e`, `test/phase19-chromium-voting-reports` (alte Diagnose-/Browsernachweise); `feat/phase20-limited-expiration` (#25), `feat/phase20-ip-protection` (#28), `feat/phase20-appeals-dashboard` (#29) (geschlossene, **nicht** gemergte Alt-PRs); `feat/phase20-moderation-insights` (alter abweichender Entwurf).

Die abweichenden Tipps werden **nicht** als identisch zum aktuellen Code oder als unbenötigter Inhalt behauptet. Ihre Commit-Historien bleiben deshalb dauerhaft über neue Git-Tags erhalten.

## Kontrollierte Ausführung

Der einmalige Job `phase22-archive-branches` wird nur durch den Merge-Commit-Marker `[phase22-archive-branches]` auf `develop` nach vollständig grüner PR-CI und erfolgreichem DEV-Deployment aktiviert.

`infrastructure/scripts/maintenance/archive-legacy-branches-20261112.mjs` ist auf das Repository und exakt diese elf Namen begrenzt. Für jeden Branch:

1. Exakten `develop`-SHA, Zweigschutz und offene Pull Requests prüfen.
2. An seiner **aktuellen exakten SHA** einen Git-Tag `archive/branch-cleanup-20261112/<ursprünglicher-branchname>` erzeugen (oder einen vorhandenen identischen Tag nachprüfen).
3. Prüfen, dass der Tag auf denselben Commit zeigt; `develop` und Branch sowie offene PRs erneut prüfen.
4. Nur dann Branch-Ref löschen. Kein Force-Push.
5. Im Log `ARCHIVE_CLEANUP_RESULT` ausgeben.

Danach entfernt der bestehende Pruner ausschließlich zusätzlich exakt gemergte und unveränderte PR-Head-Branches (einschließlich dieses Cleanup-PRs). Ein fehlgeschlagener Check stoppt den jeweiligen oder gesamten Vorgang fail-closed.

## Wiederherstellung

Ein archivierter alter Branch kann bei Bedarf mit

```bash
git fetch origin --tags
git switch -c recovered/BRANCHNAME refs/tags/archive/branch-cleanup-20261112/BRANCHNAME
```

an seinem gespeicherten Commit rekonstruiert werden. `BRANCHNAME` meint den gesamten alten Pfad, z. B. `feat/phase20-ip-protection`. Archiv-Tags sind ausdrücklich **keine Freigabe für einen ungeprüften Merge** alter Implementierungen.

**Abnahme nur mit belegtem Job-Log** und anschließender GitHub-Inventur; angestrebter Branch-Bestand: vier. Keine Änderungen an DEV-Daten, STAGING oder PROD durch das Archivscripting. Andere Phasen- und DEV-Abnahmen bleiben unabhängig offen.

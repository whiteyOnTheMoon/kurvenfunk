# Phase 0–21: Branch-Konsolidierung (11.11.2026)

## Ausgangslage
Nach erfolgreicher Phase-0–21-DEV-Bereinigung (Run #42929030278) und Merge des rein lesenden Restbestandsaudits (PR #137) werden ausschließlich **nachweislich gemergte, unveränderte** PR-Quellbranches aufgeräumt.

## Bereits abgeschlossene PRs
- PR #137: mit grüner CI gemergt, schreibgeschützte DEV-Bestandsklassifikation; Marker `[phase0-21-dev-readonly-audit]` im Merge-Commit.
- PR #25, #28, #29: alte Phase-20-Implementierungen als überholt geschlossen; **nicht** gemergt. Die Quellbranches bleiben erhalten, solange nicht einzeln nachgewiesen ist, dass keine benötigte Änderung verloren geht.
- PR #91: Exchange-Online-E-Mail bleibt als Draft offen; kein Merge.

## Löschregeln
Ausführung nur über `infrastructure/scripts/maintenance/prune-merged-branches.mjs` im bestehenden GitHub-Actions-Job `phase21-branch-cleanup`, nach grüner CI und erfolgreichem DEV-Deploy. Der Job vergleicht den exakten `develop`-SHA und löscht nur Quellbranches, deren **aktueller Tip exakt dem Head eines bereits gemergten PRs** entspricht; vor jeder Löschung werden Unverändertheit, Branchschutz und offene PRs nochmals geprüft.

Vorab verifizierte Kandidaten zum Zeitpunkt des Audits: Branches der gemergten PRs #133, #134, #135, #136 und #137. Die tatsächliche Liste kann abweichen, wenn Branches verändert oder anderweitig entfernt wurden. Auch der Cleanup-Auslöser selbst kann nach seinem eigenen Merge ein Kandidat werden.

## Bewusst beibehalten
- `develop`, `main` und sämtliche offenen PR-Branches.
- Alle nicht nachweislich gemergten alten Diagnose-, Feature- und Dokumentationsbranches, selbst wenn sie fachlich obsolet erscheinen oder ihr Dateidiff klein ist.
- Insbesondere divergiere Branches für Phase 20, alte Auth-Tests, Masterplan-Audit und einen Chromium-Test, bis mögliche einzigartige Änderungen in einem getrennten Vergleich gesichert sind.

## Datenhygiene
Keine Datenbankänderungen durch den Branch-Pruner. Die gesonderte DEV-Metadateninventur aus PR #137 ist rein lesend; nur ihr tatsächlicher erfolgreicher Workflow-Nachweis darf als aktuelle Restbestandsaussage dienen. STAGING und PROD bleiben unberührt.

## Erneute Bestandsprüfung (12.11.2026, Phase 22)

Der Betreiber hat die Bereinigung nicht mehr benötigter Branches freigegeben. Die GitHub-Branch-Liste umfasst **36 Branches** (Stand der Inventur vor diesem Cleanup-PR, inklusive `develop`/`main`). Nur die unverändert gemergten PR-Quellbranches sind Löschkandidaten; bloß geschlossene, divergierte oder nicht zuordenbare Branches bleiben erhalten.

- Schutz: `develop`/`main` sowie **alle offenen PRs**, insbesondere #1 (`chore/save-masterplan-audit`) und #91 (`feat/email-exchange-online-oauth`).
- Nachweis: Das vorhandene Cleanup-Skript holt die vollständige GitHub-Branch-/PR-Liste und prüft bei jedem Kandidaten die exakte Head-SHA-Übereinstimmung, den Schutzstatus und das Fehlen offener PRs erneut. Der erfolgreiche Merge ist zwingend.
- Ablauf: regulärer PR-CI-Check; anschließend **nur** der bestehende markergebundene `phase21-branch-cleanup`-Workflow nach erfolgreichem `develop`-CI- und DEV-Deploy. Der Workflow ist keine Freigabe für Daten-/Medienlöschungen oder STAGING/PROD.
- Ergebnis gilt erst als bestätigt, wenn der Actions-Log `BRANCH_CLEANUP_RESULT` und eine anschließende Branch-Inventur vorliegen. Bei CI-/Deploy-Fehler: keine Löschung behaupten.

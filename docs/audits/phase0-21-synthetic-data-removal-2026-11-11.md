# Phase 0–21: letzte bekannte DEV-Testdatensätze und Kommentare bereinigen

Stand: 11.11.2026. **Ausschließlich DEV**. Der Anwender hat ausdrücklich auch der Entfernung sämtlicher Kommentare und dazugehöriger Daten zugestimmt. Die Referenz ist die erfolgreiche read-only-Inventur [#42889543434](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/42889543434).

## Preflight und Umfang

Ein strikter read-only Plan muss folgende aktuelle Originalwerte bestätigen: **29 Kommentare, 2 ARCHIVED-Seed-Artikel, 3 Seed-Application-Accounts und 3 nach Herkunft eindeutig zuordenbare Phase-17-/19-QA-Accounts**. Alle 29 Kommentare müssen zu den beiden Original-Seed-Artikeln gehören. Die beiden Artikel dürfen keine Import-, EntityMatch- oder Revisionsbeziehung haben. Die beiden Phase-17-Konten und das Phase-19-Konto müssen mit drei exakt passenden privaten Keycloak-Identitäten (ID, `kf-p17-`/`kf-p19-`, `@example.test`) übereinstimmen. Unbekannte Beziehungen oder abweichende Zähler: **Abbruch ohne DB-Änderung**.

## Sicherheitsregeln

- DEV-Compose, DEV-PostgreSQL und DEV-Keycloak (intern) sowie der exakt geprüfte `develop`-SHA sind verpflichtend. Locks blockieren parallele Deployments, andere Cleanup-Läufe und diesen Cleanup.
- Vor jeder Änderung: **vollständiges privates PostgreSQL-Custom-Dump sowohl der App-Datenbank als auch der Keycloak-Datenbank**. Beide müssen separat durch `pg_restore --list` und vollständigen lesenden `pg_restore --file /dev/null` geprüft sein. SHA256 protokollieren; keine Backups/Secrets in GitHub-Artefakte hochladen.
- Innerhalb einer serialisierbaren Transaktion: Kommentar-bezogene Revisionen, Votes, Reports, Benachrichtigungen und zugehörige Auditereignisse; anschließend sämtliche Kommentare, dann exakt die zwei archivierten Seed-Artikel und sechs bestätigten Testnutzer entfernen. Unbetroffene Audit- und Moderationsdaten bleiben stehen.
- **Nach** bestätigter DB-Transaktion ausschließlich die drei bereits im Preflight verifizierten Keycloak-QA-Nutzer löschen; anschließend DB+Keycloak schreibgeschützt nachprüfen. Erst nach Gesamterfolg private alte QA-Zugangsdatenartefakte vom DEV-Host entfernen.
- Fehler oder unbekannte andere Moderationskarten-/Sanktionsbezüge führen zu einem klaren Abbruch. Falls die Keycloak-Löschung nach der DB-Transaktion fehlschlägt, ist der Lauf ausdrücklich **teilweise abgeschlossen** und benötigt einen gezielten Recovery-Check. Backups bleiben erhalten.
- Kein generisches `TRUNCATE`, kein Löschen fremder Konten, echter Vereine oder belegter redaktioneller Artikel. Kein STAGING- oder PROD-Eingriff.

## Erhaltene und offene Bereiche

Die verbliebenen **acht Vereinsidentitäten sind echte Vereinsnamen mit tatsächlichen Referenzen**; sie werden nicht als künstliche Teams behandelt. Die **sechs anderen Artikel** bleiben erhalten. Die **565 Importjobs sowie je 46 ImportRecords und RawPayloads** gehören nicht zum bestätigten alten Sport-Seed; ihre Providerherkunft muss gesondert klassifiziert werden. Andere im Projekt verbleibende CI-Fakeprovider/Fixtures sind nur Testcode, keine DEV-Datenbankdaten.

Der Branch `develop` ist nicht die gesamte Produktfreigabe: Bei den Aufgaben **001–208** sind insbesondere fachliche Freigaben aus Phase 1, vollständiger aktueller Restore/Recovery-Drill und mehrere STAGING-/Browser-DoD-Nachweise noch offen. Siehe [Phase-0–21-Audit](../audits/phase0-21-completeness-audit-2026-11-10.md). Ein erfolgreicher Cleanup allein schließt diese Lücken nicht.

## Abnahme

CI-Trigger **`[phase0-21-dev-synthetic-cleanup]`** nur nach erfolgreichem PR-Review und grünem CI-Lauf verwenden. Nach Abschluss müssen global in DEV `comment`, `commentRevision`, comment-bezogene `reaction`, `seed-*`-Artikel, die sechs bekannten Seed-/QA-Accounts sowie drei entsprechende Keycloak-QA-Accounts **jeweils Null** sein. Anschließende read-only-Querschnittsinventur dokumentieren. Gesicherte historische Backups sind keine Live-Datensätze und benötigen eigene geschützte Retention.

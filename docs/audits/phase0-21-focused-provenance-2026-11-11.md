# DEV-only provenance deepcheck (11.11.2026)

## Anlass
Der erfolgreiche schreibgeschützte DEV-Lauf [#42936588127](https://github.com/whiteyOnTheMoon/kurvenfunk/actions/runs/42936588127) meldet zwei Nutzerkonten mit generischen Test-/Demo-Markern, vier Benachrichtigungen mit ähnlichen Textmarkern und sechs Artikel, deren `deletedAt` sämtlich gesetzt ist. Die Konten sind **nicht** die bereits entfernten bekannten Phase-17-/19-/Seed-Konten. Ein Texttreffer ist kein Provenienzbeleg.

## Prüfumfang
Dieser PR ergänzt ausschließlich aggregierte, schreibgeschützte Beziehungen im bestehenden DEV-Audit: markierte Benutzer mit Rolle, Moderations-, Artikel-, Benachrichtigungs- und Auditbezügen; markierte Benachrichtigungen nach Typ, Quellenbezug und Empfängerbeziehung zu markierten Konten; soft-gelöschte Artikel nach Status, redaktionellem Bezug und Importprovider-Klasse.

Keine Benutzer-ID, Keycloak-Subject, E-Mail, Nickname, Slug, Artikelüberschrift, Benachrichtigungstext, Zeitstempel oder Payload wird ausgegeben. Kein Update, Delete, Keycloak-Zugriff oder PROD/STAGING-Lauf. Der bestehende `EXPECTED_COMMIT`- und DEV-only-Guard bleibt erhalten. Ein positiver Markerbefund allein erlaubt **keine** Datenlöschung.

## Ausführung / Abnahme
Zuerst grüner PR-CI, danach Merge mit `[phase0-21-dev-readonly-audit]` im Commit-Titel. Die bisherige GitHub-Actions-DEV-Inventur läuft automatisch erst nach erfolgreichem DEV-Deploy und exakter SHA-Prüfung. In den Joblogs muss `PHASE021_DEV_FOCUSED_PROVENANCE` zusammen mit `PHASE021_DEV_AUDIT_EXECUTION=PASS_READ_ONLY` erscheinen.

## Entscheidung
Abweichende Konten und Benachrichtigungen nur anhand geprüfter Herkunft und abhängiger Beziehungen als synthetisch klassifizieren. Die sechs Artikel sind nach dem aktuellen API-Code durch `deletedAt != null` von öffentlichen Listen ausgeschlossen; sie sind nicht automatisch löschbare Seed-Daten. Sobald das Ergebnis vorliegt, Entscheidung pro Datengruppe dokumentieren. **Kein pauschales Cleanup.**

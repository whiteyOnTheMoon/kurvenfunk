# KURVENFUNK – Verifikation vor Phase 20

**Stand:** 04.11.2026. **Ziel:** Transparente Einordnung der Aufgaben
001–171, ohne historische Auditstatistiken als aktuellen Erfüllungsgrad
auszugeben. Reviewstand des `develop`-Repositories nach PRs #30–#39.
Diese Datei ist ein Nachweis-/Restarbeitenindex, **keine vollständige
neue Einzelabnahme aller 171 Aufgaben**.

## Quellen und Bewertungsmethode

- Masterplan-Extrakt: `docs/audits/verification-001-174-2026-10-22/masterplan.txt`.
- Historischer Einzelaudit:
  `docs/audits/verification-001-174-2026-10-22/statusmatrix.csv`.
- Technischer Befundstand:
  `docs/audits/2026-10-22/AUDIT.md`.
- Merge- und CI-Nachweise aus den zugehörigen GitHub-PRs.

Die zweite historische Verifikation bewertete die 171 IDs bis
einschließlich Phase 19 als **40 DONE, 124 PARTIAL, 5 TODO, 2 UNKNOWN**.
Dieser Stand ist inzwischen veraltet und darf nicht mit der aktuellen
Abnahmequote verwechselt werden.

## Nach dem historischen Audit integriert

| Problem | Maßnahme | Grenze des Nachweises |
| --- | --- | --- |
| F02/F03/F09 | Diagnosequeue, API-E2E und Webtestauswahl: PRs #7, #11, #12 | Nicht alle Fachflows im Browser |
| F04 | Serverseitige Onboarding-Sperren: PR #30 | Isolierte HTTP-E2E vorhanden |
| F06 | Keycloak-Token-Erneuerung: PR #33 | Echte Keycloak-/Chromium-Tests vorhanden |
| F07 | Bildsignatur, Dekodierung, Grenzen: PR #35 | Echter MinIO-Multiparttest offen |
| F08 | Import-Review erzeugt idempotenten DRAFT: PR #36 | Live-Provider und Publishing offen |
| F12 | Query- und Freitextlog-Redaction: PRs #31 und #34 | Operatives Logreview offen |
| F14 | Medien-UUID-Validierung: PR #32 | Übrige Endpunkte separat prüfen |
| F11 (Teil) | Browser- und API-Basisheader: PR #39 | CSP, HSTS und Edge-Header offen |

## Weiterhin offene Aufgabenbereiche bis Phase 19

1. **Phase 1 / IDs 001–005:** Die neuen Produkt-, Architektur- und
   ADR-Dokumente sind ausdrücklich nicht als fachlich freigegeben zu werten.
2. **Betrieb / IDs 012, 057:** VPS-Persistenz und kompletter aktueller
   Restore mit Objektstorage sind extern nachzuweisen.
3. **Editorial / IDs 131–143:** Browser-CRUD, Audits, Revisionen,
   zeitgesteuertes Publizieren und MinIO-Multipart prüfen.
4. **Newsimport / IDs 144–161:** Rechte und Liveprovider, Auto-Publish
   unter Konkurrenz, DLQ-Replay sowie echte Scheduler-/Ausfalltests prüfen.
5. **Community / IDs 162–171:** Meldungsbearbeitung und Missbrauchsschutz
   vervollständigen; Vote-Produktabweichung, Browser-/Staging-E2E und
   Parallelitätsverhalten abnehmen.
6. **Übergreifend:** Mockdaten aus echten Produktansichten entfernen oder
   eindeutig kenntlich machen, rechtliche Datenschutzprozesse freigeben,
   CSP/Monitoring/Alarmierung und Restore testen.

## Vorbedingungen für die vollständig abgeschlossene Phase 20

- Ausstehende IP-Funktionen (#28) integrieren, echte Redis/Postgres-
  Tests und Cloudflare-/Keycloak-Abusegrenzen nachweisen.
- Appeals, Dashboard und User-History (#29) konfliktfrei integrieren,
  Rechte und BANNED-Ausnahmen im Browser testen.
- Überlappenden alten PR #25 nicht ohne Vergleich zu #24/#26 integrieren.
- Aufgabe 190 (optionales Vier-Augen-Prinzip) fachlich entscheiden.
- Aufgaben 172–191 nicht pauschal DONE markieren, bevor jede relevante
  DEV-E2E- und Sicherheitsabnahme dokumentiert ist.

## Nicht durchgeführt

Kein umfassender Source-Code-Zeilenaudit jeder Datei, kein
Penetrationstest, kein Zugriff auf produktive Daten oder Liveprovider,
kein Beweis der externen Lizenz- und Betriebsanforderungen.

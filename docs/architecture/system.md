# KURVENFUNK – Systemarchitektur

> **Ist-Aufnahme vom 04.11.2026 auf Grundlage des Repositories.**
> Externe Infrastrukturzustände, Providerlizenzen und Produktionsverhalten
> sind damit nicht unabhängig bestätigt.

## Struktur

Kurvenfunk verwendet ein pnpm-/Turborepo mit drei wesentlichen Anwendungen:

- `apps/web`: Next.js/React, App Router, öffentliche und geschützte Seiten.
- `apps/api`: NestJS REST API, Rollen- und Fachlogik.
- `apps/worker`: NestJS Worker für geplante und asynchrone Vorgänge.

Gemeinsame Pakete liegen unter `packages/`, darunter Datenbankmodell,
Typen, Validation und Logger. Die Architektur ist ein modularer Monolith,
nicht eine Sammlung unabhängig deployter Microservices.

## Fachliche Datenflüsse

### Anmeldung und Community

1. Browser startet Keycloak-Login mit PKCE.
2. Die API validiert das Access-Token anhand des konfigurierten JWT/JWKS
   und ordnet es einem Kurvenfunk-Benutzer zu.
3. Serverseitige Guards prüfen Accountstatus, Onboarding und Permissions.
4. Kommentar-/Reaktions-/Report-Mutationen verwenden PostgreSQL; für
   Kommentar-Spamschutz werden atomare Redis-Prüfungen verwendet.
5. Sperren und Session-Widerrufe müssen Auditspuren und Retryfälle beachten.

### Redaktion und Newsimport

1. Der Worker bezieht Daten über Provideradapter, zum Beispiel Fake/OTS.
2. Normalisierung, Validierung, Matching, Duplikaterkennung und Review
   bestimmen die weitere Verarbeitung.
3. Eine autorisierte Importfreigabe kann idempotent einen redaktionellen
   DRAFT erzeugen; Publikation bleibt ein gesonderter Schritt.
4. Die öffentliche API liest veröffentlichte Artikel und zugeordnete
   Stammdaten aus PostgreSQL.

### Medien und Suchfunktionen

- Bilder werden API-seitig geprüft, dekodiert und vor der Speicherung
  in ein normalisiertes Format gebracht.
- Ein S3-kompatibler Storagevertrag verwendet in DEV/STAGING MinIO
  beziehungsweise je nach Umgebung externen Objektspeicher.
- Meilisearch ist in der Compose-Struktur vorgesehen; ein laufender
  Dienst allein belegt noch keine vollständige Suche.

## Infrastruktur und Netzwerk

`compose.yml` definiert PostgreSQL, Redis, Web, API, Worker, Keycloak
und Meilisearch. `compose.dev.yml`, `compose.staging.yml` und
`compose.prod.yml` ergänzen eigene Konfigurationen. Lokale Volumes
liegen nach Environment getrennt unter `/srv/kurvenfunk/`.

Die Compose-Netzwerke heißen `frontend` und `backend`.
Nur definierte Dienste dürfen über konfigurierte Tunnel/Ports
erreichbar sein. Die tatsächliche Firewall- und Cloudflare-Konfiguration
muss unabhängig überprüft werden.

## Zuverlässigkeit und Sicherheitsgrenzen

- PostgreSQL ist die fachliche Datenquelle; Redis unterstützt Queues
  und kurzlebige Zustände, darf kritische Fachtransaktionen nicht ersetzen.
- Secrets kommen aus umgebungsspezifischer Konfiguration und dürfen
  weder in Repository noch Logs erscheinen.
- Migrationen, Keycloak-Verfügbarkeit, Storagezugriff und Queueverarbeitung
  brauchen eigene Health-/Integrationstests.
- Das CI prüft Format, Lint, Typecheck, Tests und Build; PRs können
  isolierte PostgreSQL-/Redis-/JWT-E2E-Tests ausführen.
- Ein erfolgreicher Merge nach `develop` kann DEV deployen.
  `main` ist von diesem Arbeitszweig getrennt; STAGING/PROD-Freigaben
  sind eigene Vorgänge.

## Offene Architekturrisiken

- Vollständige CSP/HSTS nur nach verifiziertem Keycloak-, HTTPS-
  und Ressourcenvertrag aktivieren.
- Suche, Forum und weitere Verwaltungsbereiche sind noch nicht
  vollständig integriert.
- Echtes MinIO-Multipart, Browser-E2E, Backup/Restore samt Objekten,
  Alarmierung und Ausfallszenarien müssen abgenommen werden.
- Verbindungspools, Workerzustellung, Import-Parallelität und
  Verbindlichkeit von Audit-/Notificationevents weiter prüfen.

**Status:** technische Bestandsdokumentation; externe Architektur- und
Betriebsabnahme ausstehend.

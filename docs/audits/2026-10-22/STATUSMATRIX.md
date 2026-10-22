# Statusmatrix – alle 334 Aufgaben

Basis: Masterplan PDF v1.1; develop @ cabf1477136e0a4c8951655a11cf122cd834617e. Audit: 22.10.2026 (Europe/Vienna).

Die Statusangaben im PDF werden nicht übernommen. DONE gilt nur für den konkreten Aufgaben-Scope; ein fertiges Modell ist kein fertiges Feature. PARTIAL umfasst implementierte, aber noch nicht vollständig integrierte/abgenommene Funktionen. UNKNOWN betrifft nicht nachgewiesenen externen Betrieb. BLOCKED nennt konkrete Abhängigkeiten; fehlender Code allein wird nicht als Blocker umetikettiert.

Für vollständige Features gelten die Abnahmeanforderungen des Plans einschließlich Mobile/Staging. Diese Nachweise fehlen überwiegend. Die Dateilisten zeigen relevante Belege/Grundlagen, keine pauschale Funktionsfertigstellung. Bei TODO/UNKNOWN kann ein verlinktes leeres Modul oder Compose-Overlay nur der Negativ-/Konfigurationsbeleg sein.

Tests: aufgelistete spezifische Tests wurden im aktuellen API-/Worker-/Validation-/Web-Lauf ausgeführt. E2E scheitert vor Testausführung. Wo nur allgemeine Build-/Schema-Prüfung besteht, ist dies ausdrücklich bezeichnet. CSV/JSON enthalten dieselben 334 Bewertungen und JSON zusätzlich den vollständigen Originalanforderungstext pro Aufgabe.

Verteilung: DONE: 37, PARTIAL: 212, TODO: 56, BLOCKED: 13, UNKNOWN: 16.


## Phase 01 – PRODUCT FOUNDATION


### 001 – MVP Dokument erstellen — TODO

**Bestand:** README beschreibt Produkt und Stack grob.

**Dateien:** [.gitignore](../../../.gitignore)<br>[README.md](../../../README.md)<br>[package.json](../../../package.json)<br>[pnpm-workspace.yaml](../../../pnpm-workspace.yaml)<br>[turbo.json](../../../turbo.json)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Eigenständige, im Plan geforderte Dokumentation für MVP/Scope/Monetarisierung fehlt; kein docs/product bzw. ADR-Bestand.


### 002 – Community Konzept dokumentieren — TODO

**Bestand:** README beschreibt Produkt und Stack grob.

**Dateien:** [.gitignore](../../../.gitignore)<br>[README.md](../../../README.md)<br>[package.json](../../../package.json)<br>[pnpm-workspace.yaml](../../../pnpm-workspace.yaml)<br>[turbo.json](../../../turbo.json)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Eigenständige, im Plan geforderte Dokumentation für Communityregeln und Moderationskonzept fehlt; kein docs/product bzw. ADR-Bestand.


### 003 – Personalisierungskonzept dokumentieren — TODO

**Bestand:** README beschreibt Produkt und Stack grob.

**Dateien:** [.gitignore](../../../.gitignore)<br>[README.md](../../../README.md)<br>[package.json](../../../package.json)<br>[pnpm-workspace.yaml](../../../pnpm-workspace.yaml)<br>[turbo.json](../../../turbo.json)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Eigenständige, im Plan geforderte Dokumentation für Personalisierungskonzept fehlt; kein docs/product bzw. ADR-Bestand.


### 004 – technische Architektur dokumentieren — TODO

**Bestand:** README beschreibt Produkt und Stack grob.

**Dateien:** [.gitignore](../../../.gitignore)<br>[README.md](../../../README.md)<br>[package.json](../../../package.json)<br>[pnpm-workspace.yaml](../../../pnpm-workspace.yaml)<br>[turbo.json](../../../turbo.json)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Eigenständige, im Plan geforderte Dokumentation für Systemarchitektur und Datenflüsse fehlt; kein docs/product bzw. ADR-Bestand.


### 005 – Architecture Decision Records einführen — TODO

**Bestand:** README beschreibt Produkt und Stack grob.

**Dateien:** [.gitignore](../../../.gitignore)<br>[README.md](../../../README.md)<br>[package.json](../../../package.json)<br>[pnpm-workspace.yaml](../../../pnpm-workspace.yaml)<br>[turbo.json](../../../turbo.json)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Eigenständige, im Plan geforderte Dokumentation für Architecture Decision Records fehlt; kein docs/product bzw. ADR-Bestand.


## Phase 02 – REPOSITORY & MONOREPO


### 006 – Git Repository prüfen / erstellen — DONE

**Bestand:** Repository, Remote, Ignore-Regeln, README und Branch-Konzept vorhanden.

**Dateien:** [.gitignore](../../../.gitignore)<br>[README.md](../../../README.md)<br>[package.json](../../../package.json)<br>[pnpm-workspace.yaml](../../../pnpm-workspace.yaml)<br>[turbo.json](../../../turbo.json)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Branch develop und Commit verifiziert; Arbeitsbaum sauber.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 007 – pnpm Workspace konfigurieren — DONE

**Bestand:** pnpm-Workspace apps/* und packages/* mit Lockfile.

**Dateien:** [.gitignore](../../../.gitignore)<br>[README.md](../../../README.md)<br>[package.json](../../../package.json)<br>[pnpm-workspace.yaml](../../../pnpm-workspace.yaml)<br>[turbo.json](../../../turbo.json)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Frozen-Installation auf develop im Setup erfolgreich; aktuelle Tests/Builds verwenden diese Installation.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 008 – Turborepo konfigurieren — DONE

**Bestand:** Turborepo-Tasks und Abhängigkeitsgraph vorhanden.

**Dateien:** [.gitignore](../../../.gitignore)<br>[README.md](../../../README.md)<br>[package.json](../../../package.json)<br>[pnpm-workspace.yaml](../../../pnpm-workspace.yaml)<br>[turbo.json](../../../turbo.json)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Alle 7 Build-Tasks erfolgreich; Lint/Typechecks erfolgreich, siehe aktuelle Logs.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 009 – Shared Config Package — DONE

**Bestand:** Geteilte TypeScript-, ESLint- und Prettier-Konfiguration vorhanden.

**Dateien:** [apps/api/eslint.config.mjs](../../../apps/api/eslint.config.mjs)<br>[apps/web/eslint.config.mjs](../../../apps/web/eslint.config.mjs)<br>[packages/config/eslint.config.js](../../../packages/config/eslint.config.js)<br>[packages/config/package.json](../../../packages/config/package.json)<br>[packages/config/prettier.config.js](../../../packages/config/prettier.config.js)<br>[packages/config/tsconfig.base.json](../../../packages/config/tsconfig.base.json)<br>[packages/config/tsconfig.node.json](../../../packages/config/tsconfig.node.json)<br>[prettier.config.mjs](../../../prettier.config.mjs)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Lint/Typechecks und separater Formatcheck ausgeführt; siehe Testbericht.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


## Phase 03 – DEV / STAGING / PRODUCTION


### 010 – Environment Separation definieren — PARTIAL

**Bestand:** Getrennte Compose-Overlays, Env-Dateinamen und Beispielkonfiguration.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Laufende Trennung, Credentials und Daten auf VPS nicht geprüft; lokale Einzelservices sind kein Beweis für drei Umgebungen.


### 011 – Docker Projektnamen definieren — DONE

**Bestand:** Projektname je Overlay; kein festes container_name in Repository-Compose.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Alle drei Overlay-Namen statisch geprüft.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 012 – VPS Persistenzstruktur erstellen — UNKNOWN

**Bestand:** Persistenzpfade /srv/kurvenfunk je Umgebung in Compose beschrieben.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Existenz, Eigentümer und tatsächliche VPS-Persistenz nicht nachweisbar; kein VPS-Zugriff erlaubt.


### 013 – Dateirechte definieren — PARTIAL

**Bestand:** Dateirechte sind dokumentiert.

**Dateien:** [docs/security/file-permissions.md](../../../docs/security/file-permissions.md)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Reale Owner/Gruppen und Rechte nicht geprüft.


### 014 – Docker Networks erstellen — PARTIAL

**Bestand:** frontend/backend-Netze; DB und Redis ohne öffentliche Portfreigaben.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Tatsächliche Netzwerkexposition der Compose-Umgebungen und Tunnelzugriffe nicht geprüft.


## Phase 04 – DATABASE & CORE INFRASTRUCTURE


### 015 – PostgreSQL DEV — PARTIAL

**Bestand:** Lokaler PostgreSQL-17-Container, Persistenz, DB und Readiness geprüft; Keycloak-DB nicht lokal eingerichtet.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Vollständige Aufgabenabnahme mit allen Zielumgebungs-/Restart-/Backup-Kriterien fehlt; kein externer Betrieb geprüft.


### 016 – PostgreSQL STAGING — PARTIAL

**Bestand:** Staging-Persistenz und separate Compose-Instanz konfiguriert.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Vollständige Aufgabenabnahme mit allen Zielumgebungs-/Restart-/Backup-Kriterien fehlt; kein externer Betrieb geprüft.


### 017 – PostgreSQL PRODUCTION vorbereiten — PARTIAL

**Bestand:** Production-Overlay für PostgreSQL vorhanden.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Vollständige Aufgabenabnahme mit allen Zielumgebungs-/Restart-/Backup-Kriterien fehlt; kein externer Betrieb geprüft.


### 018 – Redis DEV — PARTIAL

**Bestand:** Lokaler Redis mit Passwort, Persistenz, noeviction und PING/BullMQ-Nutzung.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Vollständige Aufgabenabnahme mit allen Zielumgebungs-/Restart-/Backup-Kriterien fehlt; kein externer Betrieb geprüft.


### 019 – Redis STAGING — PARTIAL

**Bestand:** Staging-Redis getrennt konfiguriert.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Vollständige Aufgabenabnahme mit allen Zielumgebungs-/Restart-/Backup-Kriterien fehlt; kein externer Betrieb geprüft.


### 020 – Redis PRODUCTION vorbereiten — PARTIAL

**Bestand:** Production-Redis mit separater Persistenz konfiguriert.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Vollständige Aufgabenabnahme mit allen Zielumgebungs-/Restart-/Backup-Kriterien fehlt; kein externer Betrieb geprüft.


### 021 – Keycloak DEV — PARTIAL

**Bestand:** Keycloak-Service und Admin-Konfigurationsskripte vorhanden.

**Dateien:** [compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)<br>[infrastructure/scripts/keycloak/configure-account-linking.sh](../../../infrastructure/scripts/keycloak/configure-account-linking.sh)<br>[infrastructure/scripts/keycloak/configure-api-audience.sh](../../../infrastructure/scripts/keycloak/configure-api-audience.sh)<br>[infrastructure/scripts/keycloak/configure-email-registration.sh](../../../infrastructure/scripts/keycloak/configure-email-registration.sh)

**Tests:** [apps/api/src/modules/auth/account-status-integration.spec.ts](../../../apps/api/src/modules/auth/account-status-integration.spec.ts)<br>[apps/api/src/modules/auth/account-status.guard.spec.ts](../../../apps/api/src/modules/auth/account-status.guard.spec.ts)<br>[apps/api/src/modules/auth/auth.controller.spec.ts](../../../apps/api/src/modules/auth/auth.controller.spec.ts)<br>[apps/api/src/modules/auth/auth.guard.spec.ts](../../../apps/api/src/modules/auth/auth.guard.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Kein laufender lokaler Realm-/Client-/SMTP-/Google-Test; Zielumgebung und vollständiger Export nicht verifiziert.


### 022 – Keycloak STAGING — PARTIAL

**Bestand:** Keycloak-Service und Admin-Konfigurationsskripte vorhanden.

**Dateien:** [compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)<br>[infrastructure/scripts/keycloak/configure-account-linking.sh](../../../infrastructure/scripts/keycloak/configure-account-linking.sh)<br>[infrastructure/scripts/keycloak/configure-api-audience.sh](../../../infrastructure/scripts/keycloak/configure-api-audience.sh)<br>[infrastructure/scripts/keycloak/configure-email-registration.sh](../../../infrastructure/scripts/keycloak/configure-email-registration.sh)

**Tests:** [apps/api/src/modules/auth/account-status-integration.spec.ts](../../../apps/api/src/modules/auth/account-status-integration.spec.ts)<br>[apps/api/src/modules/auth/account-status.guard.spec.ts](../../../apps/api/src/modules/auth/account-status.guard.spec.ts)<br>[apps/api/src/modules/auth/auth.controller.spec.ts](../../../apps/api/src/modules/auth/auth.controller.spec.ts)<br>[apps/api/src/modules/auth/auth.guard.spec.ts](../../../apps/api/src/modules/auth/auth.guard.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Kein laufender lokaler Realm-/Client-/SMTP-/Google-Test; Zielumgebung und vollständiger Export nicht verifiziert.


### 023 – Keycloak PRODUCTION vorbereiten — PARTIAL

**Bestand:** Keycloak-Service und Admin-Konfigurationsskripte vorhanden.

**Dateien:** [compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)<br>[infrastructure/scripts/keycloak/configure-account-linking.sh](../../../infrastructure/scripts/keycloak/configure-account-linking.sh)<br>[infrastructure/scripts/keycloak/configure-api-audience.sh](../../../infrastructure/scripts/keycloak/configure-api-audience.sh)<br>[infrastructure/scripts/keycloak/configure-email-registration.sh](../../../infrastructure/scripts/keycloak/configure-email-registration.sh)

**Tests:** [apps/api/src/modules/auth/account-status-integration.spec.ts](../../../apps/api/src/modules/auth/account-status-integration.spec.ts)<br>[apps/api/src/modules/auth/account-status.guard.spec.ts](../../../apps/api/src/modules/auth/account-status.guard.spec.ts)<br>[apps/api/src/modules/auth/auth.controller.spec.ts](../../../apps/api/src/modules/auth/auth.controller.spec.ts)<br>[apps/api/src/modules/auth/auth.guard.spec.ts](../../../apps/api/src/modules/auth/auth.guard.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Kein laufender lokaler Realm-/Client-/SMTP-/Google-Test; Zielumgebung und vollständiger Export nicht verifiziert.


### 024 – Meilisearch DEV — PARTIAL

**Bestand:** Meilisearch-Service/Healthcheck und umgebungsspezifische Volumes konfiguriert.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Testindex und Testsuche sowie reale Isolation nicht ausgeführt.


### 025 – Meilisearch STAGING — PARTIAL

**Bestand:** Meilisearch-Service/Healthcheck und umgebungsspezifische Volumes konfiguriert.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Testindex und Testsuche sowie reale Isolation nicht ausgeführt.


### 026 – Meilisearch PRODUCTION vorbereiten — PARTIAL

**Bestand:** Meilisearch-Service/Healthcheck und umgebungsspezifische Volumes konfiguriert.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Testindex und Testsuche sowie reale Isolation nicht ausgeführt.


### 027 – MinIO DEV — PARTIAL

**Bestand:** MinIO-Service mit lokalen Ports und persistenter Ablage in DEV/STAGING.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Bucket, Credentials und Upload/Download/Delete nicht gegen MinIO getestet.


### 028 – MinIO STAGING — PARTIAL

**Bestand:** MinIO-Service mit lokalen Ports und persistenter Ablage in DEV/STAGING.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Bucket, Credentials und Upload/Download/Delete nicht gegen MinIO getestet.


## Phase 05 – APPLICATION SERVICES


### 029 – Next.js Web App — PARTIAL

**Bestand:** Next.js mit TypeScript, App Router, Env-Validation, Healthcheck und Dockerfile.

**Dateien:** [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts)<br>[apps/api/src/main.ts](../../../apps/api/src/main.ts)<br>[apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/worker/src/main.ts](../../../apps/worker/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Lokaler Build und HTTP /health sowie Homepage 200; Dockerfile statisch vorhanden.

**Fehlend:** Docker-Image nicht gebaut/geprüft; vollständige Infrastruktur-DoD offen.


### 030 – NestJS API — PARTIAL

**Bestand:** NestJS mit Config, Prefix, Zod-Pipes, Errorfilter und Healthchecks.

**Dateien:** [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts)<br>[apps/api/src/main.ts](../../../apps/api/src/main.ts)<br>[apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/worker/src/main.ts](../../../apps/worker/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** API startet; Readiness mit DB/Redis ok; API-Unit-Tests bestanden.

**Fehlend:** Input-Validation nicht lückenlos (Media-UUID liefert 500); Docker-Runtime nicht geprüft.


### 031 – Worker Service — PARTIAL

**Bestand:** Worker mit Redis, BullMQ, Startup-Test, Shutdown-Hooks und Dockerfile.

**Dateien:** [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts)<br>[apps/api/src/main.ts](../../../apps/api/src/main.ts)<br>[apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/worker/src/main.ts](../../../apps/worker/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Realer Startup-Job und Request-ID-Job lokal abgeschlossen.

**Fehlend:** Container-/Signal-/Restart-Abnahme fehlt.


## Phase 06 – SHARED PACKAGES


### 032 – Database Package — DONE

**Bestand:** Prisma-Package mit Schema, Client, Migrationen und Seed.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Generation/Validation/Migration/Seed im Setup erfolgreich; DB-Build und Readiness erfolgreich.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 033 – Types Package — DONE

**Bestand:** Geteilte Typen, Queue-Konstanten und Provider-Verträge; keine Fachservices.

**Dateien:** [packages/types/package.json](../../../packages/types/package.json)<br>[packages/types/src/common.ts](../../../packages/types/src/common.ts)<br>[packages/types/src/index.ts](../../../packages/types/src/index.ts)<br>[packages/types/src/news-normalization.ts](../../../packages/types/src/news-normalization.ts)<br>[packages/types/src/news-provider.ts](../../../packages/types/src/news-provider.ts)<br>[packages/types/src/queue.ts](../../../packages/types/src/queue.ts)<br>[packages/types/src/request-context.ts](../../../packages/types/src/request-context.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Package-Build und Typecheck bestanden.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 034 – Validation Package — DONE

**Bestand:** Geteilte Zod-Verträge für Artikel, Profil, Nickname, Kommentare, Medien, Kategorien und Tags.

**Dateien:** [packages/validation/package.json](../../../packages/validation/package.json)<br>[packages/validation/src/article.ts](../../../packages/validation/src/article.ts)<br>[packages/validation/src/category.ts](../../../packages/validation/src/category.ts)<br>[packages/validation/src/comment.ts](../../../packages/validation/src/comment.ts)<br>[packages/validation/src/common.ts](../../../packages/validation/src/common.ts)<br>[packages/validation/src/fan-preference.ts](../../../packages/validation/src/fan-preference.ts)<br>[packages/validation/src/index.ts](../../../packages/validation/src/index.ts)<br>[packages/validation/src/media.ts](../../../packages/validation/src/media.ts)<br>[packages/validation/src/nickname.ts](../../../packages/validation/src/nickname.ts)<br>[packages/validation/src/profile.ts](../../../packages/validation/src/profile.ts)<br>[packages/validation/src/tag.ts](../../../packages/validation/src/tag.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** 90 Validation-Tests und Typecheck bestanden.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 035 – Logger Package — PARTIAL

**Bestand:** Logger mit Standardfeldern und rekursiver Redaction nach Schlüssel.

**Dateien:** [packages/logger/src/index.ts](../../../packages/logger/src/index.ts)<br>[packages/logger/src/logger.ts](../../../packages/logger/src/logger.ts)<br>[packages/logger/src/types.ts](../../../packages/logger/src/types.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Build/Typecheck und reale strukturierte/lesbare Logs; statische Redaction-Prüfung.

**Fehlend:** Fehlermeldungen/Stacks und Freitext werden nicht inhaltlich redigiert; keine Logger-Unit-Tests.


### 036 – UI Package — PARTIAL

**Bestand:** Wiederverwendbare UI-Komponenten mit Tokens.

**Dateien:** [apps/web/src/app/design-system/design-system-client.tsx](../../../apps/web/src/app/design-system/design-system-client.tsx)<br>[apps/web/src/app/design-system/page.tsx](../../../apps/web/src/app/design-system/page.tsx)<br>[packages/ui/src/components/button.tsx](../../../packages/ui/src/components/button.tsx)<br>[packages/ui/src/components/display.tsx](../../../packages/ui/src/components/display.tsx)<br>[packages/ui/src/components/form-controls.tsx](../../../packages/ui/src/components/form-controls.tsx)<br>[packages/ui/src/components/interactive.tsx](../../../packages/ui/src/components/interactive.tsx)<br>[packages/ui/src/components/overlays.tsx](../../../packages/ui/src/components/overlays.tsx)<br>[packages/ui/src/styles/components.css](../../../packages/ui/src/styles/components.css)<br>[packages/ui/src/styles/tokens.css](../../../packages/ui/src/styles/tokens.css)<br>[packages/ui/src/tokens.ts](../../../packages/ui/src/tokens.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Komponenten-/Browser-/A11y-Abnahme fehlt.


## Phase 07 – TECHNICAL FOUNDATION


### 037 – Environment Validation — PARTIAL

**Bestand:** Zod-Env-Validation in Web/API/Worker.

**Dateien:** [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts)<br>[apps/api/src/main.ts](../../../apps/api/src/main.ts)<br>[apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/worker/src/main.ts](../../../apps/worker/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Alle drei Anwendungen lokal gestartet; statische Env-Schemas geprüft.

**Fehlend:** Dedizierte Negativtests für komplette Laufzeitkonfiguration fehlen; OTS-Key nur optional validiert.


### 038 – Secrets Management — PARTIAL

**Bestand:** Secrets-Management und getrennte Env-Dateien dokumentiert.

**Dateien:** [.env.example](../../../.env.example)<br>[.gitignore](../../../.gitignore)<br>[docs/security/secrets-management.md](../../../docs/security/secrets-management.md)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Reale Secrets/Rotation/Umgebungsbindungen und Git-Historie nicht vollständig auditiert; keine Secretwerte inspiziert.


### 039 – Request ID System — PARTIAL

**Bestand:** API generiert/validiert UUID und propagiert sie über Queue zum Worker.

**Dateien:** [apps/api/src/common/middleware/request-id.middleware.ts](../../../apps/api/src/common/middleware/request-id.middleware.ts)<br>[apps/api/src/modules/request-id-test/request-id-test.controller.ts](../../../apps/api/src/modules/request-id-test/request-id-test.controller.ts)<br>[apps/api/src/modules/request-id-test/request-id-test.module.ts](../../../apps/api/src/modules/request-id-test/request-id-test.module.ts)<br>[apps/api/src/modules/request-id-test/request-id-test.service.ts](../../../apps/api/src/modules/request-id-test/request-id-test.service.ts)<br>[apps/worker/src/processors/test.processor.ts](../../../apps/worker/src/processors/test.processor.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Lokaler POST ohne Auth 201; gleicher requestId in Workerabschluss nachgewiesen.

**Fehlend:** Web erzeugt/propagiert Request-ID nicht konsistent; Diagnoseendpoint öffentlich.


### 040 – Structured Logging — PARTIAL

**Bestand:** Pretty DEV- und JSON-Logging vorgesehen.

**Dateien:** [apps/api/src/common/interceptors/http-logging.interceptor.ts](../../../apps/api/src/common/interceptors/http-logging.interceptor.ts)<br>[packages/logger/src/logger.ts](../../../packages/logger/src/logger.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Reale Worker-/API-Logs vorhanden; Package-Build bestanden.

**Fehlend:** Kein vollständiges Redaction-/Retention-/Fachereignis-Konzept; keine Logger-Tests.


### 041 – Healthchecks — PARTIAL

**Bestand:** Web-Health und API-Live/Ready, DB SELECT 1 und Redis PING.

**Dateien:** [apps/api/src/modules/health/health.controller.ts](../../../apps/api/src/modules/health/health.controller.ts)<br>[apps/api/src/modules/health/health.module.ts](../../../apps/api/src/modules/health/health.module.ts)<br>[apps/api/src/modules/health/health.service.ts](../../../apps/api/src/modules/health/health.service.ts)<br>[apps/web/src/app/health/route.ts](../../../apps/web/src/app/health/route.ts)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Lokale Health-Requests 200, DB/Redis ok.

**Fehlend:** Worker-Health prüft nur Redis; Auth/Storage/Queue-Verarbeitung nicht durch Readiness belegt.


### 042 – Queue Infrastruktur — PARTIAL

**Bestand:** Alle Plan-Queues registriert; News-/Scheduled-Publishing-/Test-Prozessoren vorhanden.

**Dateien:** [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts)<br>[apps/worker/src/app.module.ts](../../../apps/worker/src/app.module.ts)<br>[packages/types/src/queue.ts](../../../packages/types/src/queue.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Realer Test-Job abgeschlossen; Worker-Unit-Tests bestanden.

**Fehlend:** Registrierung bedeutet keinen Consumer: Sports/Search/Notifications/Cleanup/Moderation/Sanctions fehlen.


## Phase 08 – DEPLOYMENT


### 043 – Docker Compose finalisieren — PARTIAL

**Bestand:** Services modular in Compose definiert.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Alle Service-Container einzeln starten/restarten und Persistenz prüfen noch offen.


### 044 – Cloudflare DEV Routing — PARTIAL

**Bestand:** Cloudflared-Service und Environment-Overlays vorhanden.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Cloudflare-DNS/Tunnel-Zuordnung, Access-Schutz und tatsächliches Routing extern nicht verifiziert.


### 045 – Cloudflare STAGING Routing — PARTIAL

**Bestand:** Cloudflared-Service und Environment-Overlays vorhanden.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Cloudflare-DNS/Tunnel-Zuordnung, Access-Schutz und tatsächliches Routing extern nicht verifiziert.


### 046 – Production Routing vorbereiten — PARTIAL

**Bestand:** Cloudflared-Service und Environment-Overlays vorhanden.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Cloudflare-DNS/Tunnel-Zuordnung, Access-Schutz und tatsächliches Routing extern nicht verifiziert.


### 047 – CI Pipeline — PARTIAL

**Bestand:** CI konfiguriert Install/Format/Lint/Typecheck/Tests/Build.

**Dateien:** [.github/workflows/ci.yml](../../../.github/workflows/ci.yml)<br>[.github/workflows/production.yml](../../../.github/workflows/production.yml)<br>[infrastructure/scripts/deploy/dev.sh](../../../infrastructure/scripts/deploy/dev.sh)<br>[infrastructure/scripts/deploy/production.sh](../../../infrastructure/scripts/deploy/production.sh)<br>[infrastructure/scripts/deploy/rollback.sh](../../../infrastructure/scripts/deploy/rollback.sh)<br>[infrastructure/scripts/deploy/staging.sh](../../../infrastructure/scripts/deploy/staging.sh)<br>[tests/e2e/staging.sh](../../../tests/e2e/staging.sh)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Lokale entsprechende Checks ausgeführt; kein Deploy-Workflow gestartet.

**Fehlend:** GitHub-CI-Lauf nicht nachgewiesen; E2E nicht enthalten; Frontend-Testglob unvollständig.


### 048 – DEV Deployment — PARTIAL

**Bestand:** Deployment-Skripte für DEV/STAGING/PRODUCTION vorhanden; Production manuell angestoßen.

**Dateien:** [.github/workflows/ci.yml](../../../.github/workflows/ci.yml)<br>[.github/workflows/production.yml](../../../.github/workflows/production.yml)<br>[infrastructure/scripts/deploy/dev.sh](../../../infrastructure/scripts/deploy/dev.sh)<br>[infrastructure/scripts/deploy/production.sh](../../../infrastructure/scripts/deploy/production.sh)<br>[infrastructure/scripts/deploy/rollback.sh](../../../infrastructure/scripts/deploy/rollback.sh)<br>[infrastructure/scripts/deploy/staging.sh](../../../infrastructure/scripts/deploy/staging.sh)<br>[tests/e2e/staging.sh](../../../tests/e2e/staging.sh)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Kein Deployment durchgeführt; Zielbetrieb, Backup und Freigabegates nicht praktisch verifiziert. Staging-Skript testet überwiegend Health statt Produktabläufe.


### 049 – STAGING Deployment — PARTIAL

**Bestand:** Deployment-Skripte für DEV/STAGING/PRODUCTION vorhanden; Production manuell angestoßen.

**Dateien:** [.github/workflows/ci.yml](../../../.github/workflows/ci.yml)<br>[.github/workflows/production.yml](../../../.github/workflows/production.yml)<br>[infrastructure/scripts/deploy/dev.sh](../../../infrastructure/scripts/deploy/dev.sh)<br>[infrastructure/scripts/deploy/production.sh](../../../infrastructure/scripts/deploy/production.sh)<br>[infrastructure/scripts/deploy/rollback.sh](../../../infrastructure/scripts/deploy/rollback.sh)<br>[infrastructure/scripts/deploy/staging.sh](../../../infrastructure/scripts/deploy/staging.sh)<br>[tests/e2e/staging.sh](../../../tests/e2e/staging.sh)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Kein Deployment durchgeführt; Zielbetrieb, Backup und Freigabegates nicht praktisch verifiziert. Staging-Skript testet überwiegend Health statt Produktabläufe.


### 050 – PRODUCTION Deployment — PARTIAL

**Bestand:** Deployment-Skripte für DEV/STAGING/PRODUCTION vorhanden; Production manuell angestoßen.

**Dateien:** [.github/workflows/ci.yml](../../../.github/workflows/ci.yml)<br>[.github/workflows/production.yml](../../../.github/workflows/production.yml)<br>[infrastructure/scripts/deploy/dev.sh](../../../infrastructure/scripts/deploy/dev.sh)<br>[infrastructure/scripts/deploy/production.sh](../../../infrastructure/scripts/deploy/production.sh)<br>[infrastructure/scripts/deploy/rollback.sh](../../../infrastructure/scripts/deploy/rollback.sh)<br>[infrastructure/scripts/deploy/staging.sh](../../../infrastructure/scripts/deploy/staging.sh)<br>[tests/e2e/staging.sh](../../../tests/e2e/staging.sh)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Kein Deployment durchgeführt; Zielbetrieb, Backup und Freigabegates nicht praktisch verifiziert. Staging-Skript testet überwiegend Health statt Produktabläufe.


### 051 – Rollback Konzept — PARTIAL

**Bestand:** Rollback mit Release-Metadaten und Script vorhanden.

**Dateien:** [.github/workflows/ci.yml](../../../.github/workflows/ci.yml)<br>[.github/workflows/production.yml](../../../.github/workflows/production.yml)<br>[infrastructure/scripts/deploy/dev.sh](../../../infrastructure/scripts/deploy/dev.sh)<br>[infrastructure/scripts/deploy/production.sh](../../../infrastructure/scripts/deploy/production.sh)<br>[infrastructure/scripts/deploy/rollback.sh](../../../infrastructure/scripts/deploy/rollback.sh)<br>[infrastructure/scripts/deploy/staging.sh](../../../infrastructure/scripts/deploy/staging.sh)<br>[tests/e2e/staging.sh](../../../tests/e2e/staging.sh)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Rollback-/Migrationskompatibilität und tatsächlicher Wiederanlauf nicht getestet.


## Phase 09 – BACKUPS


### 052 – PostgreSQL Backup — PARTIAL

**Bestand:** Backup-/Rotationsskripte und systemd-Timer vorhanden.

**Dateien:** [docs/architecture/object-storage-backup.md](../../../docs/architecture/object-storage-backup.md)<br>[docs/architecture/restore-test.md](../../../docs/architecture/restore-test.md)<br>[infrastructure/scripts/backup/keycloak.sh](../../../infrastructure/scripts/backup/keycloak.sh)<br>[infrastructure/scripts/backup/postgres.sh](../../../infrastructure/scripts/backup/postgres.sh)<br>[infrastructure/scripts/backup/rotation.sh](../../../infrastructure/scripts/backup/rotation.sh)<br>[infrastructure/scripts/restore/keycloak.sh](../../../infrastructure/scripts/restore/keycloak.sh)<br>[infrastructure/scripts/restore/postgres.sh](../../../infrastructure/scripts/restore/postgres.sh)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer](../../../infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer](../../../infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup@.service](../../../infrastructure/systemd/kurvenfunk-keycloak-backup@.service)<br>[infrastructure/systemd/kurvenfunk-postgres-backup-production.timer](../../../infrastructure/systemd/kurvenfunk-postgres-backup-production.timer)<br>[infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer](../../../infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer)<br>[infrastructure/systemd/kurvenfunk-postgres-backup@.service](../../../infrastructure/systemd/kurvenfunk-postgres-backup@.service)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Automatischer Zielbetrieb und Wiederherstellbarkeit aktueller Backups nicht praktisch geprüft; Syntaxprüfung ersetzt keinen Restore.


### 053 – Backup Rotation — PARTIAL

**Bestand:** Backup-/Rotationsskripte und systemd-Timer vorhanden.

**Dateien:** [docs/architecture/object-storage-backup.md](../../../docs/architecture/object-storage-backup.md)<br>[docs/architecture/restore-test.md](../../../docs/architecture/restore-test.md)<br>[infrastructure/scripts/backup/keycloak.sh](../../../infrastructure/scripts/backup/keycloak.sh)<br>[infrastructure/scripts/backup/postgres.sh](../../../infrastructure/scripts/backup/postgres.sh)<br>[infrastructure/scripts/backup/rotation.sh](../../../infrastructure/scripts/backup/rotation.sh)<br>[infrastructure/scripts/restore/keycloak.sh](../../../infrastructure/scripts/restore/keycloak.sh)<br>[infrastructure/scripts/restore/postgres.sh](../../../infrastructure/scripts/restore/postgres.sh)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer](../../../infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer](../../../infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup@.service](../../../infrastructure/systemd/kurvenfunk-keycloak-backup@.service)<br>[infrastructure/systemd/kurvenfunk-postgres-backup-production.timer](../../../infrastructure/systemd/kurvenfunk-postgres-backup-production.timer)<br>[infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer](../../../infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer)<br>[infrastructure/systemd/kurvenfunk-postgres-backup@.service](../../../infrastructure/systemd/kurvenfunk-postgres-backup@.service)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Automatischer Zielbetrieb und Wiederherstellbarkeit aktueller Backups nicht praktisch geprüft; Syntaxprüfung ersetzt keinen Restore.


### 054 – Keycloak Backup — PARTIAL

**Bestand:** Backup-/Rotationsskripte und systemd-Timer vorhanden.

**Dateien:** [docs/architecture/object-storage-backup.md](../../../docs/architecture/object-storage-backup.md)<br>[docs/architecture/restore-test.md](../../../docs/architecture/restore-test.md)<br>[infrastructure/scripts/backup/keycloak.sh](../../../infrastructure/scripts/backup/keycloak.sh)<br>[infrastructure/scripts/backup/postgres.sh](../../../infrastructure/scripts/backup/postgres.sh)<br>[infrastructure/scripts/backup/rotation.sh](../../../infrastructure/scripts/backup/rotation.sh)<br>[infrastructure/scripts/restore/keycloak.sh](../../../infrastructure/scripts/restore/keycloak.sh)<br>[infrastructure/scripts/restore/postgres.sh](../../../infrastructure/scripts/restore/postgres.sh)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer](../../../infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer](../../../infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup@.service](../../../infrastructure/systemd/kurvenfunk-keycloak-backup@.service)<br>[infrastructure/systemd/kurvenfunk-postgres-backup-production.timer](../../../infrastructure/systemd/kurvenfunk-postgres-backup-production.timer)<br>[infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer](../../../infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer)<br>[infrastructure/systemd/kurvenfunk-postgres-backup@.service](../../../infrastructure/systemd/kurvenfunk-postgres-backup@.service)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Automatischer Zielbetrieb und Wiederherstellbarkeit aktueller Backups nicht praktisch geprüft; Syntaxprüfung ersetzt keinen Restore.


### 055 – Object Storage Backup Strategie — PARTIAL

**Bestand:** Object-Storage-Backupstrategie dokumentiert.

**Dateien:** [docs/architecture/object-storage-backup.md](../../../docs/architecture/object-storage-backup.md)<br>[docs/architecture/restore-test.md](../../../docs/architecture/restore-test.md)<br>[infrastructure/scripts/backup/keycloak.sh](../../../infrastructure/scripts/backup/keycloak.sh)<br>[infrastructure/scripts/backup/postgres.sh](../../../infrastructure/scripts/backup/postgres.sh)<br>[infrastructure/scripts/backup/rotation.sh](../../../infrastructure/scripts/backup/rotation.sh)<br>[infrastructure/scripts/restore/keycloak.sh](../../../infrastructure/scripts/restore/keycloak.sh)<br>[infrastructure/scripts/restore/postgres.sh](../../../infrastructure/scripts/restore/postgres.sh)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer](../../../infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer](../../../infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup@.service](../../../infrastructure/systemd/kurvenfunk-keycloak-backup@.service)<br>[infrastructure/systemd/kurvenfunk-postgres-backup-production.timer](../../../infrastructure/systemd/kurvenfunk-postgres-backup-production.timer)<br>[infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer](../../../infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer)<br>[infrastructure/systemd/kurvenfunk-postgres-backup@.service](../../../infrastructure/systemd/kurvenfunk-postgres-backup@.service)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Nachweis von Kopien, Integrität und realem R2-/MinIO-Restore fehlt.


### 056 – Restore Scripts — PARTIAL

**Bestand:** Restore-Skripte für PostgreSQL und Keycloak vorhanden.

**Dateien:** [docs/architecture/object-storage-backup.md](../../../docs/architecture/object-storage-backup.md)<br>[docs/architecture/restore-test.md](../../../docs/architecture/restore-test.md)<br>[infrastructure/scripts/backup/keycloak.sh](../../../infrastructure/scripts/backup/keycloak.sh)<br>[infrastructure/scripts/backup/postgres.sh](../../../infrastructure/scripts/backup/postgres.sh)<br>[infrastructure/scripts/backup/rotation.sh](../../../infrastructure/scripts/backup/rotation.sh)<br>[infrastructure/scripts/restore/keycloak.sh](../../../infrastructure/scripts/restore/keycloak.sh)<br>[infrastructure/scripts/restore/postgres.sh](../../../infrastructure/scripts/restore/postgres.sh)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer](../../../infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer](../../../infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup@.service](../../../infrastructure/systemd/kurvenfunk-keycloak-backup@.service)<br>[infrastructure/systemd/kurvenfunk-postgres-backup-production.timer](../../../infrastructure/systemd/kurvenfunk-postgres-backup-production.timer)<br>[infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer](../../../infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer)<br>[infrastructure/systemd/kurvenfunk-postgres-backup@.service](../../../infrastructure/systemd/kurvenfunk-postgres-backup@.service)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aktueller isolierter End-to-End-Restore nicht ausgeführt; keine Produktionsdaten verwendet.


### 057 – Restore Test — UNKNOWN

**Bestand:** docs/architecture/restore-test.md beschreibt erfolgreichen Test vom 14.08.2026.

**Dateien:** [docs/architecture/object-storage-backup.md](../../../docs/architecture/object-storage-backup.md)<br>[docs/architecture/restore-test.md](../../../docs/architecture/restore-test.md)<br>[infrastructure/scripts/backup/keycloak.sh](../../../infrastructure/scripts/backup/keycloak.sh)<br>[infrastructure/scripts/backup/postgres.sh](../../../infrastructure/scripts/backup/postgres.sh)<br>[infrastructure/scripts/backup/rotation.sh](../../../infrastructure/scripts/backup/rotation.sh)<br>[infrastructure/scripts/restore/keycloak.sh](../../../infrastructure/scripts/restore/keycloak.sh)<br>[infrastructure/scripts/restore/postgres.sh](../../../infrastructure/scripts/restore/postgres.sh)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer](../../../infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer](../../../infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup@.service](../../../infrastructure/systemd/kurvenfunk-keycloak-backup@.service)<br>[infrastructure/systemd/kurvenfunk-postgres-backup-production.timer](../../../infrastructure/systemd/kurvenfunk-postgres-backup-production.timer)<br>[infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer](../../../infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer)<br>[infrastructure/systemd/kurvenfunk-postgres-backup@.service](../../../infrastructure/systemd/kurvenfunk-postgres-backup@.service)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Nur historischer Dokumentnachweis, keine zugehörigen Rohresultate/Backups im Audit; aktuellen Restore nicht erneut ausgeführt.


## Phase 10 – DOMAIN MODEL


### 058 – User Model — DONE

**Bestand:** User als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 059 – Profile Model — DONE

**Bestand:** Profile als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 060 – User Status Model — PARTIAL

**Bestand:** UserStatus ACTIVE/LIMITED/BANNED vorhanden; Auth-/Permissions-Prüfungen implementiert.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Account-Status- und Permission-Unit-Tests bestanden.

**Fehlend:** Statusänderungs-/Sanktionslogik und Session-Revoke fehlen; vollständige Anwendung noch nicht fertig.


### 061 – User Roles Model — DONE

**Bestand:** UserRole/UserRoleAssignment als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 062 – Club Model — DONE

**Bestand:** Club als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 063 – Club Alias Model — DONE

**Bestand:** ClubAlias als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 064 – Neutral Preference — DONE

**Bestand:** FanPreference als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 065 – Competition Model — DONE

**Bestand:** Competition als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 066 – Season Model — DONE

**Bestand:** Season/Stage als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 067 – Match Model — DONE

**Bestand:** Match als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 068 – Standing Model — DONE

**Bestand:** Standing als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 069 – Article Model — DONE

**Bestand:** Article/ArticleClub/ArticleCategory/ArticleTag als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 070 – Media Model — DONE

**Bestand:** Media als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 071 – Comment Model — DONE

**Bestand:** Comment/CommentRevision als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 072 – Reaction Model — PARTIAL

**Bestand:** Reaction-Modell und statusabhängige Kommentarvotes vorhanden.

**Dateien:** [apps/api/src/modules/reactions/reactions.controller.ts](../../../apps/api/src/modules/reactions/reactions.controller.ts)<br>[apps/api/src/modules/reactions/reactions.module.ts](../../../apps/api/src/modules/reactions/reactions.module.ts)<br>[apps/api/src/modules/reactions/reactions.service.ts](../../../apps/api/src/modules/reactions/reactions.service.ts)<br>[apps/web/src/features/articles/comment-voting.tsx](../../../apps/web/src/features/articles/comment-voting.tsx)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)

**Tests:** [apps/api/src/modules/reactions/reactions.controller.spec.ts](../../../apps/api/src/modules/reactions/reactions.controller.spec.ts)<br>[apps/api/src/modules/reactions/reactions.service.spec.ts](../../../apps/api/src/modules/reactions/reactions.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Plan fordert zunächst LIKE; API/UI verwenden UPVOTE/DOWNVOTE. Produktabweichung freigeben oder angleichen.


### 073 – Forum Model — DONE

**Bestand:** ForumCategory/Forum/Thread/Post/ThreadSubscription/ThreadReadState als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 074 – Moderation Report Model — DONE

**Bestand:** ModerationReport als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 075 – Yellow Card Model — DONE

**Bestand:** ModerationCard als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 076 – Sanction Model — DONE

**Bestand:** Sanction als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 077 – IP Block Model — DONE

**Bestand:** IPBlock als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 078 – Audit Log Model — DONE

**Bestand:** AuditLog als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 079 – Notification Model — DONE

**Bestand:** Notification/NotificationPreference als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 080 – Import Models — DONE

**Bestand:** Provider/ImportJob/ImportRecord/RawPayload/EntityMatch als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 081 – Prisma Schema erstellen — DONE

**Bestand:** Gesamtschema als Datenmodell vorhanden; keine Gleichsetzung mit Service/API/UI.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)<br>[docs/database/article-model.md](../../../docs/database/article-model.md)<br>[docs/database/audit-log-model.md](../../../docs/database/audit-log-model.md)<br>[docs/database/club-alias-model.md](../../../docs/database/club-alias-model.md)<br>[docs/database/club-model.md](../../../docs/database/club-model.md)<br>[docs/database/comment-model.md](../../../docs/database/comment-model.md)<br>[docs/database/competition-model.md](../../../docs/database/competition-model.md)<br>[docs/database/forum-model.md](../../../docs/database/forum-model.md)<br>[docs/database/import-models.md](../../../docs/database/import-models.md)<br>[docs/database/ip-block-model.md](../../../docs/database/ip-block-model.md)<br>[docs/database/match-model.md](../../../docs/database/match-model.md)<br>[docs/database/media-model.md](../../../docs/database/media-model.md)<br>[docs/database/moderation-card-model.md](../../../docs/database/moderation-card-model.md)<br>[docs/database/moderation-report-model.md](../../../docs/database/moderation-report-model.md)<br>[docs/database/neutral-preference.md](../../../docs/database/neutral-preference.md)<br>[docs/database/notification-model.md](../../../docs/database/notification-model.md)<br>[docs/database/profile-model.md](../../../docs/database/profile-model.md)<br>[docs/database/reaction-model.md](../../../docs/database/reaction-model.md)<br>[docs/database/sanction-model.md](../../../docs/database/sanction-model.md)<br>[docs/database/season-model.md](../../../docs/database/season-model.md)<br>[docs/database/standing-model.md](../../../docs/database/standing-model.md)<br>[docs/database/user-model.md](../../../docs/database/user-model.md)<br>[docs/database/user-roles-model.md](../../../docs/database/user-roles-model.md)<br>[docs/database/user-status-model.md](../../../docs/database/user-status-model.md)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema validiert/generiert; Migrationen lokal im Setup angewandt; Paket frisch gebaut. Kein Nachweis einer vollständigen Fachfunktion.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 082 – Initial Migration — PARTIAL

**Bestand:** Initialmigration und zehn weitere fachliche Migrationen vorhanden.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Migrationen im lokalen DEV-Setup erfolgreich; aktueller Build/Schema gültig.

**Fehlend:** STAGING-Migrationsabnahme nicht nachgewiesen.


### 083 – Seed System — PARTIAL

**Bestand:** Seed für Vereine/Farben/Aliases, Wettbewerbe/Saisons/Stages, Demoartikel/Matches/Standings.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Seed im DEV-Setup erfolgreich; 28 Clubs lokal über API nachgewiesen.

**Fehlend:** Drei Testuser vorhanden; vollständiger Seed-Abnahmekatalog und produktive Testdatenbereinigung fehlen.


## Phase 11 – API FOUNDATION


### 084 – NestJS Module anlegen — DONE

**Bestand:** Fachmodule entsprechend Struktur angelegt, mehrere absichtlich leer.

**Dateien:** [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts)<br>[apps/api/src/modules/admin/admin.module.ts](../../../apps/api/src/modules/admin/admin.module.ts)<br>[apps/api/src/modules/articles/articles.module.ts](../../../apps/api/src/modules/articles/articles.module.ts)<br>[apps/api/src/modules/audit/audit.module.ts](../../../apps/api/src/modules/audit/audit.module.ts)<br>[apps/api/src/modules/auth/auth.module.ts](../../../apps/api/src/modules/auth/auth.module.ts)<br>[apps/api/src/modules/bans/bans.module.ts](../../../apps/api/src/modules/bans/bans.module.ts)<br>[apps/api/src/modules/categories/categories.module.ts](../../../apps/api/src/modules/categories/categories.module.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/comments/comments.module.ts](../../../apps/api/src/modules/comments/comments.module.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/forums/forums.module.ts](../../../apps/api/src/modules/forums/forums.module.ts)<br>[apps/api/src/modules/health/health.module.ts](../../../apps/api/src/modules/health/health.module.ts)<br>[apps/api/src/modules/imports/imports.module.ts](../../../apps/api/src/modules/imports/imports.module.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/media/media.module.ts](../../../apps/api/src/modules/media/media.module.ts)<br>[apps/api/src/modules/moderation/moderation.module.ts](../../../apps/api/src/modules/moderation/moderation.module.ts)<br>[apps/api/src/modules/notifications/notifications.module.ts](../../../apps/api/src/modules/notifications/notifications.module.ts)<br>[apps/api/src/modules/onboarding/onboarding.module.ts](../../../apps/api/src/modules/onboarding/onboarding.module.ts)<br>[apps/api/src/modules/permissions/permissions.module.ts](../../../apps/api/src/modules/permissions/permissions.module.ts)<br>[apps/api/src/modules/personalization/personalization.module.ts](../../../apps/api/src/modules/personalization/personalization.module.ts)<br>[apps/api/src/modules/posts/posts.module.ts](../../../apps/api/src/modules/posts/posts.module.ts)<br>[apps/api/src/modules/profiles/profiles.module.ts](../../../apps/api/src/modules/profiles/profiles.module.ts)<br>[apps/api/src/modules/providers/providers.module.ts](../../../apps/api/src/modules/providers/providers.module.ts)<br>[apps/api/src/modules/reactions/reactions.module.ts](../../../apps/api/src/modules/reactions/reactions.module.ts)<br>[apps/api/src/modules/reports/reports.module.ts](../../../apps/api/src/modules/reports/reports.module.ts)<br>[apps/api/src/modules/request-id-test/request-id-test.module.ts](../../../apps/api/src/modules/request-id-test/request-id-test.module.ts)<br>[apps/api/src/modules/sanctions/sanctions.module.ts](../../../apps/api/src/modules/sanctions/sanctions.module.ts)<br>[apps/api/src/modules/search/search.module.ts](../../../apps/api/src/modules/search/search.module.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/tags/tags.module.ts](../../../apps/api/src/modules/tags/tags.module.ts)<br>[apps/api/src/modules/threads/threads.module.ts](../../../apps/api/src/modules/threads/threads.module.ts)<br>[apps/api/src/modules/users/users.module.ts](../../../apps/api/src/modules/users/users.module.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** API baut und startet; Aufgabe fordert ausdrücklich noch keine vollständige Fachimplementierung.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 085 – API Versionierung — DONE

**Bestand:** Globaler Prefix api/v1.

**Dateien:** [apps/api/src/main.ts](../../../apps/api/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Lokale API-Requests unter /api/v1 erfolgreich.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 086 – Response Standard — PARTIAL

**Bestand:** Responses data/meta/requestId zentral gekapselt.

**Dateien:** [apps/api/src/common/interceptors/response.interceptor.ts](../../../apps/api/src/common/interceptors/response.interceptor.ts)<br>[apps/api/src/common/types/api-response.ts](../../../apps/api/src/common/types/api-response.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Lokale API-Responses geprüft.

**Fehlend:** Kein dedizierter Interceptor-Integrationstest; rohe Media-Antwort ist begründete Ausnahme.


### 087 – Error Standard — DONE

**Bestand:** Zentraler Errorstandard code/message/requestId inkl. 500-Masking.

**Dateien:** [apps/api/src/common/filters/http-exception.filter.ts](../../../apps/api/src/common/filters/http-exception.filter.ts)

**Tests:** [apps/api/src/common/filters/http-exception.filter.spec.ts](../../../apps/api/src/common/filters/http-exception.filter.spec.ts)

**Nachweis:** HttpExceptionFilter-Unit-Tests und lokale 401/404/500-Responses geprüft.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 088 – Validation — PARTIAL

**Bestand:** Zod-Validation für zentrale Bodies und Querys.

**Dateien:** [apps/api/src/common/pipes/zod-validation.pipe.ts](../../../apps/api/src/common/pipes/zod-validation.pipe.ts)<br>[apps/api/src/modules/media/media.controller.ts](../../../apps/api/src/modules/media/media.controller.ts)<br>[packages/validation/src/article.ts](../../../packages/validation/src/article.ts)<br>[packages/validation/src/category.ts](../../../packages/validation/src/category.ts)<br>[packages/validation/src/comment.ts](../../../packages/validation/src/comment.ts)<br>[packages/validation/src/common.ts](../../../packages/validation/src/common.ts)<br>[packages/validation/src/fan-preference.ts](../../../packages/validation/src/fan-preference.ts)<br>[packages/validation/src/index.ts](../../../packages/validation/src/index.ts)<br>[packages/validation/src/media.ts](../../../packages/validation/src/media.ts)<br>[packages/validation/src/nickname.ts](../../../packages/validation/src/nickname.ts)<br>[packages/validation/src/profile.ts](../../../packages/validation/src/profile.ts)<br>[packages/validation/src/tag.ts](../../../packages/validation/src/tag.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Validation-Unit-Tests bestanden; lokaler ungültiger Media-Aufruf reproduziert.

**Fehlend:** Lücken bei Parametern (ungültige Media-ID => 500); nicht sämtliche Eingaben systematisch getestet.


### 089 – Pagination — PARTIAL

**Bestand:** Cursor-Pagination für Artikel/Kommentare/Medien/Imports implementiert.

**Dateien:** [apps/api/src/modules/comments/comment-pagination.ts](../../../apps/api/src/modules/comments/comment-pagination.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.ts)<br>[apps/api/src/modules/comments/comments.controller.ts](../../../apps/api/src/modules/comments/comments.controller.ts)<br>[apps/api/src/modules/comments/comments.module.ts](../../../apps/api/src/modules/comments/comments.module.ts)<br>[apps/api/src/modules/comments/comments.service.ts](../../../apps/api/src/modules/comments/comments.service.ts)<br>[apps/web/src/features/articles/comment-composer.tsx](../../../apps/web/src/features/articles/comment-composer.tsx)<br>[packages/validation/src/comment.ts](../../../packages/validation/src/comment.ts)

**Tests:** [apps/api/src/modules/comments/comment-pagination.service.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.service.spec.ts)<br>[apps/api/src/modules/comments/comment-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-popular-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-popular-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.spec.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.spec.ts)<br>[apps/api/src/modules/comments/comments-spam-integration.spec.ts](../../../apps/api/src/modules/comments/comments-spam-integration.spec.ts)<br>[apps/api/src/modules/comments/comments.controller.spec.ts](../../../apps/api/src/modules/comments/comments.controller.spec.ts)<br>[apps/api/src/modules/comments/comments.service.spec.ts](../../../apps/api/src/modules/comments/comments.service.spec.ts)<br>[apps/web/src/features/articles/comment-pagination-client.spec.mjs](../../../apps/web/src/features/articles/comment-pagination-client.spec.mjs)<br>[apps/web/src/features/articles/comment-sort.spec.mjs](../../../apps/web/src/features/articles/comment-sort.spec.mjs)<br>[apps/web/src/features/articles/comment-spam-error.spec.mjs](../../../apps/web/src/features/articles/comment-spam-error.spec.mjs)<br>[packages/validation/src/comment.spec.ts](../../../packages/validation/src/comment.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Nicht alle großen Listen begrenzt (z.B. Artikel-Admin findAll, Clubs, Season-Matches); DB-/Nebenläufigkeitsabnahme fehlt.


### 090 – Filtering — DONE

**Bestand:** Wiederverwendbare Standard-Filterparser.

**Dateien:** [apps/api/src/common/filtering/api-filtering.ts](../../../apps/api/src/common/filtering/api-filtering.ts)

**Tests:** [apps/api/src/common/filtering/api-filtering.spec.ts](../../../apps/api/src/common/filtering/api-filtering.spec.ts)

**Nachweis:** api-filtering.spec.ts im API-Lauf bestanden; keine Aussage zur Vollständigkeit jedes Endpoints.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 091 – Sorting — DONE

**Bestand:** Standard-Sortierparameter mit erlaubten Feldern.

**Dateien:** [apps/api/src/common/sorting/api-sorting.ts](../../../apps/api/src/common/sorting/api-sorting.ts)

**Tests:** [apps/api/src/common/sorting/api-sorting.spec.ts](../../../apps/api/src/common/sorting/api-sorting.spec.ts)

**Nachweis:** api-sorting.spec.ts im API-Lauf bestanden.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 092 – Swagger / OpenAPI — PARTIAL

**Bestand:** Swagger optional über SWAGGER_ENABLED und /docs eingerichtet.

**Dateien:** [.env.example](../../../.env.example)<br>[apps/api/src/main.ts](../../../apps/api/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** STAGING-Erreichbarkeit/Schutz und vollständige fachliche OpenAPI-Verträge nicht abgenommen.


## Phase 12 – AUTHENTICATION


### 093 – Keycloak ↔ API — PARTIAL

**Bestand:** jose prüft RS256, Signatur, Issuer, Audience; AuthGuard verlangt verifizierte E-Mail.

**Dateien:** [apps/api/src/modules/auth/account-status.guard.ts](../../../apps/api/src/modules/auth/account-status.guard.ts)<br>[apps/api/src/modules/auth/auth.controller.ts](../../../apps/api/src/modules/auth/auth.controller.ts)<br>[apps/api/src/modules/auth/auth.guard.ts](../../../apps/api/src/modules/auth/auth.guard.ts)<br>[apps/api/src/modules/auth/auth.module.ts](../../../apps/api/src/modules/auth/auth.module.ts)<br>[apps/api/src/modules/auth/auth.types.ts](../../../apps/api/src/modules/auth/auth.types.ts)<br>[apps/api/src/modules/auth/keycloak-jwt.service.ts](../../../apps/api/src/modules/auth/keycloak-jwt.service.ts)<br>[apps/api/src/modules/users/users.service.ts](../../../apps/api/src/modules/users/users.service.ts)<br>[apps/web/src/app/login/login](../../../apps/web/src/app/login/login)<br>[apps/web/src/app/login/login-client.tsx](../../../apps/web/src/app/login/login-client.tsx)<br>[apps/web/src/app/login/page.tsx](../../../apps/web/src/app/login/page.tsx)<br>[apps/web/src/features/auth/auth-provider.tsx](../../../apps/web/src/features/auth/auth-provider.tsx)

**Tests:** [apps/api/src/modules/auth/account-status-integration.spec.ts](../../../apps/api/src/modules/auth/account-status-integration.spec.ts)<br>[apps/api/src/modules/auth/account-status.guard.spec.ts](../../../apps/api/src/modules/auth/account-status.guard.spec.ts)<br>[apps/api/src/modules/auth/auth.controller.spec.ts](../../../apps/api/src/modules/auth/auth.controller.spec.ts)<br>[apps/api/src/modules/auth/auth.guard.spec.ts](../../../apps/api/src/modules/auth/auth.guard.spec.ts)<br>[apps/api/src/modules/users/users.service.spec.ts](../../../apps/api/src/modules/users/users.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Kein echter Keycloak-/JWKS-/Expiry-/Rotationstest; Guardtests mocken JWT-Service.


### 094 – User Sync — PARTIAL

**Bestand:** Keycloak subject-basiertes Upsert mit UNSET/onboardingCompleted=false und DB-Rollen.

**Dateien:** [apps/api/src/modules/auth/account-status.guard.ts](../../../apps/api/src/modules/auth/account-status.guard.ts)<br>[apps/api/src/modules/auth/auth.controller.ts](../../../apps/api/src/modules/auth/auth.controller.ts)<br>[apps/api/src/modules/auth/auth.guard.ts](../../../apps/api/src/modules/auth/auth.guard.ts)<br>[apps/api/src/modules/auth/auth.module.ts](../../../apps/api/src/modules/auth/auth.module.ts)<br>[apps/api/src/modules/auth/auth.types.ts](../../../apps/api/src/modules/auth/auth.types.ts)<br>[apps/api/src/modules/auth/keycloak-jwt.service.ts](../../../apps/api/src/modules/auth/keycloak-jwt.service.ts)<br>[apps/api/src/modules/users/users.service.ts](../../../apps/api/src/modules/users/users.service.ts)<br>[apps/web/src/app/login/login](../../../apps/web/src/app/login/login)<br>[apps/web/src/app/login/login-client.tsx](../../../apps/web/src/app/login/login-client.tsx)<br>[apps/web/src/app/login/page.tsx](../../../apps/web/src/app/login/page.tsx)<br>[apps/web/src/features/auth/auth-provider.tsx](../../../apps/web/src/features/auth/auth-provider.tsx)

**Tests:** [apps/api/src/modules/auth/account-status-integration.spec.ts](../../../apps/api/src/modules/auth/account-status-integration.spec.ts)<br>[apps/api/src/modules/auth/account-status.guard.spec.ts](../../../apps/api/src/modules/auth/account-status.guard.spec.ts)<br>[apps/api/src/modules/auth/auth.controller.spec.ts](../../../apps/api/src/modules/auth/auth.controller.spec.ts)<br>[apps/api/src/modules/auth/auth.guard.spec.ts](../../../apps/api/src/modules/auth/auth.guard.spec.ts)<br>[apps/api/src/modules/users/users.service.spec.ts](../../../apps/api/src/modules/users/users.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Echte konkurrierende Erstlogins und Identity-Provider-Flow nicht integriert getestet.


### 095 – E-Mail Registrierung — PARTIAL

**Bestand:** Keycloak-Registrierungsskript und Login-Anbindung.

**Dateien:** [apps/api/src/modules/auth/account-status.guard.ts](../../../apps/api/src/modules/auth/account-status.guard.ts)<br>[apps/api/src/modules/auth/auth.controller.ts](../../../apps/api/src/modules/auth/auth.controller.ts)<br>[apps/api/src/modules/auth/auth.guard.ts](../../../apps/api/src/modules/auth/auth.guard.ts)<br>[apps/api/src/modules/auth/auth.module.ts](../../../apps/api/src/modules/auth/auth.module.ts)<br>[apps/api/src/modules/auth/auth.types.ts](../../../apps/api/src/modules/auth/auth.types.ts)<br>[apps/api/src/modules/auth/keycloak-jwt.service.ts](../../../apps/api/src/modules/auth/keycloak-jwt.service.ts)<br>[apps/api/src/modules/users/users.service.ts](../../../apps/api/src/modules/users/users.service.ts)<br>[apps/web/src/app/login/login](../../../apps/web/src/app/login/login)<br>[apps/web/src/app/login/login-client.tsx](../../../apps/web/src/app/login/login-client.tsx)<br>[apps/web/src/app/login/page.tsx](../../../apps/web/src/app/login/page.tsx)<br>[apps/web/src/features/auth/auth-provider.tsx](../../../apps/web/src/features/auth/auth-provider.tsx)<br>[infrastructure/scripts/keycloak/configure-account-linking.sh](../../../infrastructure/scripts/keycloak/configure-account-linking.sh)<br>[infrastructure/scripts/keycloak/configure-api-audience.sh](../../../infrastructure/scripts/keycloak/configure-api-audience.sh)<br>[infrastructure/scripts/keycloak/configure-email-registration.sh](../../../infrastructure/scripts/keycloak/configure-email-registration.sh)

**Tests:** [apps/api/src/modules/auth/account-status-integration.spec.ts](../../../apps/api/src/modules/auth/account-status-integration.spec.ts)<br>[apps/api/src/modules/auth/account-status.guard.spec.ts](../../../apps/api/src/modules/auth/account-status.guard.spec.ts)<br>[apps/api/src/modules/auth/auth.controller.spec.ts](../../../apps/api/src/modules/auth/auth.controller.spec.ts)<br>[apps/api/src/modules/auth/auth.guard.spec.ts](../../../apps/api/src/modules/auth/auth.guard.spec.ts)<br>[apps/api/src/modules/users/users.service.spec.ts](../../../apps/api/src/modules/users/users.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** SMTP, Registrierung und Verify-Mail nicht Ende-zu-Ende geprüft.


### 096 – E-Mail Verifizierung — PARTIAL

**Bestand:** AuthGuard prüft email_verified; Login/UI behandeln EMAIL_NOT_VERIFIED.

**Dateien:** [apps/api/src/modules/auth/account-status.guard.ts](../../../apps/api/src/modules/auth/account-status.guard.ts)<br>[apps/api/src/modules/auth/auth.controller.ts](../../../apps/api/src/modules/auth/auth.controller.ts)<br>[apps/api/src/modules/auth/auth.guard.ts](../../../apps/api/src/modules/auth/auth.guard.ts)<br>[apps/api/src/modules/auth/auth.module.ts](../../../apps/api/src/modules/auth/auth.module.ts)<br>[apps/api/src/modules/auth/auth.types.ts](../../../apps/api/src/modules/auth/auth.types.ts)<br>[apps/api/src/modules/auth/keycloak-jwt.service.ts](../../../apps/api/src/modules/auth/keycloak-jwt.service.ts)<br>[apps/api/src/modules/users/users.service.ts](../../../apps/api/src/modules/users/users.service.ts)<br>[apps/web/src/app/login/login](../../../apps/web/src/app/login/login)<br>[apps/web/src/app/login/login-client.tsx](../../../apps/web/src/app/login/login-client.tsx)<br>[apps/web/src/app/login/page.tsx](../../../apps/web/src/app/login/page.tsx)<br>[apps/web/src/features/auth/auth-provider.tsx](../../../apps/web/src/features/auth/auth-provider.tsx)<br>[infrastructure/scripts/keycloak/configure-account-linking.sh](../../../infrastructure/scripts/keycloak/configure-account-linking.sh)<br>[infrastructure/scripts/keycloak/configure-api-audience.sh](../../../infrastructure/scripts/keycloak/configure-api-audience.sh)<br>[infrastructure/scripts/keycloak/configure-email-registration.sh](../../../infrastructure/scripts/keycloak/configure-email-registration.sh)

**Tests:** [apps/api/src/modules/auth/account-status-integration.spec.ts](../../../apps/api/src/modules/auth/account-status-integration.spec.ts)<br>[apps/api/src/modules/auth/account-status.guard.spec.ts](../../../apps/api/src/modules/auth/account-status.guard.spec.ts)<br>[apps/api/src/modules/auth/auth.controller.spec.ts](../../../apps/api/src/modules/auth/auth.controller.spec.ts)<br>[apps/api/src/modules/auth/auth.guard.spec.ts](../../../apps/api/src/modules/auth/auth.guard.spec.ts)<br>[apps/api/src/modules/users/users.service.spec.ts](../../../apps/api/src/modules/users/users.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Echte Verifizierungsmail und anschließendes Onboarding nicht getestet.


### 097 – Login mit E-Mail — PARTIAL

**Bestand:** Keycloak-Login und API-BANNED-Guard.

**Dateien:** [apps/api/src/modules/auth/account-status.guard.ts](../../../apps/api/src/modules/auth/account-status.guard.ts)<br>[apps/api/src/modules/auth/auth.controller.ts](../../../apps/api/src/modules/auth/auth.controller.ts)<br>[apps/api/src/modules/auth/auth.guard.ts](../../../apps/api/src/modules/auth/auth.guard.ts)<br>[apps/api/src/modules/auth/auth.module.ts](../../../apps/api/src/modules/auth/auth.module.ts)<br>[apps/api/src/modules/auth/auth.types.ts](../../../apps/api/src/modules/auth/auth.types.ts)<br>[apps/api/src/modules/auth/keycloak-jwt.service.ts](../../../apps/api/src/modules/auth/keycloak-jwt.service.ts)<br>[apps/api/src/modules/users/users.service.ts](../../../apps/api/src/modules/users/users.service.ts)<br>[apps/web/src/app/login/login](../../../apps/web/src/app/login/login)<br>[apps/web/src/app/login/login-client.tsx](../../../apps/web/src/app/login/login-client.tsx)<br>[apps/web/src/app/login/page.tsx](../../../apps/web/src/app/login/page.tsx)<br>[apps/web/src/features/auth/auth-provider.tsx](../../../apps/web/src/features/auth/auth-provider.tsx)

**Tests:** [apps/api/src/modules/auth/account-status-integration.spec.ts](../../../apps/api/src/modules/auth/account-status-integration.spec.ts)<br>[apps/api/src/modules/auth/account-status.guard.spec.ts](../../../apps/api/src/modules/auth/account-status.guard.spec.ts)<br>[apps/api/src/modules/auth/auth.controller.spec.ts](../../../apps/api/src/modules/auth/auth.controller.spec.ts)<br>[apps/api/src/modules/auth/auth.guard.spec.ts](../../../apps/api/src/modules/auth/auth.guard.spec.ts)<br>[apps/api/src/modules/users/users.service.spec.ts](../../../apps/api/src/modules/users/users.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Echte Loginfehler, Token-Erneuerung und Sessions nicht abgenommen; keine updateToken-Logik im AuthProvider.


### 098 – Google Login — PARTIAL

**Bestand:** loginWithGoogle nutzt idpHint google; Keycloak-Skript prüft Google-IdP.

**Dateien:** [apps/api/src/modules/auth/account-status.guard.ts](../../../apps/api/src/modules/auth/account-status.guard.ts)<br>[apps/api/src/modules/auth/auth.controller.ts](../../../apps/api/src/modules/auth/auth.controller.ts)<br>[apps/api/src/modules/auth/auth.guard.ts](../../../apps/api/src/modules/auth/auth.guard.ts)<br>[apps/api/src/modules/auth/auth.module.ts](../../../apps/api/src/modules/auth/auth.module.ts)<br>[apps/api/src/modules/auth/auth.types.ts](../../../apps/api/src/modules/auth/auth.types.ts)<br>[apps/api/src/modules/auth/keycloak-jwt.service.ts](../../../apps/api/src/modules/auth/keycloak-jwt.service.ts)<br>[apps/api/src/modules/users/users.service.ts](../../../apps/api/src/modules/users/users.service.ts)<br>[apps/web/src/app/login/login](../../../apps/web/src/app/login/login)<br>[apps/web/src/app/login/login-client.tsx](../../../apps/web/src/app/login/login-client.tsx)<br>[apps/web/src/app/login/page.tsx](../../../apps/web/src/app/login/page.tsx)<br>[apps/web/src/features/auth/auth-provider.tsx](../../../apps/web/src/features/auth/auth-provider.tsx)<br>[infrastructure/scripts/keycloak/configure-account-linking.sh](../../../infrastructure/scripts/keycloak/configure-account-linking.sh)<br>[infrastructure/scripts/keycloak/configure-api-audience.sh](../../../infrastructure/scripts/keycloak/configure-api-audience.sh)<br>[infrastructure/scripts/keycloak/configure-email-registration.sh](../../../infrastructure/scripts/keycloak/configure-email-registration.sh)

**Tests:** [apps/api/src/modules/auth/account-status-integration.spec.ts](../../../apps/api/src/modules/auth/account-status-integration.spec.ts)<br>[apps/api/src/modules/auth/account-status.guard.spec.ts](../../../apps/api/src/modules/auth/account-status.guard.spec.ts)<br>[apps/api/src/modules/auth/auth.controller.spec.ts](../../../apps/api/src/modules/auth/auth.controller.spec.ts)<br>[apps/api/src/modules/auth/auth.guard.spec.ts](../../../apps/api/src/modules/auth/auth.guard.spec.ts)<br>[apps/api/src/modules/users/users.service.spec.ts](../../../apps/api/src/modules/users/users.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Kein echter OAuth-/Google-Login; konfigurierte Credentials/IdP außerhalb Repository unbekannt.


### 099 – Logout — PARTIAL

**Bestand:** Lokaler Auth-State wird gelöscht und Keycloak logout aufgerufen.

**Dateien:** [apps/api/src/modules/auth/account-status.guard.ts](../../../apps/api/src/modules/auth/account-status.guard.ts)<br>[apps/api/src/modules/auth/auth.controller.ts](../../../apps/api/src/modules/auth/auth.controller.ts)<br>[apps/api/src/modules/auth/auth.guard.ts](../../../apps/api/src/modules/auth/auth.guard.ts)<br>[apps/api/src/modules/auth/auth.module.ts](../../../apps/api/src/modules/auth/auth.module.ts)<br>[apps/api/src/modules/auth/auth.types.ts](../../../apps/api/src/modules/auth/auth.types.ts)<br>[apps/api/src/modules/auth/keycloak-jwt.service.ts](../../../apps/api/src/modules/auth/keycloak-jwt.service.ts)<br>[apps/api/src/modules/users/users.service.ts](../../../apps/api/src/modules/users/users.service.ts)<br>[apps/web/src/app/login/login](../../../apps/web/src/app/login/login)<br>[apps/web/src/app/login/login-client.tsx](../../../apps/web/src/app/login/login-client.tsx)<br>[apps/web/src/app/login/page.tsx](../../../apps/web/src/app/login/page.tsx)<br>[apps/web/src/features/auth/auth-provider.tsx](../../../apps/web/src/features/auth/auth-provider.tsx)

**Tests:** [apps/api/src/modules/auth/account-status-integration.spec.ts](../../../apps/api/src/modules/auth/account-status-integration.spec.ts)<br>[apps/api/src/modules/auth/account-status.guard.spec.ts](../../../apps/api/src/modules/auth/account-status.guard.spec.ts)<br>[apps/api/src/modules/auth/auth.controller.spec.ts](../../../apps/api/src/modules/auth/auth.controller.spec.ts)<br>[apps/api/src/modules/auth/auth.guard.spec.ts](../../../apps/api/src/modules/auth/auth.guard.spec.ts)<br>[apps/api/src/modules/users/users.service.spec.ts](../../../apps/api/src/modules/users/users.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Browser-/Keycloak-Session-Ende und SSO nicht getestet.


### 100 – Password Reset — PARTIAL

**Bestand:** Keycloak-Konfigurationsskript setzt resetPasswordAllowed=true; Web delegiert Anmeldung an Keycloak.

**Dateien:** [apps/api/src/modules/auth/account-status.guard.ts](../../../apps/api/src/modules/auth/account-status.guard.ts)<br>[apps/api/src/modules/auth/auth.controller.ts](../../../apps/api/src/modules/auth/auth.controller.ts)<br>[apps/api/src/modules/auth/auth.guard.ts](../../../apps/api/src/modules/auth/auth.guard.ts)<br>[apps/api/src/modules/auth/auth.module.ts](../../../apps/api/src/modules/auth/auth.module.ts)<br>[apps/api/src/modules/auth/auth.types.ts](../../../apps/api/src/modules/auth/auth.types.ts)<br>[apps/api/src/modules/auth/keycloak-jwt.service.ts](../../../apps/api/src/modules/auth/keycloak-jwt.service.ts)<br>[apps/api/src/modules/users/users.service.ts](../../../apps/api/src/modules/users/users.service.ts)<br>[apps/web/src/app/login/login](../../../apps/web/src/app/login/login)<br>[apps/web/src/app/login/login-client.tsx](../../../apps/web/src/app/login/login-client.tsx)<br>[apps/web/src/app/login/page.tsx](../../../apps/web/src/app/login/page.tsx)<br>[apps/web/src/features/auth/auth-provider.tsx](../../../apps/web/src/features/auth/auth-provider.tsx)<br>[infrastructure/scripts/keycloak/configure-account-linking.sh](../../../infrastructure/scripts/keycloak/configure-account-linking.sh)<br>[infrastructure/scripts/keycloak/configure-api-audience.sh](../../../infrastructure/scripts/keycloak/configure-api-audience.sh)<br>[infrastructure/scripts/keycloak/configure-email-registration.sh](../../../infrastructure/scripts/keycloak/configure-email-registration.sh)

**Tests:** [apps/api/src/modules/auth/account-status-integration.spec.ts](../../../apps/api/src/modules/auth/account-status-integration.spec.ts)<br>[apps/api/src/modules/auth/account-status.guard.spec.ts](../../../apps/api/src/modules/auth/account-status.guard.spec.ts)<br>[apps/api/src/modules/auth/auth.controller.spec.ts](../../../apps/api/src/modules/auth/auth.controller.spec.ts)<br>[apps/api/src/modules/auth/auth.guard.spec.ts](../../../apps/api/src/modules/auth/auth.guard.spec.ts)<br>[apps/api/src/modules/users/users.service.spec.ts](../../../apps/api/src/modules/users/users.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** E-Mail-Zustellung, Einmallink und tatsächlicher Password-Reset nicht abgenommen.


### 101 – Account Linking — PARTIAL

**Bestand:** Script setzt duplicateEmailsAllowed=false und Broker-Linking-Flow.

**Dateien:** [apps/api/src/modules/auth/account-status.guard.ts](../../../apps/api/src/modules/auth/account-status.guard.ts)<br>[apps/api/src/modules/auth/auth.controller.ts](../../../apps/api/src/modules/auth/auth.controller.ts)<br>[apps/api/src/modules/auth/auth.guard.ts](../../../apps/api/src/modules/auth/auth.guard.ts)<br>[apps/api/src/modules/auth/auth.module.ts](../../../apps/api/src/modules/auth/auth.module.ts)<br>[apps/api/src/modules/auth/auth.types.ts](../../../apps/api/src/modules/auth/auth.types.ts)<br>[apps/api/src/modules/auth/keycloak-jwt.service.ts](../../../apps/api/src/modules/auth/keycloak-jwt.service.ts)<br>[apps/api/src/modules/users/users.service.ts](../../../apps/api/src/modules/users/users.service.ts)<br>[apps/web/src/app/login/login](../../../apps/web/src/app/login/login)<br>[apps/web/src/app/login/login-client.tsx](../../../apps/web/src/app/login/login-client.tsx)<br>[apps/web/src/app/login/page.tsx](../../../apps/web/src/app/login/page.tsx)<br>[apps/web/src/features/auth/auth-provider.tsx](../../../apps/web/src/features/auth/auth-provider.tsx)<br>[infrastructure/scripts/keycloak/configure-account-linking.sh](../../../infrastructure/scripts/keycloak/configure-account-linking.sh)<br>[infrastructure/scripts/keycloak/configure-api-audience.sh](../../../infrastructure/scripts/keycloak/configure-api-audience.sh)<br>[infrastructure/scripts/keycloak/configure-email-registration.sh](../../../infrastructure/scripts/keycloak/configure-email-registration.sh)

**Tests:** [apps/api/src/modules/auth/account-status-integration.spec.ts](../../../apps/api/src/modules/auth/account-status-integration.spec.ts)<br>[apps/api/src/modules/auth/account-status.guard.spec.ts](../../../apps/api/src/modules/auth/account-status.guard.spec.ts)<br>[apps/api/src/modules/auth/auth.controller.spec.ts](../../../apps/api/src/modules/auth/auth.controller.spec.ts)<br>[apps/api/src/modules/auth/auth.guard.spec.ts](../../../apps/api/src/modules/auth/auth.guard.spec.ts)<br>[apps/api/src/modules/users/users.service.spec.ts](../../../apps/api/src/modules/users/users.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Kein echter Email+Google-Linking-Test; angewandte Realmkonfiguration nicht nachgewiesen.


## Phase 13 – USER ONBOARDING


### 102 – Onboarding Gate — PARTIAL

**Bestand:** Clientseitiger OnboardingGate leitet unvollständige Nutzer um.

**Dateien:** [apps/api/src/modules/onboarding/onboarding.controller.ts](../../../apps/api/src/modules/onboarding/onboarding.controller.ts)<br>[apps/api/src/modules/onboarding/onboarding.module.ts](../../../apps/api/src/modules/onboarding/onboarding.module.ts)<br>[apps/api/src/modules/onboarding/onboarding.service.ts](../../../apps/api/src/modules/onboarding/onboarding.service.ts)<br>[apps/web/src/features/onboarding/club-selection.tsx](../../../apps/web/src/features/onboarding/club-selection.tsx)<br>[apps/web/src/features/onboarding/nickname-selection.tsx](../../../apps/web/src/features/onboarding/nickname-selection.tsx)<br>[apps/web/src/features/onboarding/onboarding-completion.tsx](../../../apps/web/src/features/onboarding/onboarding-completion.tsx)<br>[apps/web/src/features/onboarding/onboarding-gate.tsx](../../../apps/web/src/features/onboarding/onboarding-gate.tsx)<br>[packages/validation/src/fan-preference.ts](../../../packages/validation/src/fan-preference.ts)<br>[packages/validation/src/nickname.ts](../../../packages/validation/src/nickname.ts)

**Tests:** [apps/api/src/modules/onboarding/onboarding.controller.spec.ts](../../../apps/api/src/modules/onboarding/onboarding.controller.spec.ts)<br>[apps/api/src/modules/onboarding/onboarding.service.spec.ts](../../../apps/api/src/modules/onboarding/onboarding.service.spec.ts)<br>[packages/validation/src/fan-preference.spec.ts](../../../packages/validation/src/fan-preference.spec.ts)<br>[packages/validation/src/nickname.spec.ts](../../../packages/validation/src/nickname.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Serverseitige Sperre von Communityaktionen vor Onboarding fehlt; umgehbar durch direkte API-Nutzung.


### 103 – Nickname Auswahl — PARTIAL

**Bestand:** Nickname-Länge/Zeichen/Reservierungen; case-insensitive DB-Unique-Index.

**Dateien:** [apps/api/src/modules/onboarding/onboarding.controller.ts](../../../apps/api/src/modules/onboarding/onboarding.controller.ts)<br>[apps/api/src/modules/onboarding/onboarding.module.ts](../../../apps/api/src/modules/onboarding/onboarding.module.ts)<br>[apps/api/src/modules/onboarding/onboarding.service.ts](../../../apps/api/src/modules/onboarding/onboarding.service.ts)<br>[apps/web/src/features/onboarding/club-selection.tsx](../../../apps/web/src/features/onboarding/club-selection.tsx)<br>[apps/web/src/features/onboarding/nickname-selection.tsx](../../../apps/web/src/features/onboarding/nickname-selection.tsx)<br>[apps/web/src/features/onboarding/onboarding-completion.tsx](../../../apps/web/src/features/onboarding/onboarding-completion.tsx)<br>[apps/web/src/features/onboarding/onboarding-gate.tsx](../../../apps/web/src/features/onboarding/onboarding-gate.tsx)<br>[packages/validation/src/fan-preference.ts](../../../packages/validation/src/fan-preference.ts)<br>[packages/validation/src/nickname.ts](../../../packages/validation/src/nickname.ts)

**Tests:** [apps/api/src/modules/onboarding/onboarding.controller.spec.ts](../../../apps/api/src/modules/onboarding/onboarding.controller.spec.ts)<br>[apps/api/src/modules/onboarding/onboarding.service.spec.ts](../../../apps/api/src/modules/onboarding/onboarding.service.spec.ts)<br>[packages/validation/src/fan-preference.spec.ts](../../../packages/validation/src/fan-preference.spec.ts)<br>[packages/validation/src/nickname.spec.ts](../../../packages/validation/src/nickname.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Verbotene Begriffe zusätzlich zu fünf reservierten Namen fehlen; Browser-/Konkurrenzabnahme offen.


### 104 – Nickname Live Validation — PARTIAL

**Bestand:** Verfügbarkeitsendpoint plus debouncte UI-Validierung/AbortController.

**Dateien:** [apps/api/src/modules/onboarding/onboarding.controller.ts](../../../apps/api/src/modules/onboarding/onboarding.controller.ts)<br>[apps/api/src/modules/onboarding/onboarding.module.ts](../../../apps/api/src/modules/onboarding/onboarding.module.ts)<br>[apps/api/src/modules/onboarding/onboarding.service.ts](../../../apps/api/src/modules/onboarding/onboarding.service.ts)<br>[apps/web/src/features/onboarding/club-selection.tsx](../../../apps/web/src/features/onboarding/club-selection.tsx)<br>[apps/web/src/features/onboarding/nickname-selection.tsx](../../../apps/web/src/features/onboarding/nickname-selection.tsx)<br>[apps/web/src/features/onboarding/onboarding-completion.tsx](../../../apps/web/src/features/onboarding/onboarding-completion.tsx)<br>[apps/web/src/features/onboarding/onboarding-gate.tsx](../../../apps/web/src/features/onboarding/onboarding-gate.tsx)<br>[packages/validation/src/fan-preference.ts](../../../packages/validation/src/fan-preference.ts)<br>[packages/validation/src/nickname.ts](../../../packages/validation/src/nickname.ts)

**Tests:** [apps/api/src/modules/onboarding/onboarding.controller.spec.ts](../../../apps/api/src/modules/onboarding/onboarding.controller.spec.ts)<br>[apps/api/src/modules/onboarding/onboarding.service.spec.ts](../../../apps/api/src/modules/onboarding/onboarding.service.spec.ts)<br>[packages/validation/src/fan-preference.spec.ts](../../../packages/validation/src/fan-preference.spec.ts)<br>[packages/validation/src/nickname.spec.ts](../../../packages/validation/src/nickname.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Kein UI-Test für Rennen/Abbrüche und echte Auth-Abnahme.


### 105 – Vereinsauswahl — PARTIAL

**Bestand:** Aktive Clubs, Logos und Neutraloption in Auswahl.

**Dateien:** [apps/api/src/modules/onboarding/onboarding.controller.ts](../../../apps/api/src/modules/onboarding/onboarding.controller.ts)<br>[apps/api/src/modules/onboarding/onboarding.module.ts](../../../apps/api/src/modules/onboarding/onboarding.module.ts)<br>[apps/api/src/modules/onboarding/onboarding.service.ts](../../../apps/api/src/modules/onboarding/onboarding.service.ts)<br>[apps/web/src/features/onboarding/club-selection.tsx](../../../apps/web/src/features/onboarding/club-selection.tsx)<br>[apps/web/src/features/onboarding/nickname-selection.tsx](../../../apps/web/src/features/onboarding/nickname-selection.tsx)<br>[apps/web/src/features/onboarding/onboarding-completion.tsx](../../../apps/web/src/features/onboarding/onboarding-completion.tsx)<br>[apps/web/src/features/onboarding/onboarding-gate.tsx](../../../apps/web/src/features/onboarding/onboarding-gate.tsx)<br>[packages/validation/src/fan-preference.ts](../../../packages/validation/src/fan-preference.ts)<br>[packages/validation/src/nickname.ts](../../../packages/validation/src/nickname.ts)

**Tests:** [apps/api/src/modules/onboarding/onboarding.controller.spec.ts](../../../apps/api/src/modules/onboarding/onboarding.controller.spec.ts)<br>[apps/api/src/modules/onboarding/onboarding.service.spec.ts](../../../apps/api/src/modules/onboarding/onboarding.service.spec.ts)<br>[packages/validation/src/fan-preference.spec.ts](../../../packages/validation/src/fan-preference.spec.ts)<br>[packages/validation/src/nickname.spec.ts](../../../packages/validation/src/nickname.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Authenticated Browserflow/Mobile-Abnahme fehlt.


### 106 – Neutral Auswahl — DONE

**Bestand:** Explizites FanPreference UNSET/CLUB/NEUTRAL und diskriminierte Validierung.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** [packages/validation/src/fan-preference.spec.ts](../../../packages/validation/src/fan-preference.spec.ts)

**Nachweis:** Fan-Preference-Validation-/Onboarding-Tests bestanden; Schema gültig.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 107 – Onboarding abschließen — PARTIAL

**Bestand:** Abschluss persistiert Nickname/FanPreference/favoriteClubId und Completion.

**Dateien:** [apps/api/src/modules/onboarding/onboarding.controller.ts](../../../apps/api/src/modules/onboarding/onboarding.controller.ts)<br>[apps/api/src/modules/onboarding/onboarding.module.ts](../../../apps/api/src/modules/onboarding/onboarding.module.ts)<br>[apps/api/src/modules/onboarding/onboarding.service.ts](../../../apps/api/src/modules/onboarding/onboarding.service.ts)<br>[apps/web/src/features/onboarding/club-selection.tsx](../../../apps/web/src/features/onboarding/club-selection.tsx)<br>[apps/web/src/features/onboarding/nickname-selection.tsx](../../../apps/web/src/features/onboarding/nickname-selection.tsx)<br>[apps/web/src/features/onboarding/onboarding-completion.tsx](../../../apps/web/src/features/onboarding/onboarding-completion.tsx)<br>[apps/web/src/features/onboarding/onboarding-gate.tsx](../../../apps/web/src/features/onboarding/onboarding-gate.tsx)<br>[packages/validation/src/fan-preference.ts](../../../packages/validation/src/fan-preference.ts)<br>[packages/validation/src/nickname.ts](../../../packages/validation/src/nickname.ts)

**Tests:** [apps/api/src/modules/onboarding/onboarding.controller.spec.ts](../../../apps/api/src/modules/onboarding/onboarding.controller.spec.ts)<br>[apps/api/src/modules/onboarding/onboarding.service.spec.ts](../../../apps/api/src/modules/onboarding/onboarding.service.spec.ts)<br>[packages/validation/src/fan-preference.spec.ts](../../../packages/validation/src/fan-preference.spec.ts)<br>[packages/validation/src/nickname.spec.ts](../../../packages/validation/src/nickname.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Echter vollständiger Login-zu-Startseite-Flow und serverseitiges Gate fehlen.


### 108 – Vereinswahl später ändern — PARTIAL

**Bestand:** Profileinstellungen ändern Lieblingsverein oder Neutral.

**Dateien:** [apps/api/src/modules/profiles/profiles.controller.ts](../../../apps/api/src/modules/profiles/profiles.controller.ts)<br>[apps/api/src/modules/profiles/profiles.module.ts](../../../apps/api/src/modules/profiles/profiles.module.ts)<br>[apps/api/src/modules/profiles/profiles.service.ts](../../../apps/api/src/modules/profiles/profiles.service.ts)<br>[apps/web/src/features/profile/club-combobox.tsx](../../../apps/web/src/features/profile/club-combobox.tsx)<br>[apps/web/src/features/profile/fan-preference-settings.tsx](../../../apps/web/src/features/profile/fan-preference-settings.tsx)<br>[apps/web/src/features/profile/profile-page.tsx](../../../apps/web/src/features/profile/profile-page.tsx)<br>[apps/web/src/features/settings/user-settings-page.tsx](../../../apps/web/src/features/settings/user-settings-page.tsx)<br>[packages/validation/src/profile.ts](../../../packages/validation/src/profile.ts)

**Tests:** [apps/api/src/modules/profiles/profiles.controller.spec.ts](../../../apps/api/src/modules/profiles/profiles.controller.spec.ts)<br>[apps/api/src/modules/profiles/profiles.service.spec.ts](../../../apps/api/src/modules/profiles/profiles.service.spec.ts)<br>[packages/validation/src/profile.spec.ts](../../../packages/validation/src/profile.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Browser-/Staging-Test inkl. Theme-/Feed-Aktualisierung fehlt.


## Phase 14 – PERSONALIZATION & CLUB BRANDING


### 109 – Club Theme System — PARTIAL

**Bestand:** Clubdaten werden in CSS-Theme-Tokens mit Kontrastwahl umgesetzt.

**Dateien:** [apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/personalization/club-theme.ts](../../../apps/web/src/features/personalization/club-theme.ts)<br>[apps/web/src/features/personalization/personalized-club-theme.tsx](../../../apps/web/src/features/personalization/personalized-club-theme.tsx)<br>[apps/web/src/features/personalization/personalized-startpage.tsx](../../../apps/web/src/features/personalization/personalized-startpage.tsx)<br>[apps/web/src/features/personalization/startpage-mock-data.ts](../../../apps/web/src/features/personalization/startpage-mock-data.ts)

**Tests:** [apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[apps/web/src/features/personalization/club-theme.spec.mjs](../../../apps/web/src/features/personalization/club-theme.spec.mjs)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Nicht alle UI-Komponenten/Clubvarianten im Browser abgenommen.


### 110 – Default Kurvenfunk Theme — PARTIAL

**Bestand:** Standard-Kurvenfunk-Theme mit Defaulttokens für Neutral/Gäste.

**Dateien:** [apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/personalization/club-theme.ts](../../../apps/web/src/features/personalization/club-theme.ts)<br>[apps/web/src/features/personalization/personalized-club-theme.tsx](../../../apps/web/src/features/personalization/personalized-club-theme.tsx)<br>[apps/web/src/features/personalization/personalized-startpage.tsx](../../../apps/web/src/features/personalization/personalized-startpage.tsx)<br>[apps/web/src/features/personalization/startpage-mock-data.ts](../../../apps/web/src/features/personalization/startpage-mock-data.ts)

**Tests:** [apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[apps/web/src/features/personalization/club-theme.spec.mjs](../../../apps/web/src/features/personalization/club-theme.spec.mjs)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Render-/A11y-Abnahme in allen Gast-/UNSET-/Neutralpfaden fehlt.


### 111 – Personalized Club Theme — PARTIAL

**Bestand:** PersonalizedClubTheme setzt CSS-Variablen für gewählten Club.

**Dateien:** [apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/personalization/club-theme.ts](../../../apps/web/src/features/personalization/club-theme.ts)<br>[apps/web/src/features/personalization/personalized-club-theme.tsx](../../../apps/web/src/features/personalization/personalized-club-theme.tsx)<br>[apps/web/src/features/personalization/personalized-startpage.tsx](../../../apps/web/src/features/personalization/personalized-startpage.tsx)<br>[apps/web/src/features/personalization/startpage-mock-data.ts](../../../apps/web/src/features/personalization/startpage-mock-data.ts)

**Tests:** [apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[apps/web/src/features/personalization/club-theme.spec.mjs](../../../apps/web/src/features/personalization/club-theme.spec.mjs)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Echte Auth-/Clubwechsel-/Browserabnahme fehlt.


### 112 – News Priorisierung — PARTIAL

**Bestand:** Querybasiertes Club-/Wettbewerbs-/General-Ranking mit Quoten.

**Dateien:** [apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/personalization/club-theme.ts](../../../apps/web/src/features/personalization/club-theme.ts)<br>[apps/web/src/features/personalization/personalized-club-theme.tsx](../../../apps/web/src/features/personalization/personalized-club-theme.tsx)<br>[apps/web/src/features/personalization/personalized-startpage.tsx](../../../apps/web/src/features/personalization/personalized-startpage.tsx)<br>[apps/web/src/features/personalization/startpage-mock-data.ts](../../../apps/web/src/features/personalization/startpage-mock-data.ts)

**Tests:** [apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[apps/web/src/features/personalization/club-theme.spec.mjs](../../../apps/web/src/features/personalization/club-theme.spec.mjs)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Reale DB-/Browser-Abnahme und Last-/Qualitätsprüfung fehlen.


### 113 – Neutral News Ranking — PARTIAL

**Bestand:** Neutrales Ranking Top News/Recent/Competition vorhanden.

**Dateien:** [apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/personalization/club-theme.ts](../../../apps/web/src/features/personalization/club-theme.ts)<br>[apps/web/src/features/personalization/personalized-club-theme.tsx](../../../apps/web/src/features/personalization/personalized-club-theme.tsx)<br>[apps/web/src/features/personalization/personalized-startpage.tsx](../../../apps/web/src/features/personalization/personalized-startpage.tsx)<br>[apps/web/src/features/personalization/startpage-mock-data.ts](../../../apps/web/src/features/personalization/startpage-mock-data.ts)

**Tests:** [apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[apps/web/src/features/personalization/club-theme.spec.mjs](../../../apps/web/src/features/personalization/club-theme.spec.mjs)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** DB-Integration und Nutzerabnahme fehlen.


### 114 – Personalized Startpage — PARTIAL

**Bestand:** Personalisierte News via API; Layout für Fan/Neutral.

**Dateien:** [apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/personalization/club-theme.ts](../../../apps/web/src/features/personalization/club-theme.ts)<br>[apps/web/src/features/personalization/personalized-club-theme.tsx](../../../apps/web/src/features/personalization/personalized-club-theme.tsx)<br>[apps/web/src/features/personalization/personalized-startpage.tsx](../../../apps/web/src/features/personalization/personalized-startpage.tsx)<br>[apps/web/src/features/personalization/startpage-mock-data.ts](../../../apps/web/src/features/personalization/startpage-mock-data.ts)

**Tests:** [apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[apps/web/src/features/personalization/club-theme.spec.mjs](../../../apps/web/src/features/personalization/club-theme.spec.mjs)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Spiele/Ergebnisse/Tabellen/Diskussionen enthalten noch Mockdaten; kein vollständiger Produktflow.


## Phase 15 – DESIGN SYSTEM


### 115 – Design Tokens — PARTIAL

**Bestand:** CSS-/TS-Tokens für Farbe, Typografie, Abstände, Radien und Clubtheming.

**Dateien:** [apps/web/src/app/design-system/design-system-client.tsx](../../../apps/web/src/app/design-system/design-system-client.tsx)<br>[apps/web/src/app/design-system/page.tsx](../../../apps/web/src/app/design-system/page.tsx)<br>[packages/ui/src/components/button.tsx](../../../packages/ui/src/components/button.tsx)<br>[packages/ui/src/components/display.tsx](../../../packages/ui/src/components/display.tsx)<br>[packages/ui/src/components/form-controls.tsx](../../../packages/ui/src/components/form-controls.tsx)<br>[packages/ui/src/components/interactive.tsx](../../../packages/ui/src/components/interactive.tsx)<br>[packages/ui/src/components/overlays.tsx](../../../packages/ui/src/components/overlays.tsx)<br>[packages/ui/src/styles/components.css](../../../packages/ui/src/styles/components.css)<br>[packages/ui/src/styles/tokens.css](../../../packages/ui/src/styles/tokens.css)<br>[packages/ui/src/tokens.ts](../../../packages/ui/src/tokens.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Abnahme aller Breakpoints/Icons und Dokumentation/A11y fehlt.


### 116 – UI Components — PARTIAL

**Bestand:** Button/Form/Display/Interactive/Overlay-Komponenten und Designsystem-Demo.

**Dateien:** [apps/web/src/app/design-system/design-system-client.tsx](../../../apps/web/src/app/design-system/design-system-client.tsx)<br>[apps/web/src/app/design-system/page.tsx](../../../apps/web/src/app/design-system/page.tsx)<br>[packages/ui/src/components/button.tsx](../../../packages/ui/src/components/button.tsx)<br>[packages/ui/src/components/display.tsx](../../../packages/ui/src/components/display.tsx)<br>[packages/ui/src/components/form-controls.tsx](../../../packages/ui/src/components/form-controls.tsx)<br>[packages/ui/src/components/interactive.tsx](../../../packages/ui/src/components/interactive.tsx)<br>[packages/ui/src/components/overlays.tsx](../../../packages/ui/src/components/overlays.tsx)<br>[packages/ui/src/styles/components.css](../../../packages/ui/src/styles/components.css)<br>[packages/ui/src/styles/tokens.css](../../../packages/ui/src/styles/tokens.css)<br>[packages/ui/src/tokens.ts](../../../packages/ui/src/tokens.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Systematische Komponenten-, Keyboard- und Screenreadertests fehlen.


## Phase 16 – FRONTEND BASE


### 117 – App Shell — PARTIAL

**Bestand:** Header, Desktop/Mobile-Navigation, Footer, Usermenü und Theming.

**Dateien:** [apps/web/src/components/layout/app-shell.tsx](../../../apps/web/src/components/layout/app-shell.tsx)<br>[apps/web/src/components/layout/route-shell.tsx](../../../apps/web/src/components/layout/route-shell.tsx)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Browser-/Responsive-/Auth-/A11y-Abnahme fehlt.


### 118 – Startseite Mock — PARTIAL

**Bestand:** Fan-/Neutral-Mockdaten und Layout vorhanden.

**Dateien:** [apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/personalization/club-theme.ts](../../../apps/web/src/features/personalization/club-theme.ts)<br>[apps/web/src/features/personalization/personalized-club-theme.tsx](../../../apps/web/src/features/personalization/personalized-club-theme.tsx)<br>[apps/web/src/features/personalization/personalized-startpage.tsx](../../../apps/web/src/features/personalization/personalized-startpage.tsx)<br>[apps/web/src/features/personalization/startpage-mock-data.ts](../../../apps/web/src/features/personalization/startpage-mock-data.ts)

**Tests:** [apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[apps/web/src/features/personalization/club-theme.spec.mjs](../../../apps/web/src/features/personalization/club-theme.spec.mjs)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Beide Varianten nicht interaktiv im Browser getestet; Mock-Vollständigkeit nicht Produktnachweis.


### 119 – Newsübersicht — PARTIAL

**Bestand:** Newsübersicht mit API, Filter und Pagination.

**Dateien:** [apps/api/src/modules/articles/articles.controller.ts](../../../apps/api/src/modules/articles/articles.controller.ts)<br>[apps/web/src/features/articles/news-overview.tsx](../../../apps/web/src/features/articles/news-overview.tsx)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Filter/Pagination im Browser und mobil nicht abgenommen.


### 120 – Artikelseite — PARTIAL

**Bestand:** Artikeldarstellung, Meta, Medien, Clubs/Tags und Kommentarbereich.

**Dateien:** [apps/web/src/app/artikel/[slug]/page.tsx](../../../apps/web/src/app/artikel/[slug]/page.tsx)<br>[apps/web/src/features/articles/article-detail.tsx](../../../apps/web/src/features/articles/article-detail.tsx)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Echte Editor-zu-Public-/Kommentar-Browserkette fehlt.


### 121 – Vereinsseite — PARTIAL

**Bestand:** Vereinsstammdaten aus API, Bereiche News/Spiele/Tabelle/Diskussion.

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** ClubDetail nutzt getClubPageMockData für die Inhaltsbereiche; Forum nicht implementiert.


### 122 – Spielseite — PARTIAL

**Bestand:** Spielseite mit DB-Stammdaten, Score/Status und verknüpften News.

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Spieldiskussion/echter Datenimport fehlt; keine Browserabnahme.


### 123 – Tabelle — PARTIAL

**Bestand:** Tabelle mit API-Anbindung und Favoritenmarkierung; Mock-Fallback.

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Mobile-/Browserabnahme, echte Datenquelle und Tabellenberechnung fehlen.


### 124 – Spielplan — PARTIAL

**Bestand:** Spielplan mit API, Spieltagsauswahl und Favoritenmarkierung.

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Mock-Fallback kann Datenfehler verdecken; echtes Import-/Browserergebnis fehlt.


### 125 – Profilseite — PARTIAL

**Bestand:** Profil mit Nickname, Avatar-Metadaten, Bio, Club und Aktivitätszählern.

**Dateien:** [apps/api/src/modules/profiles/profiles.controller.ts](../../../apps/api/src/modules/profiles/profiles.controller.ts)<br>[apps/api/src/modules/profiles/profiles.module.ts](../../../apps/api/src/modules/profiles/profiles.module.ts)<br>[apps/api/src/modules/profiles/profiles.service.ts](../../../apps/api/src/modules/profiles/profiles.service.ts)<br>[apps/web/src/features/profile/club-combobox.tsx](../../../apps/web/src/features/profile/club-combobox.tsx)<br>[apps/web/src/features/profile/fan-preference-settings.tsx](../../../apps/web/src/features/profile/fan-preference-settings.tsx)<br>[apps/web/src/features/profile/profile-page.tsx](../../../apps/web/src/features/profile/profile-page.tsx)<br>[apps/web/src/features/settings/user-settings-page.tsx](../../../apps/web/src/features/settings/user-settings-page.tsx)<br>[packages/validation/src/profile.ts](../../../packages/validation/src/profile.ts)

**Tests:** [apps/api/src/modules/profiles/profiles.controller.spec.ts](../../../apps/api/src/modules/profiles/profiles.controller.spec.ts)<br>[apps/api/src/modules/profiles/profiles.service.spec.ts](../../../apps/api/src/modules/profiles/profiles.service.spec.ts)<br>[packages/validation/src/profile.spec.ts](../../../packages/validation/src/profile.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Kein vollständiges öffentliches Profil-/Avatar-/Browser-Abnahmeszenario.


### 126 – User Settings — PARTIAL

**Bestand:** Profil- und Clubbearbeitung implementiert; weitere Settings-Abschnitte.

**Dateien:** [apps/api/src/modules/profiles/profiles.controller.ts](../../../apps/api/src/modules/profiles/profiles.controller.ts)<br>[apps/api/src/modules/profiles/profiles.module.ts](../../../apps/api/src/modules/profiles/profiles.module.ts)<br>[apps/api/src/modules/profiles/profiles.service.ts](../../../apps/api/src/modules/profiles/profiles.service.ts)<br>[apps/web/src/features/profile/club-combobox.tsx](../../../apps/web/src/features/profile/club-combobox.tsx)<br>[apps/web/src/features/profile/fan-preference-settings.tsx](../../../apps/web/src/features/profile/fan-preference-settings.tsx)<br>[apps/web/src/features/profile/profile-page.tsx](../../../apps/web/src/features/profile/profile-page.tsx)<br>[apps/web/src/features/settings/user-settings-page.tsx](../../../apps/web/src/features/settings/user-settings-page.tsx)<br>[packages/validation/src/profile.ts](../../../packages/validation/src/profile.ts)

**Tests:** [apps/api/src/modules/profiles/profiles.controller.spec.ts](../../../apps/api/src/modules/profiles/profiles.controller.spec.ts)<br>[apps/api/src/modules/profiles/profiles.service.spec.ts](../../../apps/api/src/modules/profiles/profiles.service.spec.ts)<br>[packages/validation/src/profile.spec.ts](../../../packages/validation/src/profile.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Datenschutz/Notifications/Sessions sind Platzhalter bzw. nur Account-Console-Verweise.


### 127 – Admin Layout — PARTIAL

**Bestand:** Adminlayout und Navigationspunkte vorhanden.

**Dateien:** [apps/api/src/modules/admin/admin.module.ts](../../../apps/api/src/modules/admin/admin.module.ts)<br>[apps/web/src/app/admin/artikel/page.tsx](../../../apps/web/src/app/admin/artikel/page.tsx)<br>[apps/web/src/app/admin/benutzer/page.tsx](../../../apps/web/src/app/admin/benutzer/page.tsx)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[apps/web/src/app/admin/importe/page.tsx](../../../apps/web/src/app/admin/importe/page.tsx)<br>[apps/web/src/app/admin/kategorien/page.tsx](../../../apps/web/src/app/admin/kategorien/page.tsx)<br>[apps/web/src/app/admin/medien/page.tsx](../../../apps/web/src/app/admin/medien/page.tsx)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[apps/web/src/app/admin/page.tsx](../../../apps/web/src/app/admin/page.tsx)<br>[apps/web/src/app/admin/sportdaten/page.tsx](../../../apps/web/src/app/admin/sportdaten/page.tsx)<br>[apps/web/src/app/admin/system/page.tsx](../../../apps/web/src/app/admin/system/page.tsx)<br>[apps/web/src/app/admin/tags/page.tsx](../../../apps/web/src/app/admin/tags/page.tsx)<br>[apps/web/src/features/admin/admin-layout.tsx](../../../apps/web/src/features/admin/admin-layout.tsx)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Admin-UI selbst nicht zentral rollenbasiert geschützt; Fachseiten teilweise Platzhalter.


### 128 – Loading States — PARTIAL

**Bestand:** Skeletons und Loading-Komponenten für Kernseiten.

**Dateien:** [apps/web/src/features/loading/loading-states.tsx](../../../apps/web/src/features/loading/loading-states.tsx)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Kein systematischer UI-Abnahmekatalog aller asynchronen/Fehlerzustände.


### 129 – Empty States — PARTIAL

**Bestand:** EmptyState-Komponente und leere Listenhinweise in Fachseiten.

**Dateien:** [apps/web/src/app/design-system/design-system-client.tsx](../../../apps/web/src/app/design-system/design-system-client.tsx)<br>[apps/web/src/app/design-system/page.tsx](../../../apps/web/src/app/design-system/page.tsx)<br>[packages/ui/src/components/button.tsx](../../../packages/ui/src/components/button.tsx)<br>[packages/ui/src/components/display.tsx](../../../packages/ui/src/components/display.tsx)<br>[packages/ui/src/components/form-controls.tsx](../../../packages/ui/src/components/form-controls.tsx)<br>[packages/ui/src/components/interactive.tsx](../../../packages/ui/src/components/interactive.tsx)<br>[packages/ui/src/components/overlays.tsx](../../../packages/ui/src/components/overlays.tsx)<br>[packages/ui/src/styles/components.css](../../../packages/ui/src/styles/components.css)<br>[packages/ui/src/styles/tokens.css](../../../packages/ui/src/styles/tokens.css)<br>[packages/ui/src/tokens.ts](../../../packages/ui/src/tokens.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Nicht für jede Liste im Browser verifiziert.


### 130 – Error States — PARTIAL

**Bestand:** Fehlerseiten 403/404/429/500 und React-Errorboundary.

**Dateien:** [apps/web/src/app/403/page.tsx](../../../apps/web/src/app/403/page.tsx)<br>[apps/web/src/app/429/page.tsx](../../../apps/web/src/app/429/page.tsx)<br>[apps/web/src/app/500/page.tsx](../../../apps/web/src/app/500/page.tsx)<br>[apps/web/src/app/error.tsx](../../../apps/web/src/app/error.tsx)<br>[apps/web/src/app/not-found.tsx](../../../apps/web/src/app/not-found.tsx)<br>[apps/web/src/features/errors/error-state.tsx](../../../apps/web/src/features/errors/error-state.tsx)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Statuscodes, Weiterleitungen und Fehlerzustände nicht vollständig im Browser getestet.


## Phase 17 – EDITORIAL SYSTEM


### 131 – Article CRUD — PARTIAL

**Bestand:** Article CRUD inkl. Soft-Delete/Restore, Service und Admin-UI.

**Dateien:** [apps/api/src/modules/articles/article-editorial.guard.ts](../../../apps/api/src/modules/articles/article-editorial.guard.ts)<br>[apps/api/src/modules/articles/articles.controller.ts](../../../apps/api/src/modules/articles/articles.controller.ts)<br>[apps/api/src/modules/articles/articles.module.ts](../../../apps/api/src/modules/articles/articles.module.ts)<br>[apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/admin/articles/article-editor.tsx](../../../apps/web/src/features/admin/articles/article-editor.tsx)<br>[apps/web/src/features/admin/articles/article-list.tsx](../../../apps/web/src/features/admin/articles/article-list.tsx)<br>[packages/validation/src/article.ts](../../../packages/validation/src/article.ts)

**Tests:** [apps/api/src/modules/articles/article-editorial.guard.spec.ts](../../../apps/api/src/modules/articles/article-editorial.guard.spec.ts)<br>[apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[packages/validation/src/article.spec.ts](../../../packages/validation/src/article.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Echter DB-/Browser-/Staging-Test und vollständige Auditspur fehlen.


### 132 – Publication Workflow — PARTIAL

**Bestand:** DRAFT/REVIEW/SCHEDULED/PUBLISHED/ARCHIVED mit Berechtigungen und Transitionen.

**Dateien:** [apps/api/src/modules/articles/article-editorial.guard.ts](../../../apps/api/src/modules/articles/article-editorial.guard.ts)<br>[apps/api/src/modules/articles/articles.controller.ts](../../../apps/api/src/modules/articles/articles.controller.ts)<br>[apps/api/src/modules/articles/articles.module.ts](../../../apps/api/src/modules/articles/articles.module.ts)<br>[apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/admin/articles/article-editor.tsx](../../../apps/web/src/features/admin/articles/article-editor.tsx)<br>[apps/web/src/features/admin/articles/article-list.tsx](../../../apps/web/src/features/admin/articles/article-list.tsx)<br>[packages/validation/src/article.ts](../../../packages/validation/src/article.ts)

**Tests:** [apps/api/src/modules/articles/article-editorial.guard.spec.ts](../../../apps/api/src/modules/articles/article-editorial.guard.spec.ts)<br>[apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[packages/validation/src/article.spec.ts](../../../packages/validation/src/article.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Authenticated Workflow über echte DB/Worker/UI nicht vollständig getestet.


### 133 – Article Editor — PARTIAL

**Bestand:** Tiptap-Editor mit Text, Überschriften, Links, Listen, Zitaten und Bildern.

**Dateien:** [apps/api/src/modules/articles/article-editorial.guard.ts](../../../apps/api/src/modules/articles/article-editorial.guard.ts)<br>[apps/api/src/modules/articles/articles.controller.ts](../../../apps/api/src/modules/articles/articles.controller.ts)<br>[apps/api/src/modules/articles/articles.module.ts](../../../apps/api/src/modules/articles/articles.module.ts)<br>[apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/admin/articles/article-editor.tsx](../../../apps/web/src/features/admin/articles/article-editor.tsx)<br>[apps/web/src/features/admin/articles/article-list.tsx](../../../apps/web/src/features/admin/articles/article-list.tsx)<br>[packages/validation/src/article.ts](../../../packages/validation/src/article.ts)

**Tests:** [apps/api/src/modules/articles/article-editorial.guard.spec.ts](../../../apps/api/src/modules/articles/article-editorial.guard.spec.ts)<br>[apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[packages/validation/src/article.spec.ts](../../../packages/validation/src/article.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Kein Editor-Browser-/Accessibility-/Upload-Abnahmetest.


### 134 – Kategorien — PARTIAL

**Bestand:** categories: CRUD, Validierung, Admin-UI und Artikelzuordnung.

**Dateien:** [apps/api/src/modules/categories/categories.controller.ts](../../../apps/api/src/modules/categories/categories.controller.ts)<br>[apps/api/src/modules/categories/categories.module.ts](../../../apps/api/src/modules/categories/categories.module.ts)<br>[apps/api/src/modules/categories/categories.service.ts](../../../apps/api/src/modules/categories/categories.service.ts)<br>[apps/web/src/features/admin/categories/category-admin.tsx](../../../apps/web/src/features/admin/categories/category-admin.tsx)<br>[packages/validation/src/category.ts](../../../packages/validation/src/category.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Zugehörige Service- und Validation-Unit-Tests im Gesamtlauf bestanden.

**Fehlend:** Echte DB-/UI-/Staging-Abnahme fehlt.


### 135 – Tags — PARTIAL

**Bestand:** tags: CRUD, Validierung, Admin-UI und Artikelzuordnung.

**Dateien:** [apps/api/src/modules/tags/tags.controller.ts](../../../apps/api/src/modules/tags/tags.controller.ts)<br>[apps/api/src/modules/tags/tags.module.ts](../../../apps/api/src/modules/tags/tags.module.ts)<br>[apps/api/src/modules/tags/tags.service.ts](../../../apps/api/src/modules/tags/tags.service.ts)<br>[apps/web/src/features/admin/tags/tag-admin.tsx](../../../apps/web/src/features/admin/tags/tag-admin.tsx)<br>[packages/validation/src/tag.ts](../../../packages/validation/src/tag.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Zugehörige Service- und Validation-Unit-Tests im Gesamtlauf bestanden.

**Fehlend:** Echte DB-/UI-/Staging-Abnahme fehlt.


### 136 – Club Assignment — PARTIAL

**Bestand:** Mehrere Clubs über ArticleClub und Validierung zuweisbar.

**Dateien:** [apps/api/src/modules/articles/article-editorial.guard.ts](../../../apps/api/src/modules/articles/article-editorial.guard.ts)<br>[apps/api/src/modules/articles/articles.controller.ts](../../../apps/api/src/modules/articles/articles.controller.ts)<br>[apps/api/src/modules/articles/articles.module.ts](../../../apps/api/src/modules/articles/articles.module.ts)<br>[apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/admin/articles/article-editor.tsx](../../../apps/web/src/features/admin/articles/article-editor.tsx)<br>[apps/web/src/features/admin/articles/article-list.tsx](../../../apps/web/src/features/admin/articles/article-list.tsx)<br>[packages/validation/src/article.ts](../../../packages/validation/src/article.ts)

**Tests:** [apps/api/src/modules/articles/article-editorial.guard.spec.ts](../../../apps/api/src/modules/articles/article-editorial.guard.spec.ts)<br>[apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[packages/validation/src/article.spec.ts](../../../packages/validation/src/article.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Vollständige Editor-/Feed-DB-Integration nicht abgenommen.


### 137 – Competition Assignment — PARTIAL

**Bestand:** competitionId in Artikelmodell, Validation, Service und Editor.

**Dateien:** [apps/api/src/modules/articles/article-editorial.guard.ts](../../../apps/api/src/modules/articles/article-editorial.guard.ts)<br>[apps/api/src/modules/articles/articles.controller.ts](../../../apps/api/src/modules/articles/articles.controller.ts)<br>[apps/api/src/modules/articles/articles.module.ts](../../../apps/api/src/modules/articles/articles.module.ts)<br>[apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/admin/articles/article-editor.tsx](../../../apps/web/src/features/admin/articles/article-editor.tsx)<br>[apps/web/src/features/admin/articles/article-list.tsx](../../../apps/web/src/features/admin/articles/article-list.tsx)<br>[packages/validation/src/article.ts](../../../packages/validation/src/article.ts)

**Tests:** [apps/api/src/modules/articles/article-editorial.guard.spec.ts](../../../apps/api/src/modules/articles/article-editorial.guard.spec.ts)<br>[apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[packages/validation/src/article.spec.ts](../../../packages/validation/src/article.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Verknüpfung und Fehlerszenarien nicht Ende-zu-Ende getestet.


### 138 – Match Assignment — PARTIAL

**Bestand:** matchId in Artikelmodell, Validation, Service und Editor.

**Dateien:** [apps/api/src/modules/articles/article-editorial.guard.ts](../../../apps/api/src/modules/articles/article-editorial.guard.ts)<br>[apps/api/src/modules/articles/articles.controller.ts](../../../apps/api/src/modules/articles/articles.controller.ts)<br>[apps/api/src/modules/articles/articles.module.ts](../../../apps/api/src/modules/articles/articles.module.ts)<br>[apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/admin/articles/article-editor.tsx](../../../apps/web/src/features/admin/articles/article-editor.tsx)<br>[apps/web/src/features/admin/articles/article-list.tsx](../../../apps/web/src/features/admin/articles/article-list.tsx)<br>[packages/validation/src/article.ts](../../../packages/validation/src/article.ts)

**Tests:** [apps/api/src/modules/articles/article-editorial.guard.spec.ts](../../../apps/api/src/modules/articles/article-editorial.guard.spec.ts)<br>[apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[packages/validation/src/article.spec.ts](../../../packages/validation/src/article.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Keine Ende-zu-Ende-Abnahme mit echten Spielimportdaten.


### 139 – Media Upload — PARTIAL

**Bestand:** Upload über StorageService/S3 mit Größenlimit und MIME-Allowlist.

**Dateien:** [apps/api/src/infrastructure/storage/s3-storage.service.ts](../../../apps/api/src/infrastructure/storage/s3-storage.service.ts)<br>[apps/api/src/infrastructure/storage/storage.module.ts](../../../apps/api/src/infrastructure/storage/storage.module.ts)<br>[apps/api/src/infrastructure/storage/storage.types.ts](../../../apps/api/src/infrastructure/storage/storage.types.ts)<br>[apps/api/src/modules/media/media.controller.ts](../../../apps/api/src/modules/media/media.controller.ts)<br>[apps/api/src/modules/media/media.module.ts](../../../apps/api/src/modules/media/media.module.ts)<br>[apps/api/src/modules/media/media.service.ts](../../../apps/api/src/modules/media/media.service.ts)<br>[apps/web/src/features/admin/media/media-library.tsx](../../../apps/web/src/features/admin/media/media-library.tsx)<br>[packages/validation/src/media.ts](../../../packages/validation/src/media.ts)

**Tests:** [apps/api/src/modules/media/media.service.spec.ts](../../../apps/api/src/modules/media/media.service.spec.ts)<br>[packages/validation/src/media.spec.ts](../../../packages/validation/src/media.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** MinIO/R2-Roundtrip fehlt; MIME wird vom Client übernommen, Dateisignatur-/Dekodierprüfung fehlt.


### 140 – Media Library — PARTIAL

**Bestand:** Media Library mit Metadaten und Nutzungsanzeige.

**Dateien:** [apps/api/src/infrastructure/storage/s3-storage.service.ts](../../../apps/api/src/infrastructure/storage/s3-storage.service.ts)<br>[apps/api/src/infrastructure/storage/storage.module.ts](../../../apps/api/src/infrastructure/storage/storage.module.ts)<br>[apps/api/src/infrastructure/storage/storage.types.ts](../../../apps/api/src/infrastructure/storage/storage.types.ts)<br>[apps/api/src/modules/media/media.controller.ts](../../../apps/api/src/modules/media/media.controller.ts)<br>[apps/api/src/modules/media/media.module.ts](../../../apps/api/src/modules/media/media.module.ts)<br>[apps/api/src/modules/media/media.service.ts](../../../apps/api/src/modules/media/media.service.ts)<br>[apps/web/src/features/admin/media/media-library.tsx](../../../apps/web/src/features/admin/media/media-library.tsx)<br>[packages/validation/src/media.ts](../../../packages/validation/src/media.ts)

**Tests:** [apps/api/src/modules/media/media.service.spec.ts](../../../apps/api/src/modules/media/media.service.spec.ts)<br>[packages/validation/src/media.spec.ts](../../../packages/validation/src/media.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** OG-Bild-Nutzung fehlt in usage-Zählung; keine echte Storage-/UI-Abnahme.


### 141 – SEO Fields — PARTIAL

**Bestand:** Slug, seoTitle, seoDescription, canonicalUrl, ogImageId vorhanden.

**Dateien:** [apps/api/src/modules/articles/article-editorial.guard.ts](../../../apps/api/src/modules/articles/article-editorial.guard.ts)<br>[apps/api/src/modules/articles/articles.controller.ts](../../../apps/api/src/modules/articles/articles.controller.ts)<br>[apps/api/src/modules/articles/articles.module.ts](../../../apps/api/src/modules/articles/articles.module.ts)<br>[apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/admin/articles/article-editor.tsx](../../../apps/web/src/features/admin/articles/article-editor.tsx)<br>[apps/web/src/features/admin/articles/article-list.tsx](../../../apps/web/src/features/admin/articles/article-list.tsx)<br>[packages/validation/src/article.ts](../../../packages/validation/src/article.ts)

**Tests:** [apps/api/src/modules/articles/article-editorial.guard.spec.ts](../../../apps/api/src/modules/articles/article-editorial.guard.spec.ts)<br>[apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[packages/validation/src/article.spec.ts](../../../packages/validation/src/article.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Metadaten im Browser/Crawler nicht umfassend geprüft.


### 142 – Revisions — PARTIAL

**Bestand:** ArticleRevision persistiert Snapshot-Felder bei Änderungen.

**Dateien:** [apps/api/src/modules/articles/article-editorial.guard.ts](../../../apps/api/src/modules/articles/article-editorial.guard.ts)<br>[apps/api/src/modules/articles/articles.controller.ts](../../../apps/api/src/modules/articles/articles.controller.ts)<br>[apps/api/src/modules/articles/articles.module.ts](../../../apps/api/src/modules/articles/articles.module.ts)<br>[apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/admin/articles/article-editor.tsx](../../../apps/web/src/features/admin/articles/article-editor.tsx)<br>[apps/web/src/features/admin/articles/article-list.tsx](../../../apps/web/src/features/admin/articles/article-list.tsx)<br>[packages/validation/src/article.ts](../../../packages/validation/src/article.ts)

**Tests:** [apps/api/src/modules/articles/article-editorial.guard.spec.ts](../../../apps/api/src/modules/articles/article-editorial.guard.spec.ts)<br>[apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[packages/validation/src/article.spec.ts](../../../packages/validation/src/article.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Historie enthält keinen expliziten Akteur; Fachabnahme/Audit-Vollständigkeit offen.


### 143 – Scheduled Publishing — PARTIAL

**Bestand:** Worker scannt fällige Artikel mit konditionalem Update.

**Dateien:** [apps/worker/src/jobs/scheduled-publishing-job.service.ts](../../../apps/worker/src/jobs/scheduled-publishing-job.service.ts)<br>[apps/worker/src/processors/scheduled-publishing.processor.ts](../../../apps/worker/src/processors/scheduled-publishing.processor.ts)<br>[apps/worker/src/services/scheduled-publishing.service.ts](../../../apps/worker/src/services/scheduled-publishing.service.ts)

**Tests:** [apps/worker/src/services/scheduled-publishing.service.spec.ts](../../../apps/worker/src/services/scheduled-publishing.service.spec.ts)

**Nachweis:** Service-Unit-Tests bestanden; echter Scan lokal abgeschlossen (0 fällige Artikel).

**Fehlend:** Kein nachgewiesener zeitgesteuerter Übergang eines konkreten Artikels über reale DB/Queue; keine Audit-/Reindex-Events.


## Phase 18 – NEWS IMPORT


### 144 – Provider Interface — DONE

**Bestand:** Geteilter NewsProvider-Vertrag mit Fetchresultat/RawRecord/Trust-Flag.

**Dateien:** [packages/types/src/news-provider.ts](../../../packages/types/src/news-provider.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Vertrag von Fake/OTS konsumiert; Types-/Worker-Build und Adaptertests bestanden.

**Fehlend:** Keine Lücke im eng definierten Aufgaben-Scope festgestellt.


### 145 – Fake Provider — PARTIAL

**Bestand:** Fake-Newsprovider mit Normalizer.

**Dateien:** [apps/worker/src/providers/fake-news-provider.ts](../../../apps/worker/src/providers/fake-news-provider.ts)<br>[apps/api/src/modules/imports/imports.controller.ts](../../../apps/api/src/modules/imports/imports.controller.ts)<br>[apps/api/src/modules/imports/imports.module.ts](../../../apps/api/src/modules/imports/imports.module.ts)<br>[apps/api/src/modules/imports/imports.service.ts](../../../apps/api/src/modules/imports/imports.service.ts)

**Tests:** [apps/worker/src/providers/fake-news-provider.spec.ts](../../../apps/worker/src/providers/fake-news-provider.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Vollständiger echter Pipeline-/DB-/Queue-/Admin-Abnahmetest fehlt; Unit-Mocks sind kein Provider-Betriebsnachweis.


### 146 – Scheduler — PARTIAL

**Bestand:** Providerabhängiger periodischer BullMQ-Scheduler.

**Dateien:** [apps/worker/src/jobs/news-import-scheduler.service.ts](../../../apps/worker/src/jobs/news-import-scheduler.service.ts)<br>[apps/api/src/modules/imports/imports.controller.ts](../../../apps/api/src/modules/imports/imports.controller.ts)<br>[apps/api/src/modules/imports/imports.module.ts](../../../apps/api/src/modules/imports/imports.module.ts)<br>[apps/api/src/modules/imports/imports.service.ts](../../../apps/api/src/modules/imports/imports.service.ts)

**Tests:** [apps/worker/src/jobs/news-import-scheduler.service.spec.ts](../../../apps/worker/src/jobs/news-import-scheduler.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Vollständiger echter Pipeline-/DB-/Queue-/Admin-Abnahmetest fehlt; Unit-Mocks sind kein Provider-Betriebsnachweis.


### 147 – Import Queue — PARTIAL

**Bestand:** news-import-Queue und Processor.

**Dateien:** [apps/worker/src/processors/news-import.processor.ts](../../../apps/worker/src/processors/news-import.processor.ts)<br>[apps/api/src/modules/imports/imports.controller.ts](../../../apps/api/src/modules/imports/imports.controller.ts)<br>[apps/api/src/modules/imports/imports.module.ts](../../../apps/api/src/modules/imports/imports.module.ts)<br>[apps/api/src/modules/imports/imports.service.ts](../../../apps/api/src/modules/imports/imports.service.ts)

**Tests:** [apps/worker/src/processors/news-import.processor.spec.ts](../../../apps/worker/src/processors/news-import.processor.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Vollständiger echter Pipeline-/DB-/Queue-/Admin-Abnahmetest fehlt; Unit-Mocks sind kein Provider-Betriebsnachweis.


### 148 – Raw Payload — PARTIAL

**Bestand:** Originalpayload, Hash und Importjob/Record gespeichert.

**Dateien:** [apps/worker/src/services/raw-payload.service.ts](../../../apps/worker/src/services/raw-payload.service.ts)<br>[apps/api/src/modules/imports/imports.controller.ts](../../../apps/api/src/modules/imports/imports.controller.ts)<br>[apps/api/src/modules/imports/imports.module.ts](../../../apps/api/src/modules/imports/imports.module.ts)<br>[apps/api/src/modules/imports/imports.service.ts](../../../apps/api/src/modules/imports/imports.service.ts)

**Tests:** [apps/worker/src/services/raw-payload.service.spec.ts](../../../apps/worker/src/services/raw-payload.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Vollständiger echter Pipeline-/DB-/Queue-/Admin-Abnahmetest fehlt; Unit-Mocks sind kein Provider-Betriebsnachweis.


### 149 – Normalization — PARTIAL

**Bestand:** Provider-Normalisierung ins interne Format.

**Dateien:** [apps/worker/src/services/news-normalization.service.ts](../../../apps/worker/src/services/news-normalization.service.ts)<br>[apps/api/src/modules/imports/imports.controller.ts](../../../apps/api/src/modules/imports/imports.controller.ts)<br>[apps/api/src/modules/imports/imports.module.ts](../../../apps/api/src/modules/imports/imports.module.ts)<br>[apps/api/src/modules/imports/imports.service.ts](../../../apps/api/src/modules/imports/imports.service.ts)

**Tests:** [apps/worker/src/services/news-normalization.service.spec.ts](../../../apps/worker/src/services/news-normalization.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Vollständiger echter Pipeline-/DB-/Queue-/Admin-Abnahmetest fehlt; Unit-Mocks sind kein Provider-Betriebsnachweis.


### 150 – Validation — PARTIAL

**Bestand:** Pflichtfelder/Datenqualität mit Statusübergängen.

**Dateien:** [apps/worker/src/services/news-validation.service.ts](../../../apps/worker/src/services/news-validation.service.ts)<br>[apps/api/src/modules/imports/imports.controller.ts](../../../apps/api/src/modules/imports/imports.controller.ts)<br>[apps/api/src/modules/imports/imports.module.ts](../../../apps/api/src/modules/imports/imports.module.ts)<br>[apps/api/src/modules/imports/imports.service.ts](../../../apps/api/src/modules/imports/imports.service.ts)

**Tests:** [apps/worker/src/services/news-validation.service.spec.ts](../../../apps/worker/src/services/news-validation.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Vollständiger echter Pipeline-/DB-/Queue-/Admin-Abnahmetest fehlt; Unit-Mocks sind kein Provider-Betriebsnachweis.


### 151 – Duplicate Detection — PARTIAL

**Bestand:** Provider-ID/URL/Hash/Titel/Ähnlichkeit geprüft.

**Dateien:** [apps/worker/src/services/news-duplicate-detection.service.ts](../../../apps/worker/src/services/news-duplicate-detection.service.ts)<br>[apps/api/src/modules/imports/imports.controller.ts](../../../apps/api/src/modules/imports/imports.controller.ts)<br>[apps/api/src/modules/imports/imports.module.ts](../../../apps/api/src/modules/imports/imports.module.ts)<br>[apps/api/src/modules/imports/imports.service.ts](../../../apps/api/src/modules/imports/imports.service.ts)

**Tests:** [apps/worker/src/services/news-duplicate-detection.service.spec.ts](../../../apps/worker/src/services/news-duplicate-detection.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Nur letzte 200 Titelkandidaten; keine atomare Record-/Artikel-Idempotenz über konkurrierende Worker nachgewiesen; Integration fehlt.


### 152 – Club Matching — PARTIAL

**Bestand:** Clubalias-Matching mit persistierten EntityMatches.

**Dateien:** [apps/worker/src/services/news-club-matching.service.ts](../../../apps/worker/src/services/news-club-matching.service.ts)<br>[apps/api/src/modules/imports/imports.controller.ts](../../../apps/api/src/modules/imports/imports.controller.ts)<br>[apps/api/src/modules/imports/imports.module.ts](../../../apps/api/src/modules/imports/imports.module.ts)<br>[apps/api/src/modules/imports/imports.service.ts](../../../apps/api/src/modules/imports/imports.service.ts)

**Tests:** [apps/worker/src/services/news-club-matching.service.spec.ts](../../../apps/worker/src/services/news-club-matching.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Vollständiger echter Pipeline-/DB-/Queue-/Admin-Abnahmetest fehlt; Unit-Mocks sind kein Provider-Betriebsnachweis.


### 153 – Competition Matching — PARTIAL

**Bestand:** Wettbewerbs-Matching vorhanden.

**Dateien:** [apps/worker/src/services/news-competition-matching.service.ts](../../../apps/worker/src/services/news-competition-matching.service.ts)<br>[apps/api/src/modules/imports/imports.controller.ts](../../../apps/api/src/modules/imports/imports.controller.ts)<br>[apps/api/src/modules/imports/imports.module.ts](../../../apps/api/src/modules/imports/imports.module.ts)<br>[apps/api/src/modules/imports/imports.service.ts](../../../apps/api/src/modules/imports/imports.service.ts)

**Tests:** [apps/worker/src/services/news-competition-matching.service.spec.ts](../../../apps/worker/src/services/news-competition-matching.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Vollständiger echter Pipeline-/DB-/Queue-/Admin-Abnahmetest fehlt; Unit-Mocks sind kein Provider-Betriebsnachweis.


### 154 – Match Matching — PARTIAL

**Bestand:** Spielmatching anhand Vereinen/Wettbewerb/Datum.

**Dateien:** [apps/worker/src/services/news-match-matching.service.ts](../../../apps/worker/src/services/news-match-matching.service.ts)<br>[apps/api/src/modules/imports/imports.controller.ts](../../../apps/api/src/modules/imports/imports.controller.ts)<br>[apps/api/src/modules/imports/imports.module.ts](../../../apps/api/src/modules/imports/imports.module.ts)<br>[apps/api/src/modules/imports/imports.service.ts](../../../apps/api/src/modules/imports/imports.service.ts)

**Tests:** [apps/worker/src/services/news-match-matching.service.spec.ts](../../../apps/worker/src/services/news-match-matching.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Vollständiger echter Pipeline-/DB-/Queue-/Admin-Abnahmetest fehlt; Unit-Mocks sind kein Provider-Betriebsnachweis.


### 155 – Confidence Score — PARTIAL

**Bestand:** Confidence EXACT/HIGH/MEDIUM/LOW/UNKNOWN.

**Dateien:** [apps/worker/src/services/news-confidence-score.service.ts](../../../apps/worker/src/services/news-confidence-score.service.ts)<br>[apps/api/src/modules/imports/imports.controller.ts](../../../apps/api/src/modules/imports/imports.controller.ts)<br>[apps/api/src/modules/imports/imports.module.ts](../../../apps/api/src/modules/imports/imports.module.ts)<br>[apps/api/src/modules/imports/imports.service.ts](../../../apps/api/src/modules/imports/imports.service.ts)

**Tests:** [apps/worker/src/services/news-confidence-score.service.spec.ts](../../../apps/worker/src/services/news-confidence-score.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Vollständiger echter Pipeline-/DB-/Queue-/Admin-Abnahmetest fehlt; Unit-Mocks sind kein Provider-Betriebsnachweis.


### 156 – Retry Logic — PARTIAL

**Bestand:** BullMQ-Retry/Backoff und persistierter Fehlerstatus.

**Dateien:** [packages/types/src/queue.ts](../../../packages/types/src/queue.ts)<br>[apps/api/src/modules/imports/imports.controller.ts](../../../apps/api/src/modules/imports/imports.controller.ts)<br>[apps/api/src/modules/imports/imports.module.ts](../../../apps/api/src/modules/imports/imports.module.ts)<br>[apps/api/src/modules/imports/imports.service.ts](../../../apps/api/src/modules/imports/imports.service.ts)

**Tests:** [apps/worker/src/processors/news-import.processor.spec.ts](../../../apps/worker/src/processors/news-import.processor.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Vollständiger echter Pipeline-/DB-/Queue-/Admin-Abnahmetest fehlt; Unit-Mocks sind kein Provider-Betriebsnachweis.


### 157 – Dead Letter Queue — PARTIAL

**Bestand:** Dead-Letter-Queue nach ausgeschöpften Versuchen.

**Dateien:** [apps/worker/src/services/news-import-dead-letter.service.ts](../../../apps/worker/src/services/news-import-dead-letter.service.ts)<br>[apps/api/src/modules/imports/imports.controller.ts](../../../apps/api/src/modules/imports/imports.controller.ts)<br>[apps/api/src/modules/imports/imports.module.ts](../../../apps/api/src/modules/imports/imports.module.ts)<br>[apps/api/src/modules/imports/imports.service.ts](../../../apps/api/src/modules/imports/imports.service.ts)

**Tests:** [apps/worker/src/services/news-import-dead-letter.service.spec.ts](../../../apps/worker/src/services/news-import-dead-letter.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Reale Retry-Erschöpfung, genau-einmalige DLQ-Aufnahme und Replay/Alarmierung nicht nachgewiesen.


### 158 – Import Admin — PARTIAL

**Bestand:** Import-Admin mit Provider/Jobs/Records/Fehlern.

**Dateien:** [apps/api/src/modules/imports/imports.service.ts](../../../apps/api/src/modules/imports/imports.service.ts)<br>[apps/api/src/modules/imports/imports.controller.ts](../../../apps/api/src/modules/imports/imports.controller.ts)<br>[apps/api/src/modules/imports/imports.module.ts](../../../apps/api/src/modules/imports/imports.module.ts)<br>[apps/web/src/features/admin/imports/import-admin.tsx](../../../apps/web/src/features/admin/imports/import-admin.tsx)

**Tests:** [apps/api/src/modules/imports/imports.service.spec.ts](../../../apps/api/src/modules/imports/imports.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Vollständiger echter Pipeline-/DB-/Queue-/Admin-Abnahmetest fehlt; Unit-Mocks sind kein Provider-Betriebsnachweis.


### 159 – Review Workflow — PARTIAL

**Bestand:** Unsichere Datensätze zur manuellen Review.

**Dateien:** [apps/worker/src/services/news-review-workflow.service.ts](../../../apps/worker/src/services/news-review-workflow.service.ts)<br>[apps/api/src/modules/imports/imports.controller.ts](../../../apps/api/src/modules/imports/imports.controller.ts)<br>[apps/api/src/modules/imports/imports.module.ts](../../../apps/api/src/modules/imports/imports.module.ts)<br>[apps/api/src/modules/imports/imports.service.ts](../../../apps/api/src/modules/imports/imports.service.ts)

**Tests:** [apps/worker/src/services/news-review-workflow.service.spec.ts](../../../apps/worker/src/services/news-review-workflow.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Review-Approval setzt nur MATCHED/APPROVED; kein anschließender Artikel-Create-/Publish-/Queuepfad gefunden. OTS ist untrusted und erzeugt ohne redaktionellen Übernahmeweg keine Artikel. Echte Integration fehlt.


### 160 – Auto Publish — PARTIAL

**Bestand:** Trusted-Provider und Review-Gate vor Auto-Publish.

**Dateien:** [apps/worker/src/services/news-auto-publishing.service.ts](../../../apps/worker/src/services/news-auto-publishing.service.ts)<br>[apps/api/src/modules/imports/imports.controller.ts](../../../apps/api/src/modules/imports/imports.controller.ts)<br>[apps/api/src/modules/imports/imports.module.ts](../../../apps/api/src/modules/imports/imports.module.ts)<br>[apps/api/src/modules/imports/imports.service.ts](../../../apps/api/src/modules/imports/imports.service.ts)

**Tests:** [apps/worker/src/services/news-auto-publishing.service.spec.ts](../../../apps/worker/src/services/news-auto-publishing.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Transaktion liest Status vor Create, aber kein expliziter Lock/Claim/Unique-Importrecord→Article; Race/Slug-Kollision unter Nebenläufigkeit offen.


### 161 – erster echter Newsprovider — PARTIAL

**Bestand:** OTS-Adapter, Normalizer und Unit-Tests vorhanden.

**Dateien:** [apps/worker/src/providers/ots-news-provider.ts](../../../apps/worker/src/providers/ots-news-provider.ts)<br>[apps/api/src/modules/imports/imports.controller.ts](../../../apps/api/src/modules/imports/imports.controller.ts)<br>[apps/api/src/modules/imports/imports.module.ts](../../../apps/api/src/modules/imports/imports.module.ts)<br>[apps/api/src/modules/imports/imports.service.ts](../../../apps/api/src/modules/imports/imports.service.ts)

**Tests:** [apps/worker/src/providers/ots-news-provider.spec.ts](../../../apps/worker/src/providers/ots-news-provider.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Realer OTS-Zugang, Lizenz-/Publikationsrechte, Fehlerfälle und Live-Abnahme nicht geprüft; kein externer Provider aufgerufen.


## Phase 19 – COMMENTS & REACTIONS


### 162 – Kommentar erstellen — PARTIAL

**Bestand:** Kommentar-Erstellung mit ACTIVE-Prüfung, Schema, Spamreservation und UI.

**Dateien:** [apps/api/src/modules/comments/comment-pagination.ts](../../../apps/api/src/modules/comments/comment-pagination.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.ts)<br>[apps/api/src/modules/comments/comments.controller.ts](../../../apps/api/src/modules/comments/comments.controller.ts)<br>[apps/api/src/modules/comments/comments.module.ts](../../../apps/api/src/modules/comments/comments.module.ts)<br>[apps/api/src/modules/comments/comments.service.ts](../../../apps/api/src/modules/comments/comments.service.ts)<br>[apps/web/src/features/articles/comment-composer.tsx](../../../apps/web/src/features/articles/comment-composer.tsx)<br>[packages/validation/src/comment.ts](../../../packages/validation/src/comment.ts)

**Tests:** [apps/api/src/modules/comments/comment-pagination.service.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.service.spec.ts)<br>[apps/api/src/modules/comments/comment-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-popular-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-popular-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.spec.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.spec.ts)<br>[apps/api/src/modules/comments/comments-spam-integration.spec.ts](../../../apps/api/src/modules/comments/comments-spam-integration.spec.ts)<br>[apps/api/src/modules/comments/comments.controller.spec.ts](../../../apps/api/src/modules/comments/comments.controller.spec.ts)<br>[apps/api/src/modules/comments/comments.service.spec.ts](../../../apps/api/src/modules/comments/comments.service.spec.ts)<br>[apps/web/src/features/articles/comment-pagination-client.spec.mjs](../../../apps/web/src/features/articles/comment-pagination-client.spec.mjs)<br>[apps/web/src/features/articles/comment-sort.spec.mjs](../../../apps/web/src/features/articles/comment-sort.spec.mjs)<br>[apps/web/src/features/articles/comment-spam-error.spec.mjs](../../../apps/web/src/features/articles/comment-spam-error.spec.mjs)<br>[packages/validation/src/comment.spec.ts](../../../packages/validation/src/comment.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Serverseitiges Onboardinggate fehlt; echter Auth-/DB-/Browserflow nicht geprüft.


### 163 – Antworten — PARTIAL

**Bestand:** Antworten mit Parentbezug/Status-/Artikelprüfung und UI.

**Dateien:** [apps/api/src/modules/comments/comment-pagination.ts](../../../apps/api/src/modules/comments/comment-pagination.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.ts)<br>[apps/api/src/modules/comments/comments.controller.ts](../../../apps/api/src/modules/comments/comments.controller.ts)<br>[apps/api/src/modules/comments/comments.module.ts](../../../apps/api/src/modules/comments/comments.module.ts)<br>[apps/api/src/modules/comments/comments.service.ts](../../../apps/api/src/modules/comments/comments.service.ts)<br>[apps/web/src/features/articles/comment-composer.tsx](../../../apps/web/src/features/articles/comment-composer.tsx)<br>[packages/validation/src/comment.ts](../../../packages/validation/src/comment.ts)

**Tests:** [apps/api/src/modules/comments/comment-pagination.service.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.service.spec.ts)<br>[apps/api/src/modules/comments/comment-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-popular-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-popular-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.spec.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.spec.ts)<br>[apps/api/src/modules/comments/comments-spam-integration.spec.ts](../../../apps/api/src/modules/comments/comments-spam-integration.spec.ts)<br>[apps/api/src/modules/comments/comments.controller.spec.ts](../../../apps/api/src/modules/comments/comments.controller.spec.ts)<br>[apps/api/src/modules/comments/comments.service.spec.ts](../../../apps/api/src/modules/comments/comments.service.spec.ts)<br>[apps/web/src/features/articles/comment-pagination-client.spec.mjs](../../../apps/web/src/features/articles/comment-pagination-client.spec.mjs)<br>[apps/web/src/features/articles/comment-sort.spec.mjs](../../../apps/web/src/features/articles/comment-sort.spec.mjs)<br>[apps/web/src/features/articles/comment-spam-error.spec.mjs](../../../apps/web/src/features/articles/comment-spam-error.spec.mjs)<br>[packages/validation/src/comment.spec.ts](../../../packages/validation/src/comment.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Vollständige Auth-/DB-/Browserabnahme fehlt.


### 164 – Comment Depth — PARTIAL

**Bestand:** Parentrelation und depth; UI-Anzeige auf fünf Ebenen begrenzt.

**Dateien:** [apps/api/src/modules/comments/comment-pagination.ts](../../../apps/api/src/modules/comments/comment-pagination.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.ts)<br>[apps/api/src/modules/comments/comments.controller.ts](../../../apps/api/src/modules/comments/comments.controller.ts)<br>[apps/api/src/modules/comments/comments.module.ts](../../../apps/api/src/modules/comments/comments.module.ts)<br>[apps/api/src/modules/comments/comments.service.ts](../../../apps/api/src/modules/comments/comments.service.ts)<br>[apps/web/src/features/articles/comment-composer.tsx](../../../apps/web/src/features/articles/comment-composer.tsx)<br>[packages/validation/src/comment.ts](../../../packages/validation/src/comment.ts)

**Tests:** [apps/api/src/modules/comments/comment-pagination.service.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.service.spec.ts)<br>[apps/api/src/modules/comments/comment-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-popular-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-popular-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.spec.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.spec.ts)<br>[apps/api/src/modules/comments/comments-spam-integration.spec.ts](../../../apps/api/src/modules/comments/comments-spam-integration.spec.ts)<br>[apps/api/src/modules/comments/comments.controller.spec.ts](../../../apps/api/src/modules/comments/comments.controller.spec.ts)<br>[apps/api/src/modules/comments/comments.service.spec.ts](../../../apps/api/src/modules/comments/comments.service.spec.ts)<br>[apps/web/src/features/articles/comment-pagination-client.spec.mjs](../../../apps/web/src/features/articles/comment-pagination-client.spec.mjs)<br>[apps/web/src/features/articles/comment-sort.spec.mjs](../../../apps/web/src/features/articles/comment-sort.spec.mjs)<br>[apps/web/src/features/articles/comment-spam-error.spec.mjs](../../../apps/web/src/features/articles/comment-spam-error.spec.mjs)<br>[packages/validation/src/comment.spec.ts](../../../packages/validation/src/comment.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Tiefer Antwortbaum und Rendering/Performance nicht real integriert getestet.


### 165 – Kommentar bearbeiten — PARTIAL

**Bestand:** Eigener Kommentar kann editiert werden; editedAt und Revision gespeichert.

**Dateien:** [apps/api/src/modules/comments/comment-pagination.ts](../../../apps/api/src/modules/comments/comment-pagination.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.ts)<br>[apps/api/src/modules/comments/comments.controller.ts](../../../apps/api/src/modules/comments/comments.controller.ts)<br>[apps/api/src/modules/comments/comments.module.ts](../../../apps/api/src/modules/comments/comments.module.ts)<br>[apps/api/src/modules/comments/comments.service.ts](../../../apps/api/src/modules/comments/comments.service.ts)<br>[apps/web/src/features/articles/comment-composer.tsx](../../../apps/web/src/features/articles/comment-composer.tsx)<br>[packages/validation/src/comment.ts](../../../packages/validation/src/comment.ts)

**Tests:** [apps/api/src/modules/comments/comment-pagination.service.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.service.spec.ts)<br>[apps/api/src/modules/comments/comment-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-popular-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-popular-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.spec.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.spec.ts)<br>[apps/api/src/modules/comments/comments-spam-integration.spec.ts](../../../apps/api/src/modules/comments/comments-spam-integration.spec.ts)<br>[apps/api/src/modules/comments/comments.controller.spec.ts](../../../apps/api/src/modules/comments/comments.controller.spec.ts)<br>[apps/api/src/modules/comments/comments.service.spec.ts](../../../apps/api/src/modules/comments/comments.service.spec.ts)<br>[apps/web/src/features/articles/comment-pagination-client.spec.mjs](../../../apps/web/src/features/articles/comment-pagination-client.spec.mjs)<br>[apps/web/src/features/articles/comment-sort.spec.mjs](../../../apps/web/src/features/articles/comment-sort.spec.mjs)<br>[apps/web/src/features/articles/comment-spam-error.spec.mjs](../../../apps/web/src/features/articles/comment-spam-error.spec.mjs)<br>[packages/validation/src/comment.spec.ts](../../../packages/validation/src/comment.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Echter Browser-/Ownership-/Konkurrenztest fehlt.


### 166 – Kommentar löschen — PARTIAL

**Bestand:** User-Soft-Delete und Tombstones implementiert.

**Dateien:** [apps/api/src/modules/comments/comment-pagination.ts](../../../apps/api/src/modules/comments/comment-pagination.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.ts)<br>[apps/api/src/modules/comments/comments.controller.ts](../../../apps/api/src/modules/comments/comments.controller.ts)<br>[apps/api/src/modules/comments/comments.module.ts](../../../apps/api/src/modules/comments/comments.module.ts)<br>[apps/api/src/modules/comments/comments.service.ts](../../../apps/api/src/modules/comments/comments.service.ts)<br>[apps/web/src/features/articles/comment-composer.tsx](../../../apps/web/src/features/articles/comment-composer.tsx)<br>[packages/validation/src/comment.ts](../../../packages/validation/src/comment.ts)

**Tests:** [apps/api/src/modules/comments/comment-pagination.service.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.service.spec.ts)<br>[apps/api/src/modules/comments/comment-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-popular-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-popular-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.spec.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.spec.ts)<br>[apps/api/src/modules/comments/comments-spam-integration.spec.ts](../../../apps/api/src/modules/comments/comments-spam-integration.spec.ts)<br>[apps/api/src/modules/comments/comments.controller.spec.ts](../../../apps/api/src/modules/comments/comments.controller.spec.ts)<br>[apps/api/src/modules/comments/comments.service.spec.ts](../../../apps/api/src/modules/comments/comments.service.spec.ts)<br>[apps/web/src/features/articles/comment-pagination-client.spec.mjs](../../../apps/web/src/features/articles/comment-pagination-client.spec.mjs)<br>[apps/web/src/features/articles/comment-sort.spec.mjs](../../../apps/web/src/features/articles/comment-sort.spec.mjs)<br>[apps/web/src/features/articles/comment-spam-error.spec.mjs](../../../apps/web/src/features/articles/comment-spam-error.spec.mjs)<br>[packages/validation/src/comment.spec.ts](../../../packages/validation/src/comment.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Moderatoren-Löschung mit separater Auditspur nicht implementiert.


### 167 – Voting / Reactions — PARTIAL

**Bestand:** ACTIVE/LIMITED votes erlaubt, BANNED blockiert, Unique-Constraints und UI.

**Dateien:** [apps/api/src/modules/reactions/reactions.controller.ts](../../../apps/api/src/modules/reactions/reactions.controller.ts)<br>[apps/api/src/modules/reactions/reactions.module.ts](../../../apps/api/src/modules/reactions/reactions.module.ts)<br>[apps/api/src/modules/reactions/reactions.service.ts](../../../apps/api/src/modules/reactions/reactions.service.ts)<br>[apps/web/src/features/articles/comment-voting.tsx](../../../apps/web/src/features/articles/comment-voting.tsx)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)

**Tests:** [apps/api/src/modules/reactions/reactions.controller.spec.ts](../../../apps/api/src/modules/reactions/reactions.controller.spec.ts)<br>[apps/api/src/modules/reactions/reactions.service.spec.ts](../../../apps/api/src/modules/reactions/reactions.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** API/UI implementieren UPVOTE/DOWNVOTE statt geplantem LIKE; Rate-Limit und echte Browserabnahme fehlen.


### 168 – Kommentar Sortierung — PARTIAL

**Bestand:** newest/oldest/popular und UI-Sortierung.

**Dateien:** [apps/api/src/modules/comments/comment-pagination.ts](../../../apps/api/src/modules/comments/comment-pagination.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.ts)<br>[apps/api/src/modules/comments/comments.controller.ts](../../../apps/api/src/modules/comments/comments.controller.ts)<br>[apps/api/src/modules/comments/comments.module.ts](../../../apps/api/src/modules/comments/comments.module.ts)<br>[apps/api/src/modules/comments/comments.service.ts](../../../apps/api/src/modules/comments/comments.service.ts)<br>[apps/web/src/features/articles/comment-composer.tsx](../../../apps/web/src/features/articles/comment-composer.tsx)<br>[packages/validation/src/comment.ts](../../../packages/validation/src/comment.ts)

**Tests:** [apps/api/src/modules/comments/comment-pagination.service.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.service.spec.ts)<br>[apps/api/src/modules/comments/comment-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-popular-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-popular-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.spec.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.spec.ts)<br>[apps/api/src/modules/comments/comments-spam-integration.spec.ts](../../../apps/api/src/modules/comments/comments-spam-integration.spec.ts)<br>[apps/api/src/modules/comments/comments.controller.spec.ts](../../../apps/api/src/modules/comments/comments.controller.spec.ts)<br>[apps/api/src/modules/comments/comments.service.spec.ts](../../../apps/api/src/modules/comments/comments.service.spec.ts)<br>[apps/web/src/features/articles/comment-pagination-client.spec.mjs](../../../apps/web/src/features/articles/comment-pagination-client.spec.mjs)<br>[apps/web/src/features/articles/comment-sort.spec.mjs](../../../apps/web/src/features/articles/comment-sort.spec.mjs)<br>[apps/web/src/features/articles/comment-spam-error.spec.mjs](../../../apps/web/src/features/articles/comment-spam-error.spec.mjs)<br>[packages/validation/src/comment.spec.ts](../../../packages/validation/src/comment.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Reale DB-Page-Konsistenz bei Votes/Deletes nicht vollständig geprüft.


### 169 – Pagination — PARTIAL

**Bestand:** Cursor-Pagination mit Root/Reply-/Popular-Logik und Client-Merge.

**Dateien:** [apps/api/src/modules/comments/comment-pagination.ts](../../../apps/api/src/modules/comments/comment-pagination.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.ts)<br>[apps/api/src/modules/comments/comments.controller.ts](../../../apps/api/src/modules/comments/comments.controller.ts)<br>[apps/api/src/modules/comments/comments.module.ts](../../../apps/api/src/modules/comments/comments.module.ts)<br>[apps/api/src/modules/comments/comments.service.ts](../../../apps/api/src/modules/comments/comments.service.ts)<br>[apps/web/src/features/articles/comment-composer.tsx](../../../apps/web/src/features/articles/comment-composer.tsx)<br>[packages/validation/src/comment.ts](../../../packages/validation/src/comment.ts)

**Tests:** [apps/api/src/modules/comments/comment-pagination.service.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.service.spec.ts)<br>[apps/api/src/modules/comments/comment-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-popular-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-popular-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.spec.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.spec.ts)<br>[apps/api/src/modules/comments/comments-spam-integration.spec.ts](../../../apps/api/src/modules/comments/comments-spam-integration.spec.ts)<br>[apps/api/src/modules/comments/comments.controller.spec.ts](../../../apps/api/src/modules/comments/comments.controller.spec.ts)<br>[apps/api/src/modules/comments/comments.service.spec.ts](../../../apps/api/src/modules/comments/comments.service.spec.ts)<br>[apps/web/src/features/articles/comment-pagination-client.spec.mjs](../../../apps/web/src/features/articles/comment-pagination-client.spec.mjs)<br>[apps/web/src/features/articles/comment-sort.spec.mjs](../../../apps/web/src/features/articles/comment-sort.spec.mjs)<br>[apps/web/src/features/articles/comment-spam-error.spec.mjs](../../../apps/web/src/features/articles/comment-spam-error.spec.mjs)<br>[packages/validation/src/comment.spec.ts](../../../packages/validation/src/comment.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** DB-Integration unter Nebenläufigkeit und vollständige Browserabnahme fehlen.


### 170 – Reports — PARTIAL

**Bestand:** Kommentar-Report mit Gründen, Detailtext, Dedupe/Unique-Index und UI.

**Dateien:** [apps/api/src/modules/reports/reports.controller.ts](../../../apps/api/src/modules/reports/reports.controller.ts)<br>[apps/api/src/modules/reports/reports.module.ts](../../../apps/api/src/modules/reports/reports.module.ts)<br>[apps/api/src/modules/reports/reports.service.ts](../../../apps/api/src/modules/reports/reports.service.ts)<br>[apps/web/src/features/articles/comment-report-client.ts](../../../apps/web/src/features/articles/comment-report-client.ts)<br>[apps/web/src/features/articles/comment-report.tsx](../../../apps/web/src/features/articles/comment-report.tsx)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)

**Tests:** [apps/api/src/modules/reports/reports.controller.spec.ts](../../../apps/api/src/modules/reports/reports.controller.spec.ts)<br>[apps/api/src/modules/reports/reports.service.spec.ts](../../../apps/api/src/modules/reports/reports.service.spec.ts)<br>[apps/web/src/features/articles/comment-report-client.spec.mjs](../../../apps/web/src/features/articles/comment-report-client.spec.mjs)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Moderationsbearbeitung, Forum-/Userreports und Rate-Limits fehlen.


### 171 – Spam Protection — PARTIAL

**Bestand:** Redis-Lua: Rate/Cooldown/Duplikate/Linklimit und Fehlerbehandlung.

**Dateien:** [apps/api/src/modules/comments/comment-pagination.ts](../../../apps/api/src/modules/comments/comment-pagination.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.ts)<br>[apps/api/src/modules/comments/comments.controller.ts](../../../apps/api/src/modules/comments/comments.controller.ts)<br>[apps/api/src/modules/comments/comments.module.ts](../../../apps/api/src/modules/comments/comments.module.ts)<br>[apps/api/src/modules/comments/comments.service.ts](../../../apps/api/src/modules/comments/comments.service.ts)<br>[apps/web/src/features/articles/comment-composer.tsx](../../../apps/web/src/features/articles/comment-composer.tsx)<br>[packages/validation/src/comment.ts](../../../packages/validation/src/comment.ts)

**Tests:** [apps/api/src/modules/comments/comment-pagination.service.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.service.spec.ts)<br>[apps/api/src/modules/comments/comment-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-popular-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-popular-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.spec.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.spec.ts)<br>[apps/api/src/modules/comments/comments-spam-integration.spec.ts](../../../apps/api/src/modules/comments/comments-spam-integration.spec.ts)<br>[apps/api/src/modules/comments/comments.controller.spec.ts](../../../apps/api/src/modules/comments/comments.controller.spec.ts)<br>[apps/api/src/modules/comments/comments.service.spec.ts](../../../apps/api/src/modules/comments/comments.service.spec.ts)<br>[apps/web/src/features/articles/comment-pagination-client.spec.mjs](../../../apps/web/src/features/articles/comment-pagination-client.spec.mjs)<br>[apps/web/src/features/articles/comment-sort.spec.mjs](../../../apps/web/src/features/articles/comment-sort.spec.mjs)<br>[apps/web/src/features/articles/comment-spam-error.spec.mjs](../../../apps/web/src/features/articles/comment-spam-error.spec.mjs)<br>[packages/validation/src/comment.spec.ts](../../../packages/validation/src/comment.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Kein ausgeführter echter Redis-Lua-Integrationstest; nur Mock-/Servicechecks.


## Phase 20 – MODERATION & CARDS


### 172 – Permission System — PARTIAL

**Bestand:** Zentrale Permission-Konstanten/Decorator/Service/Guard mit Rollen und Status.

**Dateien:** [apps/api/src/modules/auth/account-status.guard.ts](../../../apps/api/src/modules/auth/account-status.guard.ts)<br>[apps/api/src/modules/permissions/permissions.constants.ts](../../../apps/api/src/modules/permissions/permissions.constants.ts)<br>[apps/api/src/modules/permissions/permissions.guard.ts](../../../apps/api/src/modules/permissions/permissions.guard.ts)<br>[apps/api/src/modules/permissions/permissions.module.ts](../../../apps/api/src/modules/permissions/permissions.module.ts)<br>[apps/api/src/modules/permissions/permissions.service.ts](../../../apps/api/src/modules/permissions/permissions.service.ts)<br>[apps/api/src/modules/permissions/require-permissions.decorator.ts](../../../apps/api/src/modules/permissions/require-permissions.decorator.ts)

**Tests:** [apps/api/src/modules/auth/account-status-integration.spec.ts](../../../apps/api/src/modules/auth/account-status-integration.spec.ts)<br>[apps/api/src/modules/auth/account-status.guard.spec.ts](../../../apps/api/src/modules/auth/account-status.guard.spec.ts)<br>[apps/api/src/modules/permissions/article-publication-permission.spec.ts](../../../apps/api/src/modules/permissions/article-publication-permission.spec.ts)<br>[apps/api/src/modules/permissions/permissions-integration.spec.ts](../../../apps/api/src/modules/permissions/permissions-integration.spec.ts)<br>[apps/api/src/modules/permissions/permissions.guard.spec.ts](../../../apps/api/src/modules/permissions/permissions.guard.spec.ts)<br>[apps/api/src/modules/permissions/permissions.module.spec.ts](../../../apps/api/src/modules/permissions/permissions.module.spec.ts)<br>[apps/api/src/modules/permissions/permissions.service.spec.ts](../../../apps/api/src/modules/permissions/permissions.service.spec.ts)

**Nachweis:** Permission-Unit-/Modul-Integrationstests bestanden, Auth/DB teilweise gemockt.

**Fehlend:** Nicht jede Fachaktion angeschlossen; Forum-/Moderationsaktionen fehlen.


### 173 – Account Status Guard — PARTIAL

**Bestand:** Zentraler AccountStatusGuard in AuthGuard blockiert BANNED.

**Dateien:** [apps/api/src/modules/auth/account-status.guard.ts](../../../apps/api/src/modules/auth/account-status.guard.ts)<br>[apps/api/src/modules/permissions/permissions.constants.ts](../../../apps/api/src/modules/permissions/permissions.constants.ts)<br>[apps/api/src/modules/permissions/permissions.guard.ts](../../../apps/api/src/modules/permissions/permissions.guard.ts)<br>[apps/api/src/modules/permissions/permissions.module.ts](../../../apps/api/src/modules/permissions/permissions.module.ts)<br>[apps/api/src/modules/permissions/permissions.service.ts](../../../apps/api/src/modules/permissions/permissions.service.ts)<br>[apps/api/src/modules/permissions/require-permissions.decorator.ts](../../../apps/api/src/modules/permissions/require-permissions.decorator.ts)

**Tests:** [apps/api/src/modules/auth/account-status-integration.spec.ts](../../../apps/api/src/modules/auth/account-status-integration.spec.ts)<br>[apps/api/src/modules/auth/account-status.guard.spec.ts](../../../apps/api/src/modules/auth/account-status.guard.spec.ts)<br>[apps/api/src/modules/permissions/article-publication-permission.spec.ts](../../../apps/api/src/modules/permissions/article-publication-permission.spec.ts)<br>[apps/api/src/modules/permissions/permissions-integration.spec.ts](../../../apps/api/src/modules/permissions/permissions-integration.spec.ts)<br>[apps/api/src/modules/permissions/permissions.guard.spec.ts](../../../apps/api/src/modules/permissions/permissions.guard.spec.ts)<br>[apps/api/src/modules/permissions/permissions.module.spec.ts](../../../apps/api/src/modules/permissions/permissions.module.spec.ts)<br>[apps/api/src/modules/permissions/permissions.service.spec.ts](../../../apps/api/src/modules/permissions/permissions.service.spec.ts)

**Nachweis:** Account-Status-Unit-/Integrationstests bestanden (gemockter JWT-Service).

**Fehlend:** Keine Session-Revocation und kein zentraler serverseitiger Onboardingcheck.


### 174 – Yellow Card erstellen — PARTIAL

**Bestand:** Karten-/Sanktionsschema und Permission-Namen vorhanden; Fachmodule leer.

**Dateien:** [apps/api/src/modules/bans/bans.module.ts](../../../apps/api/src/modules/bans/bans.module.ts)<br>[apps/api/src/modules/moderation/moderation.module.ts](../../../apps/api/src/modules/moderation/moderation.module.ts)<br>[apps/api/src/modules/sanctions/sanctions.module.ts](../../../apps/api/src/modules/sanctions/sanctions.module.ts)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Ausführbarer Karten-/Zähl-/Eskaltions-/LIMITED-Service, API/UI, Audit/Notification und Tests fehlen.


### 175 – Yellow Card Counter — PARTIAL

**Bestand:** Karten-/Sanktionsschema und Permission-Namen vorhanden; Fachmodule leer.

**Dateien:** [apps/api/src/modules/bans/bans.module.ts](../../../apps/api/src/modules/bans/bans.module.ts)<br>[apps/api/src/modules/moderation/moderation.module.ts](../../../apps/api/src/modules/moderation/moderation.module.ts)<br>[apps/api/src/modules/sanctions/sanctions.module.ts](../../../apps/api/src/modules/sanctions/sanctions.module.ts)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Ausführbarer Karten-/Zähl-/Eskaltions-/LIMITED-Service, API/UI, Audit/Notification und Tests fehlen.


### 176 – automatische Rote Karte — PARTIAL

**Bestand:** Karten-/Sanktionsschema und Permission-Namen vorhanden; Fachmodule leer.

**Dateien:** [apps/api/src/modules/bans/bans.module.ts](../../../apps/api/src/modules/bans/bans.module.ts)<br>[apps/api/src/modules/moderation/moderation.module.ts](../../../apps/api/src/modules/moderation/moderation.module.ts)<br>[apps/api/src/modules/sanctions/sanctions.module.ts](../../../apps/api/src/modules/sanctions/sanctions.module.ts)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Ausführbarer Karten-/Zähl-/Eskaltions-/LIMITED-Service, API/UI, Audit/Notification und Tests fehlen.


### 177 – direkte Rote Karte — PARTIAL

**Bestand:** Karten-/Sanktionsschema und Permission-Namen vorhanden; Fachmodule leer.

**Dateien:** [apps/api/src/modules/bans/bans.module.ts](../../../apps/api/src/modules/bans/bans.module.ts)<br>[apps/api/src/modules/moderation/moderation.module.ts](../../../apps/api/src/modules/moderation/moderation.module.ts)<br>[apps/api/src/modules/sanctions/sanctions.module.ts](../../../apps/api/src/modules/sanctions/sanctions.module.ts)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Ausführbarer Karten-/Zähl-/Eskaltions-/LIMITED-Service, API/UI, Audit/Notification und Tests fehlen.


### 178 – LIMITED Sanktion — PARTIAL

**Bestand:** Karten-/Sanktionsschema und Permission-Namen vorhanden; Fachmodule leer.

**Dateien:** [apps/api/src/modules/bans/bans.module.ts](../../../apps/api/src/modules/bans/bans.module.ts)<br>[apps/api/src/modules/moderation/moderation.module.ts](../../../apps/api/src/modules/moderation/moderation.module.ts)<br>[apps/api/src/modules/sanctions/sanctions.module.ts](../../../apps/api/src/modules/sanctions/sanctions.module.ts)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Ausführbarer Karten-/Zähl-/Eskaltions-/LIMITED-Service, API/UI, Audit/Notification und Tests fehlen.


### 179 – LIMITED Permission Matrix — PARTIAL

**Bestand:** LIMITED darf comment.vote/delete; create/reply und andere Permissions blockiert.

**Dateien:** [apps/api/src/modules/auth/account-status.guard.ts](../../../apps/api/src/modules/auth/account-status.guard.ts)<br>[apps/api/src/modules/permissions/permissions.constants.ts](../../../apps/api/src/modules/permissions/permissions.constants.ts)<br>[apps/api/src/modules/permissions/permissions.guard.ts](../../../apps/api/src/modules/permissions/permissions.guard.ts)<br>[apps/api/src/modules/permissions/permissions.module.ts](../../../apps/api/src/modules/permissions/permissions.module.ts)<br>[apps/api/src/modules/permissions/permissions.service.ts](../../../apps/api/src/modules/permissions/permissions.service.ts)<br>[apps/api/src/modules/permissions/require-permissions.decorator.ts](../../../apps/api/src/modules/permissions/require-permissions.decorator.ts)

**Tests:** [apps/api/src/modules/auth/account-status-integration.spec.ts](../../../apps/api/src/modules/auth/account-status-integration.spec.ts)<br>[apps/api/src/modules/auth/account-status.guard.spec.ts](../../../apps/api/src/modules/auth/account-status.guard.spec.ts)<br>[apps/api/src/modules/permissions/article-publication-permission.spec.ts](../../../apps/api/src/modules/permissions/article-publication-permission.spec.ts)<br>[apps/api/src/modules/permissions/permissions-integration.spec.ts](../../../apps/api/src/modules/permissions/permissions-integration.spec.ts)<br>[apps/api/src/modules/permissions/permissions.guard.spec.ts](../../../apps/api/src/modules/permissions/permissions.guard.spec.ts)<br>[apps/api/src/modules/permissions/permissions.module.spec.ts](../../../apps/api/src/modules/permissions/permissions.module.spec.ts)<br>[apps/api/src/modules/permissions/permissions.service.spec.ts](../../../apps/api/src/modules/permissions/permissions.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Forum-Laufzeitfunktionen fehlen; vollständige Matrix im echten System nicht getestet.


### 180 – BANNED Handling — PARTIAL

**Bestand:** BANNED wird bei authentifizierten Requests zentral blockiert.

**Dateien:** [apps/api/src/modules/auth/account-status.guard.ts](../../../apps/api/src/modules/auth/account-status.guard.ts)<br>[apps/api/src/modules/auth/auth.controller.ts](../../../apps/api/src/modules/auth/auth.controller.ts)<br>[apps/api/src/modules/auth/auth.guard.ts](../../../apps/api/src/modules/auth/auth.guard.ts)<br>[apps/api/src/modules/auth/auth.module.ts](../../../apps/api/src/modules/auth/auth.module.ts)<br>[apps/api/src/modules/auth/auth.types.ts](../../../apps/api/src/modules/auth/auth.types.ts)<br>[apps/api/src/modules/auth/keycloak-jwt.service.ts](../../../apps/api/src/modules/auth/keycloak-jwt.service.ts)<br>[apps/api/src/modules/users/users.service.ts](../../../apps/api/src/modules/users/users.service.ts)<br>[apps/web/src/app/login/login](../../../apps/web/src/app/login/login)<br>[apps/web/src/app/login/login-client.tsx](../../../apps/web/src/app/login/login-client.tsx)<br>[apps/web/src/app/login/page.tsx](../../../apps/web/src/app/login/page.tsx)<br>[apps/web/src/features/auth/auth-provider.tsx](../../../apps/web/src/features/auth/auth-provider.tsx)

**Tests:** [apps/api/src/modules/auth/account-status-integration.spec.ts](../../../apps/api/src/modules/auth/account-status-integration.spec.ts)<br>[apps/api/src/modules/auth/account-status.guard.spec.ts](../../../apps/api/src/modules/auth/account-status.guard.spec.ts)<br>[apps/api/src/modules/auth/auth.controller.spec.ts](../../../apps/api/src/modules/auth/auth.controller.spec.ts)<br>[apps/api/src/modules/auth/auth.guard.spec.ts](../../../apps/api/src/modules/auth/auth.guard.spec.ts)<br>[apps/api/src/modules/users/users.service.spec.ts](../../../apps/api/src/modules/users/users.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Ban setzen, Keycloak-Sessions widerrufen, verständlicher Loginzustand und Umgehungslogging fehlen.


### 181 – IP Hashing — PARTIAL

**Bestand:** IPBlock-Modell enthält ipHash und hashKeyVersion.

**Dateien:** [apps/api/src/modules/bans/bans.module.ts](../../../apps/api/src/modules/bans/bans.module.ts)<br>[apps/api/src/modules/moderation/moderation.module.ts](../../../apps/api/src/modules/moderation/moderation.module.ts)<br>[apps/api/src/modules/sanctions/sanctions.module.ts](../../../apps/api/src/modules/sanctions/sanctions.module.ts)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Kein HMAC-Service, keine Keyrotation/Erfassung/Retention implementiert.


### 182 – IP Rate Limits — TODO

**Bestand:** Kommentarspam ist autorbasiert, kein IP-Limit.

**Dateien:** [apps/api/src/modules/bans/bans.module.ts](../../../apps/api/src/modules/bans/bans.module.ts)<br>[apps/api/src/modules/moderation/moderation.module.ts](../../../apps/api/src/modules/moderation/moderation.module.ts)<br>[apps/api/src/modules/sanctions/sanctions.module.ts](../../../apps/api/src/modules/sanctions/sanctions.module.ts)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** IP-Rate-Limits für Login/Register/Reset/Kommentare/Forum/Reports fehlen.


### 183 – temporärer IP Block — PARTIAL

**Bestand:** IPBlock-/Sanction-Relationen und Permission-Namen vorhanden.

**Dateien:** [apps/api/src/modules/bans/bans.module.ts](../../../apps/api/src/modules/bans/bans.module.ts)<br>[apps/api/src/modules/moderation/moderation.module.ts](../../../apps/api/src/modules/moderation/moderation.module.ts)<br>[apps/api/src/modules/sanctions/sanctions.module.ts](../../../apps/api/src/modules/sanctions/sanctions.module.ts)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Kein ausführbarer IP-Block-/Ban-/Red-Card-Kopplungsflow und keine Tests.


### 184 – manueller IP Ban — PARTIAL

**Bestand:** IPBlock-/Sanction-Relationen und Permission-Namen vorhanden.

**Dateien:** [apps/api/src/modules/bans/bans.module.ts](../../../apps/api/src/modules/bans/bans.module.ts)<br>[apps/api/src/modules/moderation/moderation.module.ts](../../../apps/api/src/modules/moderation/moderation.module.ts)<br>[apps/api/src/modules/sanctions/sanctions.module.ts](../../../apps/api/src/modules/sanctions/sanctions.module.ts)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Kein ausführbarer IP-Block-/Ban-/Red-Card-Kopplungsflow und keine Tests.


### 185 – Red Card + IP Protection — PARTIAL

**Bestand:** IPBlock-/Sanction-Relationen und Permission-Namen vorhanden.

**Dateien:** [apps/api/src/modules/bans/bans.module.ts](../../../apps/api/src/modules/bans/bans.module.ts)<br>[apps/api/src/modules/moderation/moderation.module.ts](../../../apps/api/src/modules/moderation/moderation.module.ts)<br>[apps/api/src/modules/sanctions/sanctions.module.ts](../../../apps/api/src/modules/sanctions/sanctions.module.ts)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Kein ausführbarer IP-Block-/Ban-/Red-Card-Kopplungsflow und keine Tests.


### 186 – Session Revoke — TODO

**Bestand:** BANNED-Requestguard vorhanden, kein Keycloak-Admin-Revoke-Aufruf.

**Dateien:** [apps/api/src/modules/auth/account-status.guard.ts](../../../apps/api/src/modules/auth/account-status.guard.ts)<br>[apps/api/src/modules/auth/auth.controller.ts](../../../apps/api/src/modules/auth/auth.controller.ts)<br>[apps/api/src/modules/auth/auth.guard.ts](../../../apps/api/src/modules/auth/auth.guard.ts)<br>[apps/api/src/modules/auth/auth.module.ts](../../../apps/api/src/modules/auth/auth.module.ts)<br>[apps/api/src/modules/auth/auth.types.ts](../../../apps/api/src/modules/auth/auth.types.ts)<br>[apps/api/src/modules/auth/keycloak-jwt.service.ts](../../../apps/api/src/modules/auth/keycloak-jwt.service.ts)<br>[apps/api/src/modules/users/users.service.ts](../../../apps/api/src/modules/users/users.service.ts)<br>[apps/web/src/app/login/login](../../../apps/web/src/app/login/login)<br>[apps/web/src/app/login/login-client.tsx](../../../apps/web/src/app/login/login-client.tsx)<br>[apps/web/src/app/login/page.tsx](../../../apps/web/src/app/login/page.tsx)<br>[apps/web/src/features/auth/auth-provider.tsx](../../../apps/web/src/features/auth/auth-provider.tsx)

**Tests:** [apps/api/src/modules/auth/account-status-integration.spec.ts](../../../apps/api/src/modules/auth/account-status-integration.spec.ts)<br>[apps/api/src/modules/auth/account-status.guard.spec.ts](../../../apps/api/src/modules/auth/account-status.guard.spec.ts)<br>[apps/api/src/modules/auth/auth.controller.spec.ts](../../../apps/api/src/modules/auth/auth.controller.spec.ts)<br>[apps/api/src/modules/auth/auth.guard.spec.ts](../../../apps/api/src/modules/auth/auth.guard.spec.ts)<br>[apps/api/src/modules/users/users.service.spec.ts](../../../apps/api/src/modules/users/users.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Keycloak-Session-Revoke, Fehler-/Retry-/Auditbehandlung und Integrationstest fehlen.


### 187 – Moderation Dashboard — PARTIAL

**Bestand:** Admin-Menü/Moderationsplatzhalter vorhanden.

**Dateien:** [apps/api/src/modules/admin/admin.module.ts](../../../apps/api/src/modules/admin/admin.module.ts)<br>[apps/web/src/app/admin/artikel/page.tsx](../../../apps/web/src/app/admin/artikel/page.tsx)<br>[apps/web/src/app/admin/benutzer/page.tsx](../../../apps/web/src/app/admin/benutzer/page.tsx)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[apps/web/src/app/admin/importe/page.tsx](../../../apps/web/src/app/admin/importe/page.tsx)<br>[apps/web/src/app/admin/kategorien/page.tsx](../../../apps/web/src/app/admin/kategorien/page.tsx)<br>[apps/web/src/app/admin/medien/page.tsx](../../../apps/web/src/app/admin/medien/page.tsx)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[apps/web/src/app/admin/page.tsx](../../../apps/web/src/app/admin/page.tsx)<br>[apps/web/src/app/admin/sportdaten/page.tsx](../../../apps/web/src/app/admin/sportdaten/page.tsx)<br>[apps/web/src/app/admin/system/page.tsx](../../../apps/web/src/app/admin/system/page.tsx)<br>[apps/web/src/app/admin/tags/page.tsx](../../../apps/web/src/app/admin/tags/page.tsx)<br>[apps/web/src/features/admin/admin-layout.tsx](../../../apps/web/src/features/admin/admin-layout.tsx)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Reports/Karten/Sperren/Appeals-Dashboard ohne Daten/Services.


### 188 – User Moderation History — PARTIAL

**Bestand:** Historienfähige Datenmodelle vorhanden.

**Dateien:** [apps/api/src/modules/bans/bans.module.ts](../../../apps/api/src/modules/bans/bans.module.ts)<br>[apps/api/src/modules/moderation/moderation.module.ts](../../../apps/api/src/modules/moderation/moderation.module.ts)<br>[apps/api/src/modules/sanctions/sanctions.module.ts](../../../apps/api/src/modules/sanctions/sanctions.module.ts)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Keine User-Moderationshistorie als API/UI; interne Notizen/RBAC-Abnahme fehlen.


### 189 – Appeals — TODO

**Bestand:** Kein Appeal-Fachmodell/Service im überprüften Bestand.

**Dateien:** [apps/api/src/modules/bans/bans.module.ts](../../../apps/api/src/modules/bans/bans.module.ts)<br>[apps/api/src/modules/moderation/moderation.module.ts](../../../apps/api/src/modules/moderation/moderation.module.ts)<br>[apps/api/src/modules/sanctions/sanctions.module.ts](../../../apps/api/src/modules/sanctions/sanctions.module.ts)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Anfechtung mit Statusworkflow, Bearbeitung, Audit und UI fehlt.


### 190 – Vier-Augen-Prinzip — TODO

**Bestand:** Keine kritische Aktion mit zweiter Freigabe implementiert.

**Dateien:** [apps/api/src/modules/bans/bans.module.ts](../../../apps/api/src/modules/bans/bans.module.ts)<br>[apps/api/src/modules/moderation/moderation.module.ts](../../../apps/api/src/modules/moderation/moderation.module.ts)<br>[apps/api/src/modules/sanctions/sanctions.module.ts](../../../apps/api/src/modules/sanctions/sanctions.module.ts)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Optionale Vier-Augen-Regel und Akteurstrennung erst fachlich festlegen.


### 191 – Sanction Expiration Worker — PARTIAL

**Bestand:** ExpiresAt/Status-Felder und sanctions/cleanup-Queue-Namen.

**Dateien:** [apps/api/src/modules/bans/bans.module.ts](../../../apps/api/src/modules/bans/bans.module.ts)<br>[apps/api/src/modules/moderation/moderation.module.ts](../../../apps/api/src/modules/moderation/moderation.module.ts)<br>[apps/api/src/modules/sanctions/sanctions.module.ts](../../../apps/api/src/modules/sanctions/sanctions.module.ts)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Sanction-Expiration-Consumer und Prüfung konkurrierender Sanktionen fehlen.


## Phase 21 – SPORT DATA


### 192 – Competition Management — PARTIAL

**Bestand:** Prisma-Domain/Seeds und öffentliche Lese-APIs vorhanden (Seasonmodul leer).

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Administrative Verwaltung/Mutation und echte Datenimportkette fehlen; reine Leseansicht ist kein Management.


### 193 – Season Management — PARTIAL

**Bestand:** Prisma-Domain/Seeds und öffentliche Lese-APIs vorhanden (Seasonmodul leer).

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Administrative Verwaltung/Mutation und echte Datenimportkette fehlen; reine Leseansicht ist kein Management.


### 194 – Club Management — PARTIAL

**Bestand:** Prisma-Domain/Seeds und öffentliche Lese-APIs vorhanden (Seasonmodul leer).

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Administrative Verwaltung/Mutation und echte Datenimportkette fehlen; reine Leseansicht ist kein Management.


### 195 – Match Management — PARTIAL

**Bestand:** Prisma-Domain/Seeds und öffentliche Lese-APIs vorhanden (Seasonmodul leer).

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Administrative Verwaltung/Mutation und echte Datenimportkette fehlen; reine Leseansicht ist kein Management.


### 196 – Results — PARTIAL

**Bestand:** Prisma-Domain/Seeds und öffentliche Lese-APIs vorhanden (Seasonmodul leer).

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Administrative Verwaltung/Mutation und echte Datenimportkette fehlen; reine Leseansicht ist kein Management.


### 197 – Standings — PARTIAL

**Bestand:** Prisma-Domain/Seeds und öffentliche Lese-APIs vorhanden (Seasonmodul leer).

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Administrative Verwaltung/Mutation und echte Datenimportkette fehlen; reine Leseansicht ist kein Management.


### 198 – Standings Calculation — TODO

**Bestand:** Standing speichert Zeilen; Read-Service liest sie.

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Keine Berechnung aus Matches, Tie-Breaker-/Phasenregeln und Berechnungstests gefunden.


### 199 – Sports Provider Interface — TODO

**Bestand:** Newsmatching existiert separat; keine Sports-Importimplementierung.

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Aufgabenspezifische Sportprovider-/Scheduler-/Korrekturfunktion fehlt; Newsprovider zählt nicht als Sportsprovider.


### 200 – Fake Sports Provider — TODO

**Bestand:** Newsmatching existiert separat; keine Sports-Importimplementierung.

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Aufgabenspezifische Sportprovider-/Scheduler-/Korrekturfunktion fehlt; Newsprovider zählt nicht als Sportsprovider.


### 201 – Sports Import Queue — PARTIAL

**Bestand:** sports-import-Queue ist registriert.

**Dateien:** [apps/worker/src/app.module.ts](../../../apps/worker/src/app.module.ts)<br>[packages/types/src/queue.ts](../../../packages/types/src/queue.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Sports-Consumer, Jobs, Persistenz und Pipeline-Tests fehlen.


### 202 – Club Matching — TODO

**Bestand:** Newsmatching existiert separat; keine Sports-Importimplementierung.

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Aufgabenspezifische Sportprovider-/Scheduler-/Korrekturfunktion fehlt; Newsprovider zählt nicht als Sportsprovider.


### 203 – Match Matching — TODO

**Bestand:** Newsmatching existiert separat; keine Sports-Importimplementierung.

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Aufgabenspezifische Sportprovider-/Scheduler-/Korrekturfunktion fehlt; Newsprovider zählt nicht als Sportsprovider.


### 204 – Sports Scheduler — TODO

**Bestand:** Newsmatching existiert separat; keine Sports-Importimplementierung.

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Aufgabenspezifische Sportprovider-/Scheduler-/Korrekturfunktion fehlt; Newsprovider zählt nicht als Sportsprovider.


### 205 – Correction Interface — TODO

**Bestand:** Newsmatching existiert separat; keine Sports-Importimplementierung.

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Aufgabenspezifische Sportprovider-/Scheduler-/Korrekturfunktion fehlt; Newsprovider zählt nicht als Sportsprovider.


### 206 – echte Vereinsseiten — PARTIAL

**Bestand:** Clubs aus PostgreSQL, öffentliche API und Vereinsdetailroute.

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** News/Spiele/Tabelle/Diskussion im Clubdetail werden aus Mockdaten erzeugt.


### 207 – echte Spielseiten — PARTIAL

**Bestand:** Spielroute liest echte DB-Felder und verknüpfte Artikel.

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Kein echter Import, keine Spieldiskussion und keine Browser-/Produktabnahme.


### 208 – echte Tabelle — PARTIAL

**Bestand:** Tabellen-API liest DB-Zeilen, Frontend bindet sie an.

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Berechnung/Import und echte laufende Saisondaten fehlen; Mock-Fallback ist kein echter Datenbeleg.


## Phase 22 – FORUM


### 209 – Forum Kategorien — PARTIAL

**Bestand:** Forum-/Thread-/Post-/Subscription-/ReadState-Schema vorhanden; Module leer.

**Dateien:** [apps/api/src/modules/forums/forums.module.ts](../../../apps/api/src/modules/forums/forums.module.ts)<br>[apps/api/src/modules/posts/posts.module.ts](../../../apps/api/src/modules/posts/posts.module.ts)<br>[apps/api/src/modules/threads/threads.module.ts](../../../apps/api/src/modules/threads/threads.module.ts)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Keine ausführbare aufgabenspezifische Forum-API/Service/UI und keine Featuretests; nur Struktur/Datenmodell.


### 210 – Vereinsforen — PARTIAL

**Bestand:** Forum-/Thread-/Post-/Subscription-/ReadState-Schema vorhanden; Module leer.

**Dateien:** [apps/api/src/modules/forums/forums.module.ts](../../../apps/api/src/modules/forums/forums.module.ts)<br>[apps/api/src/modules/posts/posts.module.ts](../../../apps/api/src/modules/posts/posts.module.ts)<br>[apps/api/src/modules/threads/threads.module.ts](../../../apps/api/src/modules/threads/threads.module.ts)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Keine ausführbare aufgabenspezifische Forum-API/Service/UI und keine Featuretests; nur Struktur/Datenmodell.


### 211 – Threads — PARTIAL

**Bestand:** Forum-/Thread-/Post-/Subscription-/ReadState-Schema vorhanden; Module leer.

**Dateien:** [apps/api/src/modules/forums/forums.module.ts](../../../apps/api/src/modules/forums/forums.module.ts)<br>[apps/api/src/modules/posts/posts.module.ts](../../../apps/api/src/modules/posts/posts.module.ts)<br>[apps/api/src/modules/threads/threads.module.ts](../../../apps/api/src/modules/threads/threads.module.ts)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Keine ausführbare aufgabenspezifische Forum-API/Service/UI und keine Featuretests; nur Struktur/Datenmodell.


### 212 – Posts — PARTIAL

**Bestand:** Forum-/Thread-/Post-/Subscription-/ReadState-Schema vorhanden; Module leer.

**Dateien:** [apps/api/src/modules/forums/forums.module.ts](../../../apps/api/src/modules/forums/forums.module.ts)<br>[apps/api/src/modules/posts/posts.module.ts](../../../apps/api/src/modules/posts/posts.module.ts)<br>[apps/api/src/modules/threads/threads.module.ts](../../../apps/api/src/modules/threads/threads.module.ts)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Keine ausführbare aufgabenspezifische Forum-API/Service/UI und keine Featuretests; nur Struktur/Datenmodell.


### 213 – Replies — PARTIAL

**Bestand:** Forum-/Thread-/Post-/Subscription-/ReadState-Schema vorhanden; Module leer.

**Dateien:** [apps/api/src/modules/forums/forums.module.ts](../../../apps/api/src/modules/forums/forums.module.ts)<br>[apps/api/src/modules/posts/posts.module.ts](../../../apps/api/src/modules/posts/posts.module.ts)<br>[apps/api/src/modules/threads/threads.module.ts](../../../apps/api/src/modules/threads/threads.module.ts)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Keine ausführbare aufgabenspezifische Forum-API/Service/UI und keine Featuretests; nur Struktur/Datenmodell.


### 214 – Thread Pagination — PARTIAL

**Bestand:** Forum-/Thread-/Post-/Subscription-/ReadState-Schema vorhanden; Module leer.

**Dateien:** [apps/api/src/modules/forums/forums.module.ts](../../../apps/api/src/modules/forums/forums.module.ts)<br>[apps/api/src/modules/posts/posts.module.ts](../../../apps/api/src/modules/posts/posts.module.ts)<br>[apps/api/src/modules/threads/threads.module.ts](../../../apps/api/src/modules/threads/threads.module.ts)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Keine ausführbare aufgabenspezifische Forum-API/Service/UI und keine Featuretests; nur Struktur/Datenmodell.


### 215 – Thread Subscriptions — PARTIAL

**Bestand:** Forum-/Thread-/Post-/Subscription-/ReadState-Schema vorhanden; Module leer.

**Dateien:** [apps/api/src/modules/forums/forums.module.ts](../../../apps/api/src/modules/forums/forums.module.ts)<br>[apps/api/src/modules/posts/posts.module.ts](../../../apps/api/src/modules/posts/posts.module.ts)<br>[apps/api/src/modules/threads/threads.module.ts](../../../apps/api/src/modules/threads/threads.module.ts)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Keine ausführbare aufgabenspezifische Forum-API/Service/UI und keine Featuretests; nur Struktur/Datenmodell.


### 216 – Unread Tracking — PARTIAL

**Bestand:** Forum-/Thread-/Post-/Subscription-/ReadState-Schema vorhanden; Module leer.

**Dateien:** [apps/api/src/modules/forums/forums.module.ts](../../../apps/api/src/modules/forums/forums.module.ts)<br>[apps/api/src/modules/posts/posts.module.ts](../../../apps/api/src/modules/posts/posts.module.ts)<br>[apps/api/src/modules/threads/threads.module.ts](../../../apps/api/src/modules/threads/threads.module.ts)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Keine ausführbare aufgabenspezifische Forum-API/Service/UI und keine Featuretests; nur Struktur/Datenmodell.


### 217 – Last Read Position — PARTIAL

**Bestand:** Forum-/Thread-/Post-/Subscription-/ReadState-Schema vorhanden; Module leer.

**Dateien:** [apps/api/src/modules/forums/forums.module.ts](../../../apps/api/src/modules/forums/forums.module.ts)<br>[apps/api/src/modules/posts/posts.module.ts](../../../apps/api/src/modules/posts/posts.module.ts)<br>[apps/api/src/modules/threads/threads.module.ts](../../../apps/api/src/modules/threads/threads.module.ts)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Keine ausführbare aufgabenspezifische Forum-API/Service/UI und keine Featuretests; nur Struktur/Datenmodell.


### 218 – Thread Pinning — PARTIAL

**Bestand:** Forum-/Thread-/Post-/Subscription-/ReadState-Schema vorhanden; Module leer.

**Dateien:** [apps/api/src/modules/forums/forums.module.ts](../../../apps/api/src/modules/forums/forums.module.ts)<br>[apps/api/src/modules/posts/posts.module.ts](../../../apps/api/src/modules/posts/posts.module.ts)<br>[apps/api/src/modules/threads/threads.module.ts](../../../apps/api/src/modules/threads/threads.module.ts)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Keine ausführbare aufgabenspezifische Forum-API/Service/UI und keine Featuretests; nur Struktur/Datenmodell.


### 219 – Thread Locking — PARTIAL

**Bestand:** Forum-/Thread-/Post-/Subscription-/ReadState-Schema vorhanden; Module leer.

**Dateien:** [apps/api/src/modules/forums/forums.module.ts](../../../apps/api/src/modules/forums/forums.module.ts)<br>[apps/api/src/modules/posts/posts.module.ts](../../../apps/api/src/modules/posts/posts.module.ts)<br>[apps/api/src/modules/threads/threads.module.ts](../../../apps/api/src/modules/threads/threads.module.ts)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Keine ausführbare aufgabenspezifische Forum-API/Service/UI und keine Featuretests; nur Struktur/Datenmodell.


### 220 – Thread Moving — PARTIAL

**Bestand:** Forum-/Thread-/Post-/Subscription-/ReadState-Schema vorhanden; Module leer.

**Dateien:** [apps/api/src/modules/forums/forums.module.ts](../../../apps/api/src/modules/forums/forums.module.ts)<br>[apps/api/src/modules/posts/posts.module.ts](../../../apps/api/src/modules/posts/posts.module.ts)<br>[apps/api/src/modules/threads/threads.module.ts](../../../apps/api/src/modules/threads/threads.module.ts)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Keine ausführbare aufgabenspezifische Forum-API/Service/UI und keine Featuretests; nur Struktur/Datenmodell.


### 221 – Thread Merging — PARTIAL

**Bestand:** Forum-/Thread-/Post-/Subscription-/ReadState-Schema vorhanden; Module leer.

**Dateien:** [apps/api/src/modules/forums/forums.module.ts](../../../apps/api/src/modules/forums/forums.module.ts)<br>[apps/api/src/modules/posts/posts.module.ts](../../../apps/api/src/modules/posts/posts.module.ts)<br>[apps/api/src/modules/threads/threads.module.ts](../../../apps/api/src/modules/threads/threads.module.ts)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Keine ausführbare aufgabenspezifische Forum-API/Service/UI und keine Featuretests; nur Struktur/Datenmodell.


### 222 – Forum Reports — PARTIAL

**Bestand:** Forum-/Thread-/Post-/Subscription-/ReadState-Schema vorhanden; Module leer.

**Dateien:** [apps/api/src/modules/forums/forums.module.ts](../../../apps/api/src/modules/forums/forums.module.ts)<br>[apps/api/src/modules/posts/posts.module.ts](../../../apps/api/src/modules/posts/posts.module.ts)<br>[apps/api/src/modules/threads/threads.module.ts](../../../apps/api/src/modules/threads/threads.module.ts)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Keine ausführbare aufgabenspezifische Forum-API/Service/UI und keine Featuretests; nur Struktur/Datenmodell.


### 223 – Article / Forum Integration — TODO

**Bestand:** Artikel haben Kommentardiskussionen; keine Forum-Verknüpfungslogik.

**Dateien:** [apps/api/src/modules/forums/forums.module.ts](../../../apps/api/src/modules/forums/forums.module.ts)<br>[apps/api/src/modules/posts/posts.module.ts](../../../apps/api/src/modules/posts/posts.module.ts)<br>[apps/api/src/modules/threads/threads.module.ts](../../../apps/api/src/modules/threads/threads.module.ts)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Gemeinsamer Artikel-/Forum-Kontext und konsistente Moderation fehlen.


## Phase 23 – NOTIFICATIONS


### 224 – Notification Types — PARTIAL

**Bestand:** Notification-/Preference-Schema bzw. notifications-Queue vorhanden.

**Dateien:** [apps/api/src/modules/notifications/notifications.module.ts](../../../apps/api/src/modules/notifications/notifications.module.ts)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/types/src/queue.ts](../../../packages/types/src/queue.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Producer/Consumer, Versand-/Read-/Preference-API und UI fehlen; keine Fachtests.


### 225 – Notification Queue — PARTIAL

**Bestand:** Notification-/Preference-Schema bzw. notifications-Queue vorhanden.

**Dateien:** [apps/api/src/modules/notifications/notifications.module.ts](../../../apps/api/src/modules/notifications/notifications.module.ts)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/types/src/queue.ts](../../../packages/types/src/queue.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Producer/Consumer, Versand-/Read-/Preference-API und UI fehlen; keine Fachtests.


### 226 – In-App Notifications — PARTIAL

**Bestand:** Notification-/Preference-Schema bzw. notifications-Queue vorhanden.

**Dateien:** [apps/api/src/modules/notifications/notifications.module.ts](../../../apps/api/src/modules/notifications/notifications.module.ts)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/types/src/queue.ts](../../../packages/types/src/queue.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Producer/Consumer, Versand-/Read-/Preference-API und UI fehlen; keine Fachtests.


### 227 – Read / Unread — PARTIAL

**Bestand:** Notification-/Preference-Schema bzw. notifications-Queue vorhanden.

**Dateien:** [apps/api/src/modules/notifications/notifications.module.ts](../../../apps/api/src/modules/notifications/notifications.module.ts)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/types/src/queue.ts](../../../packages/types/src/queue.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Producer/Consumer, Versand-/Read-/Preference-API und UI fehlen; keine Fachtests.


### 228 – E-Mail Notifications — TODO

**Bestand:** Kein Mail-Service/Notification-Mail-Worker.

**Dateien:** [apps/api/src/modules/notifications/notifications.module.ts](../../../apps/api/src/modules/notifications/notifications.module.ts)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/types/src/queue.ts](../../../packages/types/src/queue.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Asynchroner Mailversand, Templates, Retry, Opt-outs und Zustelltests fehlen.


### 229 – Notification Preferences — PARTIAL

**Bestand:** Notification-/Preference-Schema bzw. notifications-Queue vorhanden.

**Dateien:** [apps/api/src/modules/notifications/notifications.module.ts](../../../apps/api/src/modules/notifications/notifications.module.ts)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/types/src/queue.ts](../../../packages/types/src/queue.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Producer/Consumer, Versand-/Read-/Preference-API und UI fehlen; keine Fachtests.


## Phase 24 – SEARCH


### 230 – Article Index — TODO

**Bestand:** Meilisearch-Service und leeres SearchModule vorhanden.

**Dateien:** [apps/api/src/modules/search/search.module.ts](../../../apps/api/src/modules/search/search.module.ts)<br>[compose.yml](../../../compose.yml)<br>[packages/types/src/queue.ts](../../../packages/types/src/queue.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Kein aufgabenspezifischer Index/Search-/Ranking-/Reindex-Service, Endpoint oder UI; keine Tests.


### 231 – Club Index — TODO

**Bestand:** Meilisearch-Service und leeres SearchModule vorhanden.

**Dateien:** [apps/api/src/modules/search/search.module.ts](../../../apps/api/src/modules/search/search.module.ts)<br>[compose.yml](../../../compose.yml)<br>[packages/types/src/queue.ts](../../../packages/types/src/queue.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Kein aufgabenspezifischer Index/Search-/Ranking-/Reindex-Service, Endpoint oder UI; keine Tests.


### 232 – Forum Index — TODO

**Bestand:** Meilisearch-Service und leeres SearchModule vorhanden.

**Dateien:** [apps/api/src/modules/search/search.module.ts](../../../apps/api/src/modules/search/search.module.ts)<br>[compose.yml](../../../compose.yml)<br>[packages/types/src/queue.ts](../../../packages/types/src/queue.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Kein aufgabenspezifischer Index/Search-/Ranking-/Reindex-Service, Endpoint oder UI; keine Tests.


### 233 – Global Search — TODO

**Bestand:** Meilisearch-Service und leeres SearchModule vorhanden.

**Dateien:** [apps/api/src/modules/search/search.module.ts](../../../apps/api/src/modules/search/search.module.ts)<br>[compose.yml](../../../compose.yml)<br>[packages/types/src/queue.ts](../../../packages/types/src/queue.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Kein aufgabenspezifischer Index/Search-/Ranking-/Reindex-Service, Endpoint oder UI; keine Tests.


### 234 – Search Ranking — TODO

**Bestand:** Meilisearch-Service und leeres SearchModule vorhanden.

**Dateien:** [apps/api/src/modules/search/search.module.ts](../../../apps/api/src/modules/search/search.module.ts)<br>[compose.yml](../../../compose.yml)<br>[packages/types/src/queue.ts](../../../packages/types/src/queue.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Kein aufgabenspezifischer Index/Search-/Ranking-/Reindex-Service, Endpoint oder UI; keine Tests.


### 235 – Search Index Queue — PARTIAL

**Bestand:** search-index-Queue registriert.

**Dateien:** [apps/api/src/modules/search/search.module.ts](../../../apps/api/src/modules/search/search.module.ts)<br>[compose.yml](../../../compose.yml)<br>[packages/types/src/queue.ts](../../../packages/types/src/queue.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Indexierungsconsumer und transaktionale Ereigniszustellung fehlen.


### 236 – Full Reindex — TODO

**Bestand:** Meilisearch-Service und leeres SearchModule vorhanden.

**Dateien:** [apps/api/src/modules/search/search.module.ts](../../../apps/api/src/modules/search/search.module.ts)<br>[compose.yml](../../../compose.yml)<br>[packages/types/src/queue.ts](../../../packages/types/src/queue.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Kein aufgabenspezifischer Index/Search-/Ranking-/Reindex-Service, Endpoint oder UI; keine Tests.


## Phase 25 – ADMIN SYSTEM


### 237 – Admin Dashboard — PARTIAL

**Bestand:** Dashboard mit statischen Strichen und Navigation.

**Dateien:** [apps/api/src/modules/admin/admin.module.ts](../../../apps/api/src/modules/admin/admin.module.ts)<br>[apps/web/src/app/admin/artikel/page.tsx](../../../apps/web/src/app/admin/artikel/page.tsx)<br>[apps/web/src/app/admin/benutzer/page.tsx](../../../apps/web/src/app/admin/benutzer/page.tsx)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[apps/web/src/app/admin/importe/page.tsx](../../../apps/web/src/app/admin/importe/page.tsx)<br>[apps/web/src/app/admin/kategorien/page.tsx](../../../apps/web/src/app/admin/kategorien/page.tsx)<br>[apps/web/src/app/admin/medien/page.tsx](../../../apps/web/src/app/admin/medien/page.tsx)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[apps/web/src/app/admin/page.tsx](../../../apps/web/src/app/admin/page.tsx)<br>[apps/web/src/app/admin/sportdaten/page.tsx](../../../apps/web/src/app/admin/sportdaten/page.tsx)<br>[apps/web/src/app/admin/system/page.tsx](../../../apps/web/src/app/admin/system/page.tsx)<br>[apps/web/src/app/admin/tags/page.tsx](../../../apps/web/src/app/admin/tags/page.tsx)<br>[apps/web/src/features/admin/admin-layout.tsx](../../../apps/web/src/features/admin/admin-layout.tsx)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Keine echten User-/Karten-/Reports-/Import-/Systemkennzahlen.


### 238 – User Search — TODO

**Bestand:** User-Admin-Seite ist Platzhalter.

**Dateien:** [apps/api/src/modules/admin/admin.module.ts](../../../apps/api/src/modules/admin/admin.module.ts)<br>[apps/web/src/app/admin/artikel/page.tsx](../../../apps/web/src/app/admin/artikel/page.tsx)<br>[apps/web/src/app/admin/benutzer/page.tsx](../../../apps/web/src/app/admin/benutzer/page.tsx)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[apps/web/src/app/admin/importe/page.tsx](../../../apps/web/src/app/admin/importe/page.tsx)<br>[apps/web/src/app/admin/kategorien/page.tsx](../../../apps/web/src/app/admin/kategorien/page.tsx)<br>[apps/web/src/app/admin/medien/page.tsx](../../../apps/web/src/app/admin/medien/page.tsx)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[apps/web/src/app/admin/page.tsx](../../../apps/web/src/app/admin/page.tsx)<br>[apps/web/src/app/admin/sportdaten/page.tsx](../../../apps/web/src/app/admin/sportdaten/page.tsx)<br>[apps/web/src/app/admin/system/page.tsx](../../../apps/web/src/app/admin/system/page.tsx)<br>[apps/web/src/app/admin/tags/page.tsx](../../../apps/web/src/app/admin/tags/page.tsx)<br>[apps/web/src/features/admin/admin-layout.tsx](../../../apps/web/src/features/admin/admin-layout.tsx)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Suche nach Nickname/E-Mail/User-ID fehlt; E-Mail-Quelle/Datenschutz klären.


### 239 – User Detail — TODO

**Bestand:** User-Admin-Seite ist Platzhalter.

**Dateien:** [apps/api/src/modules/admin/admin.module.ts](../../../apps/api/src/modules/admin/admin.module.ts)<br>[apps/web/src/app/admin/artikel/page.tsx](../../../apps/web/src/app/admin/artikel/page.tsx)<br>[apps/web/src/app/admin/benutzer/page.tsx](../../../apps/web/src/app/admin/benutzer/page.tsx)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[apps/web/src/app/admin/importe/page.tsx](../../../apps/web/src/app/admin/importe/page.tsx)<br>[apps/web/src/app/admin/kategorien/page.tsx](../../../apps/web/src/app/admin/kategorien/page.tsx)<br>[apps/web/src/app/admin/medien/page.tsx](../../../apps/web/src/app/admin/medien/page.tsx)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[apps/web/src/app/admin/page.tsx](../../../apps/web/src/app/admin/page.tsx)<br>[apps/web/src/app/admin/sportdaten/page.tsx](../../../apps/web/src/app/admin/sportdaten/page.tsx)<br>[apps/web/src/app/admin/system/page.tsx](../../../apps/web/src/app/admin/system/page.tsx)<br>[apps/web/src/app/admin/tags/page.tsx](../../../apps/web/src/app/admin/tags/page.tsx)<br>[apps/web/src/features/admin/admin-layout.tsx](../../../apps/web/src/features/admin/admin-layout.tsx)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Userdetail inklusive Rollen/Karten/Sanktionen/IP/Audit fehlt.


### 240 – Editorial Admin — PARTIAL

**Bestand:** Artikel-/Kategorien-/Tags-/Medien-Administration weitgehend vorhanden.

**Dateien:** [apps/api/src/modules/articles/article-editorial.guard.ts](../../../apps/api/src/modules/articles/article-editorial.guard.ts)<br>[apps/api/src/modules/articles/articles.controller.ts](../../../apps/api/src/modules/articles/articles.controller.ts)<br>[apps/api/src/modules/articles/articles.module.ts](../../../apps/api/src/modules/articles/articles.module.ts)<br>[apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/admin/articles/article-editor.tsx](../../../apps/web/src/features/admin/articles/article-editor.tsx)<br>[apps/web/src/features/admin/articles/article-list.tsx](../../../apps/web/src/features/admin/articles/article-list.tsx)<br>[packages/validation/src/article.ts](../../../packages/validation/src/article.ts)

**Tests:** [apps/api/src/modules/articles/article-editorial.guard.spec.ts](../../../apps/api/src/modules/articles/article-editorial.guard.spec.ts)<br>[apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[packages/validation/src/article.spec.ts](../../../packages/validation/src/article.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Zentraler Admin-UI-Zugangsschutz, reale Upload-/Publish-Abnahme und Auditspur fehlen.


### 241 – Import Admin — PARTIAL

**Bestand:** Import-Admin für Jobs/Records/Review vorhanden.

**Dateien:** [apps/api/src/modules/imports/imports.controller.ts](../../../apps/api/src/modules/imports/imports.controller.ts)<br>[apps/api/src/modules/imports/imports.module.ts](../../../apps/api/src/modules/imports/imports.module.ts)<br>[apps/api/src/modules/imports/imports.service.ts](../../../apps/api/src/modules/imports/imports.service.ts)<br>[apps/web/src/features/admin/imports/import-admin.tsx](../../../apps/web/src/features/admin/imports/import-admin.tsx)<br>[apps/worker/src/jobs/news-import-scheduler.service.ts](../../../apps/worker/src/jobs/news-import-scheduler.service.ts)<br>[apps/worker/src/processors/news-import.processor.ts](../../../apps/worker/src/processors/news-import.processor.ts)<br>[apps/worker/src/providers/fake-news-normalizer.ts](../../../apps/worker/src/providers/fake-news-normalizer.ts)<br>[apps/worker/src/providers/fake-news-provider.ts](../../../apps/worker/src/providers/fake-news-provider.ts)<br>[apps/worker/src/providers/ots-news-normalizer.ts](../../../apps/worker/src/providers/ots-news-normalizer.ts)<br>[apps/worker/src/providers/ots-news-provider.ts](../../../apps/worker/src/providers/ots-news-provider.ts)<br>[apps/worker/src/services/news-auto-publishing.service.ts](../../../apps/worker/src/services/news-auto-publishing.service.ts)<br>[apps/worker/src/services/news-club-matching.service.ts](../../../apps/worker/src/services/news-club-matching.service.ts)<br>[apps/worker/src/services/news-competition-matching.service.ts](../../../apps/worker/src/services/news-competition-matching.service.ts)<br>[apps/worker/src/services/news-confidence-score.service.ts](../../../apps/worker/src/services/news-confidence-score.service.ts)<br>[apps/worker/src/services/news-duplicate-detection.service.ts](../../../apps/worker/src/services/news-duplicate-detection.service.ts)<br>[apps/worker/src/services/news-import-dead-letter.service.ts](../../../apps/worker/src/services/news-import-dead-letter.service.ts)<br>[apps/worker/src/services/news-match-matching.service.ts](../../../apps/worker/src/services/news-match-matching.service.ts)<br>[apps/worker/src/services/news-normalization.service.ts](../../../apps/worker/src/services/news-normalization.service.ts)<br>[apps/worker/src/services/news-review-workflow.service.ts](../../../apps/worker/src/services/news-review-workflow.service.ts)<br>[apps/worker/src/services/news-validation.service.ts](../../../apps/worker/src/services/news-validation.service.ts)<br>[apps/worker/src/services/raw-payload.service.ts](../../../apps/worker/src/services/raw-payload.service.ts)

**Tests:** [apps/api/src/modules/imports/imports.service.spec.ts](../../../apps/api/src/modules/imports/imports.service.spec.ts)<br>[apps/worker/src/jobs/news-import-scheduler.service.spec.ts](../../../apps/worker/src/jobs/news-import-scheduler.service.spec.ts)<br>[apps/worker/src/processors/news-import.processor.spec.ts](../../../apps/worker/src/processors/news-import.processor.spec.ts)<br>[apps/worker/src/providers/fake-news-normalizer.spec.ts](../../../apps/worker/src/providers/fake-news-normalizer.spec.ts)<br>[apps/worker/src/providers/fake-news-provider.spec.ts](../../../apps/worker/src/providers/fake-news-provider.spec.ts)<br>[apps/worker/src/providers/ots-news-normalizer.spec.ts](../../../apps/worker/src/providers/ots-news-normalizer.spec.ts)<br>[apps/worker/src/providers/ots-news-provider.spec.ts](../../../apps/worker/src/providers/ots-news-provider.spec.ts)<br>[apps/worker/src/services/news-auto-publishing.service.spec.ts](../../../apps/worker/src/services/news-auto-publishing.service.spec.ts)<br>[apps/worker/src/services/news-club-matching.service.spec.ts](../../../apps/worker/src/services/news-club-matching.service.spec.ts)<br>[apps/worker/src/services/news-competition-matching.service.spec.ts](../../../apps/worker/src/services/news-competition-matching.service.spec.ts)<br>[apps/worker/src/services/news-confidence-score.service.spec.ts](../../../apps/worker/src/services/news-confidence-score.service.spec.ts)<br>[apps/worker/src/services/news-duplicate-detection.service.spec.ts](../../../apps/worker/src/services/news-duplicate-detection.service.spec.ts)<br>[apps/worker/src/services/news-import-dead-letter.service.spec.ts](../../../apps/worker/src/services/news-import-dead-letter.service.spec.ts)<br>[apps/worker/src/services/news-match-matching.service.spec.ts](../../../apps/worker/src/services/news-match-matching.service.spec.ts)<br>[apps/worker/src/services/news-normalization.service.spec.ts](../../../apps/worker/src/services/news-normalization.service.spec.ts)<br>[apps/worker/src/services/news-review-workflow.service.spec.ts](../../../apps/worker/src/services/news-review-workflow.service.spec.ts)<br>[apps/worker/src/services/news-validation.service.spec.ts](../../../apps/worker/src/services/news-validation.service.spec.ts)<br>[apps/worker/src/services/raw-payload.service.spec.ts](../../../apps/worker/src/services/raw-payload.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Echte Provider-/DB-/Queue-/UI-Abnahme und DLQ-Betrieb fehlen.


### 242 – Sports Admin — PARTIAL

**Bestand:** Sports-Navigation/Platzhalter; keine vollständige Fachfunktion.

**Dateien:** [apps/api/src/modules/admin/admin.module.ts](../../../apps/api/src/modules/admin/admin.module.ts)<br>[apps/web/src/app/admin/artikel/page.tsx](../../../apps/web/src/app/admin/artikel/page.tsx)<br>[apps/web/src/app/admin/benutzer/page.tsx](../../../apps/web/src/app/admin/benutzer/page.tsx)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[apps/web/src/app/admin/importe/page.tsx](../../../apps/web/src/app/admin/importe/page.tsx)<br>[apps/web/src/app/admin/kategorien/page.tsx](../../../apps/web/src/app/admin/kategorien/page.tsx)<br>[apps/web/src/app/admin/medien/page.tsx](../../../apps/web/src/app/admin/medien/page.tsx)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[apps/web/src/app/admin/page.tsx](../../../apps/web/src/app/admin/page.tsx)<br>[apps/web/src/app/admin/sportdaten/page.tsx](../../../apps/web/src/app/admin/sportdaten/page.tsx)<br>[apps/web/src/app/admin/system/page.tsx](../../../apps/web/src/app/admin/system/page.tsx)<br>[apps/web/src/app/admin/tags/page.tsx](../../../apps/web/src/app/admin/tags/page.tsx)<br>[apps/web/src/features/admin/admin-layout.tsx](../../../apps/web/src/features/admin/admin-layout.tsx)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifische Admin-Daten/API/RBAC/UI und Tests fehlen.


### 243 – Moderation Admin — PARTIAL

**Bestand:** Moderation-Navigation/Platzhalter; keine vollständige Fachfunktion.

**Dateien:** [apps/api/src/modules/admin/admin.module.ts](../../../apps/api/src/modules/admin/admin.module.ts)<br>[apps/web/src/app/admin/artikel/page.tsx](../../../apps/web/src/app/admin/artikel/page.tsx)<br>[apps/web/src/app/admin/benutzer/page.tsx](../../../apps/web/src/app/admin/benutzer/page.tsx)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[apps/web/src/app/admin/importe/page.tsx](../../../apps/web/src/app/admin/importe/page.tsx)<br>[apps/web/src/app/admin/kategorien/page.tsx](../../../apps/web/src/app/admin/kategorien/page.tsx)<br>[apps/web/src/app/admin/medien/page.tsx](../../../apps/web/src/app/admin/medien/page.tsx)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[apps/web/src/app/admin/page.tsx](../../../apps/web/src/app/admin/page.tsx)<br>[apps/web/src/app/admin/sportdaten/page.tsx](../../../apps/web/src/app/admin/sportdaten/page.tsx)<br>[apps/web/src/app/admin/system/page.tsx](../../../apps/web/src/app/admin/system/page.tsx)<br>[apps/web/src/app/admin/tags/page.tsx](../../../apps/web/src/app/admin/tags/page.tsx)<br>[apps/web/src/features/admin/admin-layout.tsx](../../../apps/web/src/features/admin/admin-layout.tsx)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifische Admin-Daten/API/RBAC/UI und Tests fehlen.


### 244 – Audit Viewer — TODO

**Bestand:** Audit-Navigation/Platzhalter; keine vollständige Fachfunktion.

**Dateien:** [apps/api/src/modules/admin/admin.module.ts](../../../apps/api/src/modules/admin/admin.module.ts)<br>[apps/web/src/app/admin/artikel/page.tsx](../../../apps/web/src/app/admin/artikel/page.tsx)<br>[apps/web/src/app/admin/benutzer/page.tsx](../../../apps/web/src/app/admin/benutzer/page.tsx)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[apps/web/src/app/admin/importe/page.tsx](../../../apps/web/src/app/admin/importe/page.tsx)<br>[apps/web/src/app/admin/kategorien/page.tsx](../../../apps/web/src/app/admin/kategorien/page.tsx)<br>[apps/web/src/app/admin/medien/page.tsx](../../../apps/web/src/app/admin/medien/page.tsx)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[apps/web/src/app/admin/page.tsx](../../../apps/web/src/app/admin/page.tsx)<br>[apps/web/src/app/admin/sportdaten/page.tsx](../../../apps/web/src/app/admin/sportdaten/page.tsx)<br>[apps/web/src/app/admin/system/page.tsx](../../../apps/web/src/app/admin/system/page.tsx)<br>[apps/web/src/app/admin/tags/page.tsx](../../../apps/web/src/app/admin/tags/page.tsx)<br>[apps/web/src/features/admin/admin-layout.tsx](../../../apps/web/src/features/admin/admin-layout.tsx)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifische Admin-Daten/API/RBAC/UI und Tests fehlen.


### 245 – System Status — PARTIAL

**Bestand:** Systemstatus-Navigation/Platzhalter; keine vollständige Fachfunktion.

**Dateien:** [apps/api/src/modules/admin/admin.module.ts](../../../apps/api/src/modules/admin/admin.module.ts)<br>[apps/web/src/app/admin/artikel/page.tsx](../../../apps/web/src/app/admin/artikel/page.tsx)<br>[apps/web/src/app/admin/benutzer/page.tsx](../../../apps/web/src/app/admin/benutzer/page.tsx)<br>[apps/web/src/app/admin/forum/page.tsx](../../../apps/web/src/app/admin/forum/page.tsx)<br>[apps/web/src/app/admin/importe/page.tsx](../../../apps/web/src/app/admin/importe/page.tsx)<br>[apps/web/src/app/admin/kategorien/page.tsx](../../../apps/web/src/app/admin/kategorien/page.tsx)<br>[apps/web/src/app/admin/medien/page.tsx](../../../apps/web/src/app/admin/medien/page.tsx)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[apps/web/src/app/admin/page.tsx](../../../apps/web/src/app/admin/page.tsx)<br>[apps/web/src/app/admin/sportdaten/page.tsx](../../../apps/web/src/app/admin/sportdaten/page.tsx)<br>[apps/web/src/app/admin/system/page.tsx](../../../apps/web/src/app/admin/system/page.tsx)<br>[apps/web/src/app/admin/tags/page.tsx](../../../apps/web/src/app/admin/tags/page.tsx)<br>[apps/web/src/features/admin/admin-layout.tsx](../../../apps/web/src/features/admin/admin-layout.tsx)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifische Admin-Daten/API/RBAC/UI und Tests fehlen.


## Phase 26 – PRIVACY & SECURITY


### 246 – Data Classification — TODO

**Bestand:** Schema/Settings enthalten Teilaspekte personenbezogener Daten, aber keinen vollständigen Prozess.

**Dateien:** [apps/web/src/features/settings/user-settings-page.tsx](../../../apps/web/src/features/settings/user-settings-page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifische Datenklassifizierung/Minimierung/Retention/Export/Löschfunktion und rechtliche Abnahme fehlen.


### 247 – Data Minimization — TODO

**Bestand:** Schema/Settings enthalten Teilaspekte personenbezogener Daten, aber keinen vollständigen Prozess.

**Dateien:** [apps/web/src/features/settings/user-settings-page.tsx](../../../apps/web/src/features/settings/user-settings-page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifische Datenklassifizierung/Minimierung/Retention/Export/Löschfunktion und rechtliche Abnahme fehlen.


### 248 – IP Retention Policy — TODO

**Bestand:** Schema/Settings enthalten Teilaspekte personenbezogener Daten, aber keinen vollständigen Prozess.

**Dateien:** [apps/web/src/features/settings/user-settings-page.tsx](../../../apps/web/src/features/settings/user-settings-page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifische Datenklassifizierung/Minimierung/Retention/Export/Löschfunktion und rechtliche Abnahme fehlen.


### 249 – Moderation Retention — TODO

**Bestand:** Schema/Settings enthalten Teilaspekte personenbezogener Daten, aber keinen vollständigen Prozess.

**Dateien:** [apps/web/src/features/settings/user-settings-page.tsx](../../../apps/web/src/features/settings/user-settings-page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifische Datenklassifizierung/Minimierung/Retention/Export/Löschfunktion und rechtliche Abnahme fehlen.


### 250 – Datenexport — TODO

**Bestand:** Schema/Settings enthalten Teilaspekte personenbezogener Daten, aber keinen vollständigen Prozess.

**Dateien:** [apps/web/src/features/settings/user-settings-page.tsx](../../../apps/web/src/features/settings/user-settings-page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifische Datenklassifizierung/Minimierung/Retention/Export/Löschfunktion und rechtliche Abnahme fehlen.


### 251 – Accountlöschung — TODO

**Bestand:** Schema/Settings enthalten Teilaspekte personenbezogener Daten, aber keinen vollständigen Prozess.

**Dateien:** [apps/web/src/features/settings/user-settings-page.tsx](../../../apps/web/src/features/settings/user-settings-page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifische Datenklassifizierung/Minimierung/Retention/Export/Löschfunktion und rechtliche Abnahme fehlen.


### 252 – Security Headers — TODO

**Bestand:** Keine lokale Security-Header-Konfiguration für API/Web.

**Dateien:** [apps/api/src/main.ts](../../../apps/api/src/main.ts)<br>[apps/web/next.config.ts](../../../apps/web/next.config.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Lokale Responses ohne CSP/X-Content-Type-Options/X-Frame-Options; keine Aussage zu Edge-Headern.

**Fehlend:** Security-Header-Konzept/Implementierung fehlt; mögliche Cloudflare-Header extern nicht geprüft.


### 253 – Content Security Policy — TODO

**Bestand:** Keine CSP-Policy im Repository.

**Dateien:** [apps/api/src/main.ts](../../../apps/api/src/main.ts)<br>[apps/web/next.config.ts](../../../apps/web/next.config.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** CSP mit Nonces/zulässigen Quellen und Browser-Abnahme fehlt.


### 254 – CORS — PARTIAL

**Bestand:** CORS auf WEB_URL, erlaubte Methods und Header begrenzt.

**Dateien:** [apps/api/src/main.ts](../../../apps/api/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Lokaler Response enthält Access-Control-Allow-Origin localhost:3000.

**Fehlend:** Abnahme aller DEV/STAGING/PROD-Origins/Preflight und Fehlkonfigurationen fehlt.


### 255 – XSS Protection — PARTIAL

**Bestand:** Artikel-Zod begrenzt Richtext/HTTP-Links; Renderer verwendet React statt Raw-HTML.

**Dateien:** [apps/api/src/modules/articles/article-editorial.guard.ts](../../../apps/api/src/modules/articles/article-editorial.guard.ts)<br>[apps/api/src/modules/articles/articles.controller.ts](../../../apps/api/src/modules/articles/articles.controller.ts)<br>[apps/api/src/modules/articles/articles.module.ts](../../../apps/api/src/modules/articles/articles.module.ts)<br>[apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/admin/articles/article-editor.tsx](../../../apps/web/src/features/admin/articles/article-editor.tsx)<br>[apps/web/src/features/admin/articles/article-list.tsx](../../../apps/web/src/features/admin/articles/article-list.tsx)<br>[packages/validation/src/article.ts](../../../packages/validation/src/article.ts)

**Tests:** [apps/api/src/modules/articles/article-editorial.guard.spec.ts](../../../apps/api/src/modules/articles/article-editorial.guard.spec.ts)<br>[apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[packages/validation/src/article.spec.ts](../../../packages/validation/src/article.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Keine vollständige Browser-XSS-/Forum-/Import-Fuzz-Abnahme; externe Bild-/Linkpolicy fehlt.


### 256 – Upload Security — PARTIAL

**Bestand:** 10-MB-Limit und MIME-Allowlist; zufälliger Storagekey/Extension.

**Dateien:** [apps/api/src/infrastructure/storage/s3-storage.service.ts](../../../apps/api/src/infrastructure/storage/s3-storage.service.ts)<br>[apps/api/src/infrastructure/storage/storage.module.ts](../../../apps/api/src/infrastructure/storage/storage.module.ts)<br>[apps/api/src/infrastructure/storage/storage.types.ts](../../../apps/api/src/infrastructure/storage/storage.types.ts)<br>[apps/api/src/modules/media/media.controller.ts](../../../apps/api/src/modules/media/media.controller.ts)<br>[apps/api/src/modules/media/media.module.ts](../../../apps/api/src/modules/media/media.module.ts)<br>[apps/api/src/modules/media/media.service.ts](../../../apps/api/src/modules/media/media.service.ts)<br>[apps/web/src/features/admin/media/media-library.tsx](../../../apps/web/src/features/admin/media/media-library.tsx)<br>[packages/validation/src/media.ts](../../../packages/validation/src/media.ts)

**Tests:** [apps/api/src/modules/media/media.service.spec.ts](../../../apps/api/src/modules/media/media.service.spec.ts)<br>[packages/validation/src/media.spec.ts](../../../packages/validation/src/media.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Magic bytes, tatsächliche Dekodierung, Inhaltsprüfung und bösartige Upload-Integrationstests fehlen.


### 257 – Rate Limits — PARTIAL

**Bestand:** Autorenbasierter Kommentar-Ratelimiter vorhanden.

**Dateien:** [apps/api/src/modules/comments/comment-pagination.ts](../../../apps/api/src/modules/comments/comment-pagination.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.ts)<br>[apps/api/src/modules/comments/comments.controller.ts](../../../apps/api/src/modules/comments/comments.controller.ts)<br>[apps/api/src/modules/comments/comments.module.ts](../../../apps/api/src/modules/comments/comments.module.ts)<br>[apps/api/src/modules/comments/comments.service.ts](../../../apps/api/src/modules/comments/comments.service.ts)<br>[apps/web/src/features/articles/comment-composer.tsx](../../../apps/web/src/features/articles/comment-composer.tsx)<br>[packages/validation/src/comment.ts](../../../packages/validation/src/comment.ts)

**Tests:** [apps/api/src/modules/comments/comment-pagination.service.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.service.spec.ts)<br>[apps/api/src/modules/comments/comment-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-popular-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-popular-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.spec.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.spec.ts)<br>[apps/api/src/modules/comments/comments-spam-integration.spec.ts](../../../apps/api/src/modules/comments/comments-spam-integration.spec.ts)<br>[apps/api/src/modules/comments/comments.controller.spec.ts](../../../apps/api/src/modules/comments/comments.controller.spec.ts)<br>[apps/api/src/modules/comments/comments.service.spec.ts](../../../apps/api/src/modules/comments/comments.service.spec.ts)<br>[apps/web/src/features/articles/comment-pagination-client.spec.mjs](../../../apps/web/src/features/articles/comment-pagination-client.spec.mjs)<br>[apps/web/src/features/articles/comment-sort.spec.mjs](../../../apps/web/src/features/articles/comment-sort.spec.mjs)<br>[apps/web/src/features/articles/comment-spam-error.spec.mjs](../../../apps/web/src/features/articles/comment-spam-error.spec.mjs)<br>[packages/validation/src/comment.spec.ts](../../../packages/validation/src/comment.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Separate Limits für Vote/Search/Report und IdP-Login/Register/Reset/Forum fehlen; IP-Schutz fehlt.


## Phase 27 – PERFORMANCE


### 258 – Redis Cache Strategy — TODO

**Bestand:** Redis wird für Queues/Spam genutzt, kein fachlicher Readcache.

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Cachekeys/TTLs/Invalidierung für Tabelle/Clubs/Ligen fehlen.


### 259 – Personalized Feed Performance — PARTIAL

**Bestand:** Feed wird querybasiert aus begrenzten Teilmengen zusammengesetzt, keine User-Newslistenpersistenz.

**Dateien:** [apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/personalization/club-theme.ts](../../../apps/web/src/features/personalization/club-theme.ts)<br>[apps/web/src/features/personalization/personalized-club-theme.tsx](../../../apps/web/src/features/personalization/personalized-club-theme.tsx)<br>[apps/web/src/features/personalization/personalized-startpage.tsx](../../../apps/web/src/features/personalization/personalized-startpage.tsx)<br>[apps/web/src/features/personalization/startpage-mock-data.ts](../../../apps/web/src/features/personalization/startpage-mock-data.ts)

**Tests:** [apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[apps/web/src/features/personalization/club-theme.spec.mjs](../../../apps/web/src/features/personalization/club-theme.spec.mjs)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** EXPLAIN/Last-/Querybudget-Nachweis bei realem Datenvolumen fehlt.


### 260 – Database Indexes — PARTIAL

**Bestand:** Indizes auf Article.publishedAt, ArticleClub.clubId, Comment, Post, Match, Notification, User vorhanden.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Schema-/Migrationsprüfung; Performance nicht gemessen.

**Fehlend:** Keine EXPLAIN-/Last-Abnahme; Duplicate-Suche/Nullable-Unique-/Pagination-Indizes prüfen.


### 261 – Slow Query Monitoring — TODO

**Bestand:** Keine aktive Slow-Query-/pg_stat_statements-Konfiguration gefunden.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Schwellwerte, Messung, Dashboard und Alarmierung fehlen.


### 262 – Frontend Performance — PARTIAL

**Bestand:** Next.js-Build/SSR und einige optimierte Bilder vorhanden.

**Dateien:** [apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/web/src/features/articles/article-detail.tsx](../../../apps/web/src/features/articles/article-detail.tsx)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Lighthouse/Web-Vitals/Bundles/Mobile-Netzprofile fehlen; drei no-img-element-Warnungen.


## Phase 28 – TESTING


### 263 – Unit Tests — PARTIAL

**Bestand:** 655 regulär ausgewählte Unit-Tests plus 22 zusätzliche Frontendtests bestanden.

**Dateien:** [apps/api/src/modules/auth/account-status.guard.ts](../../../apps/api/src/modules/auth/account-status.guard.ts)<br>[apps/api/src/modules/permissions/permissions.constants.ts](../../../apps/api/src/modules/permissions/permissions.constants.ts)<br>[apps/api/src/modules/permissions/permissions.guard.ts](../../../apps/api/src/modules/permissions/permissions.guard.ts)<br>[apps/api/src/modules/permissions/permissions.module.ts](../../../apps/api/src/modules/permissions/permissions.module.ts)<br>[apps/api/src/modules/permissions/permissions.service.ts](../../../apps/api/src/modules/permissions/permissions.service.ts)<br>[apps/api/src/modules/permissions/require-permissions.decorator.ts](../../../apps/api/src/modules/permissions/require-permissions.decorator.ts)

**Tests:** [apps/api/src/modules/auth/account-status-integration.spec.ts](../../../apps/api/src/modules/auth/account-status-integration.spec.ts)<br>[apps/api/src/modules/auth/account-status.guard.spec.ts](../../../apps/api/src/modules/auth/account-status.guard.spec.ts)<br>[apps/api/src/modules/permissions/article-publication-permission.spec.ts](../../../apps/api/src/modules/permissions/article-publication-permission.spec.ts)<br>[apps/api/src/modules/permissions/permissions-integration.spec.ts](../../../apps/api/src/modules/permissions/permissions-integration.spec.ts)<br>[apps/api/src/modules/permissions/permissions.guard.spec.ts](../../../apps/api/src/modules/permissions/permissions.guard.spec.ts)<br>[apps/api/src/modules/permissions/permissions.module.spec.ts](../../../apps/api/src/modules/permissions/permissions.module.spec.ts)<br>[apps/api/src/modules/permissions/permissions.service.spec.ts](../../../apps/api/src/modules/permissions/permissions.service.spec.ts)

**Nachweis:** 417 API + 120 Worker + 90 Validation + 28 Web; zusätzlicher Web-Lauf 50 inkl. der 28.

**Fehlend:** Karteneskalation/Tabellenberechnung fehlen und haben keine Tests; keine vollständige Masterplan-Testabdeckung.


### 264 – Integration Tests — PARTIAL

**Bestand:** Modul-/Serviceintegration mit Mocks; lokale DB/Redis/Queue-Smokes.

**Dateien:** [apps/api/src/modules/comments/comment-pagination.ts](../../../apps/api/src/modules/comments/comment-pagination.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.ts)<br>[apps/api/src/modules/comments/comments.controller.ts](../../../apps/api/src/modules/comments/comments.controller.ts)<br>[apps/api/src/modules/comments/comments.module.ts](../../../apps/api/src/modules/comments/comments.module.ts)<br>[apps/api/src/modules/comments/comments.service.ts](../../../apps/api/src/modules/comments/comments.service.ts)<br>[apps/web/src/features/articles/comment-composer.tsx](../../../apps/web/src/features/articles/comment-composer.tsx)<br>[packages/validation/src/comment.ts](../../../packages/validation/src/comment.ts)

**Tests:** [apps/api/src/modules/comments/comment-pagination.service.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.service.spec.ts)<br>[apps/api/src/modules/comments/comment-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-popular-pagination.spec.ts](../../../apps/api/src/modules/comments/comment-popular-pagination.spec.ts)<br>[apps/api/src/modules/comments/comment-spam-protection.service.spec.ts](../../../apps/api/src/modules/comments/comment-spam-protection.service.spec.ts)<br>[apps/api/src/modules/comments/comments-spam-integration.spec.ts](../../../apps/api/src/modules/comments/comments-spam-integration.spec.ts)<br>[apps/api/src/modules/comments/comments.controller.spec.ts](../../../apps/api/src/modules/comments/comments.controller.spec.ts)<br>[apps/api/src/modules/comments/comments.service.spec.ts](../../../apps/api/src/modules/comments/comments.service.spec.ts)<br>[apps/web/src/features/articles/comment-pagination-client.spec.mjs](../../../apps/web/src/features/articles/comment-pagination-client.spec.mjs)<br>[apps/web/src/features/articles/comment-sort.spec.mjs](../../../apps/web/src/features/articles/comment-sort.spec.mjs)<br>[apps/web/src/features/articles/comment-spam-error.spec.mjs](../../../apps/web/src/features/articles/comment-spam-error.spec.mjs)<br>[packages/validation/src/comment.spec.ts](../../../packages/validation/src/comment.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Reproduzierbare vollständige echte PostgreSQL-/Redis-/BullMQ-/Prisma-Suite fehlt.


### 265 – Auth Tests — PARTIAL

**Bestand:** Guard/UserSync/Onboarding-Unit-Tests.

**Dateien:** [apps/api/src/modules/auth/account-status.guard.ts](../../../apps/api/src/modules/auth/account-status.guard.ts)<br>[apps/api/src/modules/auth/auth.controller.ts](../../../apps/api/src/modules/auth/auth.controller.ts)<br>[apps/api/src/modules/auth/auth.guard.ts](../../../apps/api/src/modules/auth/auth.guard.ts)<br>[apps/api/src/modules/auth/auth.module.ts](../../../apps/api/src/modules/auth/auth.module.ts)<br>[apps/api/src/modules/auth/auth.types.ts](../../../apps/api/src/modules/auth/auth.types.ts)<br>[apps/api/src/modules/auth/keycloak-jwt.service.ts](../../../apps/api/src/modules/auth/keycloak-jwt.service.ts)<br>[apps/api/src/modules/users/users.service.ts](../../../apps/api/src/modules/users/users.service.ts)<br>[apps/web/src/app/login/login](../../../apps/web/src/app/login/login)<br>[apps/web/src/app/login/login-client.tsx](../../../apps/web/src/app/login/login-client.tsx)<br>[apps/web/src/app/login/page.tsx](../../../apps/web/src/app/login/page.tsx)<br>[apps/web/src/features/auth/auth-provider.tsx](../../../apps/web/src/features/auth/auth-provider.tsx)

**Tests:** [apps/api/src/modules/auth/account-status-integration.spec.ts](../../../apps/api/src/modules/auth/account-status-integration.spec.ts)<br>[apps/api/src/modules/auth/account-status.guard.spec.ts](../../../apps/api/src/modules/auth/account-status.guard.spec.ts)<br>[apps/api/src/modules/auth/auth.controller.spec.ts](../../../apps/api/src/modules/auth/auth.controller.spec.ts)<br>[apps/api/src/modules/auth/auth.guard.spec.ts](../../../apps/api/src/modules/auth/auth.guard.spec.ts)<br>[apps/api/src/modules/users/users.service.spec.ts](../../../apps/api/src/modules/users/users.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Echte Email/Google/Verify/Logout/Reset/Club/Neutral-Browserkette fehlt.


### 266 – Moderation Tests — PARTIAL

**Bestand:** ACTIVE/LIMITED/BANNED-Guardtests.

**Dateien:** [apps/api/src/modules/auth/account-status.guard.ts](../../../apps/api/src/modules/auth/account-status.guard.ts)<br>[apps/api/src/modules/permissions/permissions.constants.ts](../../../apps/api/src/modules/permissions/permissions.constants.ts)<br>[apps/api/src/modules/permissions/permissions.guard.ts](../../../apps/api/src/modules/permissions/permissions.guard.ts)<br>[apps/api/src/modules/permissions/permissions.module.ts](../../../apps/api/src/modules/permissions/permissions.module.ts)<br>[apps/api/src/modules/permissions/permissions.service.ts](../../../apps/api/src/modules/permissions/permissions.service.ts)<br>[apps/api/src/modules/permissions/require-permissions.decorator.ts](../../../apps/api/src/modules/permissions/require-permissions.decorator.ts)

**Tests:** [apps/api/src/modules/auth/account-status-integration.spec.ts](../../../apps/api/src/modules/auth/account-status-integration.spec.ts)<br>[apps/api/src/modules/auth/account-status.guard.spec.ts](../../../apps/api/src/modules/auth/account-status.guard.spec.ts)<br>[apps/api/src/modules/permissions/article-publication-permission.spec.ts](../../../apps/api/src/modules/permissions/article-publication-permission.spec.ts)<br>[apps/api/src/modules/permissions/permissions-integration.spec.ts](../../../apps/api/src/modules/permissions/permissions-integration.spec.ts)<br>[apps/api/src/modules/permissions/permissions.guard.spec.ts](../../../apps/api/src/modules/permissions/permissions.guard.spec.ts)<br>[apps/api/src/modules/permissions/permissions.module.spec.ts](../../../apps/api/src/modules/permissions/permissions.module.spec.ts)<br>[apps/api/src/modules/permissions/permissions.service.spec.ts](../../../apps/api/src/modules/permissions/permissions.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Karten 1/2/3, Rot, Ablauf, Revoke und IP-Block nicht implementiert/getestet.


### 267 – Personalization Tests — PARTIAL

**Bestand:** Theme-/Contrast-Unit-Tests und Ranking-Service-Tests.

**Dateien:** [apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/personalization/club-theme.ts](../../../apps/web/src/features/personalization/club-theme.ts)<br>[apps/web/src/features/personalization/personalized-club-theme.tsx](../../../apps/web/src/features/personalization/personalized-club-theme.tsx)<br>[apps/web/src/features/personalization/personalized-startpage.tsx](../../../apps/web/src/features/personalization/personalized-startpage.tsx)<br>[apps/web/src/features/personalization/startpage-mock-data.ts](../../../apps/web/src/features/personalization/startpage-mock-data.ts)

**Tests:** [apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[apps/web/src/features/personalization/club-theme.spec.mjs](../../../apps/web/src/features/personalization/club-theme.spec.mjs)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Echter Club-/Neutralwechsel mit Auth/Browser/DB nicht getestet.


### 268 – Import Tests — PARTIAL

**Bestand:** Viele gemockte Provider-/Matching-/Retry-/Review-Tests.

**Dateien:** [apps/api/src/modules/imports/imports.controller.ts](../../../apps/api/src/modules/imports/imports.controller.ts)<br>[apps/api/src/modules/imports/imports.module.ts](../../../apps/api/src/modules/imports/imports.module.ts)<br>[apps/api/src/modules/imports/imports.service.ts](../../../apps/api/src/modules/imports/imports.service.ts)<br>[apps/web/src/features/admin/imports/import-admin.tsx](../../../apps/web/src/features/admin/imports/import-admin.tsx)<br>[apps/worker/src/jobs/news-import-scheduler.service.ts](../../../apps/worker/src/jobs/news-import-scheduler.service.ts)<br>[apps/worker/src/processors/news-import.processor.ts](../../../apps/worker/src/processors/news-import.processor.ts)<br>[apps/worker/src/providers/fake-news-normalizer.ts](../../../apps/worker/src/providers/fake-news-normalizer.ts)<br>[apps/worker/src/providers/fake-news-provider.ts](../../../apps/worker/src/providers/fake-news-provider.ts)<br>[apps/worker/src/providers/ots-news-normalizer.ts](../../../apps/worker/src/providers/ots-news-normalizer.ts)<br>[apps/worker/src/providers/ots-news-provider.ts](../../../apps/worker/src/providers/ots-news-provider.ts)<br>[apps/worker/src/services/news-auto-publishing.service.ts](../../../apps/worker/src/services/news-auto-publishing.service.ts)<br>[apps/worker/src/services/news-club-matching.service.ts](../../../apps/worker/src/services/news-club-matching.service.ts)<br>[apps/worker/src/services/news-competition-matching.service.ts](../../../apps/worker/src/services/news-competition-matching.service.ts)<br>[apps/worker/src/services/news-confidence-score.service.ts](../../../apps/worker/src/services/news-confidence-score.service.ts)<br>[apps/worker/src/services/news-duplicate-detection.service.ts](../../../apps/worker/src/services/news-duplicate-detection.service.ts)<br>[apps/worker/src/services/news-import-dead-letter.service.ts](../../../apps/worker/src/services/news-import-dead-letter.service.ts)<br>[apps/worker/src/services/news-match-matching.service.ts](../../../apps/worker/src/services/news-match-matching.service.ts)<br>[apps/worker/src/services/news-normalization.service.ts](../../../apps/worker/src/services/news-normalization.service.ts)<br>[apps/worker/src/services/news-review-workflow.service.ts](../../../apps/worker/src/services/news-review-workflow.service.ts)<br>[apps/worker/src/services/news-validation.service.ts](../../../apps/worker/src/services/news-validation.service.ts)<br>[apps/worker/src/services/raw-payload.service.ts](../../../apps/worker/src/services/raw-payload.service.ts)

**Tests:** [apps/api/src/modules/imports/imports.service.spec.ts](../../../apps/api/src/modules/imports/imports.service.spec.ts)<br>[apps/worker/src/jobs/news-import-scheduler.service.spec.ts](../../../apps/worker/src/jobs/news-import-scheduler.service.spec.ts)<br>[apps/worker/src/processors/news-import.processor.spec.ts](../../../apps/worker/src/processors/news-import.processor.spec.ts)<br>[apps/worker/src/providers/fake-news-normalizer.spec.ts](../../../apps/worker/src/providers/fake-news-normalizer.spec.ts)<br>[apps/worker/src/providers/fake-news-provider.spec.ts](../../../apps/worker/src/providers/fake-news-provider.spec.ts)<br>[apps/worker/src/providers/ots-news-normalizer.spec.ts](../../../apps/worker/src/providers/ots-news-normalizer.spec.ts)<br>[apps/worker/src/providers/ots-news-provider.spec.ts](../../../apps/worker/src/providers/ots-news-provider.spec.ts)<br>[apps/worker/src/services/news-auto-publishing.service.spec.ts](../../../apps/worker/src/services/news-auto-publishing.service.spec.ts)<br>[apps/worker/src/services/news-club-matching.service.spec.ts](../../../apps/worker/src/services/news-club-matching.service.spec.ts)<br>[apps/worker/src/services/news-competition-matching.service.spec.ts](../../../apps/worker/src/services/news-competition-matching.service.spec.ts)<br>[apps/worker/src/services/news-confidence-score.service.spec.ts](../../../apps/worker/src/services/news-confidence-score.service.spec.ts)<br>[apps/worker/src/services/news-duplicate-detection.service.spec.ts](../../../apps/worker/src/services/news-duplicate-detection.service.spec.ts)<br>[apps/worker/src/services/news-import-dead-letter.service.spec.ts](../../../apps/worker/src/services/news-import-dead-letter.service.spec.ts)<br>[apps/worker/src/services/news-match-matching.service.spec.ts](../../../apps/worker/src/services/news-match-matching.service.spec.ts)<br>[apps/worker/src/services/news-normalization.service.spec.ts](../../../apps/worker/src/services/news-normalization.service.spec.ts)<br>[apps/worker/src/services/news-review-workflow.service.spec.ts](../../../apps/worker/src/services/news-review-workflow.service.spec.ts)<br>[apps/worker/src/services/news-validation.service.spec.ts](../../../apps/worker/src/services/news-validation.service.spec.ts)<br>[apps/worker/src/services/raw-payload.service.spec.ts](../../../apps/worker/src/services/raw-payload.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Echter Pipeline-Durchlauf mit PostgreSQL/Redis und OTS-Fehler-/Replay-Abnahme fehlt.


### 269 – Sports Tests — PARTIAL

**Bestand:** Read-Services/Controller mit Unit-Tests.

**Dateien:** [apps/api/src/modules/clubs/clubs.controller.ts](../../../apps/api/src/modules/clubs/clubs.controller.ts)<br>[apps/api/src/modules/clubs/clubs.module.ts](../../../apps/api/src/modules/clubs/clubs.module.ts)<br>[apps/api/src/modules/clubs/clubs.service.ts](../../../apps/api/src/modules/clubs/clubs.service.ts)<br>[apps/api/src/modules/competitions/competitions.controller.ts](../../../apps/api/src/modules/competitions/competitions.controller.ts)<br>[apps/api/src/modules/competitions/competitions.module.ts](../../../apps/api/src/modules/competitions/competitions.module.ts)<br>[apps/api/src/modules/competitions/competitions.service.ts](../../../apps/api/src/modules/competitions/competitions.service.ts)<br>[apps/api/src/modules/matches/matches.controller.ts](../../../apps/api/src/modules/matches/matches.controller.ts)<br>[apps/api/src/modules/matches/matches.module.ts](../../../apps/api/src/modules/matches/matches.module.ts)<br>[apps/api/src/modules/matches/matches.service.ts](../../../apps/api/src/modules/matches/matches.service.ts)<br>[apps/api/src/modules/seasons/seasons.module.ts](../../../apps/api/src/modules/seasons/seasons.module.ts)<br>[apps/api/src/modules/standings/standings.controller.ts](../../../apps/api/src/modules/standings/standings.controller.ts)<br>[apps/api/src/modules/standings/standings.module.ts](../../../apps/api/src/modules/standings/standings.module.ts)<br>[apps/api/src/modules/standings/standings.service.ts](../../../apps/api/src/modules/standings/standings.service.ts)<br>[apps/web/src/features/clubs/club-detail.tsx](../../../apps/web/src/features/clubs/club-detail.tsx)<br>[apps/web/src/features/matches/match-detail.tsx](../../../apps/web/src/features/matches/match-detail.tsx)<br>[apps/web/src/features/matches/match-schedule-page.tsx](../../../apps/web/src/features/matches/match-schedule-page.tsx)<br>[apps/web/src/features/standings/standings-page.tsx](../../../apps/web/src/features/standings/standings-page.tsx)

**Tests:** [apps/api/src/modules/clubs/clubs.controller.spec.ts](../../../apps/api/src/modules/clubs/clubs.controller.spec.ts)<br>[apps/api/src/modules/clubs/clubs.service.spec.ts](../../../apps/api/src/modules/clubs/clubs.service.spec.ts)<br>[apps/api/src/modules/matches/matches.controller.spec.ts](../../../apps/api/src/modules/matches/matches.controller.spec.ts)<br>[apps/api/src/modules/matches/matches.service.spec.ts](../../../apps/api/src/modules/matches/matches.service.spec.ts)<br>[apps/api/src/modules/standings/standings.controller.spec.ts](../../../apps/api/src/modules/standings/standings.controller.spec.ts)<br>[apps/api/src/modules/standings/standings.service.spec.ts](../../../apps/api/src/modules/standings/standings.service.spec.ts)

**Nachweis:** Zugeordnete Unit-Tests bestanden; keine vollständige Feature-Abnahme.

**Fehlend:** Sportsprovider/Matching/Berechnung/Import/Correction haben keine Fachimplementierung oder Tests.


### 270 – E2E User Flow — BLOCKED

**Bestand:** API-E2E-Gerüst existiert, Stagingskript prüft Health-Endpunkte.

**Dateien:** [apps/api/test/app.e2e-spec.ts](../../../apps/api/test/app.e2e-spec.ts)<br>[apps/api/test/jest-e2e.json](../../../apps/api/test/jest-e2e.json)<br>[tests/e2e/staging.sh](../../../tests/e2e/staging.sh)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Aktuell reproduziert: 1 Suite fehlgeschlagen, 0 Tests.

**Fehlend:** Jest kann ESM aus packages/types nicht parsen; 0 Tests ausgeführt. Auch danach ist der Hello-World-Test veraltet; echte Userbrowserflows fehlen.


**Abhängigkeit:** E2E-Runner/realer Auth-Teststack; Aufgaben 093–108


### 271 – E2E Moderation Flow — BLOCKED

**Bestand:** Kein vollständiger Moderationsflow.

**Dateien:** [apps/api/src/modules/bans/bans.module.ts](../../../apps/api/src/modules/bans/bans.module.ts)<br>[apps/api/src/modules/moderation/moderation.module.ts](../../../apps/api/src/modules/moderation/moderation.module.ts)<br>[apps/api/src/modules/sanctions/sanctions.module.ts](../../../apps/api/src/modules/sanctions/sanctions.module.ts)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Kein entsprechender ausgeführter Test.

**Fehlend:** Report→Gelb→Notification→drittes Gelb→Rot→Revoke kann ohne Fachservices nicht getestet werden.


**Abhängigkeit:** 174–186, 224–228, 270


## Phase 29 – MONITORING


### 272 – API Monitoring — PARTIAL

**Bestand:** Health-/Worker-/Importlogs bzw. Backup-Fehlerexitcodes als technische Basis.

**Dateien:** [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts)<br>[apps/api/src/main.ts](../../../apps/api/src/main.ts)<br>[apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/worker/src/main.ts](../../../apps/worker/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifische Metriken, Dashboards, Retention und Alarmierung nicht implementiert/nachgewiesen.


### 273 – Worker Monitoring — PARTIAL

**Bestand:** Health-/Worker-/Importlogs bzw. Backup-Fehlerexitcodes als technische Basis.

**Dateien:** [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts)<br>[apps/api/src/main.ts](../../../apps/api/src/main.ts)<br>[apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/worker/src/main.ts](../../../apps/worker/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifische Metriken, Dashboards, Retention und Alarmierung nicht implementiert/nachgewiesen.


### 274 – Import Monitoring — PARTIAL

**Bestand:** Health-/Worker-/Importlogs bzw. Backup-Fehlerexitcodes als technische Basis.

**Dateien:** [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts)<br>[apps/api/src/main.ts](../../../apps/api/src/main.ts)<br>[apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/worker/src/main.ts](../../../apps/worker/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifische Metriken, Dashboards, Retention und Alarmierung nicht implementiert/nachgewiesen.


### 275 – Moderation Monitoring — TODO

**Bestand:** Health-/Worker-/Importlogs bzw. Backup-Fehlerexitcodes als technische Basis.

**Dateien:** [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts)<br>[apps/api/src/main.ts](../../../apps/api/src/main.ts)<br>[apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/worker/src/main.ts](../../../apps/worker/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifische Metriken, Dashboards, Retention und Alarmierung nicht implementiert/nachgewiesen.


### 276 – CPU / RAM Monitoring — TODO

**Bestand:** Health-/Worker-/Importlogs bzw. Backup-Fehlerexitcodes als technische Basis.

**Dateien:** [docs/architecture/object-storage-backup.md](../../../docs/architecture/object-storage-backup.md)<br>[docs/architecture/restore-test.md](../../../docs/architecture/restore-test.md)<br>[infrastructure/scripts/backup/keycloak.sh](../../../infrastructure/scripts/backup/keycloak.sh)<br>[infrastructure/scripts/backup/postgres.sh](../../../infrastructure/scripts/backup/postgres.sh)<br>[infrastructure/scripts/backup/rotation.sh](../../../infrastructure/scripts/backup/rotation.sh)<br>[infrastructure/scripts/restore/keycloak.sh](../../../infrastructure/scripts/restore/keycloak.sh)<br>[infrastructure/scripts/restore/postgres.sh](../../../infrastructure/scripts/restore/postgres.sh)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer](../../../infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer](../../../infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup@.service](../../../infrastructure/systemd/kurvenfunk-keycloak-backup@.service)<br>[infrastructure/systemd/kurvenfunk-postgres-backup-production.timer](../../../infrastructure/systemd/kurvenfunk-postgres-backup-production.timer)<br>[infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer](../../../infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer)<br>[infrastructure/systemd/kurvenfunk-postgres-backup@.service](../../../infrastructure/systemd/kurvenfunk-postgres-backup@.service)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifische Metriken, Dashboards, Retention und Alarmierung nicht implementiert/nachgewiesen.


### 277 – Disk Monitoring — TODO

**Bestand:** Health-/Worker-/Importlogs bzw. Backup-Fehlerexitcodes als technische Basis.

**Dateien:** [docs/architecture/object-storage-backup.md](../../../docs/architecture/object-storage-backup.md)<br>[docs/architecture/restore-test.md](../../../docs/architecture/restore-test.md)<br>[infrastructure/scripts/backup/keycloak.sh](../../../infrastructure/scripts/backup/keycloak.sh)<br>[infrastructure/scripts/backup/postgres.sh](../../../infrastructure/scripts/backup/postgres.sh)<br>[infrastructure/scripts/backup/rotation.sh](../../../infrastructure/scripts/backup/rotation.sh)<br>[infrastructure/scripts/restore/keycloak.sh](../../../infrastructure/scripts/restore/keycloak.sh)<br>[infrastructure/scripts/restore/postgres.sh](../../../infrastructure/scripts/restore/postgres.sh)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer](../../../infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer](../../../infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup@.service](../../../infrastructure/systemd/kurvenfunk-keycloak-backup@.service)<br>[infrastructure/systemd/kurvenfunk-postgres-backup-production.timer](../../../infrastructure/systemd/kurvenfunk-postgres-backup-production.timer)<br>[infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer](../../../infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer)<br>[infrastructure/systemd/kurvenfunk-postgres-backup@.service](../../../infrastructure/systemd/kurvenfunk-postgres-backup@.service)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifische Metriken, Dashboards, Retention und Alarmierung nicht implementiert/nachgewiesen.


### 278 – Backup Monitoring — PARTIAL

**Bestand:** Health-/Worker-/Importlogs bzw. Backup-Fehlerexitcodes als technische Basis.

**Dateien:** [docs/architecture/object-storage-backup.md](../../../docs/architecture/object-storage-backup.md)<br>[docs/architecture/restore-test.md](../../../docs/architecture/restore-test.md)<br>[infrastructure/scripts/backup/keycloak.sh](../../../infrastructure/scripts/backup/keycloak.sh)<br>[infrastructure/scripts/backup/postgres.sh](../../../infrastructure/scripts/backup/postgres.sh)<br>[infrastructure/scripts/backup/rotation.sh](../../../infrastructure/scripts/backup/rotation.sh)<br>[infrastructure/scripts/restore/keycloak.sh](../../../infrastructure/scripts/restore/keycloak.sh)<br>[infrastructure/scripts/restore/postgres.sh](../../../infrastructure/scripts/restore/postgres.sh)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer](../../../infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer](../../../infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup@.service](../../../infrastructure/systemd/kurvenfunk-keycloak-backup@.service)<br>[infrastructure/systemd/kurvenfunk-postgres-backup-production.timer](../../../infrastructure/systemd/kurvenfunk-postgres-backup-production.timer)<br>[infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer](../../../infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer)<br>[infrastructure/systemd/kurvenfunk-postgres-backup@.service](../../../infrastructure/systemd/kurvenfunk-postgres-backup@.service)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifische Metriken, Dashboards, Retention und Alarmierung nicht implementiert/nachgewiesen.


## Phase 30 – SEO & ACCESSIBILITY


### 279 – Semantic HTML — PARTIAL

**Bestand:** Semantische Elemente/Labels/Dialoge/ARIA teilweise vorhanden.

**Dateien:** [apps/web/src/app/design-system/design-system-client.tsx](../../../apps/web/src/app/design-system/design-system-client.tsx)<br>[apps/web/src/app/design-system/page.tsx](../../../apps/web/src/app/design-system/page.tsx)<br>[packages/ui/src/components/button.tsx](../../../packages/ui/src/components/button.tsx)<br>[packages/ui/src/components/display.tsx](../../../packages/ui/src/components/display.tsx)<br>[packages/ui/src/components/form-controls.tsx](../../../packages/ui/src/components/form-controls.tsx)<br>[packages/ui/src/components/interactive.tsx](../../../packages/ui/src/components/interactive.tsx)<br>[packages/ui/src/components/overlays.tsx](../../../packages/ui/src/components/overlays.tsx)<br>[packages/ui/src/styles/components.css](../../../packages/ui/src/styles/components.css)<br>[packages/ui/src/styles/tokens.css](../../../packages/ui/src/styles/tokens.css)<br>[packages/ui/src/tokens.ts](../../../packages/ui/src/tokens.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Keine vollständige Keyboard-/Screenreader-/automatisierte A11y-/Mobile-Prüfung; Komponentenexistenz genügt nicht.


### 280 – Keyboard Navigation — PARTIAL

**Bestand:** Semantische Elemente/Labels/Dialoge/ARIA teilweise vorhanden.

**Dateien:** [apps/web/src/app/design-system/design-system-client.tsx](../../../apps/web/src/app/design-system/design-system-client.tsx)<br>[apps/web/src/app/design-system/page.tsx](../../../apps/web/src/app/design-system/page.tsx)<br>[packages/ui/src/components/button.tsx](../../../packages/ui/src/components/button.tsx)<br>[packages/ui/src/components/display.tsx](../../../packages/ui/src/components/display.tsx)<br>[packages/ui/src/components/form-controls.tsx](../../../packages/ui/src/components/form-controls.tsx)<br>[packages/ui/src/components/interactive.tsx](../../../packages/ui/src/components/interactive.tsx)<br>[packages/ui/src/components/overlays.tsx](../../../packages/ui/src/components/overlays.tsx)<br>[packages/ui/src/styles/components.css](../../../packages/ui/src/styles/components.css)<br>[packages/ui/src/styles/tokens.css](../../../packages/ui/src/styles/tokens.css)<br>[packages/ui/src/tokens.ts](../../../packages/ui/src/tokens.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Keine vollständige Keyboard-/Screenreader-/automatisierte A11y-/Mobile-Prüfung; Komponentenexistenz genügt nicht.


### 281 – Screenreader Support — PARTIAL

**Bestand:** Semantische Elemente/Labels/Dialoge/ARIA teilweise vorhanden.

**Dateien:** [apps/web/src/app/design-system/design-system-client.tsx](../../../apps/web/src/app/design-system/design-system-client.tsx)<br>[apps/web/src/app/design-system/page.tsx](../../../apps/web/src/app/design-system/page.tsx)<br>[packages/ui/src/components/button.tsx](../../../packages/ui/src/components/button.tsx)<br>[packages/ui/src/components/display.tsx](../../../packages/ui/src/components/display.tsx)<br>[packages/ui/src/components/form-controls.tsx](../../../packages/ui/src/components/form-controls.tsx)<br>[packages/ui/src/components/interactive.tsx](../../../packages/ui/src/components/interactive.tsx)<br>[packages/ui/src/components/overlays.tsx](../../../packages/ui/src/components/overlays.tsx)<br>[packages/ui/src/styles/components.css](../../../packages/ui/src/styles/components.css)<br>[packages/ui/src/styles/tokens.css](../../../packages/ui/src/styles/tokens.css)<br>[packages/ui/src/tokens.ts](../../../packages/ui/src/tokens.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Keine vollständige Keyboard-/Screenreader-/automatisierte A11y-/Mobile-Prüfung; Komponentenexistenz genügt nicht.


### 282 – Club Branding Accessibility — PARTIAL

**Bestand:** Kontrastberechnung und sichere Text-/Akzentfarben im Theme.

**Dateien:** [apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/personalization/club-theme.ts](../../../apps/web/src/features/personalization/club-theme.ts)<br>[apps/web/src/features/personalization/personalized-club-theme.tsx](../../../apps/web/src/features/personalization/personalized-club-theme.tsx)<br>[apps/web/src/features/personalization/personalized-startpage.tsx](../../../apps/web/src/features/personalization/personalized-startpage.tsx)<br>[apps/web/src/features/personalization/startpage-mock-data.ts](../../../apps/web/src/features/personalization/startpage-mock-data.ts)

**Tests:** [apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[apps/web/src/features/personalization/club-theme.spec.mjs](../../../apps/web/src/features/personalization/club-theme.spec.mjs)

**Nachweis:** Theme-Kontrast-Unit-Tests bestanden.

**Fehlend:** Gesamte UI mit allen Vereinsfarben und Zuständen nicht nach WCAG geprüft.


### 283 – Sitemap — TODO

**Bestand:** Keine sitemap/robots-Route oder entsprechende Datei gefunden.

**Dateien:** [apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/web/src/app/layout.tsx](../../../apps/web/src/app/layout.tsx)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Generierung/Indexierungspolicy und Crawler-Abnahme fehlen.


### 284 – robots.txt — TODO

**Bestand:** Keine sitemap/robots-Route oder entsprechende Datei gefunden.

**Dateien:** [apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/web/src/app/layout.tsx](../../../apps/web/src/app/layout.tsx)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Generierung/Indexierungspolicy und Crawler-Abnahme fehlen.


### 285 – Canonicals — PARTIAL

**Bestand:** Artikelseite generiert Canonical/OpenGraph/Twitter-Metadaten.

**Dateien:** [apps/web/src/app/artikel/[slug]/page.tsx](../../../apps/web/src/app/artikel/[slug]/page.tsx)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Siteweite Clubs/Spiele/Listen/Canonicalstrategie und Crawler-Tests fehlen.


### 286 – OpenGraph — PARTIAL

**Bestand:** Artikelseite generiert Canonical/OpenGraph/Twitter-Metadaten.

**Dateien:** [apps/web/src/app/artikel/[slug]/page.tsx](../../../apps/web/src/app/artikel/[slug]/page.tsx)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Siteweite Clubs/Spiele/Listen/Canonicalstrategie und Crawler-Tests fehlen.


### 287 – Structured Data — TODO

**Bestand:** SEO-Metadaten vorhanden, keine JSON-LD-Implementierung gefunden.

**Dateien:** [apps/web/src/app/artikel/[slug]/page.tsx](../../../apps/web/src/app/artikel/[slug]/page.tsx)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** NewsArticle/SportsEvent/BreadcrumbList/Organization und Validierung fehlen.


## Phase 31 – PRODUCTION PREPARATION


### 288 – Production Secrets erzeugen — UNKNOWN

**Bestand:** Konfigurationsgrundlagen vorhanden.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Nicht ausgeführt; keine Betriebsbehauptung.

**Fehlend:** Reale Produktions-Secrets bzw. Dienstkonfiguration außerhalb des Repositorys nicht geprüft; kein Produktionszugriff erlaubt.


### 289 – Production Keycloak finalisieren — UNKNOWN

**Bestand:** Konfigurationsgrundlagen vorhanden.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Nicht ausgeführt; keine Betriebsbehauptung.

**Fehlend:** Reale Produktions-Secrets bzw. Dienstkonfiguration außerhalb des Repositorys nicht geprüft; kein Produktionszugriff erlaubt.


### 290 – Production PostgreSQL finalisieren — UNKNOWN

**Bestand:** Konfigurationsgrundlagen vorhanden.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Nicht ausgeführt; keine Betriebsbehauptung.

**Fehlend:** Reale Produktions-Secrets bzw. Dienstkonfiguration außerhalb des Repositorys nicht geprüft; kein Produktionszugriff erlaubt.


### 291 – Production Redis finalisieren — UNKNOWN

**Bestand:** Konfigurationsgrundlagen vorhanden.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Nicht ausgeführt; keine Betriebsbehauptung.

**Fehlend:** Reale Produktions-Secrets bzw. Dienstkonfiguration außerhalb des Repositorys nicht geprüft; kein Produktionszugriff erlaubt.


### 292 – Production Meilisearch finalisieren — UNKNOWN

**Bestand:** Konfigurationsgrundlagen vorhanden.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Nicht ausgeführt; keine Betriebsbehauptung.

**Fehlend:** Reale Produktions-Secrets bzw. Dienstkonfiguration außerhalb des Repositorys nicht geprüft; kein Produktionszugriff erlaubt.


### 293 – Production R2 — UNKNOWN

**Bestand:** Konfigurationsgrundlagen vorhanden.

**Dateien:** [.env.example](../../../.env.example)<br>[compose.dev.yml](../../../compose.dev.yml)<br>[compose.prod.yml](../../../compose.prod.yml)<br>[compose.staging.yml](../../../compose.staging.yml)<br>[compose.yml](../../../compose.yml)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Nicht ausgeführt; keine Betriebsbehauptung.

**Fehlend:** Reale Produktions-Secrets bzw. Dienstkonfiguration außerhalb des Repositorys nicht geprüft; kein Produktionszugriff erlaubt.


### 294 – Backup Restore Test — UNKNOWN

**Bestand:** Historischer Restorebericht vorhanden.

**Dateien:** [docs/architecture/object-storage-backup.md](../../../docs/architecture/object-storage-backup.md)<br>[docs/architecture/restore-test.md](../../../docs/architecture/restore-test.md)<br>[infrastructure/scripts/backup/keycloak.sh](../../../infrastructure/scripts/backup/keycloak.sh)<br>[infrastructure/scripts/backup/postgres.sh](../../../infrastructure/scripts/backup/postgres.sh)<br>[infrastructure/scripts/backup/rotation.sh](../../../infrastructure/scripts/backup/rotation.sh)<br>[infrastructure/scripts/restore/keycloak.sh](../../../infrastructure/scripts/restore/keycloak.sh)<br>[infrastructure/scripts/restore/postgres.sh](../../../infrastructure/scripts/restore/postgres.sh)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer](../../../infrastructure/systemd/kurvenfunk-keycloak-backup-production.timer)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer](../../../infrastructure/systemd/kurvenfunk-keycloak-backup-staging.timer)<br>[infrastructure/systemd/kurvenfunk-keycloak-backup@.service](../../../infrastructure/systemd/kurvenfunk-keycloak-backup@.service)<br>[infrastructure/systemd/kurvenfunk-postgres-backup-production.timer](../../../infrastructure/systemd/kurvenfunk-postgres-backup-production.timer)<br>[infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer](../../../infrastructure/systemd/kurvenfunk-postgres-backup-staging.timer)<br>[infrastructure/systemd/kurvenfunk-postgres-backup@.service](../../../infrastructure/systemd/kurvenfunk-postgres-backup@.service)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aktueller realistischer Gesamt-Restore inkl. Uploads/Secrets/Versionen nicht durch Rohbelege nachgewiesen.


### 295 – Security Audit — PARTIAL

**Bestand:** Dieser Code-/Konfigurationsaudit mit lokalen Checks liegt vor.

**Dateien:** [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts)<br>[apps/api/src/main.ts](../../../apps/api/src/main.ts)<br>[apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/worker/src/main.ts](../../../apps/worker/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Security-Abnahme/Penetrationstest/Behebung und Retest der Findings fehlen; Auditbericht ist keine Freigabe.


### 296 – Privacy Audit — PARTIAL

**Bestand:** Datenschutzlücken in diesem Audit erfasst.

**Dateien:** [apps/web/src/features/settings/user-settings-page.tsx](../../../apps/web/src/features/settings/user-settings-page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Fachlich/rechtliche Datenschutzabnahme, Retention/Export/Löschung/HMAC fehlen.


### 297 – Load Test — TODO

**Bestand:** Kein Matchday-Lasttest im überprüften Bestand.

**Dateien:** [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts)<br>[apps/api/src/main.ts](../../../apps/api/src/main.ts)<br>[apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/worker/src/main.ts](../../../apps/worker/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Gestufte 100/250/500/1000-User-Szenarien mit Messung und Abbruchkriterien fehlen.


### 298 – Impressum — TODO

**Bestand:** Keine passende Rechts-/Community-/Moderationsrichtlinien-Dokumentation gefunden.

**Dateien:** [README.md](../../../README.md)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifischen Text erstellen und rechtlich/fachlich freigeben; nicht aus technischen Modellen ableiten.


### 299 – Datenschutzerklärung — TODO

**Bestand:** Keine passende Rechts-/Community-/Moderationsrichtlinien-Dokumentation gefunden.

**Dateien:** [README.md](../../../README.md)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifischen Text erstellen und rechtlich/fachlich freigeben; nicht aus technischen Modellen ableiten.


### 300 – Nutzungsbedingungen — TODO

**Bestand:** Keine passende Rechts-/Community-/Moderationsrichtlinien-Dokumentation gefunden.

**Dateien:** [README.md](../../../README.md)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifischen Text erstellen und rechtlich/fachlich freigeben; nicht aus technischen Modellen ableiten.


### 301 – Community Guidelines — TODO

**Bestand:** Keine passende Rechts-/Community-/Moderationsrichtlinien-Dokumentation gefunden.

**Dateien:** [README.md](../../../README.md)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifischen Text erstellen und rechtlich/fachlich freigeben; nicht aus technischen Modellen ableiten.


### 302 – Moderationsrichtlinien intern — TODO

**Bestand:** Keine passende Rechts-/Community-/Moderationsrichtlinien-Dokumentation gefunden.

**Dateien:** [README.md](../../../README.md)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifischen Text erstellen und rechtlich/fachlich freigeben; nicht aus technischen Modellen ableiten.


## Phase 32 – BETA


### 303 – Testdaten entfernen — UNKNOWN

**Bestand:** Seed/Demodaten vorhanden.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Produktionsdatenbestand und Bereinigung nicht geprüft; kein Produktionszugriff.


### 304 – echte Vereine importieren — PARTIAL

**Bestand:** 28 reale Vereinsidentitäten mit Farben/Aliases und lokalen Logoassets im Seed.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Lokale Clubs-API liefert 28 Einträge; kein Nachweis produktiver Importdaten.

**Fehlend:** Vollständigkeit, Saisonzuordnung, Logoquellen-/Rechte und echter Import/Beta-Datenabnahme fehlen.


### 305 – Saison importieren — PARTIAL

**Bestand:** Saison-/Spiel-Seed und Lese-API vorhanden.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Kein echter Sportsprovider-Import bzw. Beta-Bestandsabnahme.


### 306 – Spiele importieren — PARTIAL

**Bestand:** Saison-/Spiel-Seed und Lese-API vorhanden.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Kein echter Sportsprovider-Import bzw. Beta-Bestandsabnahme.


### 307 – echten Newsprovider aktivieren — BLOCKED

**Bestand:** OTS-Code vorhanden; lokale Entwicklung nutzt fake.

**Dateien:** [apps/api/src/modules/imports/imports.controller.ts](../../../apps/api/src/modules/imports/imports.controller.ts)<br>[apps/api/src/modules/imports/imports.module.ts](../../../apps/api/src/modules/imports/imports.module.ts)<br>[apps/api/src/modules/imports/imports.service.ts](../../../apps/api/src/modules/imports/imports.service.ts)<br>[apps/web/src/features/admin/imports/import-admin.tsx](../../../apps/web/src/features/admin/imports/import-admin.tsx)<br>[apps/worker/src/jobs/news-import-scheduler.service.ts](../../../apps/worker/src/jobs/news-import-scheduler.service.ts)<br>[apps/worker/src/processors/news-import.processor.ts](../../../apps/worker/src/processors/news-import.processor.ts)<br>[apps/worker/src/providers/fake-news-normalizer.ts](../../../apps/worker/src/providers/fake-news-normalizer.ts)<br>[apps/worker/src/providers/fake-news-provider.ts](../../../apps/worker/src/providers/fake-news-provider.ts)<br>[apps/worker/src/providers/ots-news-normalizer.ts](../../../apps/worker/src/providers/ots-news-normalizer.ts)<br>[apps/worker/src/providers/ots-news-provider.ts](../../../apps/worker/src/providers/ots-news-provider.ts)<br>[apps/worker/src/services/news-auto-publishing.service.ts](../../../apps/worker/src/services/news-auto-publishing.service.ts)<br>[apps/worker/src/services/news-club-matching.service.ts](../../../apps/worker/src/services/news-club-matching.service.ts)<br>[apps/worker/src/services/news-competition-matching.service.ts](../../../apps/worker/src/services/news-competition-matching.service.ts)<br>[apps/worker/src/services/news-confidence-score.service.ts](../../../apps/worker/src/services/news-confidence-score.service.ts)<br>[apps/worker/src/services/news-duplicate-detection.service.ts](../../../apps/worker/src/services/news-duplicate-detection.service.ts)<br>[apps/worker/src/services/news-import-dead-letter.service.ts](../../../apps/worker/src/services/news-import-dead-letter.service.ts)<br>[apps/worker/src/services/news-match-matching.service.ts](../../../apps/worker/src/services/news-match-matching.service.ts)<br>[apps/worker/src/services/news-normalization.service.ts](../../../apps/worker/src/services/news-normalization.service.ts)<br>[apps/worker/src/services/news-review-workflow.service.ts](../../../apps/worker/src/services/news-review-workflow.service.ts)<br>[apps/worker/src/services/news-validation.service.ts](../../../apps/worker/src/services/news-validation.service.ts)<br>[apps/worker/src/services/raw-payload.service.ts](../../../apps/worker/src/services/raw-payload.service.ts)

**Tests:** [apps/api/src/modules/imports/imports.service.spec.ts](../../../apps/api/src/modules/imports/imports.service.spec.ts)<br>[apps/worker/src/jobs/news-import-scheduler.service.spec.ts](../../../apps/worker/src/jobs/news-import-scheduler.service.spec.ts)<br>[apps/worker/src/processors/news-import.processor.spec.ts](../../../apps/worker/src/processors/news-import.processor.spec.ts)<br>[apps/worker/src/providers/fake-news-normalizer.spec.ts](../../../apps/worker/src/providers/fake-news-normalizer.spec.ts)<br>[apps/worker/src/providers/fake-news-provider.spec.ts](../../../apps/worker/src/providers/fake-news-provider.spec.ts)<br>[apps/worker/src/providers/ots-news-normalizer.spec.ts](../../../apps/worker/src/providers/ots-news-normalizer.spec.ts)<br>[apps/worker/src/providers/ots-news-provider.spec.ts](../../../apps/worker/src/providers/ots-news-provider.spec.ts)<br>[apps/worker/src/services/news-auto-publishing.service.spec.ts](../../../apps/worker/src/services/news-auto-publishing.service.spec.ts)<br>[apps/worker/src/services/news-club-matching.service.spec.ts](../../../apps/worker/src/services/news-club-matching.service.spec.ts)<br>[apps/worker/src/services/news-competition-matching.service.spec.ts](../../../apps/worker/src/services/news-competition-matching.service.spec.ts)<br>[apps/worker/src/services/news-confidence-score.service.spec.ts](../../../apps/worker/src/services/news-confidence-score.service.spec.ts)<br>[apps/worker/src/services/news-duplicate-detection.service.spec.ts](../../../apps/worker/src/services/news-duplicate-detection.service.spec.ts)<br>[apps/worker/src/services/news-import-dead-letter.service.spec.ts](../../../apps/worker/src/services/news-import-dead-letter.service.spec.ts)<br>[apps/worker/src/services/news-match-matching.service.spec.ts](../../../apps/worker/src/services/news-match-matching.service.spec.ts)<br>[apps/worker/src/services/news-normalization.service.spec.ts](../../../apps/worker/src/services/news-normalization.service.spec.ts)<br>[apps/worker/src/services/news-review-workflow.service.spec.ts](../../../apps/worker/src/services/news-review-workflow.service.spec.ts)<br>[apps/worker/src/services/news-validation.service.spec.ts](../../../apps/worker/src/services/news-validation.service.spec.ts)<br>[apps/worker/src/services/raw-payload.service.spec.ts](../../../apps/worker/src/services/raw-payload.service.spec.ts)

**Nachweis:** Kein OTS-Netzaufruf/keine Aktivierung.

**Fehlend:** Providerrechte, sicherer Integrationstest und Review-/Monitoringabnahme vor Aktivierung erforderlich.


**Abhängigkeit:** 161, 268, 274


### 308 – Initial Content — PARTIAL

**Bestand:** Demo-/Seedartikel für Entwicklung.

**Dateien:** [packages/database/prisma/migrations/20260814035327_initial/migration.sql](../../../packages/database/prisma/migrations/20260814035327_initial/migration.sql)<br>[packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql](../../../packages/database/prisma/migrations/20260814220000_nickname_case_insensitive_unique/migration.sql)<br>[packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql](../../../packages/database/prisma/migrations/20260814223000_club_color_model/migration.sql)<br>[packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql](../../../packages/database/prisma/migrations/20260815050000_add_article_top_news/migration.sql)<br>[packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql](../../../packages/database/prisma/migrations/20260825001334_add_article_seo_fields/migration.sql)<br>[packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql](../../../packages/database/prisma/migrations/20260825004332_add_article_revisions/migration.sql)<br>[packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql](../../../packages/database/prisma/migrations/20260826220000_add_import_record_normalization/migration.sql)<br>[packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql](../../../packages/database/prisma/migrations/20260827010000_add_import_review_workflow/migration.sql)<br>[packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql](../../../packages/database/prisma/migrations/20261014030000_add_vote_types/migration.sql)<br>[packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql](../../../packages/database/prisma/migrations/20261014030100_reaction_vote_constraints/migration.sql)<br>[packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql](../../../packages/database/prisma/migrations/20261015000000_unique_comment_reports/migration.sql)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)<br>[packages/database/prisma/seed.ts](../../../packages/database/prisma/seed.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Redaktionell freigegebener echter Startinhalt und Bildrechte fehlen als Nachweis.


### 309 – Closed Beta — BLOCKED

**Bestand:** Keine dokumentierten Betaresultate im Repository.

**Dateien:** [apps/api/src/modules/auth/account-status.guard.ts](../../../apps/api/src/modules/auth/account-status.guard.ts)<br>[apps/api/src/modules/auth/auth.controller.ts](../../../apps/api/src/modules/auth/auth.controller.ts)<br>[apps/api/src/modules/auth/auth.guard.ts](../../../apps/api/src/modules/auth/auth.guard.ts)<br>[apps/api/src/modules/auth/auth.module.ts](../../../apps/api/src/modules/auth/auth.module.ts)<br>[apps/api/src/modules/auth/auth.types.ts](../../../apps/api/src/modules/auth/auth.types.ts)<br>[apps/api/src/modules/auth/keycloak-jwt.service.ts](../../../apps/api/src/modules/auth/keycloak-jwt.service.ts)<br>[apps/api/src/modules/users/users.service.ts](../../../apps/api/src/modules/users/users.service.ts)<br>[apps/web/src/app/login/login](../../../apps/web/src/app/login/login)<br>[apps/web/src/app/login/login-client.tsx](../../../apps/web/src/app/login/login-client.tsx)<br>[apps/web/src/app/login/page.tsx](../../../apps/web/src/app/login/page.tsx)<br>[apps/web/src/features/auth/auth-provider.tsx](../../../apps/web/src/features/auth/auth-provider.tsx)

**Tests:** [apps/api/src/modules/auth/account-status-integration.spec.ts](../../../apps/api/src/modules/auth/account-status-integration.spec.ts)<br>[apps/api/src/modules/auth/account-status.guard.spec.ts](../../../apps/api/src/modules/auth/account-status.guard.spec.ts)<br>[apps/api/src/modules/auth/auth.controller.spec.ts](../../../apps/api/src/modules/auth/auth.controller.spec.ts)<br>[apps/api/src/modules/auth/auth.guard.spec.ts](../../../apps/api/src/modules/auth/auth.guard.spec.ts)<br>[apps/api/src/modules/users/users.service.spec.ts](../../../apps/api/src/modules/users/users.service.spec.ts)

**Nachweis:** Nicht durchgeführt.

**Fehlend:** Beta mit 10–30 Teilnehmern erst nach Auth-/Moderations-/Security-Gates; keine Benutzer kontaktiert.


**Abhängigkeit:** 270, 271, 295–302


### 310 – Personalization Feedback — BLOCKED

**Bestand:** Keine echten Beta-Feedbackdaten vorhanden.

**Dateien:** [apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/personalization/club-theme.ts](../../../apps/web/src/features/personalization/club-theme.ts)<br>[apps/web/src/features/personalization/personalized-club-theme.tsx](../../../apps/web/src/features/personalization/personalized-club-theme.tsx)<br>[apps/web/src/features/personalization/personalized-startpage.tsx](../../../apps/web/src/features/personalization/personalized-startpage.tsx)<br>[apps/web/src/features/personalization/startpage-mock-data.ts](../../../apps/web/src/features/personalization/startpage-mock-data.ts)

**Tests:** [apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[apps/web/src/features/personalization/club-theme.spec.mjs](../../../apps/web/src/features/personalization/club-theme.spec.mjs)

**Nachweis:** Nicht durchgeführt.

**Fehlend:** Strukturiertes Feedback zu Clubbranding/Ranking/Neutral nach funktionierender Beta erheben.


**Abhängigkeit:** 309


### 311 – Moderation Beta Test — BLOCKED

**Bestand:** Karten-/Ban-Fachsystem nicht fertig.

**Dateien:** [apps/api/src/modules/bans/bans.module.ts](../../../apps/api/src/modules/bans/bans.module.ts)<br>[apps/api/src/modules/moderation/moderation.module.ts](../../../apps/api/src/modules/moderation/moderation.module.ts)<br>[apps/api/src/modules/sanctions/sanctions.module.ts](../../../apps/api/src/modules/sanctions/sanctions.module.ts)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Nicht durchgeführt.

**Fehlend:** Gezielter Betatest erst nach Moderationsimplementierung.


**Abhängigkeit:** 174–191, 271, 309


### 312 – Bugs klassifizieren — PARTIAL

**Bestand:** Priorisierte Findings in diesem Audit.

**Dateien:** [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts)<br>[apps/api/src/main.ts](../../../apps/api/src/main.ts)<br>[apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/worker/src/main.ts](../../../apps/worker/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Dauerhaftes Bugregister mit Verantwortlichen/Acceptance und Betriebsfeedback fehlt.


### 313 – Critical Bugs beheben — BLOCKED

**Bestand:** Befunde und vorgeschlagene Arbeitspakete vorhanden.

**Dateien:** [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts)<br>[apps/api/src/main.ts](../../../apps/api/src/main.ts)<br>[apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/worker/src/main.ts](../../../apps/worker/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Kein Anwendungscode geändert.

**Fehlend:** Keine Fixes beauftragt/umgesetzt; Retests nach separater Freigabe erforderlich.


**Abhängigkeit:** Freigabe der Behebung; Audit-Findings


### 314 – High Bugs beheben — BLOCKED

**Bestand:** Befunde und vorgeschlagene Arbeitspakete vorhanden.

**Dateien:** [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts)<br>[apps/api/src/main.ts](../../../apps/api/src/main.ts)<br>[apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/worker/src/main.ts](../../../apps/worker/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Kein Anwendungscode geändert.

**Fehlend:** Keine Fixes beauftragt/umgesetzt; Retests nach separater Freigabe erforderlich.


**Abhängigkeit:** Freigabe der Behebung; Audit-Findings


## Phase 33 – SOFT LAUNCH


### 315 – Production Deployment — UNKNOWN

**Bestand:** Deployment-/Routinggrundlagen vorhanden.

**Dateien:** [.github/workflows/ci.yml](../../../.github/workflows/ci.yml)<br>[.github/workflows/production.yml](../../../.github/workflows/production.yml)<br>[infrastructure/scripts/deploy/dev.sh](../../../infrastructure/scripts/deploy/dev.sh)<br>[infrastructure/scripts/deploy/production.sh](../../../infrastructure/scripts/deploy/production.sh)<br>[infrastructure/scripts/deploy/rollback.sh](../../../infrastructure/scripts/deploy/rollback.sh)<br>[infrastructure/scripts/deploy/staging.sh](../../../infrastructure/scripts/deploy/staging.sh)<br>[tests/e2e/staging.sh](../../../tests/e2e/staging.sh)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Nicht ausgeführt; kein Produktions-VPS-/Domainzugriff.

**Fehlend:** Öffentlicher Produktionsstatus bzw. Registrierungsöffnung nicht geprüft; Zugriff/Deployment ausdrücklich ausgeschlossen.


### 316 – kurvenfunk.at aktivieren — UNKNOWN

**Bestand:** Deployment-/Routinggrundlagen vorhanden.

**Dateien:** [.github/workflows/ci.yml](../../../.github/workflows/ci.yml)<br>[.github/workflows/production.yml](../../../.github/workflows/production.yml)<br>[infrastructure/scripts/deploy/dev.sh](../../../infrastructure/scripts/deploy/dev.sh)<br>[infrastructure/scripts/deploy/production.sh](../../../infrastructure/scripts/deploy/production.sh)<br>[infrastructure/scripts/deploy/rollback.sh](../../../infrastructure/scripts/deploy/rollback.sh)<br>[infrastructure/scripts/deploy/staging.sh](../../../infrastructure/scripts/deploy/staging.sh)<br>[tests/e2e/staging.sh](../../../tests/e2e/staging.sh)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Nicht ausgeführt; kein Produktions-VPS-/Domainzugriff.

**Fehlend:** Öffentlicher Produktionsstatus bzw. Registrierungsöffnung nicht geprüft; Zugriff/Deployment ausdrücklich ausgeschlossen.


### 317 – Registrierung öffnen — UNKNOWN

**Bestand:** Deployment-/Routinggrundlagen vorhanden.

**Dateien:** [.github/workflows/ci.yml](../../../.github/workflows/ci.yml)<br>[.github/workflows/production.yml](../../../.github/workflows/production.yml)<br>[infrastructure/scripts/deploy/dev.sh](../../../infrastructure/scripts/deploy/dev.sh)<br>[infrastructure/scripts/deploy/production.sh](../../../infrastructure/scripts/deploy/production.sh)<br>[infrastructure/scripts/deploy/rollback.sh](../../../infrastructure/scripts/deploy/rollback.sh)<br>[infrastructure/scripts/deploy/staging.sh](../../../infrastructure/scripts/deploy/staging.sh)<br>[tests/e2e/staging.sh](../../../tests/e2e/staging.sh)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Nicht ausgeführt; kein Produktions-VPS-/Domainzugriff.

**Fehlend:** Öffentlicher Produktionsstatus bzw. Registrierungsöffnung nicht geprüft; Zugriff/Deployment ausdrücklich ausgeschlossen.


### 318 – Onboarding überwachen — TODO

**Bestand:** Technische Logs/Healthchecks vorhanden.

**Dateien:** [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts)<br>[apps/api/src/main.ts](../../../apps/api/src/main.ts)<br>[apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/worker/src/main.ts](../../../apps/worker/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifische Live-Metriken und Onboarding-/Personalisierungs-/Moderations-/Infra-Dashboards fehlen; externer Betrieb unbekannt.


### 319 – Personalization überwachen — TODO

**Bestand:** Technische Logs/Healthchecks vorhanden.

**Dateien:** [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts)<br>[apps/api/src/main.ts](../../../apps/api/src/main.ts)<br>[apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/worker/src/main.ts](../../../apps/worker/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifische Live-Metriken und Onboarding-/Personalisierungs-/Moderations-/Infra-Dashboards fehlen; externer Betrieb unbekannt.


### 320 – Moderation überwachen — TODO

**Bestand:** Technische Logs/Healthchecks vorhanden.

**Dateien:** [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts)<br>[apps/api/src/main.ts](../../../apps/api/src/main.ts)<br>[apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/worker/src/main.ts](../../../apps/worker/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifische Live-Metriken und Onboarding-/Personalisierungs-/Moderations-/Infra-Dashboards fehlen; externer Betrieb unbekannt.


### 321 – Infrastruktur überwachen — TODO

**Bestand:** Technische Logs/Healthchecks vorhanden.

**Dateien:** [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts)<br>[apps/api/src/main.ts](../../../apps/api/src/main.ts)<br>[apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/worker/src/main.ts](../../../apps/worker/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Aufgabenspezifische Live-Metriken und Onboarding-/Personalisierungs-/Moderations-/Infra-Dashboards fehlen; externer Betrieb unbekannt.


## Phase 34 – PUBLIC LAUNCH


### 322 – Public Launch — UNKNOWN

**Bestand:** Keine verifizierbaren Launch-/Marketing-/Community-/KPI-Artefakte im Repository.

**Dateien:** [README.md](../../../README.md)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Keine externen Live-/Marketing-/Benutzeraktionen durchgeführt.

**Fehlend:** Geschäftliche Durchführung/Launchnachweis separat klären; technische Indexierungs-/KPI-Instrumentierung fehlt.


### 323 – Suchmaschinenindexierung aktivieren — TODO

**Bestand:** Keine verifizierbaren Launch-/Marketing-/Community-/KPI-Artefakte im Repository.

**Dateien:** [README.md](../../../README.md)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Keine externen Live-/Marketing-/Benutzeraktionen durchgeführt.

**Fehlend:** Geschäftliche Durchführung/Launchnachweis separat klären; technische Indexierungs-/KPI-Instrumentierung fehlt.


### 324 – Marketing starten — UNKNOWN

**Bestand:** Keine verifizierbaren Launch-/Marketing-/Community-/KPI-Artefakte im Repository.

**Dateien:** [README.md](../../../README.md)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Keine externen Live-/Marketing-/Benutzeraktionen durchgeführt.

**Fehlend:** Geschäftliche Durchführung/Launchnachweis separat klären; technische Indexierungs-/KPI-Instrumentierung fehlt.


### 325 – Community Aufbau — UNKNOWN

**Bestand:** Keine verifizierbaren Launch-/Marketing-/Community-/KPI-Artefakte im Repository.

**Dateien:** [README.md](../../../README.md)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Keine externen Live-/Marketing-/Benutzeraktionen durchgeführt.

**Fehlend:** Geschäftliche Durchführung/Launchnachweis separat klären; technische Indexierungs-/KPI-Instrumentierung fehlt.


### 326 – KPIs erfassen — TODO

**Bestand:** Keine verifizierbaren Launch-/Marketing-/Community-/KPI-Artefakte im Repository.

**Dateien:** [README.md](../../../README.md)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Keine externen Live-/Marketing-/Benutzeraktionen durchgeführt.

**Fehlend:** Geschäftliche Durchführung/Launchnachweis separat klären; technische Indexierungs-/KPI-Instrumentierung fehlt.


## Phase 35 – STABILIZATION


### 327 – Bugfixing — PARTIAL

**Bestand:** Laufende Entwicklung und Tests vorhanden; Audit identifiziert nächste Probleme.

**Dateien:** [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts)<br>[apps/api/src/main.ts](../../../apps/api/src/main.ts)<br>[apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/worker/src/main.ts](../../../apps/worker/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Postlaunch-Stabilisierung/Performancemessung und Abschlusskriterien nicht nachgewiesen.


### 328 – Performance — PARTIAL

**Bestand:** Laufende Entwicklung und Tests vorhanden; Audit identifiziert nächste Probleme.

**Dateien:** [apps/api/src/app.module.ts](../../../apps/api/src/app.module.ts)<br>[apps/api/src/main.ts](../../../apps/api/src/main.ts)<br>[apps/web/next.config.ts](../../../apps/web/next.config.ts)<br>[apps/worker/src/main.ts](../../../apps/worker/src/main.ts)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Postlaunch-Stabilisierung/Performancemessung und Abschlusskriterien nicht nachgewiesen.


### 329 – Moderationsaufwand analysieren — BLOCKED

**Bestand:** Keine verifizierten produktiven Nutzungs-/Moderationsdaten im Audit.

**Dateien:** [apps/api/src/modules/bans/bans.module.ts](../../../apps/api/src/modules/bans/bans.module.ts)<br>[apps/api/src/modules/moderation/moderation.module.ts](../../../apps/api/src/modules/moderation/moderation.module.ts)<br>[apps/api/src/modules/sanctions/sanctions.module.ts](../../../apps/api/src/modules/sanctions/sanctions.module.ts)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Nicht durchgeführt.

**Fehlend:** Analyse benötigt funktionsfähiges Produkt, Datenminimierung und tatsächlich erhobene Nutzungsdaten.


**Abhängigkeit:** Funktionsfertigstellung, Beta/Launch und datenschutzkonforme Metriken


### 330 – Karten-System analysieren — BLOCKED

**Bestand:** Keine verifizierten produktiven Nutzungs-/Moderationsdaten im Audit.

**Dateien:** [apps/api/src/modules/bans/bans.module.ts](../../../apps/api/src/modules/bans/bans.module.ts)<br>[apps/api/src/modules/moderation/moderation.module.ts](../../../apps/api/src/modules/moderation/moderation.module.ts)<br>[apps/api/src/modules/sanctions/sanctions.module.ts](../../../apps/api/src/modules/sanctions/sanctions.module.ts)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Nicht durchgeführt.

**Fehlend:** Analyse benötigt funktionsfähiges Produkt, Datenminimierung und tatsächlich erhobene Nutzungsdaten.


**Abhängigkeit:** Funktionsfertigstellung, Beta/Launch und datenschutzkonforme Metriken


### 331 – IP Block Effektivität prüfen — BLOCKED

**Bestand:** Keine verifizierten produktiven Nutzungs-/Moderationsdaten im Audit.

**Dateien:** [apps/api/src/modules/bans/bans.module.ts](../../../apps/api/src/modules/bans/bans.module.ts)<br>[apps/api/src/modules/moderation/moderation.module.ts](../../../apps/api/src/modules/moderation/moderation.module.ts)<br>[apps/api/src/modules/sanctions/sanctions.module.ts](../../../apps/api/src/modules/sanctions/sanctions.module.ts)<br>[apps/web/src/app/admin/moderation/page.tsx](../../../apps/web/src/app/admin/moderation/page.tsx)<br>[packages/database/prisma/schema.prisma](../../../packages/database/prisma/schema.prisma)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Nicht durchgeführt.

**Fehlend:** Analyse benötigt funktionsfähiges Produkt, Datenminimierung und tatsächlich erhobene Nutzungsdaten.


**Abhängigkeit:** Funktionsfertigstellung, Beta/Launch und datenschutzkonforme Metriken


### 332 – Personalisierung analysieren — BLOCKED

**Bestand:** Keine verifizierten produktiven Nutzungs-/Moderationsdaten im Audit.

**Dateien:** [apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/personalization/club-theme.ts](../../../apps/web/src/features/personalization/club-theme.ts)<br>[apps/web/src/features/personalization/personalized-club-theme.tsx](../../../apps/web/src/features/personalization/personalized-club-theme.tsx)<br>[apps/web/src/features/personalization/personalized-startpage.tsx](../../../apps/web/src/features/personalization/personalized-startpage.tsx)<br>[apps/web/src/features/personalization/startpage-mock-data.ts](../../../apps/web/src/features/personalization/startpage-mock-data.ts)

**Tests:** [apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[apps/web/src/features/personalization/club-theme.spec.mjs](../../../apps/web/src/features/personalization/club-theme.spec.mjs)

**Nachweis:** Nicht durchgeführt.

**Fehlend:** Analyse benötigt funktionsfähiges Produkt, Datenminimierung und tatsächlich erhobene Nutzungsdaten.


**Abhängigkeit:** Funktionsfertigstellung, Beta/Launch und datenschutzkonforme Metriken


## Phase 36 – VERSION 1.1


### 333 – Produktdaten auswerten — BLOCKED

**Bestand:** Keine verifizierten produktiven Nutzungs-/Moderationsdaten im Audit.

**Dateien:** [apps/api/src/modules/articles/articles.service.ts](../../../apps/api/src/modules/articles/articles.service.ts)<br>[apps/web/src/features/personalization/club-theme.ts](../../../apps/web/src/features/personalization/club-theme.ts)<br>[apps/web/src/features/personalization/personalized-club-theme.tsx](../../../apps/web/src/features/personalization/personalized-club-theme.tsx)<br>[apps/web/src/features/personalization/personalized-startpage.tsx](../../../apps/web/src/features/personalization/personalized-startpage.tsx)<br>[apps/web/src/features/personalization/startpage-mock-data.ts](../../../apps/web/src/features/personalization/startpage-mock-data.ts)

**Tests:** [apps/api/src/modules/articles/articles.service.spec.ts](../../../apps/api/src/modules/articles/articles.service.spec.ts)<br>[apps/web/src/features/personalization/club-theme.spec.mjs](../../../apps/web/src/features/personalization/club-theme.spec.mjs)

**Nachweis:** Nicht durchgeführt.

**Fehlend:** Analyse benötigt funktionsfähiges Produkt, Datenminimierung und tatsächlich erhobene Nutzungsdaten.


**Abhängigkeit:** Funktionsfertigstellung, Beta/Launch und datenschutzkonforme Metriken


### 334 – Version 1.1 planen — TODO

**Bestand:** Masterplan nennt mögliche Version-1.1-Erweiterungen.

**Dateien:** [README.md](../../../README.md)

**Tests:** Keine spezifische Datei/Test gefunden.

**Nachweis:** Statische Codeprüfung; kein spezifischer automatisierter Test.

**Fehlend:** Eigenständige evidenzbasierte Priorisierung/Scopeentscheidung für nächste Produktversion fehlt; PDF-Version 1.1 ist nicht fertige Produktversion 1.1.

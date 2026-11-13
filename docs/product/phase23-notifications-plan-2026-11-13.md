# Phase 23 – Benachrichtigungen (Masterplan 224–229)

Stand: 13.11.2026. Nur DEV und isolierte CI. **Phase 22 bleibt technisch abgeschlossen; ihre echte Fachabnahme in GitHub #185 ist weiterhin offen.**

## Umsetzungsschritte

| Aufgabe | Inhalt | Stand |
| --- | --- | --- |
| 224 | Notification Types | Erster interner Backend-Slice in Arbeit; PR-/DEV-CI ausstehend |
| 225 | Notification Queue | Offen: persistenter Outbox-/Retry-/Queue-Consumer-Vertrag |
| 226 | In-App Notifications | Offen: private Listen-API, Paging, Zähler und Web-Center |
| 227 | Read/Unread | Offen: atomare und empfängergebundene Lesemarkierung |
| 228 | E-Mail Notifications | Offen: async Versand, Templates, Opt-outs, Retries und Anbieterabnahme |
| 229 | Notification Preferences | Offen: sichere Kanalpräferenzen mit verpflichtenden Moderationsnachrichten |

## 23.224 – Typen- und Persistenzvertrag

- **Eine Taxonomie:** Das gemeinsame Paket `@kurvenfunk/types` definiert nur die neun vorhandenen Prisma-`NotificationType`-Werte und sieben `NotificationSourceType`-Werte. Keine Migration, kein spekulativer Typ, keine zusätzliche Datenbank.
- **Sichere statische Vorlagen:** Jeder Typ bekommt Titel und Body auf Deutsch. Nutzergenerierte Textinhalte, vertrauliche Moderatornotizen, Tokens und Auditdetails werden niemals in die Vorlagen interpoliert.
- **Quellzuordnung:** `COMMENT_REPLY` zu `COMMENT`, `THREAD_REPLY` zu `POST`/`THREAD`, Moderationskarten zu `MODERATION_CARD`, Einschränkung/Sperre zu `SANCTION`, Einsprüche zu `APPEAL` und Systemnachrichten optional zu `SYSTEM`.
- **Pflichtinhalte:** `YELLOW_CARD`, `BLUE_CARD`, `RED_CARD`, `LIMITED` und `BAN` sind als zwingend im In-App-Kanal markiert. Spätere Präferenzen dürfen sie nicht unterdrücken. Moderatoren werden bei Moderationsbenachrichtigungen nicht als Nutzer-Akteure offengelegt. Selbstbenachrichtigungen auf eigene Antworten werden unterbunden.
- **Interner Service:** `NotificationsService.persist()` ist ein intern exportierter Provider, aber **kein öffentlicher Endpunkt**. Er prüft gültige Empfänger/Quellen/Actors/Event-Keys und sichere relative URLs, erstellt bestehende `Notification`-Datensätze und akzeptiert keine freie `metadata`-Eingabe.
- **Idempotenz:** `dedupeKey` umfasst Empfänger, Typ und stabiles Ereignis. Ein Unique-Constraint verhindert konkurrierende Doppelzustellung. Identische Retries liefern denselben Record, bei widersprüchlicher Quellen-/Akteurszuordnung wird ein Konflikt geworfen; ein bereits gesetztes `readAt` wird nicht zurückgesetzt.
- **Tests:** Unit-Tests prüfen Typen, Pflichtnachrichten, statische Vorlagen, Validierung, externe URLs, Selbstbenachrichtigungen und Deduplizierung. Isolierte PostgreSQL/Redis-E2E prüfen tatsächliche DB-Enums, parallele Deduplizierung, Lesestandschutz und sichere Moderationsnachrichten.
- **Noch nicht aktiv:** Keine Produzenten in Kommentar-/Foren-/Moderationsdiensten, kein Queue-Versand, keine E-Mails, keine öffentlichen Leserechte/API, keine Benachrichtigungs-UI. Diese Aufgaben werden bewusst getrennt in 225–229 integriert.

## Nachweis- und Sicherheitsgrenzen

Alle Testkonten/Notification-Einträge existieren ausschließlich in einer ausdrücklich überprüften wegwerfbaren E2E-PostgreSQL-Datenbank; kein DEV-Seeding und keine E-Mails. Vollständig grüne PR-CI einschließlich isolierter E2E und Docker vor Merge; danach exakten Merge-Push-/DEV-CI-Abschluss kontrollieren. Keine Änderungen an STAGING/PROD.

Für 225 ist vor Aktivierung zuerst ein abgestimmter Crash-/Redis-Ausfall-Vertrag notwendig: PostgreSQL bleibt Quelle der Wahrheit, BullMQ kann mit At-least-once verarbeitet werden, und Producer-Domainaktionen dürfen nicht synchron von einem externen Mailprovider abhängen.
